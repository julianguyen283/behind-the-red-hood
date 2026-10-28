import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { soundscape } from '../content/media'

type SoundState = {
  enabled: boolean
  toggle: () => void
  /** Lower the ambience while any media element is playing with sound. */
  setDucked: (source: string, ducked: boolean) => void
  /** Cross-fade the soundscape to one of soundscape.scenes. */
  setScene: (name: string) => void
  /** Play the faint call after the last line (only if sound is on). */
  playCall: () => void
  /** Play a one-off sound effect from soundscape.sfx (only if sound is on). */
  playSfx: (name: string) => void
}

const SoundContext = createContext<SoundState>({ enabled: false, toggle: () => {}, setDucked: () => {}, setScene: () => {}, playCall: () => {}, playSfx: () => {} })

/** Background level when sound is on (0–1). ~12%: atmosphere, never in the way. */
const LEVEL = 0.12
/** Level while a video or the narration plays with sound. ~4%. */
const DUCKED = 0.04
const FADE_IN = 2.5 // seconds
const DUCK_DOWN = 0.5
const DUCK_UP = 1.5
const STORAGE_KEY = 'btrh-sound'

const readPref = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}
const writePref = (on: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* storage unavailable — the toggle still works for this visit */
  }
}

/** Fallback when no ambience file exists: soft wind from filtered brown noise. */
function createWind(ctx: AudioContext, out: AudioNode) {
  const length = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    let last = 0
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      data[i] = last * 3.2
    }
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 420
  filter.Q.value = 0.7
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.06
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 260
  lfo.connect(lfoGain).connect(filter.frequency)
  const level = ctx.createGain()
  level.gain.value = 0.6
  source.connect(filter).connect(level).connect(out)
  source.start()
  lfo.start()
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const starting = useRef<Promise<void> | null>(null)
  const duckers = useRef(new Set<string>())
  const enabledRef = useRef(false)
  const layers = useRef(new Map<string, GainNode>())
  const scene = useRef('forest')

  /** Fade every loop to the level the scene asks for. */
  const mixScene = useCallback((name: string, seconds: number) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const mixLevels = soundscape.scenes[name] ?? {}
    const now = ctx.currentTime
    layers.current.forEach((gain, loop) => {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(mixLevels[loop] ?? 0, now + seconds)
    })
  }, [])

  const ramp = useCallback((to: number, seconds: number) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(to, now + seconds)
  }, [])

  const target = () => (duckers.current.size ? DUCKED : LEVEL)

  /** Builds the audio graph once, on the first user gesture. */
  const start = useCallback(() => {
    if (starting.current) return starting.current
    starting.current = (async () => {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master

      // Everything up to the first await runs inside the click itself,
      // which iOS Safari requires before it will play any audio.
      const first = soundscape.scenes[scene.current] ?? {}
      const plays = Object.entries(soundscape.loops).map(([loop, src]) => {
        const audio = new Audio(src)
        audio.loop = true
        const gain = ctx.createGain()
        gain.gain.value = first[loop] ?? 0
        gain.connect(master)
        ctx.createMediaElementSource(audio).connect(gain) // silent until master fades up
        layers.current.set(loop, gain)
        return audio.play().then(
          () => true,
          () => false,
        )
      })
      const resumed = ctx.resume()
      const [forestOk] = await Promise.all(plays)
      await resumed
      if (!forestOk) createWind(ctx, layers.current.get('forest') ?? master) // no ambience file: built-in wind
    })()
    return starting.current
  }, [])

  const apply = useCallback(
    async (on: boolean) => {
      enabledRef.current = on
      if (on) {
        await start()
        await ctxRef.current?.resume()
        if (enabledRef.current) ramp(target(), FADE_IN)
      } else {
        ramp(0, 0.8)
      }
    },
    [ramp, start],
  )

  const toggle = useCallback(() => {
    const next = !enabledRef.current
    setEnabled(next)
    writePref(next)
    void apply(next) // runs inside the click, which satisfies autoplay rules
  }, [apply])

  // Returning visitor who left sound on: resume on their first interaction,
  // since browsers block audio until the page has been clicked or keyed.
  useEffect(() => {
    if (!readPref()) return
    const resume = () => {
      remove()
      setEnabled(true)
      void apply(true)
    }
    const events = ['pointerdown', 'keydown'] as const
    const remove = () => events.forEach((e) => window.removeEventListener(e, resume))
    events.forEach((e) => window.addEventListener(e, resume, { once: true }))
    return remove
  }, [apply])

  // Go quiet while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      const ctx = ctxRef.current
      if (!ctx) return
      if (document.hidden) void ctx.suspend()
      else if (enabledRef.current) void ctx.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const setDucked = useCallback(
    (source: string, ducked: boolean) => {
      const had = duckers.current.size > 0
      if (ducked) duckers.current.add(source)
      else duckers.current.delete(source)
      const has = duckers.current.size > 0
      if (!enabledRef.current || had === has) return
      ramp(has ? DUCKED : LEVEL, has ? DUCK_DOWN : DUCK_UP)
    },
    [ramp],
  )

  const setScene = useCallback(
    (name: string) => {
      if (name === scene.current) return
      scene.current = name
      // silence falls fast (the lamp is thrown); everything else drifts in
      mixScene(name, name === 'silence' ? 0.4 : 3)
    },
    [mixScene],
  )

  /** One-off sounds sit outside the low ambience level so they can still be heard. */
  const oneShot = useCallback((src: string | undefined, level: number) => {
    const ctx = ctxRef.current
    if (!ctx || !src || !enabledRef.current) return
    const audio = new Audio(src)
    const gain = ctx.createGain()
    gain.gain.value = level
    ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination)
    void audio.play().catch(() => {})
  }, [])
  const playCall = useCallback(() => oneShot(soundscape.call, 0.45), [oneShot])
  const playSfx = useCallback((name: string) => oneShot(soundscape.sfx[name], 0.55), [oneShot])

  return <SoundContext.Provider value={{ enabled, toggle, setDucked, setScene, playCall, playSfx }}>{children}</SoundContext.Provider>
}

export const useAmbientSound = () => useContext(SoundContext)

/** Ducks the ambience while `active` is true for the calling component. */
export function useDuck(active: boolean) {
  const id = useId()
  const { setDucked } = useAmbientSound()
  useEffect(() => {
    setDucked(id, active)
    return () => setDucked(id, false)
  }, [id, active, setDucked])
}
