import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../../../engine/rng'
import type { Timeline } from '../LaunchSequence'
import type { SceneryStyle } from '../LaunchScenery'
import { ascentAt, rocketMetres } from './ascent'

/**
 * The launch in Three.js (loaded on demand). Driven by the game timeline through `tRef` (seconds after pressing Launch);
 * the HUD, captions, countdown digits and every sound stay in LaunchSequence. Started from the `?proto=three` prototype.
 */

const LIGHTS: Record<SceneryStyle, { sky: [string, string]; sun: [number, number, number]; sunColor: number; sunI: number; hemi: [number, number, number]; fog: number; hills: number; ground: number; stars: number; floods: boolean }> = {
  dawn: { sky: ['#433880', '#fdba74'], sun: [1200, 160, -5200], sunColor: 0xffc58a, sunI: 2.4, hemi: [0x8b7fb8, 0x3b2a20, 0.9], fog: 0xb58aa0, hills: 0x5a4a85, ground: 0x5b4636, stars: 0.25, floods: false },
  day: { sky: ['#1e54c8', '#d6eafa'], sun: [500, 900, 300], sunColor: 0xfffbea, sunI: 2.8, hemi: [0xbcdcff, 0x8a6a45, 1.3], fog: 0xb9c6da, hills: 0x8a735e, ground: 0xb8925f, stars: 0, floods: false },
  night: { sky: ['#020617', '#243260'], sun: [400, 600, -300], sunColor: 0x9fb4e0, sunI: 0.35, hemi: [0x1c2847, 0x05070d, 0.35], fog: 0x121e46, hills: 0x1c2847, ground: 0x151b2b, stars: 1, floods: true },
}

function softTexture(rgb = '255,255,255') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, `rgba(${rgb},1)`)
  g.addColorStop(0.4, `rgba(${rgb},0.45)`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
function skyTexture(top: string, bottom: string) {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const x = c.getContext('2d')!
  const g = x.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  x.fillStyle = g
  x.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface Puff { s: THREE.Sprite; life: number; max: number; v: THREE.Vector3; grow: number; a0: number; drag: number }

interface Props {
  launcherId: string
  light: SceneryStyle
  T: Timeline
  tRef: { current: number }
  failAt: number | null
}

export default function LaunchScene3D({ launcherId, light, T, tRef, failAt }: Props) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current!
    const L = LIGHTS[light]
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const sky = skyTexture(L.sky[0], L.sky[1])
    scene.background = sky
    scene.fog = new THREE.Fog(L.fog, 900, 9000)
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 1, 30000)
    const rnd = mulberry32(11)

    // lights
    const sun = new THREE.DirectionalLight(L.sunColor, L.sunI)
    sun.position.set(...L.sun)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -40, near: 10, far: 8000 })
    scene.add(sun, new THREE.HemisphereLight(...L.hemi))
    const flameLight = new THREE.PointLight(0xffa64d, 0, 400, 1.6)
    scene.add(flameLight)

    // ground, the Andes and the Misti on the horizon, framed behind the pad from the opening camera
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const hillMat = new THREE.MeshStandardMaterial({ color: L.hills, flatShading: true, roughness: 1 })
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ff, flatShading: true, roughness: 0.8 })
    // view axis of the opening shot: from (-70, 22, 130) towards the pad; "right" is perpendicular on the ground
    const fwd = new THREE.Vector3(70, 0, -130).normalize()
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x)
    const at = (dist: number, side: number) => new THREE.Vector3(-70, 0, 130).addScaledVector(fwd, dist).addScaledVector(right, side)
    for (let i = 0; i < 26; i++) {
      const r = 500 + rnd() * 700
      const h = 300 + rnd() * 700
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), hillMat)
      const p = at(7000 + rnd() * 2500, -6000 + i * 480 + rnd() * 200)
      peak.position.set(p.x, h / 2 - 20, p.z)
      peak.rotation.y = rnd() * Math.PI
      scene.add(peak)
      if (h > 820) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, h * 0.22, 6), snowMat)
        cap.position.set(p.x, h - h * 0.11 - 20, p.z)
        cap.rotation.y = peak.rotation.y
        scene.add(cap)
      }
    }
    const misti = new THREE.Group()
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2300, 2200, 11, 1, true), hillMat)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(560, 520, 11), snowMat)
    cap.position.y = 1100 - 260
    misti.add(cone, cap)
    const mp = at(6200, -900)
    misti.position.set(mp.x, 1080, mp.z)
    scene.add(misti)

    // stars: always there, shown at night and with altitude
    const starGeo = new THREE.BufferGeometry()
    const pts: number[] = []
    for (let i = 0; i < 2000; i++) {
      const a = rnd() * Math.PI * 2
      const e = -0.2 + rnd() * 1.7
      pts.push(Math.cos(a) * Math.cos(e) * 20000, Math.sin(e) * 20000, Math.sin(a) * Math.cos(e) * 20000)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: L.stars })
    scene.add(new THREE.Points(starGeo, starMat))

    // cloud deck around 650 m that the rocket climbs through
    const cloudTex = softTexture()
    const cloudColor = new THREE.Color(light === 'night' ? 0x3a4668 : light === 'day' ? 0xffffff : 0xf3d6c8)
    const clouds: THREE.Sprite[] = []
    for (let i = 0; i < 70; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: cloudColor, transparent: true, opacity: 0.55, depthWrite: false }))
      const a = rnd() * Math.PI * 2
      const d = 120 + rnd() * 1800
      s.position.set(Math.cos(a) * d, 620 + rnd() * 90, Math.sin(a) * d)
      s.scale.set(380 + rnd() * 380, 120 + rnd() * 90, 1)
      clouds.push(s)
      scene.add(s)
    }

    // pad, lattice tower, service arms
    const H = launcherId === 'light' ? 46 : 60
    const steel = new THREE.MeshStandardMaterial({ color: light === 'day' ? 0xd5dbe3 : 0x8a96a8, metalness: 0.4, roughness: 0.6 })
    const concrete = new THREE.MeshStandardMaterial({ color: 0x77706a, roughness: 0.9 })
    const pad = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 40), concrete)
    pad.position.y = 2
    pad.receiveShadow = pad.castShadow = true
    scene.add(pad)
    const tower = new THREE.Group()
    for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, H, 0.6), steel)
      leg.position.set(x, H / 2, z)
      tower.add(leg)
    }
    for (let y = 0; y < H; y += 5) {
      for (const [x, z, ry] of [[3, 0, 0], [3, 6, 0], [0, 3, Math.PI / 2], [6, 3, Math.PI / 2]]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.3), steel)
        bar.position.set(x, y, z)
        bar.rotation.set(0, ry, 0)
        tower.add(bar)
        const diag = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.22, 0.22), steel)
        diag.position.set(x, y + 2.5, z)
        diag.rotation.set(0, ry, Math.atan2(5, 6))
        tower.add(diag)
      }
    }
    tower.traverse((o) => (o.castShadow = true))
    tower.position.set(6, 4, -3)
    scene.add(tower)
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8), new THREE.MeshBasicMaterial({ color: 0xff3b3b }))
    beacon.position.set(9, H + 5, 0)
    scene.add(beacon)
    const arms = [0.4, 0.7, 0.92].map((f) => {
      const pivot = new THREE.Group()
      pivot.position.set(6, 4 + H * f, 0)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1.4), steel)
      arm.position.x = -2.5
      pivot.add(arm)
      scene.add(pivot)
      return pivot
    })
    if (L.floods) {
      for (const x of [-40, 40]) {
        const s = new THREE.SpotLight(0xfff1c9, 400, 300, 0.35, 0.5, 1.2)
        s.position.set(x, 3, 30)
        s.target.position.set(0, 30, 0)
        scene.add(s, s.target)
      }
    }

    // rocket: first stage 60 %, second stage 20 %, fairing 20 % of its height; origin at the first-stage nozzle
    const RH = rocketMetres(launcherId)
    const R = launcherId === 'light' ? 1.4 : 1.8
    const h1 = RH * 0.6
    const h2 = RH * 0.2
    const hf = RH * 0.2
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
    const gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8, roughness: 0.35 })
    const rocket = new THREE.Group()
    const s1 = new THREE.Group()
    const body1 = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h1, 24), white)
    body1.position.y = h1 / 2
    const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 1.4, 24), orange)
    band.position.y = h1 * 0.62
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.83, 1.6, 16, 1, true), dark)
    nozzle.position.y = -0.6
    s1.add(body1, band, nozzle)
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4, 2.2), dark)
      fin.position.set(Math.cos((i * Math.PI) / 2) * (R + 0.6), 2.2, Math.sin((i * Math.PI) / 2) * (R + 0.6))
      fin.rotation.y = -(i * Math.PI) / 2
      s1.add(fin)
    }
    const s2 = new THREE.Group()
    const inter = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 24), dark)
    inter.position.y = h1 + 0.5
    const body2 = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h2 - 1, 24), white)
    body2.position.y = h1 + 1 + (h2 - 1) / 2
    const nozzle2 = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.35, R * 0.6, 1.4, 16, 1, true), dark)
    nozzle2.position.y = h1 - 0.2
    nozzle2.visible = false
    // spacecraft inside the fairing (a stand-in until the procedural spacecraft is ported to 3D)
    const craft = new THREE.Group()
    const bus = new THREE.Mesh(new THREE.BoxGeometry(R * 0.9, hf * 0.35, R * 0.9), gold)
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.45, R * 0.1, 0.4, 16), white)
    dish.position.y = hf * 0.22
    craft.add(bus, dish)
    craft.position.y = h1 + h2 + hf * 0.3
    const fairingShape = Array.from({ length: 12 }, (_, i) => new THREE.Vector2((R + 0.15) * Math.cos((i / 11) * (Math.PI / 2)) ** 0.7, (i / 11) * hf))
    const halves = [0, Math.PI].map((phi) => {
      const g = new THREE.Group()
      const m = new THREE.Mesh(new THREE.LatheGeometry(fairingShape, 16, phi, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, side: THREE.DoubleSide }))
      g.add(m)
      g.position.y = h1 + h2
      return g
    })
    s2.add(inter, body2, nozzle2, craft, ...halves)
    rocket.add(s1, s2)
    rocket.traverse((o) => (o.castShadow = true))
    rocket.position.y = 4.8
    scene.add(rocket)

    // flame, vapour cone, staging flash, explosion
    const flameMat = new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(R * 0.9, 1, 16, 1, true), flameMat)
    flame.rotation.x = Math.PI
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(R * 0.45, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff7e0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    flameCore.rotation.x = Math.PI
    const flameGroup = new THREE.Group()
    flameGroup.add(flame, flameCore)
    rocket.add(flameGroup)
    const vapor = new THREE.Mesh(new THREE.ConeGeometry(R * 1.9, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))
    vapor.position.y = h1 + h2 - 3
    rocket.add(vapor)
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }))
    scene.add(flash)
    const boom = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture('255,150,60'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }))
    scene.add(boom)

    // smoke puffs (sprites, pooled; the pool is reset when the clock jumps back)
    const smokeTex = softTexture()
    const smokeColor = new THREE.Color(light === 'night' ? 0x6b7a90 : light === 'day' ? 0xf1f5f9 : 0xe9dcf2)
    const hotColor = new THREE.Color(0xffd2a0)
    const pool: Puff[] = []
    for (let i = 0; i < 420; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: smokeColor, transparent: true, depthWrite: false, opacity: 0 }))
      s.visible = false
      scene.add(s)
      pool.push({ s, life: 0, max: 1, v: new THREE.Vector3(), grow: 0, a0: 0, drag: 0 })
    }
    const prand = mulberry32(42)
    const emit = (p: THREE.Vector3, v: THREE.Vector3, size: number, life: number, alpha: number, drag: number) => {
      const q = pool.find((x) => !x.s.visible)
      if (!q) return
      q.s.visible = true
      q.s.position.copy(p)
      q.s.scale.setScalar(size)
      q.life = 0
      q.max = life
      q.v.copy(v)
      q.grow = size * 0.8
      q.a0 = alpha
      q.drag = drag
    }

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const skyTop = new THREE.Color(L.sky[0])
    const black = new THREE.Color(0x02040c)
    const fogBase = new THREE.Color(L.fog)
    const OPEN_CAM = new THREE.Vector3(-70, 22, 130)
    const camPos = OPEN_CAM.clone()
    const up = new THREE.Vector3()
    const tmp = new THREE.Vector3()
    let last = -1
    let prev = performance.now()
    let sepDone = false
    let fairingGone = false
    let raf = 0

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const time = tRef.current
      if (time < last - 0.01) {
        // clock went back (new launch): reset the one-way changes
        pool.forEach((p) => (p.s.visible = false))
        if (sepDone) {
          rocket.add(s1)
          s1.position.set(0, 0, 0)
          s1.rotation.set(0, 0, 0)
          sepDone = false
        }
        camPos.copy(OPEN_CAM)
      }
      const jumped = time - last > 1 // skip: settle instantly
      last = time
      const r = ascentAt(time, T)
      const exploded = failAt !== null && time >= failAt

      rocket.position.set(r.down, 4.8 + r.alt, 0)
      rocket.rotation.z = -r.pitch
      rocket.visible = !exploded
      arms.forEach((a, i) => (a.rotation.y = r.arms * (1.2 + i * 0.1)))
      ;(beacon.material as THREE.MeshBasicMaterial).color.setHex(Math.floor(time * 2) % 2 ? 0xff3b3b : 0x551111)
      ;(vapor.material as THREE.MeshBasicMaterial).opacity = r.vapor * 0.35
      up.set(Math.sin(r.pitch), Math.cos(r.pitch), 0)

      // stage separation: the first stage stays in the world and falls away
      if (r.stage === 2 && !sepDone) {
        sepDone = true
        scene.attach(s1)
      }
      if (sepDone && s1.parent === scene) {
        const k = time - T.meco
        s1.position.y -= (6 + k * 40) * dt
        s1.position.x -= 8 * dt
        s1.rotation.z += 0.5 * dt
      }
      nozzle2.visible = sepDone
      craft.visible = time < T.deploy // the 2D spacecraft takes over at deployment (LaunchSequence)
      // fairing halves swing open and drift off
      halves.forEach((g, i) => {
        const s = i === 0 ? 1 : -1
        g.rotation.x = s * r.fairing * 0.9
        g.position.z = s * r.fairing * 6
        g.position.y = h1 + h2 - r.fairing * 4
        g.visible = r.fairing < 1
      })
      if (r.fairing >= 1 && !fairingGone) fairingGone = true
      const flashK = Math.max(0, 1 - Math.abs(time - T.meco - 0.15) / 0.35)
      flash.position.copy(rocket.position).addScaledVector(up, h1 + 0.5)
      flash.scale.setScalar(4 + flashK * 50)
      ;(flash.material as THREE.SpriteMaterial).opacity = exploded ? 0 : flashK

      // flame: longer and wider in thin air; blue-ish on the upper stage
      const thin = Math.min(1, r.alt / 900)
      const flick = 0.85 + 0.3 * Math.abs(Math.sin(time * 37)) * Math.abs(Math.cos(time * 23))
      const len = (RH * 0.3 + thin * RH * 0.8) * r.thrust * flick
      flameGroup.visible = r.thrust > 0.02
      flameGroup.position.y = (r.stage === 2 ? h1 - 0.9 : -1.2) - len / 2
      flame.scale.set(1 + thin * 3, len, 1 + thin * 3)
      flameCore.scale.set(1, len * 0.55, 1)
      flameCore.position.y = len * 0.2
      flameMat.color.setHex(r.stage === 2 ? 0x9cc8ff : 0xffffff)
      const nozzleW = rocket.position.clone().addScaledVector(up, r.stage === 2 ? h1 : -1)
      flameLight.position.copy(nozzleW).addScaledVector(up, -6)
      flameLight.intensity = exploded ? 0 : r.thrust * (r.stage === 1 ? 5000 : 600) * flick

      // explosion
      const bk = exploded ? time - failAt! : -1
      boom.visible = bk >= 0 && bk < 1.8
      if (boom.visible) {
        boom.position.copy(rocket.position).addScaledVector(up, RH * 0.5)
        boom.scale.setScalar(10 + bk * 90)
        ;(boom.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - bk / 1.6)
        if (bk < 0.4) for (let i = 0; i < 6; i++) emit(boom.position.clone(), new THREE.Vector3((prand() - 0.5) * 60, (prand() - 0.5) * 40, (prand() - 0.5) * 60), 6 + prand() * 8, 2 + prand() * 2, 0.7, 0.8)
      }

      // smoke: exhaust trail, and big clouds pushed out of the flame trench near the pad
      if (!exploded && !jumped) {
        const n = Math.round(r.thrust * (r.stage === 1 ? 6 : 1))
        for (let i = 0; i < n; i++) {
          const p = nozzleW.clone().addScaledVector(up, -4 - prand() * 4)
          p.x += (prand() - 0.5) * 3
          p.z += (prand() - 0.5) * 3
          emit(p, up.clone().multiplyScalar(-14).add(new THREE.Vector3((prand() - 0.5) * 6, 0, (prand() - 0.5) * 6)), 5 + prand() * 4, 3 + prand() * 2.5, 0.55, 0.5)
        }
        if (r.thrust > 0.1 && r.alt < 30) {
          for (let i = 0; i < 5; i++) {
            const side = prand() < 0.5 ? -1 : 1
            emit(new THREE.Vector3(side * (6 + prand() * 6), 3 + prand() * 3, (prand() - 0.5) * 10),
              new THREE.Vector3(side * (50 + prand() * 50), 2 + prand() * 6, (prand() - 0.5) * 20), 8 + prand() * 8, 3.5 + prand() * 2, 0.65, 1.2)
          }
        }
      }
      for (const q of pool) {
        if (!q.s.visible) continue
        q.life += dt
        if (q.life >= q.max || jumped) {
          q.s.visible = false
          continue
        }
        const k = q.life / q.max
        q.v.multiplyScalar(1 - q.drag * dt)
        q.v.y += 2 * dt
        q.s.position.addScaledVector(q.v, dt)
        q.s.scale.setScalar(q.s.scale.x + q.grow * dt)
        const m = q.s.material as THREE.SpriteMaterial
        m.opacity = q.a0 * (1 - k) * (k < 0.1 ? k / 0.1 : 1)
        m.color.copy(q.s.position.distanceTo(nozzleW) < 25 && r.thrust > 0.2 ? hotColor : smokeColor)
      }

      // clouds thin out as the sky turns black
      for (const c of clouds) (c.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - r.space * 0.8)

      // camera: slow push-in on the pad during the countdown, then follows; after MECO it closes in on the upper stage
      const close = Math.min(1, Math.max(0, (time - T.meco - 0.2) / 2))
      const target = new THREE.Vector3(r.down * 0.9, 25 + r.alt, 0)
      const want = new THREE.Vector3(-70 + r.down * 0.6, 22 + r.alt * 0.92, 130 + r.alt * 0.12)
      if (time < T.liftoff) want.lerp(tmp.set(-58, 18, 108), Math.min(1, Math.max(0, time / T.liftoff)))
      if (close > 0) {
        const near = rocket.position.clone().addScaledVector(up, h1 + h2 * 0.5)
        target.lerp(near, close)
        want.lerp(near.clone().add(tmp.set(-38, -10, 62)), close)
      }
      if (jumped) camPos.copy(want)
      else camPos.lerp(want, 1 - Math.exp(-dt * 2.5))
      const sh = r.shake * 0.35
      camera.position.set(camPos.x + sh * Math.sin(time * 71), camPos.y + sh * Math.cos(time * 53), camPos.z)
      camera.lookAt(target)

      // sky: towards black with altitude, stars come out
      const fog = scene.fog as THREE.Fog
      fog.color.copy(fogBase).lerp(black, r.space)
      renderer.setClearColor(skyTop.clone().lerp(black, r.space))
      scene.backgroundIntensity = 1 - r.space * 0.97
      starMat.opacity = Math.max(L.stars, r.space)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
      sky.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [launcherId, light, T, tRef, failAt])
  return <div ref={host} className="absolute inset-0" />
}
