import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { useDuck } from '../hooks/useAmbientSound'
import { CaptionsIcon, PauseIcon, PlayIcon, SoundOffIcon, SoundOnIcon } from './Icons'
import { MediaPlaceholder } from './MediaPlaceholder'
import { WordByWord } from './WordByWord'

type Props = {
  src: string
  poster?: string
  captions?: string
  title: string
  aspect: string
  placeholderNote: string
  /**
   * feature: viewer presses play; sound on by default.
   * loop:    plays silently in a loop while on screen (unless reduced motion).
   */
  mode?: 'feature' | 'loop'
  placeholderExtra?: ReactNode
  playButtonId?: string
  /** Line revealed word by word when the video ends. */
  endLine?: string
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function VideoPlayer({ src, poster, captions, title, aspect, placeholderNote, mode = 'feature', placeholderExtra, playButtonId, endLine }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const track = useRef<HTMLTrackElement>(null)
  const reduced = useReducedMotion() ?? false
  const inView = useInView(wrap, { amount: 0.5 })

  const [missing, setMissing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(mode === 'loop')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasCaptions, setHasCaptions] = useState(Boolean(captions))
  const [showCaptions, setShowCaptions] = useState(true)
  const [cue, setCue] = useState('')
  const [ended, setEnded] = useState(false)

  // Render captions ourselves so they match the site's typography.
  useEffect(() => {
    const t = track.current?.track
    if (!t) return
    t.mode = 'hidden'
    const onCue = () => {
      const active = t.activeCues
      setCue(active && active.length ? Array.from(active).map((c) => (c as VTTCue).text).join('\n') : '')
    }
    t.addEventListener('cuechange', onCue)
    return () => t.removeEventListener('cuechange', onCue)
  }, [missing])

  // Loop clips play only while visible.
  useEffect(() => {
    const v = video.current
    if (mode !== 'loop' || !v || missing || reduced) return
    if (inView) void v.play().catch(() => {})
    else v.pause()
  }, [inView, mode, missing, reduced])

  // Feature video pauses if the reader scrolls well away from it.
  useEffect(() => {
    if (mode === 'feature' && !inView) video.current?.pause()
  }, [inView, mode])

  useDuck(playing && !muted)

  if (missing) {
    return (
      <MediaPlaceholder kind="video" note={placeholderNote} aspect={placeholderExtra ? undefined : aspect}>
        {placeholderExtra}
      </MediaPlaceholder>
    )
  }

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  return (
    <div ref={wrap} className="group relative w-full overflow-hidden bg-black" style={{ aspectRatio: aspect }}>
      <video
        ref={video}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        muted={muted}
        loop={mode === 'loop'}
        playsInline
        preload="metadata"
        aria-label={title}
        onClick={toggle}
        onError={() => setMissing(true)}
        onPlay={() => {
          setPlaying(true)
          setEnded(false)
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setEnded(true)
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      >
        {captions && (
          <track ref={track} kind="captions" srcLang="en" label="English" src={captions} default onError={() => setHasCaptions(false)} />
        )}
      </video>

      {/* letterbox shading */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.75)]" />

      {ended && endLine && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/60 px-6">
          <WordByWord text={endLine} className="max-w-2xl text-center font-fell text-2xl text-ivory italic md:text-4xl" />
        </div>
      )}

      {!playing && !ended && mode === 'feature' && (
        <button
          type="button"
          id={playButtonId}
          onClick={toggle}
          className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full border border-ivory/40 bg-void/40 text-ivory backdrop-blur-sm transition-colors duration-700 hover:border-crimson hover:text-crimson"
          aria-label={`Play: ${title}`}
        >
          <PlayIcon width={26} height={26} />
        </button>
      )}

      {showCaptions && hasCaptions && cue && !ended && (
        <p className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto w-fit max-w-[85%] bg-void/70 px-4 py-1.5 text-center font-story text-base whitespace-pre-line text-ivory italic md:text-xl" aria-live="off">
          {cue}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-3 font-ui text-xs text-ivory/80 opacity-100 transition-opacity duration-500 md:px-5 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <button type="button" onClick={toggle} className="p-1.5 hover:text-crimson" aria-label={playing ? 'Pause video' : 'Play video'}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        {mode === 'feature' && (
          <>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => {
                if (video.current) video.current.currentTime = Number(e.target.value)
              }}
              className="h-1 flex-1 cursor-pointer accent-crimson"
              aria-label="Seek"
              aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
            />
            <span className="tabular-nums text-ivory/60">
              {fmt(time)} / {fmt(duration)}
            </span>
          </>
        )}
        {mode === 'loop' && <span className="flex-1" />}
        {hasCaptions && (
          <button
            type="button"
            onClick={() => setShowCaptions((s) => !s)}
            className={`p-1.5 hover:text-crimson ${showCaptions ? 'text-ivory' : 'text-ivory/40'}`}
            aria-pressed={showCaptions}
            aria-label="Captions"
          >
            <CaptionsIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="p-1.5 hover:text-crimson"
          aria-pressed={!muted}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <SoundOffIcon /> : <SoundOnIcon />}
        </button>
      </div>
    </div>
  )
}
