import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/** A red hood, drawn to sit in the word HOOD as its first O. */
function HoodGlyph() {
  return (
    <svg viewBox="0 0 100 110" className="inline-block h-[0.74em] w-[0.7em] align-[-0.02em]" aria-hidden="true">
      {/* the cloak: a cowl with its point falling back, over flared shoulders */}
      <path
        d="M44 7 C 58 1 76 2 86 12 C 78 13 74 18 76 25 C 86 38 88 55 87 70 C 87 84 91 96 98 107 L 2 107 C 9 96 13 84 13 70 C 13 42 23 14 44 7 Z"
        fill="currentColor"
      />
      {/* the empty face: the hollow of the O */}
      <ellipse cx="49" cy="60" rx="20" ry="26" fill="var(--color-void)" />
      {/* folds of the cowl and the clasp at the throat */}
      <path d="M28 26 C 21 40 20 55 23 68" stroke="rgba(0,0,0,0.35)" strokeWidth="3" fill="none" />
      <path d="M74 30 C 79 44 80 58 78 70" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" />
      <circle cx="49" cy="94" r="3.5" fill="rgba(232,223,213,0.55)" />
    </svg>
  )
}

type Drip = { at: number; length: number; delay: number }

/** One letter with red running down from it. */
function Bleeding({ children, drips, still }: { children: ReactNode; drips: Drip[]; still: boolean }) {
  return (
    <span className="relative inline-block">
      {children}
      {drips.map((d, i) => (
        <span key={i} aria-hidden="true" className="absolute top-[0.735em] text-crimson" style={{ left: `${d.at}%` }}>
          {/* the run of red: wide where it leaves the letter, a thin neck, a heavy bead */}
          <motion.svg
            viewBox="0 0 10 40"
            preserveAspectRatio="none"
            className="block w-[0.075em] origin-top -translate-x-1/2"
            style={{ height: `${d.length}em` }}
            initial={{ scaleY: still ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 3.4 + d.delay, duration: 3 + d.length * 10, ease: [0.3, 0, 0.2, 1] }}
          >
            <path
              d="M0 0 H10 C 8 5 6.4 12 6.4 22 C 6.4 28 8.6 31 8.6 34.6 A 3.6 3.6 0 1 1 1.4 34.6 C 1.4 31 3.6 28 3.6 22 C 3.6 12 2 5 0 0 Z"
              fill="currentColor"
            />
          </motion.svg>
          {/* now and then, a drop falls */}
          {!still && (
            <motion.span
              className="absolute left-0 block h-[0.05em] w-[0.04em] -translate-x-1/2 rounded-full bg-crimson"
              style={{ top: `${d.length - 0.03}em` }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: ['0em', '0em', '0.8em'], opacity: [0, 1, 0] }}
              transition={{
                delay: 3.4 + d.delay + 3 + d.length * 10,
                duration: 1.6,
                times: [0, 0.35, 1],
                ease: 'easeIn',
                repeat: Infinity,
                repeatDelay: 5 + i * 1.7,
              }}
            />
          )}
        </span>
      ))}
    </span>
  )
}

/** "RED HOOD" with the first O as a hood and red running from the letters. */
export function DrippingTitle() {
  const still = useReducedMotion() ?? false
  return (
    <span aria-hidden="true">
      RED{' '}
      <span className="text-crimson">
        <Bleeding still={still} drips={[{ at: 20, length: 0.13, delay: 0.4 }, { at: 80, length: 0.24, delay: 0 }]}>H</Bleeding>
        <Bleeding still={still} drips={[{ at: 62, length: 0.32, delay: 0.9 }]}>
          <HoodGlyph />
        </Bleeding>
        <Bleeding still={still} drips={[{ at: 36, length: 0.19, delay: 1.5 }]}>O</Bleeding>
        <Bleeding still={still} drips={[{ at: 22, length: 0.11, delay: 0.7 }]}>D</Bleeding>
      </span>
    </span>
  )
}
