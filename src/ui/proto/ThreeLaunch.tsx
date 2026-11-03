import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../../engine/rng'
import { PROTO, rocketAt, type ProtoLight } from './launchScript'

/**
 * Renderer prototype B — Three.js: a stylised low-poly 3D pad (units = metres) with real lights and a
 * following camera. The three launch lights are only a sun position + sky colour here.
 */
const LIGHTS: Record<ProtoLight, { sky: [string, string]; sun: [number, number, number]; sunColor: number; sunI: number; hemi: [number, number, number]; fog: number; misti: number; ground: number; stars: boolean; floods: boolean }> = {
  dawn: { sky: ['#433880', '#fdba74'], sun: [-600, 120, -900], sunColor: 0xffc58a, sunI: 2.2, hemi: [0x8b7fb8, 0x3b2a20, 0.9], fog: 0xb58aa0, misti: 0x5a4a85, ground: 0x5b4636, stars: false, floods: false },
  day: { sky: ['#1e54c8', '#d6eafa'], sun: [500, 900, 300], sunColor: 0xfffbea, sunI: 2.8, hemi: [0xbcdcff, 0x8a6a45, 1.3], fog: 0xb9c6da, misti: 0x8a735e, ground: 0xb8925f, stars: false, floods: false },
  night: { sky: ['#020617', '#243260'], sun: [400, 600, -300], sunColor: 0x9fb4e0, sunI: 0.35, hemi: [0x1c2847, 0x05070d, 0.35], fog: 0x121e46, misti: 0x1c2847, ground: 0x151b2b, stars: true, floods: true },
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

export function ThreeLaunch({ light, t }: { light: ProtoLight; t: { current: number } }) {
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
    scene.background = skyTexture(L.sky[0], L.sky[1])
    scene.fog = new THREE.Fog(L.fog, 600, 7000)
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 1, 20000)

    // lights
    const sun = new THREE.DirectionalLight(L.sunColor, L.sunI)
    sun.position.set(...L.sun)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -40, near: 10, far: 3000 })
    scene.add(sun, new THREE.HemisphereLight(...L.hemi))
    const flameLight = new THREE.PointLight(0xffa64d, 0, 400, 1.6)
    scene.add(flameLight)

    // ground, foothills, the Misti far away
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const rnd = mulberry32(11)
    const hillMat = new THREE.MeshStandardMaterial({ color: L.misti, flatShading: true, roughness: 1 })
    for (let i = 0; i < 14; i++) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(300 + rnd() * 500, 150 + rnd() * 350, 6), hillMat)
      h.position.set(-4000 + i * 600 + rnd() * 200, 60, -3000 - rnd() * 1500)
      scene.add(h)
    }
    const misti = new THREE.Group()
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1500, 1500, 9, 1, true), hillMat)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(330, 330, 9), new THREE.MeshStandardMaterial({ color: 0xf5f3ff, flatShading: true }))
    cap.position.y = 590
    misti.add(cone, cap)
    misti.position.set(-1600, 740, -5200)
    scene.add(misti)
    if (L.stars) {
      const g = new THREE.BufferGeometry()
      const pts: number[] = []
      for (let i = 0; i < 1500; i++) {
        const a = rnd() * Math.PI * 2
        const e = 0.05 + rnd() * 1.4
        pts.push(Math.cos(a) * Math.cos(e) * 9000, Math.sin(e) * 9000, Math.sin(a) * Math.cos(e) * 9000)
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xe2e8f0, size: 2, sizeAttenuation: false, fog: false })))
    }

    // pad, flame trench and lattice tower (60 m)
    const steel = new THREE.MeshStandardMaterial({ color: light === 'day' ? 0xd5dbe3 : 0x8a96a8, metalness: 0.4, roughness: 0.6 })
    const concrete = new THREE.MeshStandardMaterial({ color: 0x77706a, roughness: 0.9 })
    const pad = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 40), concrete)
    pad.position.y = 2
    pad.receiveShadow = pad.castShadow = true
    scene.add(pad)
    const tower = new THREE.Group()
    const H = PROTO.towerHeight
    for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, H, 0.6), steel)
      leg.position.set(x, H / 2, z)
      tower.add(leg)
    }
    for (let y = 0; y < H; y += 5) {
      for (const [x, z, rx, ry] of [[3, 0, 0, 0], [3, 6, 0, 0], [0, 3, 0, Math.PI / 2], [6, 3, 0, Math.PI / 2]]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.3), steel)
        bar.position.set(x, y, z)
        bar.rotation.set(rx, ry, 0)
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

    // rocket (50 m): first stage 30 m, second stage 10 m, fairing 10 m. Origin at the first-stage nozzle.
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
    const rocket = new THREE.Group()
    const s1 = new THREE.Group()
    const body1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 30, 24), white)
    body1.position.y = 15
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 1.4, 24), orange)
    band.position.y = 19
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 1.6, 16, 1, true), dark)
    nozzle.position.y = -0.6
    s1.add(body1, band, nozzle)
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4, 2.2), dark)
      fin.position.set(Math.cos((i * Math.PI) / 2) * 2.4, 2.2, Math.sin((i * Math.PI) / 2) * 2.4)
      fin.rotation.y = -(i * Math.PI) / 2
      s1.add(fin)
    }
    const s2 = new THREE.Group()
    const inter = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1, 24), dark)
    inter.position.y = 30.5
    const body2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 9, 24), white)
    body2.position.y = 35.5
    const fairingShape = Array.from({ length: 12 }, (_, i) => new THREE.Vector2(1.95 * Math.cos((i / 11) * (Math.PI / 2)) ** 0.7, (i / 11) * 10))
    const fairing = new THREE.Mesh(new THREE.LatheGeometry(fairingShape, 24), white)
    fairing.position.y = 40
    s2.add(inter, body2, fairing)
    rocket.add(s1, s2)
    rocket.traverse((o) => (o.castShadow = true))
    rocket.position.y = 4.8
    scene.add(rocket)

    // flame cones (additive), vapour cone, staging flash
    const flameMat = new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1, 16, 1, true), flameMat)
    flame.rotation.x = Math.PI
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff7e0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    flameCore.rotation.x = Math.PI
    const flameGroup = new THREE.Group()
    flameGroup.add(flame, flameCore)
    rocket.add(flameGroup)
    const vapor = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))
    vapor.position.y = 37
    rocket.add(vapor)
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))
    scene.add(flash)

    // smoke puffs (sprites, pooled)
    const smokeTex = softTexture()
    const smokeColor = new THREE.Color(light === 'night' ? 0x6b7a90 : light === 'day' ? 0xf1f5f9 : 0xe9dcf2)
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
    const space = new THREE.Color(0x02040c)
    const fogBase = new THREE.Color(L.fog)
    let last = -1
    let prev = performance.now()
    let sepDone = false
    let raf = 0
    const camPos = new THREE.Vector3(-70, 22, 130)
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const time = t.current
      if (time < last) {
        pool.forEach((p) => (p.s.visible = false))
        if (sepDone) {
          rocket.add(s1)
          s1.position.set(0, 0, 0)
          s1.rotation.set(0, 0, 0)
          sepDone = false
        }
        camPos.set(-70, 22, 130)
      }
      last = time
      const r = rocketAt(time)
      rocket.position.set(r.down, 4.8 + r.alt, 0)
      rocket.rotation.z = -r.pitch
      arms.forEach((a, i) => (a.rotation.y = r.arms * (1.2 + i * 0.1)))
      ;(beacon.material as THREE.MeshBasicMaterial).color.setHex(Math.floor(time * 2) % 2 ? 0xff3b3b : 0x551111)
      ;(vapor.material as THREE.MeshBasicMaterial).opacity = r.vapor * 0.35

      if (r.stage === 2 && !sepDone) {
        sepDone = true
        scene.attach(s1)
      }
      if (sepDone) {
        const k = time - PROTO.meco
        s1.position.y -= (6 + k * 40) * dt
        s1.position.x -= 8 * dt
        s1.rotation.z += 0.5 * dt
      }
      const flashK = Math.max(0, 1 - Math.abs(time - PROTO.meco - 0.15) / 0.35)
      const up = new THREE.Vector3(Math.sin(r.pitch), Math.cos(r.pitch), 0)
      flash.position.copy(rocket.position).addScaledVector(up, 30.5)
      flash.scale.setScalar(4 + flashK * 50)
      ;(flash.material as THREE.SpriteMaterial).opacity = flashK

      // flame grows longer and wider with altitude (thinner air)
      const thin = Math.min(1, r.alt / 700)
      const flick = 0.85 + 0.3 * Math.abs(Math.sin(time * 37)) * Math.abs(Math.cos(time * 23))
      const len = (14 + thin * 40) * r.thrust * flick
      flameGroup.visible = r.thrust > 0.02
      flameGroup.position.y = (r.stage === 2 ? 30 : -1.2) - len / 2
      flame.scale.set(1 + thin * 3, len, 1 + thin * 3)
      flameCore.scale.set(1, len * 0.55, 1)
      flameCore.position.y = len * 0.2
      ;(flameMat as THREE.MeshBasicMaterial).color.setHex(r.stage === 2 ? 0x9cc8ff : 0xffffff)
      const nozzleW = rocket.position.clone().addScaledVector(up, r.stage === 2 ? 30 : -1)
      flameLight.position.copy(nozzleW).addScaledVector(up, -6)
      flameLight.intensity = r.thrust * (r.stage === 1 ? 5000 : 600) * flick

      // smoke: exhaust trail, and big clouds pushed out of the flame trench while near the pad
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
      for (const q of pool) {
        if (!q.s.visible) continue
        q.life += dt
        if (q.life >= q.max) {
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
        const d = q.s.position.distanceTo(nozzleW)
        m.color.copy(d < 25 && r.thrust > 0.2 ? new THREE.Color(0xffd2a0) : smokeColor)
      }

      // camera: wide on the pad, then follows and looks up; shake at ignition
      const target = new THREE.Vector3(r.down * 0.9, 25 + r.alt, 0)
      const want = new THREE.Vector3(-70 + r.down * 0.6, 22 + r.alt * 0.92, 130 + r.alt * 0.12)
      camPos.lerp(want, 1 - Math.exp(-dt * 2.5))
      const sh = r.shake * 0.35
      camera.position.set(camPos.x + sh * Math.sin(time * 71), camPos.y + sh * Math.cos(time * 53), camPos.z)
      camera.lookAt(target)
      const sp = Math.min(1, Math.max(0, (r.alt - 200) / 600))
      ;(scene.fog as THREE.Fog).color.copy(fogBase).lerp(space, sp)
      renderer.setClearColor(skyTop.clone().lerp(space, sp))
      scene.backgroundIntensity = 1 - sp * 0.95
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
      })
      el.removeChild(renderer.domElement)
    }
  }, [light, t])
  return <div ref={host} className="absolute inset-0" />
}
