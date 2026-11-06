import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './index.css'
import { App } from './ui/App'
import { setupOffline } from './platform/offline'

void setupOffline()

// Renderer prototypes (?proto=pixi | three) load on demand so the game bundle stays the same.
const proto = new URLSearchParams(window.location.search).get('proto')
const ProtoScreen = lazy(() => import('./ui/proto/ProtoScreen'))

const scene3d = new URLSearchParams(window.location.search).get('scene3d')
const SceneDebug = lazy(() => import('./ui/launch/three/SceneDebug'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {scene3d ? (
      <Suspense fallback={null}>
        <SceneDebug launcherId={scene3d} />
      </Suspense>
    ) : proto === 'pixi' || proto === 'three' ? (
      <Suspense fallback={null}>
        <ProtoScreen kind={proto} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
