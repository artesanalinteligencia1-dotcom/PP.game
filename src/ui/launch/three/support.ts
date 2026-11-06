// No three.js import here: the game's main bundle uses this to decide whether to load the 3D scenes at all.

let webgl: boolean | null = null
/** WebGL check, cached (the 3D scenes fall back to SVG without it). */
export function webglAvailable() {
  if (webgl === null) {
    try {
      const c = document.createElement('canvas')
      webgl = Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
    } catch {
      webgl = false
    }
  }
  return webgl
}
