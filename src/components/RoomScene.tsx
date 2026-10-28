import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
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
  // targets; the springs follow them. A glance animates the targets slowly instead of jumping.
  const tx0 = useMotionValue(start.x)
  const ty0 = useMotionValue(start.y)
  const radius0 = useMotionValue(start.radius)
  const dark0 = useMotionValue(start.dark)
  const tx = useSpring(tx0, spring)
  const ty = useSpring(ty0, spring)
  const radius = useSpring(radius0, spring)
  const dark = useSpring(dark0, spring)
  const zoom = useSpring(1, { stiffness: 400, damping: 12 })
  const [lightName, setLightName] = useState('lamp')

  // which light is active: the last marker the reader has passed
  useEffect(() => {
    let frame = 0
    let active = ''
    let glanced = ''
    let glance: number | undefined
    const go = (name: string, seconds = 0) => {
      const l = room.lights[name] ?? start
      if (l.jolt) {
        // a single jerk of the frame; the light itself stays where it was
        if (!still) {
          zoom.set(1.07)
          window.setTimeout(() => zoom.set(1), 90)
        }
        return
      }
      setLightName(name)
      const pairs = [[tx0, tx, l.x], [ty0, ty, l.y], [radius0, radius, l.radius], [dark0, dark, l.dark]] as const
      for (const [target, follow, value] of pairs) {
        if (still) {
          target.jump(value)
          follow.jump(value)
        } else if (seconds) animate(target, value, { duration: seconds, ease: 'easeInOut' })
        else target.set(value)
      }
    }
    const update = () => {
      frame = 0
      // a gap entering the screen moves the light; a change inside the text waits until it is read
      const gapLine = window.innerHeight * 0.8
      const textLine = window.innerHeight * 0.5
      let name = 'lamp'
      let glimpse = ''
      section.current?.querySelectorAll<HTMLElement>('[data-light]').forEach((m) => {
        if (m.getBoundingClientRect().top > (m.dataset.inline !== undefined ? textLine : gapLine)) return
        if (m.dataset.glance !== undefined) glimpse = m.dataset.light!
        else name = m.dataset.light!
      })
      // a glance: drift to the spot, hold a breath, get pulled back
      if (glimpse !== glanced) {
        glanced = glimpse
        if (glimpse && !still) {
          // drift slowly over, linger, then get pulled back a little faster
          go(glimpse, 2.5)
          window.clearTimeout(glance)
          glance = window.setTimeout(() => go(active, 1.4), 4200)
          return
        }
      }
      if (name === active) return
      active = name
      go(name)
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
      window.clearTimeout(glance)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [tx, ty, radius, dark, tx0, ty0, radius0, dark0, zoom, still, start])

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
  const tint = room.lights[lightName]?.tint ?? '255,170,90'
  const glowAlpha = room.lights[lightName]?.tint ? 0.32 : 0.14
  const warmth = useMotionTemplate`radial-gradient(circle at ${sx}px ${sy}px, rgba(${tint},${glowAlpha}), rgba(${tint},0) ${r1}px)`

  return (
    <section ref={section} className="relative mx-[calc(50%-50vw)]">
      <div aria-hidden="true" className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: zoom }}>
          <motion.img src={room.src} alt="" className="absolute max-w-none" style={{ left, top, width: dw, height: dh }} />
          <motion.div className="absolute inset-0" style={{ background: shade }} />
          <motion.div
            className={`absolute inset-0 mix-blend-screen ${room.lights[lightName]?.flicker ? 'firelight' : ''}`}
            style={{ background: warmth }}
          />
        </motion.div>
        <div className="absolute inset-x-0 top-0 h-[18svh] bg-gradient-to-b from-void to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[18svh] bg-gradient-to-t from-void to-transparent" />
      </div>
      <div className="relative z-10 -mt-[100svh] px-4 pt-[75svh] pb-[45svh] sm:px-8">{children}</div>
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
