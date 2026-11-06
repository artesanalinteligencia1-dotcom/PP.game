import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { mulberry32 } from '../../engine/rng'
import { PROTO, rocketAt, type ProtoLight } from './launchScript'

/**
 * Renderer prototype A — PixiJS (WebGL 2D): painted parallax layers + particle smoke and flame.
 * Logical stage 1600×900, ground line at y = 760, 3 px per metre.
 */
const W = 1600
const H = 900
const GROUND = 760
const PPM = 3
const PAD_X = 760

const LIGHTS: Record<ProtoLight, {
  sky: string[]; sun: { x: number; y: number; color: string; size: number }; stars: number
  far: number; misti: number; snow: number; hills: number; ground: string[]; smoke: number; steel: number; flood: boolean
}> = {
  dawn: { sky: ['#172554', '#433880', '#be6e78', '#fdba74'], sun: { x: 230, y: 700, color: '255,214,150', size: 520 }, stars: 0.15,
    far: 0x8b7fb8, misti: 0x4c3f75, snow: 0xf5f3ff, hills: 0x2a2350, ground: ['#5b4636', '#1c1917'], smoke: 0xe9dcf2, steel: 0x64748b, flood: false },
  day: { sky: ['#1e54c8', '#3880e8', '#80baf0', '#d6eafa'], sun: { x: 1300, y: 120, color: '255,250,220', size: 380 }, stars: 0,
    far: 0x8fa6c8, misti: 0x86705c, snow: 0xffffff, hills: 0x6b5a44, ground: ['#b8925f', '#6b4f33'], smoke: 0xf1f5f9, steel: 0xcbd5e1, flood: false },
  night: { sky: ['#020617', '#081030', '#121e46', '#243260'], sun: { x: 1300, y: 140, color: '226,232,240', size: 220 }, stars: 0.9,
    far: 0x1c2847, misti: 0x15203d, snow: 0xcbd5e1, hills: 0x0a1124, ground: ['#151b2b', '#05070d'], smoke: 0x64748b, steel: 0x94a3b8, flood: true },
}

function canvasTexture(w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  paint(cv.getContext('2d')!)
  return Texture.from(cv)
}
const vgrad = (stops: string[]) => (c: CanvasRenderingContext2D) => {
  const g = c.createLinearGradient(0, 0, 0, c.canvas.height)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  c.fillStyle = g
  c.fillRect(0, 0, c.canvas.width, c.canvas.height)
}
const radial = (rgb: string, core = 1) => (c: CanvasRenderingContext2D) => {
  const r = c.canvas.width / 2
  const g = c.createRadialGradient(r, r, 0, r, r, r)
  g.addColorStop(0, `rgba(${rgb},${core})`)
  g.addColorStop(0.35, `rgba(${rgb},${core * 0.45})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  c.fillStyle = g
  c.fillRect(0, 0, c.canvas.width, c.canvas.height)
}

interface Particle { s: Sprite; life: number; max: number; vx: number; vy: number; grow: number; a0: number; drag: number }

export function PixiLaunch({ light, t }: { light: ProtoLight; t: { current: number } }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current!
    const app = new Application()
    let destroyed = false
    let started = false
    const L = LIGHTS[light]
    app
      .init({ resizeTo: el, antialias: true, background: L.sky[0], autoDensity: true, resolution: Math.min(2, window.devicePixelRatio) })
      .then(() => {
        if (destroyed) return app.destroy(true)
        started = true
        el.appendChild(app.canvas)
        const stage = new Container()
        app.stage.addChild(stage)
        const fit = () => {
          const k = Math.max(el.clientWidth / W, el.clientHeight / H)
          stage.scale.set(k)
          stage.position.set((el.clientWidth - W * k) / 2, (el.clientHeight - H * k) / 2)
        }
        fit()
        app.renderer.on('resize', fit)

        // --- painted backdrop layers (parallax factor in brackets) ---
        const sky = new Sprite(canvasTexture(16, 256, vgrad(L.sky)))
        sky.width = W
        sky.height = H
        const sun = new Sprite(canvasTexture(256, 256, radial(L.sun.color)))
        sun.anchor.set(0.5)
        sun.position.set(L.sun.x, L.sun.y)
        sun.width = sun.height = L.sun.size
        const stars = new Graphics()
        const rnd = mulberry32(7)
        for (let i = 0; i < 160; i++) stars.circle(rnd() * W, rnd() * 620, rnd() < 0.1 ? 1.8 : 1).fill({ color: 0xe2e8f0, alpha: 0.5 + rnd() * 0.5 })
        stars.alpha = L.stars
        const far = new Graphics()
          .poly([0, 560, 120, 500, 220, 530, 330, 460, 420, 505, 520, 470, 640, 520, 1000, 530, 1100, 480, 1200, 510, 1310, 450, 1420, 500, 1520, 470, 1600, 500, 1600, 900, 0, 900])
          .fill({ color: L.far, alpha: 0.8 })
        const mistiL = new Container()
        const misti = new Graphics()
          .poly([300, 640, 560, 330, 590, 330, 900, 640]).fill(L.misti)
          .poly([560, 330, 575, 330, 580, 640, 300, 640]).fill({ color: 0xffffff, alpha: 0.08 })
          .poly([560, 330, 590, 330, 640, 385, 615, 380, 600, 400, 585, 382, 572, 402, 556, 384, 540, 392, 528, 380]).fill(L.snow)
        mistiL.addChild(misti)
        const hills = new Graphics()
          .moveTo(0, 690).bezierCurveTo(200, 640, 380, 700, 600, 670).bezierCurveTo(820, 640, 1000, 700, 1250, 672).bezierCurveTo(1400, 655, 1520, 680, 1600, 670)
          .lineTo(1600, 900).lineTo(0, 900).closePath().fill(L.hills)
        const ground = new Sprite(canvasTexture(16, 128, vgrad(L.ground)))
        ground.position.set(0, GROUND - 8)
        ground.width = W
        ground.height = H - GROUND + 400

        // --- world (moves 1:1 with the camera) ---
        const world = new Container()
        const groundGlow = new Sprite(canvasTexture(256, 256, radial('255,170,80')))
        groundGlow.anchor.set(0.5)
        groundGlow.position.set(PAD_X, GROUND)
        groundGlow.blendMode = 'add'
        const pad = new Graphics()
          .poly([PAD_X - 110, GROUND + 4, PAD_X - 80, GROUND - 22, PAD_X + 80, GROUND - 22, PAD_X + 110, GROUND + 4]).fill(0x57534e)
          .rect(PAD_X - 26, GROUND - 22, 52, 26).fill(0x0c0a09)
        // lattice tower with service arms
        const tower = new Graphics()
        const tx = PAD_X + 46
        const top = GROUND - 22 - PROTO.towerHeight * PPM
        tower.moveTo(tx, GROUND - 22).lineTo(tx, top).moveTo(tx + 22, GROUND - 22).lineTo(tx + 22, top).stroke({ width: 3, color: L.steel })
        for (let y = GROUND - 22; y > top; y -= 18) tower.moveTo(tx, y).lineTo(tx + 22, y - 18).moveTo(tx + 22, y).lineTo(tx, y - 18).stroke({ width: 1.2, color: L.steel, alpha: 0.8 })
        tower.rect(tx - 4, top - 8, 30, 8).fill(0x334155)
        const beacon = new Graphics().circle(tx + 11, top - 12, 3.5).fill(0xef4444)
        const arms = [0.4, 0.7, 0.92].map((f) => {
          const a = new Graphics().rect(-34, -3, 34, 6).fill(L.steel)
          a.position.set(tx, GROUND - 22 - PROTO.towerHeight * PPM * f)
          return a
        })
        const floods = new Graphics()
        if (L.flood)
          floods.poly([PAD_X - 140, GROUND, PAD_X - 20, top, PAD_X + 8, top]).fill({ color: 0xfef3c7, alpha: 0.1 })
            .poly([PAD_X + 160, GROUND, PAD_X + 20, top, PAD_X - 8, top]).fill({ color: 0xfef3c7, alpha: 0.1 })

        // rocket: origin at the first-stage nozzle, nose up (-y). 50 m tall.
        const rocket = new Container()
        const s1 = new Graphics()
          .rect(-10, -90, 20, 90).fill(0xf1f5f9)
          .rect(-10, -52, 20, 5).fill(0xf97316)
          .rect(4, -90, 6, 90).fill({ color: 0x94a3b8, alpha: 0.35 })
          .poly([-10, -14, -20, 4, -10, 0]).fill(0x94a3b8).poly([10, -14, 20, 4, 10, 0]).fill(0x94a3b8)
          .poly([-7, 0, 7, 0, 9, 6, -9, 6]).fill(0x334155)
        const s2 = new Graphics()
          .rect(-10, -120, 20, 30).fill(0xe2e8f0)
          .rect(-10, -92, 20, 3).fill(0x334155)
          .moveTo(-10, -120).quadraticCurveTo(-10, -145, 0, -152).quadraticCurveTo(10, -145, 10, -120).closePath().fill(0xf8fafc)
          .rect(4, -120, 6, 30).fill({ color: 0x94a3b8, alpha: 0.3 })
        rocket.addChild(s1, s2)
        const vapor = new Sprite(canvasTexture(128, 256, (c) => {
          const g = c.createRadialGradient(64, 150, 6, 64, 150, 110)
          g.addColorStop(0, 'rgba(255,255,255,0.75)')
          g.addColorStop(1, 'rgba(255,255,255,0)')
          c.fillStyle = g
          c.beginPath()
          c.moveTo(64, 40)
          c.quadraticCurveTo(128, 180, 120, 256)
          c.lineTo(8, 256)
          c.quadraticCurveTo(0, 180, 64, 40)
          c.fill()
        }))
        vapor.anchor.set(0.5, 0.2)
        vapor.position.set(0, -132)
        vapor.width = 70
        vapor.height = 90
        rocket.addChild(vapor)

        const flameTex = canvasTexture(64, 256, (c) => {
          const g = c.createLinearGradient(0, 0, 0, 256)
          g.addColorStop(0, 'rgba(255,255,240,1)')
          g.addColorStop(0.25, 'rgba(255,214,120,0.95)')
          g.addColorStop(0.7, 'rgba(249,115,22,0.5)')
          g.addColorStop(1, 'rgba(249,115,22,0)')
          c.fillStyle = g
          c.beginPath()
          c.moveTo(18, 0)
          c.quadraticCurveTo(0, 120, 32, 256)
          c.quadraticCurveTo(64, 120, 46, 0)
          c.fill()
        })
        const flame = new Sprite(flameTex)
        flame.anchor.set(0.5, 0)
        flame.blendMode = 'add'
        const flame2 = new Sprite(flameTex)
        flame2.anchor.set(0.5, 0)
        flame2.blendMode = 'add'
        flame2.tint = 0x93c5fd
        const glow = new Sprite(canvasTexture(128, 128, radial('255,190,110')))
        glow.anchor.set(0.5)
        glow.blendMode = 'add'
        const flash = new Sprite(canvasTexture(128, 128, radial('255,255,255')))
        flash.anchor.set(0.5)
        flash.blendMode = 'add'

        const smokeTex = canvasTexture(128, 128, radial('255,255,255', 0.9))
        const smokeLayer = new Container()
        const pool: Particle[] = []
        for (let i = 0; i < 520; i++) {
          const s = new Sprite(smokeTex)
          s.anchor.set(0.5)
          s.visible = false
          smokeLayer.addChild(s)
          pool.push({ s, life: 0, max: 1, vx: 0, vy: 0, grow: 0, a0: 0, drag: 0 })
        }
        const prand = mulberry32(42)
        const emit = (x: number, y: number, vx: number, vy: number, size: number, life: number, tint: number, alpha: number, drag: number) => {
          const p = pool.find((q) => !q.s.visible)
          if (!p) return
          p.s.visible = true
          p.s.position.set(x, y)
          p.s.width = p.s.height = size
          p.s.tint = tint
          p.life = 0
          p.max = life
          p.vx = vx
          p.vy = vy
          p.grow = size * 0.9
          p.a0 = alpha
          p.drag = drag
          p.s.alpha = alpha
        }
        const stage1Fall = new Container()

        world.addChild(groundGlow, floods, pad, tower, beacon, ...arms, smokeLayer, stage1Fall, rocket, flame, flame2, glow, flash)
        const groundL = new Container()
        groundL.addChild(ground)
        const layers: [Container, number][] = [[stars, 0.03], [far, 0.18], [mistiL, 0.3], [hills, 0.6], [groundL, 1], [world, 1]]
        stage.addChild(sky, sun, ...layers.map(([c]) => c))

        let last = -1
        let sepDone = false
        app.ticker.add((tick) => {
          const dt = Math.min(0.05, tick.deltaMS / 1000)
          const time = t.current
          if (time < last) {
            // loop restarted: clear particles and put stage 1 back
            pool.forEach((p) => (p.s.visible = false))
            stage1Fall.removeChildren()
            rocket.addChildAt(s1, 0)
            s1.position.set(0, 0)
            s1.rotation = 0
            s1.alpha = 1
            sepDone = false
          }
          last = time
          const r = rocketAt(time)
          // camera: follow once the rocket climbs past 40 % of the frame
          const ry = GROUND - 22 - r.alt * PPM
          const camY = Math.max(0, H * 0.45 - ry)
          const shake = r.shake * 3
          const sx = shake * Math.sin(time * 71.3)
          const sy = shake * Math.cos(time * 53.1)
          for (const [c, f] of layers) c.position.set(sx * f, camY * f + sy * f)
          // high up the sky darkens toward space
          const space = Math.min(1, Math.max(0, (camY - 300) / 1500))
          sky.tint = space > 0 ? ((Math.round(255 * (1 - space)) << 16) | (Math.round(255 * (1 - space)) << 8) | Math.round(255 * (1 - space * 0.85))) : 0xffffff
          stars.alpha = Math.max(L.stars, space)
          sun.alpha = 1 - space

          const rx = PAD_X + r.down * PPM
          rocket.position.set(rx, ry)
          rocket.rotation = r.pitch
          vapor.alpha = r.vapor * 0.85
          arms.forEach((a, i) => (a.rotation = -r.arms * (1.1 + i * 0.1)))
          beacon.alpha = Math.floor(time * 2) % 2 ? 1 : 0.25

          // staging: stage 1 drops away and tumbles
          if (r.stage === 2 && !sepDone) {
            sepDone = true
            rocket.removeChild(s1)
            stage1Fall.addChild(s1)
            s1.position.set(rx, ry)
            s1.rotation = r.pitch
          }
          if (sepDone) {
            const k = time - PROTO.meco
            s1.position.set(rx - k * 14 - Math.sin(r.pitch) * 30, ry + k * k * 55 + 40)
            s1.rotation = r.pitch + k * 0.6
            s1.alpha = Math.max(0, 1 - k / 3)
          }
          const flashK = Math.max(0, 1 - Math.abs(time - PROTO.meco - 0.15) / 0.35)
          const up = { x: Math.sin(r.pitch), y: -Math.cos(r.pitch) }
          const nozzleOff = r.stage === 2 ? 90 : 0
          const nx = rx + up.x * nozzleOff
          const ny = ry + up.y * nozzleOff
          flash.position.set(rx + up.x * 92, ry + up.y * 92)
          flash.width = flash.height = 40 + flashK * 220
          flash.alpha = flashK

          // flame: wider and longer as the air thins
          const thin = Math.min(1, r.alt / 700)
          const flick = 0.85 + 0.3 * Math.abs(Math.sin(time * 37)) * Math.abs(Math.cos(time * 23))
          const f = r.stage === 1 ? flame : flame2
          const other = r.stage === 1 ? flame2 : flame
          other.visible = false
          f.visible = r.thrust > 0.02
          f.position.set(nx, ny + 2)
          f.rotation = r.pitch
          f.width = (18 + thin * 70) * (0.6 + 0.4 * r.thrust)
          f.height = (70 + thin * 120) * r.thrust * flick
          f.alpha = 0.95
          glow.position.set(nx, ny + 10)
          glow.width = glow.height = (160 + r.thrust * 160) * flick
          glow.alpha = r.thrust * (r.stage === 1 ? 0.8 : 0.4)
          const near = Math.max(0, 1 - r.alt / 120)
          groundGlow.width = 700 * r.thrust
          groundGlow.height = 160 * r.thrust
          groundGlow.alpha = r.thrust * near * 0.9

          // smoke: exhaust trail + pad clouds pushed sideways at ignition
          const exDir = { x: -up.x, y: -up.y }
          const n = Math.round(r.thrust * (r.stage === 1 ? 7 : 2))
          for (let i = 0; i < n; i++) {
            const jitter = (prand() - 0.5) * 30
            emit(nx + exDir.x * 40 + jitter, ny + exDir.y * 40, exDir.x * 60 + (prand() - 0.5) * 40, exDir.y * 60 + 20, 26 + prand() * 22, 3 + prand() * 2.5,
              L.smoke, 0.55, 0.6)
          }
          if (r.thrust > 0.1 && r.alt < 40) {
            for (let i = 0; i < 6; i++) {
              const side = prand() < 0.5 ? -1 : 1
              emit(PAD_X + side * (20 + prand() * 30), GROUND - 10 - prand() * 14, side * (260 + prand() * 220), -10 - prand() * 50, 40 + prand() * 50, 3.5 + prand() * 2,
                L.smoke, 0.6, 1.4)
            }
          }
          for (const p of pool) {
            if (!p.s.visible) continue
            p.life += dt
            if (p.life >= p.max) {
              p.s.visible = false
              continue
            }
            const k = p.life / p.max
            p.vx *= 1 - p.drag * dt
            p.vy = p.vy * (1 - p.drag * dt) - 8 * dt
            p.s.x += p.vx * dt
            p.s.y += p.vy * dt
            const size = p.s.width + p.grow * dt
            p.s.width = p.s.height = size
            p.s.alpha = p.a0 * (1 - k) * (k < 0.1 ? k / 0.1 : 1)
            // smoke near the flame is lit orange
            const d = Math.hypot(p.s.x - nx, p.s.y - ny)
            p.s.tint = d < 120 && r.thrust > 0.2 ? 0xffd7a8 : L.smoke
          }
        })
      })
    return () => {
      destroyed = true
      if (started) app.destroy(true, { children: true, texture: true })
    }
  }, [light, t])
  return <div ref={host} className="absolute inset-0" />
}
