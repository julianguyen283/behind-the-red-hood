import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

const parse = (hex: string) => {
  const n = parseInt(hex.trim().replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/**
 * Fixed page background that drifts between "mood" colours as the reader
 * scrolls past each [[mood:...]] marker in story.md: forest grey, kitchen
 * black, the warmer bedroom, cold night blue. Each change takes ~1.5 screens.
 */
export function PageMood() {
  const ref = useRef<HTMLDivElement>(null)
  const still = useReducedMotion() ?? false

  useEffect(() => {
    const el = ref.current
    if (!el || still) return
    const css = getComputedStyle(document.documentElement)
    const color = (name: string) => parse(css.getPropertyValue(`--color-mood-${name}`) || '#121012')
    let frame = 0

    const update = () => {
      frame = 0
      const h = window.innerHeight
      // a change begins as its marker comes up from the bottom of the screen
      const reading = window.scrollY + h * 0.9
      let c = color('forest')
      document.querySelectorAll<HTMLElement>('[data-mood]').forEach((m) => {
        const top = m.getBoundingClientRect().top + window.scrollY
        const t = Math.min(1, Math.max(0, (reading - top) / (1.5 * h)))
        if (t > 0) c = mix(c, color(m.dataset.mood!), t)
      })
      el.style.backgroundColor = `rgb(${c.join(' ')})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [still])

  return <div ref={ref} aria-hidden="true" className="fixed inset-0 -z-10 bg-void" />
}
