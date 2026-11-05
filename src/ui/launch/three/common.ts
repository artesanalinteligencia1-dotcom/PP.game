import * as THREE from 'three'
import type { SceneryStyle } from '../LaunchScenery'

// Shared by the 3D launch (LaunchScene3D) and the Paulet-1 prologue (SoundingScene3D).

export type SceneLight = (typeof LIGHTS)[SceneryStyle]

export const LIGHTS: Record<SceneryStyle, { sky: [string, string]; sun: [number, number, number]; sunColor: number; sunI: number; hemi: [number, number, number]; fog: number; hills: number; ground: number; stars: number; floods: boolean }> = {
  dawn: { sky: ['#433880', '#fdba74'], sun: [1200, 160, -5200], sunColor: 0xffc58a, sunI: 2.4, hemi: [0x8b7fb8, 0x3b2a20, 0.9], fog: 0xb58aa0, hills: 0x5a4a85, ground: 0x5b4636, stars: 0.25, floods: false },
  day: { sky: ['#1e54c8', '#d6eafa'], sun: [500, 900, 300], sunColor: 0xfffbea, sunI: 2.8, hemi: [0xbcdcff, 0x8a6a45, 1.3], fog: 0xb9c6da, hills: 0x8a735e, ground: 0xb8925f, stars: 0, floods: false },
  night: { sky: ['#020617', '#243260'], sun: [400, 600, -300], sunColor: 0x9fb4e0, sunI: 0.35, hemi: [0x1c2847, 0x05070d, 0.35], fog: 0x121e46, hills: 0x1c2847, ground: 0x151b2b, stars: 1, floods: true },
}

export function softTexture(rgb = '255,255,255') {
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
export function skyTexture(top: string, bottom: string) {
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

/** The Andes and the snow-capped Misti on the horizon, framed behind the pad from the opening camera at (-70, 22, 130). */
export function addAndes(scene: THREE.Scene, rnd: () => number, L: SceneLight) {
  const group = new THREE.Group()
  scene.add(group)
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
    group.add(peak)
    if (h > 820) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, h * 0.22, 6), snowMat)
      cap.position.set(p.x, h - h * 0.11 - 20, p.z)
      cap.rotation.y = peak.rotation.y
      group.add(cap)
    }
  }
  const misti = new THREE.Group()
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2300, 2200, 11, 1, true), hillMat)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(560, 520, 11), snowMat)
  cap.position.y = 1100 - 260
  misti.add(cone, cap)
  const mp = at(6200, -900)
  misti.position.set(mp.x, 1080, mp.z)
  group.add(misti)
  return group
}

/** Star field on a 20 km dome; returns its material so the scene can fade the stars in with altitude. */
export function addStars(scene: THREE.Scene, rnd: () => number, opacity: number) {
  const starGeo = new THREE.BufferGeometry()
  const pts: number[] = []
  for (let i = 0; i < 2000; i++) {
    const a = rnd() * Math.PI * 2
    const e = -0.2 + rnd() * 1.7
    pts.push(Math.cos(a) * Math.cos(e) * 20000, Math.sin(e) * 20000, Math.sin(a) * Math.cos(e) * 20000)
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity })
  scene.add(new THREE.Points(starGeo, starMat))
  return starMat
}

/**
 * The curved Earth seen from altitude: a big sphere with oceans, land and cloud patches, plus a thin blue atmosphere
 * shell. Place it below the rocket and fade it in as the sky turns black (`setOpacity`).
 */
export const EARTH_R = 6000 // small on purpose: the curve has to show within the camera's narrow view
export function makeEarth(rnd: () => number) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const x = c.getContext('2d')!
  const sea = x.createLinearGradient(0, 0, 0, 512)
  sea.addColorStop(0, '#1d4f91')
  sea.addColorStop(1, '#2b6cb0')
  x.fillStyle = sea
  x.fillRect(0, 0, 1024, 512)
  const blob = (fill: string, n: number, rmin: number, rmax: number, alpha: number) => {
    x.fillStyle = fill
    x.globalAlpha = alpha
    for (let i = 0; i < n; i++) {
      x.beginPath()
      x.ellipse(rnd() * 1024, rnd() * 512, rmin + rnd() * (rmax - rmin), (rmin + rnd() * (rmax - rmin)) * 0.6, rnd() * Math.PI, 0, Math.PI * 2)
      x.fill()
    }
  }
  blob('#4f7a3a', 260, 4, 22, 0.85)
  blob('#9a7b4f', 140, 3, 12, 0.6)
  blob('#ffffff', 420, 3, 16, 0.32)
  x.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  // only a small cap of the sphere is ever on screen: repeat the map so coastlines and clouds keep a believable size
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 3)
  const ground = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, transparent: true, opacity: 0, fog: false })
  const air = new THREE.MeshBasicMaterial({ color: 0x4ea3ff, transparent: true, opacity: 0, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 256, 128), ground), new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.01, 256, 128), air))
  // turn the sphere so the cap under the rocket is the map's equator, not its pole (where an equirectangular map streaks)
  group.rotation.z = Math.PI / 2
  group.visible = false
  const setOpacity = (k: number) => {
    group.visible = k > 0.01
    ground.opacity = k
    air.opacity = 0.28 * k
  }
  return { group, setOpacity, dispose: () => tex.dispose() }
}
