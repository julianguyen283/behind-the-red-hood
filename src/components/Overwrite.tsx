import { motion, useReducedMotion } from 'motion/react'
import { Inline, smartQuotes } from './Inline'

/**
 * A paragraph written over a remembered one: the remembered line (the
 * grandmother's answer) shows faintly first, is struck through, and fades as
 * the paragraph itself appears in its place.
 */
export function Overwrite({ ghost, text, className }: { ghost: string; text: string; className: string }) {
  const still = useReducedMotion() ?? false
  if (still) {
    return (
      <p className={className}>
        <Inline text={text} />
      </p>
    )
  }
  const view = { once: true, amount: 0.9 } as const
  return (
    <div className={`relative ${className}`}>
      {/* the remembered answer: decorative, it is already in the text above */}
      <motion.p
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 indent-[var(--story-indent)] text-ivory/55 italic"
        initial={{ opacity: 0.7, filter: 'blur(0px)' }}
        whileInView={{ opacity: 0, filter: 'blur(5px)' }}
        viewport={view}
        transition={{ delay: 2.2, duration: 1.4 }}
      >
        <span className="relative">
          {smartQuotes(ghost)}
          <motion.span
            className="absolute top-[55%] left-0 h-[2px] w-full origin-left bg-crimson"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={view}
            transition={{ delay: 1.0, duration: 0.9, ease: 'easeInOut' }}
          />
        </span>
      </motion.p>
      <motion.p
        className="indent-[var(--story-indent)]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={view}
        transition={{ delay: 2.8, duration: 1.6 }}
      >
        <Inline text={text} />
      </motion.p>
    </div>
  )
}
