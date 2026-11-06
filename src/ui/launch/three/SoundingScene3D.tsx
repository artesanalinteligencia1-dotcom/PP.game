import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../../../engine/rng'
import { SPACE_LINE_KM, type SoundingResult } from '../../../engine/sounding'
import { soundingAltKm, type SoundingTimeline } from '../../hub/soundingProfile'
import { EARTH_R, LIGHTS, addAndes, addStars, makeEarth, skyTexture, softTexture } from './common'

/**
 * The Paulet-1 prologue in Three.js (loaded on demand): a brass-and-copper sounding rocket on an 1890s-style rail at
 * dawn, straight up past the 100 km line, then a parachute. Driven by `soundingAltKm` through `tRef`; the HUD,
 * captions, countdown digits and sounds stay in SoundingSequence.
 */

/** World metres per kilometre of real altitude (the flight is compressed so the camera can follow it). */
const KM = 40
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

interface Puff { s: THREE.Sprite; life: number; max: number; v: THREE.Vector3; grow: number }

export default function SoundingScene3D({ T, tRef, result }: { T: SoundingTimeline; tRef: { current: number }; result: SoundingResult }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current!
    const L = LIGHTS.dawn
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const sky = skyTexture(L.sky[0], L.sky[1])
    scene.background = sky
    scene.fog = new THREE.Fog(L.fog, 900, 9000)
    const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 30000)
    const rnd = mulberry32(7)

    const sun = new THREE.DirectionalLight(L.sunColor, L.sunI)
    sun.position.set(...L.sun)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -10, near: 10, far: 8000 })
    const fill = new THREE.DirectionalLight(0xdfe6ff, 1.1)
    fill.position.set(-400, 250, 700)
    scene.add(sun, fill, new THREE.HemisphereLight(...L.hemi))
    const flameLight = new THREE.PointLight(0xffa64d, 0, 120, 1.6)
    scene.add(flameLight)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const andes = addAndes(scene, rnd, L)
    const starMat = addStars(scene, rnd, L.stars)
    const earth = makeEarth(rnd)
    scene.add(earth.group)

    // the 100 km line: a thin gold ring around the flight path
    const line = new THREE.Mesh(new THREE.RingGeometry(140, 143, 128), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false }))
    line.rotation.x = -Math.PI / 2
    line.position.y = SPACE_LINE_KM * KM
    scene.add(line)

    // 1890s launch rail: a braced wooden-and-iron mast and a small stone blockhouse
    const wood = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 })
    const iron = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.7, metalness: 0.3 })
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x6b625a, roughness: 1 }))
    base.position.y = 0.3
    base.receiveShadow = true
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 12, 0.3), wood)
    mast.position.set(-0.75, 6.6, 0)
    scene.add(base, mast)
    for (const [dx, dz] of [[-3, 0], [1.5, 0], [-0.75, 2.5], [-0.75, -2.5]]) {
      const from = new THREE.Vector3(-0.75, 4.5, 0)
      const to = new THREE.Vector3(dx, 0.6, dz)
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, from.distanceTo(to), 6), iron)
      brace.position.copy(from).add(to).multiplyScalar(0.5)
      brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize())
      scene.add(brace)
    }
    const hut = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 3), new THREE.MeshStandardMaterial({ color: 0x8a8178, roughness: 1 }))
    hut.position.set(-10, 1.2, 4)
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0xfde68a }))
    win.position.set(-10, 1.4, 5.51)
    scene.add(hut, win)
    scene.traverse((o) => (o.castShadow = true))

    // Paulet-1: brass and copper, 6 m, origin at the nozzle
    const copper = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.55, roughness: 0.4 })
    const brass = new THREE.MeshStandardMaterial({ color: 0xd99a2b, metalness: 0.6, roughness: 0.35 })
    const bronze = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.4, roughness: 0.5 })
    const rocket = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 4.2, 20), brass)
    body.position.y = 2.1
    const nose = new THREE.Mesh(new THREE.LatheGeometry(Array.from({ length: 10 }, (_, i) => new THREE.Vector2(0.35 * Math.cos((i / 9) * (Math.PI / 2)) ** 0.8, (i / 9) * 1.6)), 20), copper)
    nose.position.y = 4.2
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 20), bronze)
    band.position.y = 2.9
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.5, 14, 1, true), bronze)
    nozzle.position.y = -0.2
    rocket.add(body, nose, band, nozzle)
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.7), copper)
      fin.position.set(Math.cos((i * Math.PI) / 2) * 0.6, 0.5, Math.sin((i * Math.PI) / 2) * 0.6)
      fin.rotation.y = -(i * Math.PI) / 2
      rocket.add(fin)
    }
    rocket.traverse((o) => (o.castShadow = true))
    scene.add(rocket)
    const flameMat = new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 14, 1, true), flameMat)
    flame.rotation.x = Math.PI
    rocket.add(flame)

    // parachute: an orange canopy with shroud lines, above the rocket once it hangs nose-up
    const chute = new THREE.Group()
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8, side: THREE.DoubleSide }))
    canopy.position.y = 9
    chute.add(canopy)
    const lines: number[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      lines.push(Math.cos(a) * 2.6, 9, Math.sin(a) * 2.6, 0, 5.8, 0)
    }
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    chute.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xe2e8f0 })))
    scene.add(chute)

    const boom = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture('255,150,60'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }))
    scene.add(boom)

    // smoke (pooled sprites)
    const smokeTex = softTexture()
    const pool: Puff[] = []
    for (let i = 0; i < 160; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xe9dcf2, transparent: true, depthWrite: false, opacity: 0 }))
      s.visible = false
      scene.add(s)
      pool.push({ s, life: 0, max: 1, v: new THREE.Vector3(), grow: 0 })
    }
    const prand = mulberry32(42)
    const emit = (p: THREE.Vector3, v: THREE.Vector3, size: number, life: number) => {
      const q = pool.find((x) => !x.s.visible)
      if (!q) return
      q.s.visible = true
      q.s.position.copy(p)
      q.s.scale.setScalar(size)
      q.life = 0
      q.max = life
      q.v.copy(v)
      q.grow = size * 0.9
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
    const white = new THREE.Color(0xffffff)
    const fogBase = new THREE.Color(L.fog)
    const sunPad = new THREE.Vector3(...L.sun)
    const sunSpace = new THREE.Vector3(-600, 900, 1400)
    const OPEN = new THREE.Vector3(-14, 3, 24)
    const camOff = OPEN.clone()
    const tmp = new THREE.Vector3()
    let last = -1
    let prev = performance.now()
    let raf = 0

    const frame = (now: number) => {
      const wall = (now - prev) / 1000
      const dt = Math.min(0.05, wall)
      prev = now
      const time = tRef.current
      if (time < last - 0.01) {
        pool.forEach((p) => (p.s.visible = false))
        camOff.copy(OPEN)
      }
      const jumped = time - last > wall + 0.5
      last = time

      const altKm = soundingAltKm(time, T, result)
      const exploded = result.failed && time >= T.fail
      const burning = time >= T.ignition && time < T.burnout && !exploded
      const thrust = burning ? clamp((time - T.ignition) / (T.liftoff - T.ignition) + 0.2) : 0
      const chuteOpen = !result.failed && time >= T.chute
      // nose-down after apogee, back to nose-up hanging under the parachute
      const flip = chuteOpen ? Math.PI * (1 - clamp((time - T.chute) / 0.6)) : time >= T.apogee ? Math.PI * clamp((time - T.apogee) / 0.8) : 0
      rocket.position.set(0, 0.85 + altKm * KM, 0)
      rocket.rotation.z = flip
      rocket.visible = !exploded
      flame.visible = burning
      const flick = 0.85 + 0.3 * Math.abs(Math.sin(time * 37))
      const len = (2.5 + Math.min(1, altKm / 40) * 4) * thrust * flick
      flame.scale.set(1, len, 1)
      flame.position.y = -0.45 - len / 2
      flameLight.position.copy(rocket.position).add(tmp.set(0, -2, 0))
      flameLight.intensity = thrust * 600 * flick
      chute.visible = chuteOpen
      chute.position.copy(rocket.position)
      chute.scale.setScalar(clamp((time - T.chute) / 0.6) || 0.01)

      const bk = exploded ? time - T.fail : -1
      boom.visible = bk >= 0 && bk < 1.6
      if (boom.visible) {
        boom.position.copy(rocket.position).add(tmp.set(0, 2.5, 0))
        boom.scale.setScalar(2 + bk * 14)
        ;(boom.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - bk / 1.4)
        if (bk < 0.3) for (let i = 0; i < 4; i++) emit(boom.position.clone(), new THREE.Vector3((prand() - 0.5) * 10, (prand() - 0.5) * 7, (prand() - 0.5) * 10), 0.8 + prand() * 1.2, 1.6 + prand())
      }
      if (burning && !jumped) {
        for (let i = 0; i < 3; i++) {
          emit(rocket.position.clone().add(tmp.set((prand() - 0.5) * 0.6, -1 - prand() * 1.5, (prand() - 0.5) * 0.6)), new THREE.Vector3((prand() - 0.5) * 2, -6, (prand() - 0.5) * 2), 1.2 + prand(), 2.5 + prand() * 1.5)
        }
        if (altKm < 0.2) for (let i = 0; i < 2; i++) emit(new THREE.Vector3((prand() - 0.5) * 2, 0.8, (prand() - 0.5) * 2), new THREE.Vector3((prand() - 0.5) * 18, 1 + prand() * 2, (prand() - 0.5) * 18), 2 + prand() * 2, 3)
      }
      for (const q of pool) {
        if (!q.s.visible) continue
        q.life += dt
        if (q.life >= q.max || jumped) {
          q.s.visible = false
          continue
        }
        const k = q.life / q.max
        q.v.multiplyScalar(1 - 0.8 * dt)
        q.s.position.addScaledVector(q.v, dt)
        q.s.scale.setScalar(q.s.scale.x + q.grow * dt)
        ;(q.s.material as THREE.SpriteMaterial).opacity = 0.6 * (1 - k) * (k < 0.1 ? k / 0.1 : 1)
      }

      // sky: black above 100 km; the gold line shows on the way up; the Earth's curve appears near the top
      const space = clamp(altKm / SPACE_LINE_KM)
      ;(line.material as THREE.MeshBasicMaterial).opacity = 0.75 * clamp((altKm - 50) / 30) * (chuteOpen ? 0 : 1)
      line.position.x = rocket.position.x
      const earthK = clamp((space - 0.6) / 0.3)
      earth.setOpacity(earthK)
      earth.group.position.set(rocket.position.x, rocket.position.y - 150 - EARTH_R, 0)
      ground.visible = andes.visible = earthK < 0.3
      const fog = scene.fog as THREE.Fog
      fog.color.copy(fogBase).lerp(black, space)
      renderer.setClearColor(skyTop.clone().lerp(black, space))
      scene.backgroundIntensity = 1 - space * 0.97
      starMat.opacity = Math.max(L.stars, space)
      sun.intensity = L.sunI + (2.6 - L.sunI) * space
      sun.position.lerpVectors(sunPad, sunSpace, space)
      sun.color.setHex(L.sunColor).lerp(white, space)

      // camera: wide on the rail, then rides alongside the rocket (offset smoothed, not the position)
      const want = time < T.liftoff ? tmp.set(-11, 2.5, 18).lerp(OPEN, 1 - clamp(time / T.liftoff)) : tmp.set(-10, 3, 17)
      if (jumped) camOff.copy(want)
      else camOff.lerp(want, 1 - Math.exp(-dt * 2.5))
      const sh = time >= T.ignition && time < T.liftoff + 1.2 ? 0.06 : 0
      camera.position.copy(rocket.position).add(camOff).add(new THREE.Vector3(sh * Math.sin(time * 71), sh * Math.cos(time * 53), 0))
      camera.lookAt(rocket.position.x, rocket.position.y + (chuteOpen ? 5 : 2.5), 0)
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
      earth.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [T, tRef, result])
  return <div ref={host} className="absolute inset-0" />
}
