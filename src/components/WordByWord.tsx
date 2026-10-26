import { Fragment } from 'react'
import { motion } from 'motion/react'
import { smartQuotes } from './Inline'

/** Reveals a line one word at a time (instantly with reduced motion). */
export function WordByWord({ text, className }: { text: string; className?: string }) {
  const words = smartQuotes(text).split(' ')
  return (
    <motion.p
      className={className}
      initial="hidden"
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.45, delayChildren: 0.4 } } }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            className="inline-block"
            variants={{ hidden: { opacity: 0, filter: 'blur(6px)' }, shown: { opacity: 1, filter: 'blur(0px)' } }}
            transition={{ duration: 1.4 }}
          >
            {word}
          </motion.span>{' '}
        </Fragment>
      ))}
    </motion.p>
  )
}
