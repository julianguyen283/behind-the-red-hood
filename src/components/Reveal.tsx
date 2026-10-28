import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  /** distance travelled upward while fading in, in px */
  rise?: number
  as?: 'div' | 'p' | 'figure' | 'section'
  /** false = render plainly, with no fade */
  enabled?: boolean
}

/** Quiet fade-in on first entry into the viewport: opacity 0 → 1, up 8px, 400ms. */
export function Reveal({ children, className, delay = 0, rise = 8, as = 'div', enabled = true }: Props) {
  if (!enabled) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </Tag>
  )
}
