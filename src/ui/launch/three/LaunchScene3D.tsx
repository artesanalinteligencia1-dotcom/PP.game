import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing'
import type { RocketDesign } from '../../../engine/rocket'
import { launchDisplayScale, rocketLayout } from '../../../engine/rocketLayout'
import { mulberry32 } from '../../../engine/rng'
import type { Timeline } from '../LaunchSequence'
import type { SceneryStyle } from '../LaunchScenery'
import type { SpacecraftVisual } from '../../spacecraft/visual'
import { LANDING_TOUCH, ascentAt, boosterLandingAt, customStagingAt, hasSideBoosters, isReusableLauncher, rocketMetres, stagingTimes } from './ascent'
import { EARTH_R, LIGHTS, addAndes, addStars, makeEarth, makeEnvironment, skyTexture, softTexture } from './common'
import { buildRocket3D } from './rocket3d'
import { buildSpacecraft } from './spacecraft3d'

/**
 * The launch in Three.js (loaded on demand). Driven by the game timeline through `tRef` (seconds after pressing Launch);
 * the HUD, captions, countdown digits and every sound stay in LaunchSequence; the spacecraft is built from the design. Started from the `?proto=three` prototype.
 * With `rocket` (Rocket Engineer pad) the launcher is the player's own design, built from its parts: boosters and stages
 * drop in the design's order, on the same timeline.
 */

interface Puff { s: THREE.Sprite; life: number; max: number; v: THREE.Vector3; grow: number; a0: number; drag: number }

interface Props {
  launcherId: string
  light: SceneryStyle
  T: Timeline
  tRef: { current: number }
  failAt: number | null
  /** the player's spacecraft (`spacecraftVisual(design)`) */
  visual: SpacecraftVisual
  /** reusable launchers: whether the booster lands on the drone ship (mission roll); drawn in a 3D inset */
  landed?: boolean
  /** a player-built rocket: drawn from its parts instead of the catalog shape of `launcherId` */
  rocket?: RocketDesign
}

/** Booster-recovery inset, in CSS pixels from the bottom-right corner (LaunchSequence puts its labels on the same box). */
export const LANDING_INSET = { right: 12, bottom: 64, widthFrac: 0.26, aspect: 0.6 }

export default function LaunchScene3D({ launcherId, light, T, tRef, failAt, visual, landed = true, rocket: rocketDesign }: Props) {
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
    // the pad's own sky as an environment map: metal has something to reflect
    const env = makeEnvironment(renderer, L)
    scene.environment = env.texture
    // bloom on the flames and on sunlit metal, a soft vignette; the filmic tone mapping moves into the composer.
    // Without float render targets the scene is drawn directly, as before.
    let composer: EffectComposer | null = null
    try {
      composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 4 })
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(new EffectPass(camera, new BloomEffect({ mipmapBlur: true, luminanceThreshold: 1.1, luminanceSmoothing: 0.2, intensity: 0.8, radius: 0.7 }), new VignetteEffect({ offset: 0.3, darkness: 0.45 }), new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })))
    } catch {
      composer = null
    }
    const rnd = mulberry32(11)

    // lights
    const sun = new THREE.DirectionalLight(L.sunColor, L.sunI)
    sun.position.set(...L.sun)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -40, near: 10, far: 8000 })
    // soft fill from the camera side, so a rocket lit from behind (dawn) still reads
    const fill = new THREE.DirectionalLight(0xdfe6ff, light === 'day' ? 0.5 : light === 'dawn' ? 1.1 : 0.6)
    fill.position.set(-400, 250, 700)
    scene.add(sun, fill, new THREE.HemisphereLight(...L.hemi))
    const flameLight = new THREE.PointLight(0xffa64d, 0, 400, 1.6)
    scene.add(flameLight)

    // ground, the Andes and the Misti on the horizon, framed behind the pad from the opening camera
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const andes = addAndes(scene, rnd, L)

    // stars: always there, shown at night and with altitude
    const starMat = addStars(scene, rnd, L.stars)

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

    // a player-built rocket, fitted to the pad (launchDisplayScale); null for the catalog launchers
    const custom = rocketDesign ? buildRocket3D(rocketLayout(rocketDesign, launchDisplayScale(rocketLayout(rocketDesign).heightM))) : null
    const CL = custom?.layout ?? null
    const stageCount = CL ? CL.stages.length : 2
    const RH = CL ? CL.heightM : rocketMetres(launcherId)

    // pad, lattice tower, service arms
    const H = RH < 42 ? 46 : 60
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

    // rocket: origin at the first-stage nozzle. Catalog launchers: first stage 60 %, second stage 20 %, fairing 20 % of the
    // height. A player-built rocket takes every size from its layout (h2 = all the stages above the first).
    const R = CL ? CL.stages[0].diameterM / 2 : launcherId === 'light' ? 1.4 : 1.8
    const h1 = CL ? CL.stages[0].lengthM : RH * 0.6
    const hf = CL ? (CL.fairing?.lengthM ?? 0) : RH * 0.2
    const h2 = CL ? RH - h1 - hf : RH * 0.2
    const reusable = CL ? CL.reusable && stageCount > 1 : isReusableLauncher(launcherId)
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
    const rocket = new THREE.Group()
    const Rs = CL ? (CL.boosters?.diameterM ?? 0) / 2 : R * 0.55
    const sideFlameMat = new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const sideFlame = () => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(Rs * 0.9, 1, 14, 1, true), sideFlameMat)
      f.rotation.x = Math.PI
      return f
    }
    let s1: THREE.Group
    /** what reaches orbit: it carries the spacecraft and the fairing */
    let top: THREE.Group
    let halves: THREE.Group[]
    let sides: { g: THREE.Group; home: THREE.Vector3; drift: THREE.Vector3; flame: THREE.Mesh }[]
    let nozzle2: THREE.Mesh | null = null
    /** player-built rockets with three stages: the ones that drop between MECO and SECO */
    const mids = custom ? custom.stages.slice(1, -1) : []
    if (custom) {
      s1 = custom.stages[0]
      top = custom.stages[custom.stages.length - 1]
      halves = custom.fairing
      sides = custom.boosters.map((b) => {
        const flame = sideFlame()
        b.group.add(flame)
        return { g: b.group, home: b.home, drift: b.out.clone().multiplyScalar(7).setY(-0.7), flame }
      })
      custom.stages.forEach((g) => rocket.add(g))
      sides.forEach((s) => rocket.add(s.g))
    } else {
    s1 = new THREE.Group()
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
    // reusable first stages: grid fins near the top and landing legs folded against the body (they open for the landing)
    if (reusable) {
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.8), dark)
        fin.position.set(Math.cos(a) * (R + 0.9), h1 - 3, Math.sin(a) * (R + 0.9))
        fin.rotation.y = -a
        s1.add(fin)
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 9, 0.35), dark)
        leg.position.set(Math.cos(a) * (R + 0.35), 5.2, Math.sin(a) * (R + 0.35))
        leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08)
        s1.add(leg)
      }
    }
    // strap-on boosters for the heavy launchers
    const hs = h1 * 0.72
    sides = hasSideBoosters(launcherId)
      ? [0.6, Math.PI + 0.6].map((a) => {
          const g = new THREE.Group()
          const body = new THREE.Mesh(new THREE.CylinderGeometry(Rs, Rs, hs, 20), white)
          body.position.y = hs / 2
          const nose = new THREE.Mesh(new THREE.ConeGeometry(Rs, Rs * 2.4, 20), orange)
          nose.position.y = hs + Rs * 1.2
          const nz = new THREE.Mesh(new THREE.CylinderGeometry(Rs * 0.5, Rs * 0.8, 1.1, 14, 1, true), dark)
          nz.position.y = -0.4
          g.add(body, nose, nz)
          const home = new THREE.Vector3(Math.cos(a) * (R + Rs + 0.15), 0.2, Math.sin(a) * (R + Rs + 0.15))
          g.position.copy(home)
          const f = sideFlame()
          g.add(f)
          return { g, home, drift: new THREE.Vector3(Math.cos(a), -0.1, Math.sin(a)).multiplyScalar(7), flame: f }
        })
      : []
    const s2 = new THREE.Group()
    const inter = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 24), dark)
    inter.position.y = h1 + 0.5
    const body2 = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h2 - 1, 24), white)
    body2.position.y = h1 + 1 + (h2 - 1) / 2
    nozzle2 = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.35, R * 0.6, 1.4, 16, 1, true), dark)
    nozzle2.position.y = h1 - 0.2
    nozzle2.visible = false
    const fairingShape = Array.from({ length: 12 }, (_, i) => new THREE.Vector2((R + 0.15) * Math.cos((i / 11) * (Math.PI / 2)) ** 0.7, (i / 11) * hf))
    halves = [0, Math.PI].map((phi) => {
      const g = new THREE.Group()
      const m = new THREE.Mesh(new THREE.LatheGeometry(fairingShape, 16, phi, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, side: THREE.DoubleSide }))
      g.add(m)
      g.position.y = h1 + h2
      return g
    })
    s2.add(inter, body2, nozzle2, ...halves)
    rocket.add(s1, s2)
    sides.forEach((s) => rocket.add(s.g))
    top = s2
    }
    // the player's spacecraft (procedural, from the design) stowed inside the fairing
    const Rf = CL?.fairing ? CL.fairing.diameterM / 2 : R
    const busM = Rf * (0.55 + 0.5 * Math.min(1, Math.max(0, (visual.bus - 16) / 14)))
    const sc = buildSpacecraft(visual, busM)
    const craft = sc.group
    const below = (visual.instruments.some((i) => i.shape === 'telescope') ? 19 : visual.instruments.some((i) => i.shape === 'bigCamera') ? 13 : 9) * (busM / visual.bus)
    const craftHome = new THREE.Vector3(0, h1 + h2 + 0.3 + below + busM / 2, 0)
    craft.position.copy(craftHome)
    top.add(craft)
    rocket.traverse((o) => (o.castShadow = true))
    sides.forEach((s) => (s.flame.castShadow = false))
    rocket.position.y = 4.8
    scene.add(rocket)

    // the curved Earth, faded in above the atmosphere
    const earth = makeEarth(rnd)
    scene.add(earth.group)

    // booster recovery (reusable launchers): a second small scene drawn in an inset — ocean, drone ship, returning booster
    const recovery = reusable
      ? (() => {
          const ls = new THREE.Scene()
          ls.background = new THREE.Color(light === 'night' ? 0x0b1430 : light === 'day' ? 0x7fb2e8 : 0xb98aa8)
          ls.fog = new THREE.Fog(ls.background as THREE.Color, 200, 900)
          ls.add(new THREE.HemisphereLight(0xffffff, 0x223344, light === 'night' ? 0.8 : 1.4))
          const key = new THREE.DirectionalLight(0xffffff, light === 'night' ? 0.9 : 2)
          key.position.set(-60, 120, 160)
          ls.add(key)
          const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: light === 'night' ? 0x0d2547 : 0x1f5f99, roughness: 0.35, metalness: 0.1 }))
          sea.rotation.x = -Math.PI / 2
          ls.add(sea)
          const ship = new THREE.Group()
          const deck = new THREE.Mesh(new THREE.BoxGeometry(36, 2.4, 22), new THREE.MeshStandardMaterial({ color: 0x3f4652, roughness: 0.8 }))
          deck.position.y = 1.2
          const mark = new THREE.Mesh(new THREE.RingGeometry(5, 6.2, 32), new THREE.MeshBasicMaterial({ color: 0xfacc15 }))
          mark.rotation.x = -Math.PI / 2
          mark.position.y = 2.45
          ship.add(deck, mark)
          for (const z of [-11.5, 11.5]) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(36, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x9aa3ad }))
            rail.position.set(0, 3, z)
            ship.add(rail)
          }
          ls.add(ship)
          const bh = h1
          const b = new THREE.Group()
          const legs: THREE.Group[] = []
          // a player-built first stage: built again from the same layout and shown at the inset's usual size
          const again = CL ? buildRocket3D(CL) : null
          const insetK = CL ? Math.min(30 / h1, 2.6 / R) : 1
          if (again) {
            const stage = again.stages[0]
            stage.scale.setScalar(insetK)
            stage.position.y = (CL!.legs?.footDropM ?? 0) * insetK
            b.add(stage)
          } else {
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, bh, 20), new THREE.MeshStandardMaterial({ color: 0xe6eaf0, roughness: 0.6 }))
          tube.position.y = bh / 2
          const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.2, 20), dark)
          top.position.y = bh + 0.6
          b.add(tube, top)
          legs.push(...[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2 + Math.PI / 4
            const pivot = new THREE.Group()
            pivot.position.set(Math.cos(a) * R, 6, Math.sin(a) * R)
            pivot.rotation.y = -a
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 0.4), dark)
            leg.position.y = -4.5
            pivot.add(leg)
            b.add(pivot)
            return pivot
          }))
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + Math.PI / 4
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.8), dark)
            fin.position.set(Math.cos(a) * (R + 0.9), bh - 3, Math.sin(a) * (R + 0.9))
            fin.rotation.y = -a
            b.add(fin)
          }
          }
          const setLegs = again ? again.setLegs : (k: number) => legs.forEach((p) => (p.rotation.z = k * 0.55))
          const burn = new THREE.Mesh(new THREE.ConeGeometry(R * insetK * 0.7, 9, 14, 1, true), new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
          burn.rotation.x = Math.PI
          burn.position.y = -4.5
          b.add(burn)
          ls.add(b)
          const blast = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture('255,150,60'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))
          ls.add(blast)
          const cam = new THREE.PerspectiveCamera(32, 1 / LANDING_INSET.aspect, 1, 3000)
          cam.position.set(-70, 22, 95)
          cam.lookAt(0, 22, 0)
          return { ls, b, setLegs, burn, blast, cam, again }
        })()
      : null

    // flame, vapour cone, staging flash, explosion
    const flameMat = new THREE.MeshBasicMaterial({ map: softTexture('255,190,100'), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const flame = new THREE.Mesh(new THREE.ConeGeometry(R * 0.9, 1, 16, 1, true), flameMat)
    flame.rotation.x = Math.PI
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(R * 0.45, 1, 12, 1, true), new THREE.MeshBasicMaterial({ map: softTexture('255,247,224'), color: 0xfff7e0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
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
      if (composer) composer.setSize(w, h, false)
      else renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const ENV_I = 0.45
    const skyTop = new THREE.Color(L.sky[0])
    const black = new THREE.Color(0x02040c)
    const white3 = new THREE.Color(0xffffff)
    const sunPad = new THREE.Vector3(...L.sun)
    const sunSpace = new THREE.Vector3(-600, 900, 1400) // from behind the camera, so the spacecraft's visible side is lit
    const fogBase = new THREE.Color(L.fog)
    const OPEN_CAM = new THREE.Vector3(-70, 22, 130)
    const camPos = OPEN_CAM.clone()
    const camOff = OPEN_CAM.clone().sub(new THREE.Vector3(0, 4.8, 0))
    const up = new THREE.Vector3()
    const tmp = new THREE.Vector3()
    let last = -1
    let prev = performance.now()
    let sepDone = false
    let sideDone = false
    let fairingGone = false
    let raf = 0
    const separates = stageCount > 1
    const sepTimes = custom ? stagingTimes(T, stageCount) : [T.meco]
    const midDone = mids.map(() => false)

    const frame = (now: number) => {
      const wall = (now - prev) / 1000
      const dt = Math.min(0.05, wall)
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
        if (sideDone) {
          sides.forEach((s) => {
            rocket.add(s.g)
            s.g.position.copy(s.home)
            s.g.rotation.set(0, 0, 0)
          })
          sideDone = false
        }
        mids.forEach((m, i) => {
          if (!midDone[i]) return
          rocket.add(m)
          m.position.set(0, 0, 0)
          m.rotation.set(0, 0, 0)
          midDone[i] = false
        })
        camOff.copy(OPEN_CAM).sub(tmp.set(0, 4.8, 0))
      }
      // "Skip animation" moves the clock much further than the wall clock did: settle instantly. Slow frames are not skips.
      const jumped = time - last > wall + 0.5
      last = time
      const exploded = failAt !== null && time >= failAt
      // after a failure everything stays where it broke up (the camera does not keep climbing)
      const r = ascentAt(exploded ? failAt! : time, T)
      // player-built rockets: which stage burns, and the short coast while an upper stage drops
      const cs = custom ? customStagingAt(exploded ? failAt! : time, T, stageCount) : null
      const thrust = r.thrust * (cs?.throttle ?? 1)
      const burnY = CL && cs ? CL.stages[cs.stage].y0 : null

      rocket.position.set(r.down, 4.8 + r.alt, 0)
      rocket.rotation.z = -r.pitch
      rocket.visible = !exploded
      arms.forEach((a, i) => (a.rotation.y = r.arms * (1.2 + i * 0.1)))
      ;(beacon.material as THREE.MeshBasicMaterial).color.setHex(Math.floor(time * 2) % 2 ? 0xff3b3b : 0x551111)
      ;(vapor.material as THREE.MeshBasicMaterial).opacity = r.vapor * 0.35
      up.set(Math.sin(r.pitch), Math.cos(r.pitch), 0)

      // stage separation: the first stage stays in the world and falls away
      if (r.stage === 2 && !sepDone && separates) {
        sepDone = true
        scene.attach(s1)
      }
      if (sepDone && s1.parent === scene) {
        const k = time - T.meco
        s1.position.y -= (6 + k * 40) * dt
        s1.position.x -= 8 * dt
        s1.rotation.z += 0.5 * dt
      }
      mids.forEach((m, i) => {
        if (cs && cs.stage > i + 1 && !midDone[i]) {
          midDone[i] = true
          scene.attach(m)
        }
        if (midDone[i] && m.parent === scene) {
          const k = time - sepTimes[i + 1]
          m.position.y -= (6 + k * 40) * dt
          m.position.x -= 8 * dt
          m.rotation.z += 0.5 * dt
        }
      })
      const thin = Math.min(1, r.alt / 900)
      const flick = 0.85 + 0.3 * Math.abs(Math.sin(time * 37)) * Math.abs(Math.cos(time * 23))
      // side boosters burn out and swing away just before MECO
      if (sides.length && time >= T.meco - 0.4 && !sideDone) {
        sideDone = true
        sides.forEach((s) => scene.attach(s.g))
      }
      for (const s of sides) {
        s.flame.visible = !sideDone && thrust > 0.02 && !exploded
        const sl = (RH * 0.25 + thin * RH * 0.5) * thrust * flick
        s.flame.scale.set(1 + thin * 2, sl, 1 + thin * 2)
        s.flame.position.y = -0.9 - sl / 2
        if (sideDone && s.g.parent === scene) {
          const k = time - (T.meco - 0.4)
          s.g.position.addScaledVector(s.drift, dt)
          s.g.position.y -= (4 + k * 35) * dt
          s.g.rotation.z += 0.4 * dt
        }
      }
      if (nozzle2) nozzle2.visible = sepDone
      // deployment: the spacecraft pushes off the upper stage, turns slowly and unfolds its arrays
      const dk = Math.min(1, Math.max(0, (time - T.deploy) / 3.5))
      const de = 1 - (1 - dk) ** 2
      craft.position.set(craftHome.x + de * busM * 1.2, craftHome.y + de * busM * 4, craftHome.z + de * busM * 2.5)
      craft.rotation.set(de * 0.3, de * 0.25, -de * 0.15)
      sc.setDeploy((time - T.deploy - 0.6) / 1.6)
      // fairing halves swing open and drift off
      halves.forEach((g, i) => {
        const s = i === 0 ? 1 : -1
        g.rotation.x = s * r.fairing * 0.9
        g.position.z = s * r.fairing * 6
        g.position.y = h1 + h2 - r.fairing * 4
        g.visible = r.fairing < 1
      })
      if (r.fairing >= 1 && !fairingGone) fairingGone = true
      // staging flash at every separation
      let flashK = 0
      let flashY = h1 + 0.5
      sepTimes.forEach((x, i) => {
        const fk = Math.max(0, 1 - Math.abs(time - x - 0.15) / 0.35)
        if (fk <= flashK) return
        flashK = fk
        flashY = (CL ? CL.stages[i + 1].y0 : h1) + 0.5
      })
      flash.position.copy(rocket.position).addScaledVector(up, flashY)
      flash.scale.setScalar(3 + flashK * 18)
      ;(flash.material as THREE.SpriteMaterial).opacity = exploded ? 0 : flashK

      // flame: longer and wider in thin air; blue-ish on the upper stage
      const len = (RH * 0.3 + thin * RH * 0.8) * thrust * flick
      flameGroup.visible = thrust > 0.02
      flameGroup.position.y = (burnY !== null ? burnY - 0.2 : r.stage === 2 ? h1 - 0.9 : -1.2) - len / 2
      const fw = CL && cs ? CL.stages[cs.stage].diameterM / (2 * R) : 1 // a narrower upper stage has a narrower flame
      flame.scale.set((1 + thin * 3) * fw, len, (1 + thin * 3) * fw)
      flameCore.scale.set(fw, len * 0.55, fw)
      flameCore.position.y = len * 0.2
      flameMat.color.setHex(r.stage === 2 ? 0x9cc8ff : 0xffffff)
      const nozzleW = rocket.position.clone().addScaledVector(up, burnY ?? (r.stage === 2 ? h1 : -1))
      flameLight.position.copy(nozzleW).addScaledVector(up, -6)
      flameLight.intensity = exploded ? 0 : thrust * (r.stage === 1 ? 5000 : 600) * flick

      // explosion
      const bk = exploded ? time - failAt! : -1
      boom.visible = bk >= 0 && bk < 1.8
      if (boom.visible) {
        boom.position.copy(rocket.position).addScaledVector(up, RH * 0.5)
        const bf = r.stage === 2 ? 0.18 : 1 // the camera is close to the upper stage: a smaller blast fills the frame enough
        boom.scale.setScalar((10 + bk * 90) * bf)
        ;(boom.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - bk / 1.6)
        if (bk < 0.4) for (let i = 0; i < 6; i++) emit(boom.position.clone(), new THREE.Vector3((prand() - 0.5) * 60 * bf, (prand() - 0.5) * 40 * bf, (prand() - 0.5) * 60 * bf), (6 + prand() * 8) * bf, 2 + prand() * 2, 0.7, 0.8)
      }

      // smoke: exhaust trail, and big clouds pushed out of the flame trench near the pad
      if (!exploded && !jumped) {
        const n = Math.round(thrust * (r.stage === 1 ? 6 : 1))
        for (let i = 0; i < n; i++) {
          const p = nozzleW.clone().addScaledVector(up, -4 - prand() * 4)
          p.x += (prand() - 0.5) * 3
          p.z += (prand() - 0.5) * 3
          emit(p, up.clone().multiplyScalar(-14).add(new THREE.Vector3((prand() - 0.5) * 6, 0, (prand() - 0.5) * 6)), 5 + prand() * 4, 3 + prand() * 2.5, 0.55, 0.5)
        }
        if (thrust > 0.1 && r.alt < 30) {
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
        m.color.copy(q.s.position.distanceTo(nozzleW) < 25 && thrust > 0.2 ? hotColor : smokeColor)
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
        want.lerp(near.clone().add(tmp.set(-17, 7, 28)), close) // slightly above, so the Earth's curve shows below
      }
      if (dk > 0) {
        // close-up on the spacecraft while it unfolds its arrays
        const cw = craft.getWorldPosition(new THREE.Vector3())
        const k = Math.min(1, dk * 1.6)
        target.lerp(cw, k)
        want.lerp(cw.clone().add(tmp.set(-busM * 1.2, busM * 1.2, busM * 8.5)), k)
      }
      // smooth the framing (offset from the rocket), not the position: the rocket climbs too fast for a lagging camera
      const wantOff = want.sub(rocket.position)
      if (jumped) camOff.copy(wantOff)
      else camOff.lerp(wantOff, 1 - Math.exp(-dt * 2.5))
      camPos.copy(rocket.position).add(camOff)
      const sh = r.shake * 0.35
      camera.position.set(camPos.x + sh * Math.sin(time * 71), camPos.y + sh * Math.cos(time * 53), camPos.z)
      camera.lookAt(target)

      // sky: towards black with altitude, stars come out
      const fog = scene.fog as THREE.Fog
      fog.color.copy(fogBase).lerp(black, r.space)
      renderer.setClearColor(skyTop.clone().lerp(black, r.space))
      scene.backgroundIntensity = 1 - r.space * 0.97
      scene.environmentIntensity = ENV_I * (1 - r.space * 0.6)
      starMat.opacity = Math.max(L.stars, r.space)
      // above the atmosphere the Sun lights the rocket fully, whatever the light at the pad
      sun.intensity = L.sunI + (2.6 - L.sunI) * r.space
      sun.position.lerpVectors(sunPad, sunSpace, r.space)
      sun.color.setHex(L.sunColor).lerp(white3, r.space)
      // the Earth below the rocket once the sky turns black; the flat ground hides when it would show through
      earth.group.position.set(rocket.position.x, rocket.position.y - 150 - EARTH_R, 0)
      const earthK = Math.min(1, Math.max(0, (r.space - 0.35) / 0.45))
      earth.setOpacity(earthK)
      ground.visible = andes.visible = earthK < 0.3
      if (composer) composer.render(dt)
      else renderer.render(scene, camera)

      // booster-recovery inset: from MECO + 0.4 s for 6 s
      const lt = time - T.meco - 0.4
      if (recovery && !exploded && lt >= 0 && lt < 6.1) {
        const st = boosterLandingAt(lt, landed)
        const { b, setLegs, burn, blast, cam, ls } = recovery
        b.visible = !st.crashed
        b.position.set(0, 2.4 + st.y, 0)
        b.rotation.z = st.tilt
        setLegs(st.legs)
        burn.visible = st.burning
        burn.scale.y = 0.8 + 0.4 * Math.abs(Math.sin(time * 37))
        const bk = lt - LANDING_TOUCH
        blast.visible = st.crashed && bk < 1.6
        blast.position.set(0, 4, 0)
        blast.scale.setScalar(6 + bk * 40)
        ;(blast.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - bk / 1.5)
        cam.lookAt(0, 14 + Math.min(st.y, 60) * 0.5, 0)
        const W = el.clientWidth
        const w = Math.round(W * LANDING_INSET.widthFrac)
        const h = Math.round(w * LANDING_INSET.aspect)
        const x = W - w - LANDING_INSET.right
        renderer.setScissorTest(true)
        renderer.setScissor(x, LANDING_INSET.bottom, w, h)
        renderer.setViewport(x, LANDING_INSET.bottom, w, h)
        renderer.clear() // the composer turns the renderer's own clearing off
        renderer.render(ls, cam)
        renderer.setScissorTest(false)
        renderer.setViewport(0, 0, el.clientWidth, el.clientHeight)
      }
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
      env.dispose()
      composer?.dispose()
      custom?.dispose()
      recovery?.again?.dispose()
      recovery?.ls.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        ;(m.material as THREE.Material | undefined)?.dispose?.()
      })
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [launcherId, light, T, tRef, failAt, visual, landed, rocketDesign])
  return <div ref={host} className="absolute inset-0" />
}
