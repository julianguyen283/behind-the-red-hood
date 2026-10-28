import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Inline, smartQuotes } from './Inline'
import { useAmbientSound } from '../hooks/useAmbientSound'

/**
 * A paragraph written over a remembered one. The remembered line (the
 * grandmother's answer) waits on the page; when the reader clicks it, it is
 * struck through and fades, and the paragraph itself appears in its place.
 * If the reader scrolls past without clicking, it is revealed anyway, so the
 * story is never missing a line. Screen readers always get the real text.
 */
export function Overwrite({ ghost, text, className }: { ghost: string; text: string; className: string }) {
  const still = useReducedMotion() ?? false
  const [revealed, setRevealed] = useState(false)
  const { playSfx } = useAmbientSound()
  const box = useRef<HTMLDivElement>(null)

  // scrolled past without clicking: reveal it
  useEffect(() => {
    const el = box.current
    if (!el || revealed) return
    const check = () => {
      if (el.getBoundingClientRect().bottom < 0) setRevealed(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [revealed])

  const t = (delay: number, duration: number) => (still ? { duration: 0 } : { delay, duration })

  return (
    <div ref={box} className={`relative ${className}`}>
      {/* the remembered answer, waiting to be answered over */}
      <motion.button
        type="button"
        onClick={() => {
          setRevealed(true)
          playSfx('child') // only heard with sound on
        }}
        disabled={revealed}
        aria-label="Hear her answer"
        tabIndex={revealed ? -1 : 0}
        className={`group absolute inset-x-0 top-0 text-left ${revealed ? 'pointer-events-none' : 'z-10 cursor-pointer'}`}
        animate={revealed ? { opacity: 0, filter: 'blur(5px)' } : { opacity: 1, filter: 'blur(0px)' }}
        transition={t(1.1, 1.3)}
      >
        <span className="block indent-[var(--story-indent)] font-story text-[length:var(--story-size)] leading-[var(--story-leading)] text-ivory/70 italic transition-colors group-hover:text-ivory">
          <span className="relative">
            {smartQuotes(ghost)}
            <motion.span
              className="absolute top-[55%] left-0 h-[2px] w-full origin-left bg-crimson"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: revealed ? 1 : 0 }}
              transition={t(0, 1.0)}
            />
          </span>
        </span>
        {!revealed && (
          <span className="mt-2 flex items-center gap-2 pl-[var(--story-indent)] font-ui text-[0.62rem] tracking-[0.25em] text-ivory/45 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />
            Click to hear her answer
          </span>
        )}
      </motion.button>
      {/* the paragraph itself: always present for screen readers */}
      <motion.p
        className={`indent-[var(--story-indent)] ${revealed ? '' : 'pointer-events-none select-none'}`}
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={t(revealed ? 1.8 : 0, 1.6)}
      >
        <Inline text={text} />
      </motion.p>
      {/* keep room for the hint before the reveal */}
      {!revealed && <div aria-hidden="true" className="h-6" />}
    </div>
  )
}
