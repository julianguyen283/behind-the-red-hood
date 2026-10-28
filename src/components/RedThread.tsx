import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * The red thread: a 2px deep-red line that lengthens as the reader scrolls.
 * Desktop: down the left edge, laid into the page itself, so it ends exactly
 * beside the sentence where Red tears the hood away ([[thread-end]]).
 * Phone: across the top edge, and it is gone once that sentence is passed.
 * Nothing after that point has a thread.
 */
export function RedThread() {
  const side = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const still = useReducedMotion() ?? false

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const start = document.querySelector<HTMLElement>('[data-thread-start]')
      const end = document.querySelector<HTMLElement>('[data-thread-end]')
      if (!start || !end || !side.current || !top.current) return
      const y0 = start.getBoundingClientRect().top + window.scrollY
      const y1 = end.getBoundingClientRect().top + window.scrollY + 8
      const reading = window.scrollY + window.innerHeight * 0.6
      const p = still ? 1 : Math.min(1, Math.max(0, (reading - y0) / (y1 - y0)))

      side.current.style.top = `${y0}px`
      side.current.style.height = `${p * (y1 - y0)}px`
      top.current.style.transform = `scaleX(${p})`
      top.current.style.opacity = !still && reading < y1 ? '1' : '0'
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    // layout shifts as fonts and images load
    const ro = new ResizeObserver(onScroll)
    ro.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [still])

  return (
    <>
      <div ref={side} aria-hidden="true" className="pointer-events-none absolute left-[max(1.25rem,3vw)] z-20 hidden w-[2px] bg-blood md:block" />
      <div ref={top} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-blood md:hidden" />
    </>
  )
}
