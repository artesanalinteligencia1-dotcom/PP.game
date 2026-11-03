// Offline support. Web: register the service worker (precaches the whole game) and expose the browser's
// "install" prompt. Desktop (Tauri): everything is already local, so no service worker.
import { useSyncExternalStore } from 'react'

export const isDesktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
let offlineReady = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export async function setupOffline() {
  if (isDesktop || import.meta.env.DEV || !('serviceWorker' in navigator)) return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
  const { registerSW } = await import('virtual:pwa-register')
  registerSW({
    immediate: true,
    onOfflineReady() {
      offlineReady = true
      emit()
    },
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** { canInstall, offlineReady, install() } for the menu. */
export function useOffline() {
  const canInstall = useSyncExternalStore(subscribe, () => deferred !== null)
  const ready = useSyncExternalStore(subscribe, () => offlineReady)
  return {
    canInstall,
    offlineReady: ready,
    install: async () => {
      if (!deferred) return
      await deferred.prompt()
      deferred = null
      emit()
    },
  }
}
