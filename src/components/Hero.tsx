import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { site } from '../content/site'
import { ForestScene } from './ForestScene'

const ease = [0.22, 0.61, 0.36, 1] as const

export function Hero({ onEnter }: { onEnter: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : -80])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} aria-labelledby="title" className="grain relative flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden">
      <ForestScene target={ref} />

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 flex flex-col items-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, delay: 0.4 }}
          className="mb-8 font-ui text-[0.62rem] tracking-[0.5em] text-ivory/50 uppercase md:text-[0.68rem]"
        >
          {site.unit}
        </motion.p>

        <h1 id="title" className="font-display leading-[0.85] font-medium text-ivory">
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ duration: 3, delay: 0.6, ease }}
            className="block pl-[0.42em] text-[clamp(0.95rem,2.4vw,1.6rem)] text-ivory/80"
          >
            BEHIND THE
          </motion.span>
          <motion.span
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 3.2, delay: 1.1, ease }}
            className="mt-3 block text-[clamp(3.6rem,13vw,10.5rem)] tracking-[0.04em] [text-shadow:0_0_60px_color-mix(in_srgb,var(--color-blood)_55%,transparent)]"
          >
            RED <span className="text-crimson">HOOD</span>
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 2.4, ease }}
          className="mt-6 max-w-xl font-fell text-[clamp(1.05rem,2.2vw,1.45rem)] text-ivory/70 italic"
        >
          {site.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 3.2 }}
          className="mt-14 flex flex-col items-center gap-6"
        >
          <button
            type="button"
            onClick={onEnter}
            className="group relative overflow-hidden border border-ivory/35 px-10 py-4 font-ui text-[0.7rem] tracking-[0.42em] text-ivory uppercase transition-colors duration-700 hover:border-crimson focus-visible:border-crimson"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-blood transition-transform duration-700 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100" />
            <span className="relative pl-[0.42em]">{site.enterLabel}</span>
          </button>
          {site.contentNote && <p className="max-w-sm font-ui text-[0.68rem] leading-relaxed text-ivory/45">{site.contentNote}</p>}
        </motion.div>
      </motion.div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-b from-transparent to-void" />
      <div aria-hidden="true" className="absolute bottom-0 z-[2] left-1/2 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-crimson/70" />
    </section>
  )
}
