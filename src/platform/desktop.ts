// Window controls that differ between the browser and the desktop build (Tauri).
import { isDesktop } from './offline'

async function tauriWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow()
}

export async function isFullscreen(): Promise<boolean> {
  if (isDesktop) return (await tauriWindow()).isFullscreen()
  return Boolean(document.fullscreenElement)
}

export async function toggleFullscreen(): Promise<boolean> {
  if (isDesktop) {
    const w = await tauriWindow()
    const next = !(await w.isFullscreen())
    await w.setFullscreen(next)
    return next
  }
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined)
    return false
  }
  await document.documentElement.requestFullscreen?.().catch(() => undefined)
  return Boolean(document.fullscreenElement)
}

/** Only the desktop build can close itself; browsers keep the tab. */
export const canQuit = isDesktop
export async function quitGame() {
  if (isDesktop) await (await tauriWindow()).close()
}
