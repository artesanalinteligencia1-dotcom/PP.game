import introUrl from '../../assets/video/intro.mp4'
import introVtt from '../../assets/video/intro.en.vtt?url'
import { useMusic } from '../../audio/audio'
import { useGame } from '../../store/game'
import { Disclaimer } from '../components'

export function IntroScreen() {
  const go = useGame((s) => s.go)
  useMusic('none')
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        ← Home
      </button>
      <h1 className="mt-2 text-2xl font-semibold">Watch intro</h1>
      <p className="mt-1 text-sm text-slate-400">Test version (30 s). The full animated intro is in production.</p>
      <video className="mt-4 w-full rounded-xl border border-slate-800" controls preload="metadata" src={introUrl}>
        <track kind="captions" srcLang="en" label="English" src={introVtt} default />
      </video>
      <p className="mt-3 text-xs text-slate-500">
        Pedro Goicochea is a fictional character inspired by the story of Pedro Paulet (1874–1945). Narration, music and illustrations generated with
        ElevenLabs for this project.
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => go('home')} className="btn-primary px-4 py-2 ">
          Start playing
        </button>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
