import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../../engine/rng'
import { softTexture } from '../launch/three/common'

/**
 * The chosen world in 3D (loaded on demand: three.js stays out of the main bundle). Procedural globe per world, its
 * atmosphere if it has one, your spacecraft on a polar orbit, Enceladus' plume, and a "look inside" mode that thins the
 * crust to show the hidden ocean. Drag or use the arrow keys to turn it. Draws only when something moves.
 */
interface Look {
  base: string
  /** [colour, count, min radius, max radius, alpha] blobs painted over the base */
  blobs: [string, number, number, number, number][]
  caps?: string
  lines?: { color: string; n: number; south?: boolean }
  air?: { color: number; opacity: number; scale: number }
  plume?: boolean
}

const LOOKS: Record<string, Look> = {
  earth: { base: '#1f5fa8', blobs: [['#3f7d3a', 60, 10, 46, 0.9], ['#a08454', 30, 6, 22, 0.7], ['#ffffff', 120, 6, 26, 0.35]], caps: '#f8fafc', air: { color: 0x4ea3ff, opacity: 0.25, scale: 1.04 } },
  moon_poles: { base: '#9a9a96', blobs: [['#6f6f6c', 26, 12, 44, 0.6], ['#c4c4bf', 160, 2, 7, 0.5], ['#55554f', 160, 2, 6, 0.45]], caps: '#3b4252' },
  mars: { base: '#b5552f', blobs: [['#7e3520', 40, 10, 50, 0.55], ['#d98a55', 50, 8, 30, 0.45]], caps: '#f3ede6', air: { color: 0xf0a37a, opacity: 0.1, scale: 1.02 } },
  europa: { base: '#e9e4d8', blobs: [['#c9b89a', 30, 12, 46, 0.35]], lines: { color: '#8a5a3a', n: 70 } },
  enceladus: { base: '#f4f7fb', blobs: [['#dfe7f0', 30, 10, 40, 0.5]], lines: { color: '#4aa3df', n: 5, south: true }, plume: true },
  titan: { base: '#c98a2b', blobs: [['#a86c1c', 30, 20, 70, 0.35], ['#e0a94a', 30, 20, 60, 0.3]], air: { color: 0xf0a030, opacity: 0.4, scale: 1.09 } },
}

function worldTexture(id: string) {
  const look = LOOKS[id] ?? LOOKS.mars
  const rnd = mulberry32(id.length * 97 + id.charCodeAt(0))
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const x = c.getContext('2d')!
  x.fillStyle = look.base
  x.fillRect(0, 0, 1024, 512)
  for (const [fill, n, rmin, rmax, alpha] of look.blobs) {
    x.fillStyle = fill
    x.globalAlpha = alpha
    for (let i = 0; i < n; i++) {
      x.beginPath()
      x.ellipse(rnd() * 1024, 40 + rnd() * 432, rmin + rnd() * (rmax - rmin), (rmin + rnd() * (rmax - rmin)) * 0.6, rnd() * Math.PI, 0, Math.PI * 2)
      x.fill()
    }
  }
  x.globalAlpha = 1
  if (look.lines) {
    x.strokeStyle = look.lines.color
    x.lineWidth = look.lines.south ? 5 : 1.6
    x.globalAlpha = look.lines.south ? 0.9 : 0.55
    for (let i = 0; i < look.lines.n; i++) {
      x.beginPath()
      if (look.lines.south) {
        // "tiger stripes": parallel cracks near the south pole
        x.moveTo(0, 462 + i * 9)
        x.lineTo(1024, 462 + i * 9)
      } else {
        const x0 = rnd() * 1024
        const y0 = rnd() * 512
        x.moveTo(x0, y0)
        x.bezierCurveTo(x0 + 120 * (rnd() - 0.5), y0 + 90 * (rnd() - 0.5), x0 + 260 * (rnd() - 0.5), y0 + 160 * (rnd() - 0.5), x0 + 420 * (rnd() - 0.5), y0 + 220 * (rnd() - 0.5))
      }
      x.stroke()
    }
    x.globalAlpha = 1
  }
  if (look.caps) {
    for (const [y0, y1] of [[0, 34], [512, 478]]) {
      const g = x.createLinearGradient(0, y0, 0, y1)
      g.addColorStop(0, look.caps)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = g
      x.fillRect(0, Math.min(y0, y1), 1024, 34)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function WorldViewer3D({ targetId, inside, spin, label }: { targetId: string; /** thin the crust to show the ocean below */ inside: boolean; spin: boolean; label: string }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ show: (id: string, inside: boolean) => void } | null>(null)

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    el.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.6)
    sun.position.set(4, 2, 3)
    scene.add(sun, new THREE.AmbientLight(0x8fa3c8, 0.5))

    const pivot = new THREE.Group()
    scene.add(pivot)
    const crustMat = new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true })
    const crust = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), crustMat)
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(0.88, 48, 32), new THREE.MeshStandardMaterial({ color: 0x1d6fd6, emissive: 0x0b3d91, emissiveIntensity: 0.8, roughness: 0.3 }))
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 1 }))
    const airMat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    const air = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), airMat)
    const plumeTex = softTexture('190,225,255')
    const plume = new THREE.Sprite(new THREE.SpriteMaterial({ map: plumeTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }))
    plume.scale.set(0.5, 1.1, 1)
    plume.position.y = -1.45
    pivot.add(core, ocean, crust, air, plume)
    // your spacecraft on a polar orbit (it sees the poles on every lap)
    const orbit = new THREE.Group()
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.004, 6, 96), new THREE.MeshBasicMaterial({ color: 0x64748b }))
    const craft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xfacc15 }))
    orbit.add(ring, craft)
    orbit.rotation.y = 0.5
    scene.add(orbit)

    let tex: THREE.Texture | null = null
    let yaw = 0
    let pitch = 0.25
    let auto = spin
    let dirty = true
    let phase = 0
    let raf = 0
    let prev = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (auto) {
        yaw += dt * 0.12
        phase += dt * 0.5
        dirty = true
      }
      if (dirty) {
        dirty = false
        pivot.rotation.y = yaw
        craft.position.set(Math.cos(phase) * 1.45, Math.sin(phase) * 1.45, 0)
        camera.position.set(0, Math.sin(pitch) * 5.2, Math.cos(pitch) * 5.2)
        camera.lookAt(0, -0.1, 0)
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(frame)
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
      dirty = true
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    api.current = {
      show: (id, seeInside) => {
        const look = LOOKS[id] ?? LOOKS.mars
        tex?.dispose()
        tex = worldTexture(id)
        crustMat.map = tex
        crustMat.opacity = seeInside ? 0.3 : 1
        crustMat.depthWrite = !seeInside
        crustMat.needsUpdate = true
        ocean.visible = core.visible = seeInside
        air.visible = !!look.air
        if (look.air) {
          airMat.color.setHex(look.air.color)
          airMat.opacity = look.air.opacity
          air.scale.setScalar(look.air.scale)
        }
        plume.visible = !!look.plume
        dirty = true
      },
    }

    let drag: { id: number; x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
      auto = false
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      yaw += (e.clientX - drag.x) * 0.01
      if (e.pointerType === 'mouse') pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.006))
      drag.x = e.clientX
      drag.y = e.clientY
      dirty = true
    }
    const up = (e: PointerEvent) => {
      if (drag?.id === e.pointerId) drag = null
    }
    const keydown = (e: KeyboardEvent) => {
      const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.15], ArrowDown: [0, -0.15] }[e.key]
      if (!step) return
      e.preventDefault()
      auto = false
      yaw += step[0]
      pitch = Math.max(-1.2, Math.min(1.2, pitch + step[1]))
      dirty = true
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('keydown', keydown)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('keydown', keydown)
      api.current = null
      tex?.dispose()
      plumeTex.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        ;(m.material as THREE.Material | undefined)?.dispose?.()
      })
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
    // the renderer lives as long as the viewer; `spin` only matters when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api.current?.show(targetId, inside)
  }, [targetId, inside])

  return <div ref={host} role="img" aria-label={label} tabIndex={0} data-world-3d className="h-64 w-full cursor-grab touch-pan-y overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing" />
}
