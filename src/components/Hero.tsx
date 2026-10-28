import { motion } from 'motion/react'
import { site } from '../content/site'
import { ForestScene } from './ForestScene'
import { HeadphonesIcon } from './Icons'

const fade = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 1.6, delay, ease: 'easeOut' as const },
})

export function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section aria-labelledby="title" className="relative flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden">
      <ForestScene />

      <div className="relative z-10 flex flex-col items-center px-5 text-center">
        <motion.h1
          id="title"
          {...fade(0.3)}
          className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.95] font-medium text-balance text-ivory italic"
        >
          {site.title}
        </motion.h1>

        <motion.p {...fade(0.9)} className="mt-5 font-display text-[clamp(1.25rem,2.2vw,1.6rem)] text-muted italic">
          {site.subtitle}
        </motion.p>

        <motion.div {...fade(1.5)} className="mt-12 flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={onEnter}
            className="text-ui min-w-40 border border-mist px-10 py-3.5 font-medium tracking-[0.2em] text-ivory uppercase transition-colors duration-500 hover:border-blood hover:bg-blood"
          >
            {site.enterLabel}
          </button>
          {site.contentNote && <p className="text-ui max-w-sm text-muted">{site.contentNote}</p>}
          {site.listeningNote && (
            <p className="text-ui flex items-center gap-2 text-muted">
              <HeadphonesIcon width={16} height={16} />
              {site.listeningNote}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
