import { useAmbientSound } from '../hooks/useAmbientSound'
import { SoundOffIcon, SoundOnIcon } from './Icons'

/** Minimal fixed chrome: a mark and the atmospheric sound toggle. */
export function Header() {
  const { enabled, toggle } = useAmbientSound()
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex bg-gradient-to-b from-void/90 via-void/50 to-transparent items-center justify-between px-4 py-4 md:px-8 md:py-6">
      <a href="#top" className="pointer-events-auto font-display text-sm tracking-[0.3em] text-ivory/60 transition-colors hover:text-ivory">
        B<span className="text-crimson">·</span>R<span className="text-crimson">·</span>H
        <span className="sr-only"> — back to top</span>
      </a>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-ivory/15 bg-void/50 px-4 py-2 font-ui text-[0.62rem] tracking-[0.28em] text-ivory/70 uppercase backdrop-blur-sm transition-colors duration-500 hover:border-crimson/70 hover:text-ivory"
      >
        {enabled ? <SoundOnIcon width={15} height={15} /> : <SoundOffIcon width={15} height={15} />}
        <span>
          <span className="sr-only">Atmospheric sound: </span>
          {enabled ? 'Sound on' : 'Sound off'}
        </span>
      </button>
    </header>
  )
}
