import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ambientAudioSrc } from '../content/media'

type SoundState = {
  enabled: boolean
  toggle: () => void
  /** Lower the ambience while any media element is playing with sound. */
  setDucked: (source: string, ducked: boolean) => void
}

const SoundContext = createContext<SoundState>({ enabled: false, toggle: () => {}, setDucked: () => {} })

const LEVEL = 0.5
const DUCKED = 0.08

/** Soft wind: brown noise through a slowly wandering band-pass filter. */
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
  level.gain.value = 0.14
  source.connect(filter).connect(level).connect(out)
  source.start()
  lfo.start()
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const duckers = useRef(new Set<string>())

  const target = () => (duckers.current.size ? DUCKED : LEVEL)

  const init = useCallback(async () => {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master

    // Prefer the supplied ambience file; fall back to the synthesised wind.
    const audio = new Audio()
    audio.loop = true
    audio.crossOrigin = 'anonymous'
    const ok = await new Promise<boolean>((resolve) => {
      audio.addEventListener('canplaythrough', () => resolve(true), { once: true })
      audio.addEventListener('error', () => resolve(false), { once: true })
      audio.src = ambientAudioSrc
      audio.load()
    })
    if (ok) {
      ctx.createMediaElementSource(audio).connect(master)
      void audio.play()
    } else {
      createWind(ctx, master)
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabled((on) => !on)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (enabled && !ctxRef.current) await init()
      const ctx = ctxRef.current
      const master = masterRef.current
      if (!ctx || !master || cancelled) return
      if (enabled) await ctx.resume()
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(enabled ? target() : 0, now + 1.8)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, init])

  const setDucked = useCallback((source: string, ducked: boolean) => {
    if (ducked) duckers.current.add(source)
    else duckers.current.delete(source)
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master || master.gain.value === 0) return
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(target(), now + 0.8)
  }, [])

  return <SoundContext.Provider value={{ enabled, toggle, setDucked }}>{children}</SoundContext.Provider>
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
