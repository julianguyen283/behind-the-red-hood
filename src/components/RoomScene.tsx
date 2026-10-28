import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { room } from '../content/media'

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const spring = { stiffness: 70, damping: 20, mass: 1 }

/**
 * The bedroom stays on screen behind the text while Red is in it.
 * Everything is dark except a pool of lamplight, which moves to whatever
 * the next [[light:...]] marker names (configured in media.ts → room.lights).
 * On narrow screens the picture also pans so the lit spot stays in view.
 */
export function RoomScene({ children }: { children: ReactNode }) {
  const section = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const [size, setSize] = useState({ w: 1280, h: 800 })

  const start = room.lights.lamp
  const tx = useSpring(start.x, spring)
  const ty = useSpring(start.y, spring)
  const radius = useSpring(start.radius, spring)
  const dark = useSpring(start.dark, spring)

  // which light is active: the last marker the reader has passed
  useEffect(() => {
    let frame = 0
    let active = ''
    const update = () => {
      frame = 0
      const reading = window.innerHeight * 0.8 // a gap entering the screen moves the light
      let name = 'lamp'
      section.current?.querySelectorAll<HTMLElement>('[data-light]').forEach((m) => {
        if (m.getBoundingClientRect().top <= reading) name = m.dataset.light!
      })
      if (name === active) return
      active = name
      const l = room.lights[name] ?? start
      for (const [mv, value] of [[tx, l.x], [ty, l.y], [radius, l.radius], [dark, l.dark]] as const) {
        if (still) mv.jump(value)
        else mv.set(value)
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [tx, ty, radius, dark, still, start])

  // cover the screen with the picture, panned towards the light
  const scale = Math.max(size.w / room.width, size.h / room.height)
  const dw = room.width * scale
  const dh = room.height * scale
  const left = useTransform(tx, (x) => clamp(size.w / 2 - x * dw, size.w - dw, 0))
  const top = useTransform(ty, (y) => clamp(size.h / 2 - y * dh, size.h - dh, 0))
  const sx = useTransform([left, tx] as const, ([l, x]: number[]) => l + x * dw)
  const sy = useTransform([top, ty] as const, ([t, y]: number[]) => t + y * dh)
  const r1 = useTransform(radius, (r) => r * dw)
  const r0 = useTransform(radius, (r) => r * dw * 0.3)
  const shade = useMotionTemplate`radial-gradient(circle at ${sx}px ${sy}px, rgba(8,8,11,0) ${r0}px, rgba(8,8,11,${dark}) ${r1}px)`
  const warmth = useMotionTemplate`radial-gradient(circle at ${sx}px ${sy}px, rgba(255,170,90,0.14), rgba(255,170,90,0) ${r1}px)`

  return (
    <section ref={section} className="relative mx-[calc(50%-50vw)]">
      <div aria-hidden="true" className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.img src={room.src} alt="" className="absolute max-w-none" style={{ left, top, width: dw, height: dh }} />
        <motion.div className="absolute inset-0" style={{ background: shade }} />
        <motion.div className="absolute inset-0 mix-blend-screen" style={{ background: warmth }} />
        <div className="absolute inset-x-0 top-0 h-[18svh] bg-gradient-to-b from-void to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[18svh] bg-gradient-to-t from-void to-transparent" />
      </div>
      <div className="relative z-10 -mt-[100svh] px-4 pt-[75svh] pb-[70svh] sm:px-8">{children}</div>
    </section>
  )
}

/** A stretch of text inside the room, on a dark panel so it stays readable. */
export function RoomPanel({ children }: { children: ReactNode }) {
  return (
    <div className="story-prose mx-auto max-w-[calc(var(--story-width)+4rem)] bg-[rgba(8,8,11,0.82)] px-5 py-8 shadow-[0_0_50px_24px_rgba(8,8,11,0.82)] md:px-8">
      {children}
    </div>
  )
}

/** A gap in the text where the whole room can be seen. */
export function RoomPause() {
  return <div role="img" aria-label={room.alt} className="h-[90svh]" />
}
