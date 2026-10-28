import { useEffect, useRef } from 'react'
import { useAmbientSound } from '../hooks/useAmbientSound'

/**
 * Follows the reader through the [[scene:...]] markers and tells the
 * soundscape which scene they are in; plays the [[call]] once when the
 * reader reaches it with sound on.
 */
export function SceneController() {
  const { enabled, setScene, playCall, playSfx } = useAmbientSound()
  const called = useRef(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const reading = window.scrollY + window.innerHeight * 0.6
      let current = 'forest'
      document.querySelectorAll<HTMLElement>('[data-scene]').forEach((m) => {
        if (m.getBoundingClientRect().top + window.scrollY <= reading) current = m.dataset.scene!
      })
      setScene(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [setScene])

  useEffect(() => {
    const marker = document.querySelector('[data-call]')
    if (!marker || !enabled) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !called.current) {
          called.current = true
          // a beat of silence after the last line, then the call
          setTimeout(playCall, 2200)
        }
      },
      { threshold: 1 },
    )
    io.observe(marker)
    return () => io.disconnect()
  }, [enabled, playCall])

  // one-off sounds: each plays once, when its marker comes into view with sound on
  useEffect(() => {
    if (!enabled) return
    const played = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played.has(e.target)) continue
          played.add(e.target)
          playSfx((e.target as HTMLElement).dataset.sfx!)
        }
      },
      { rootMargin: '0px 0px -45% 0px' },
    )
    document.querySelectorAll('[data-sfx]').forEach((m) => io.observe(m))
    return () => io.disconnect()
  }, [enabled, playSfx])

  return null
}
