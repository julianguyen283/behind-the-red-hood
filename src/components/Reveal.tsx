import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  /** distance travelled upward while fading in, in px */
  rise?: number
  as?: 'div' | 'p' | 'figure' | 'section'
}

/** Subtle fade-and-rise on first entry into the viewport. */
export function Reveal({ children, className, delay = 0, rise = 18, as = 'div' }: Props) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.4, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}
