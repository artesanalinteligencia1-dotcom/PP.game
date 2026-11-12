import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { RocketDesign } from '../../engine/rocket'
import { rocketLayout } from '../../engine/rocketLayout'
import { buildRocket3D, type Rocket3D } from '../launch/three/rocket3d'

/**
 * The rocket on the workbench in 3D, to scale (loaded on demand, so the main bundle carries no three.js). Drag or use the
 * arrow keys to turn it; it is rebuilt whenever a part changes. A 1.8 m figure stands next to it for scale.
 * Draws only when something changed (no idle render loop).
 */
export default function RocketViewer3D({ design, label, spin }: { design: RocketDesign; label: string; /** turn slowly until the player takes over */ spin: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ show: (d: RocketDesign) => void } | null>(null)

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    const scene = new THREE.Scene()
    // a neutral studio to reflect: without it the metal parts look flat
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
    pmrem.dispose()
    scene.environment = env.texture
    scene.environmentIntensity = 0.55
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 5000)
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    const rim = new THREE.DirectionalLight(0x93c5fd, 1.1)
    scene.add(key, rim, new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.3))

    // floor and the figure for scale; resized with each rocket
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }))
    floor.rotation.x = -Math.PI / 2
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 64), new THREE.MeshBasicMaterial({ color: 0x475569 }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    const personMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    const person = new THREE.Group()
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.1, 4, 10), personMat)
    torso.position.y = 0.75
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), personMat)
    head.position.y = 1.65
    person.add(torso, head)
    scene.add(floor, ring, person)

    let model: Rocket3D | null = null
    let height = 30
    let width = 4
    let yaw = 0.6
    let pitch = 0.12
    let auto = spin
    let dirty = true
    let raf = 0
    let prev = performance.now()

    const place = () => {
      const aspect = camera.aspect
      const t = Math.tan((camera.fov * Math.PI) / 360)
      const dist = Math.max((height * 0.58) / t, (width * 0.75) / (t * aspect))
      const cy = height * 0.5
      camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist)
      camera.lookAt(0, cy, 0)
      camera.far = dist * 4 + height
      camera.updateProjectionMatrix()
      // lights travel with the camera, so the side you look at is always lit
      key.position.set(camera.position.x - Math.cos(yaw) * dist * 0.6, cy + dist * 0.7, camera.position.z + Math.sin(yaw) * dist * 0.6)
      rim.position.set(-camera.position.x, cy + dist * 0.2, -camera.position.z)
    }
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (auto) {
        yaw += dt * 0.35
        dirty = true
      }
      if (dirty) {
        dirty = false
        place()
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
      dirty = true
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    api.current = {
      show: (d) => {
        if (model) {
          scene.remove(model.root)
          model.dispose()
        }
        const layout = rocketLayout(d)
        model = buildRocket3D(layout)
        scene.add(model.root)
        height = Math.max(layout.heightM, layout.boosters?.lengthM ?? 0, 3)
        width = Math.max(layout.widthM, 1) + 3.5 // room for the figure
        const r = Math.max(width * 0.75, height * 0.14)
        floor.scale.setScalar(r)
        ring.scale.setScalar(r)
        person.position.set(layout.widthM / 2 + 1.1, 0, 0.6)
        dirty = true
      },
    }

    // drag to turn (touch: sideways only, so the page still scrolls); arrow keys do the same
    let drag: { id: number; x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
      auto = false
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      yaw -= (e.clientX - drag.x) * 0.01
      if (e.pointerType === 'mouse') pitch = Math.max(-0.15, Math.min(1.1, pitch + (e.clientY - drag.y) * 0.006))
      drag.x = e.clientX
      drag.y = e.clientY
      dirty = true
    }
    const up = (e: PointerEvent) => {
      if (drag?.id === e.pointerId) drag = null
    }
    const keydown = (e: KeyboardEvent) => {
      const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key]
      if (!step) return
      e.preventDefault()
      auto = false
      yaw += step[0]
      pitch = Math.max(-0.15, Math.min(1.1, pitch + step[1]))
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
      model?.dispose()
      for (const m of [floor, ring, torso, head]) {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      }
      env.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
    // the renderer lives as long as the viewer; `spin` only matters when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api.current?.show(design)
  }, [design])

  return <div ref={host} role="img" aria-label={label} tabIndex={0} data-rocket-3d className="h-80 w-full cursor-grab touch-pan-y overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing" />
}
