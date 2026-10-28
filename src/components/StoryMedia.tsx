import { useRef, useState, type CSSProperties } from 'react'
import { storyMedia, type ImageMedia } from '../content/media'
import { AudioPlayer } from './AudioPlayer'
import { MediaPlaceholder } from './MediaPlaceholder'
import { Reveal } from './Reveal'
import { VideoPlayer } from './VideoPlayer'

const MOBILE = '(max-width: 767px)'

/** Illustration with an optional phone crop and an optional full-screen view. */
export function StoryImage({ media }: { media: ImageMedia }) {
  // If the phone crop is missing, fall back to the main image before giving up.
  const [useMobile, setUseMobile] = useState(Boolean(media.srcMobile))
  const [missing, setMissing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  const onError = () => (useMobile ? setUseMobile(false) : setMissing(true))
  if (missing) return <MediaPlaceholder kind="image" note={media.placeholderNote} aspect={media.aspect} />

  const picture = (
    <picture>
      {useMobile && media.srcMobile && <source media={MOBILE} srcSet={media.srcMobile} />}
      <img src={media.src} alt={media.alt} loading="lazy" decoding="async" onError={onError} className="h-full w-full object-cover" />
    </picture>
  )
  // Phones use the crop's ratio (if a crop exists); larger screens the main ratio.
  const frame = 'relative block w-full overflow-hidden bg-charcoal aspect-[var(--ratio-m)] md:aspect-[var(--ratio-d)]'
  const frameStyle = {
    '--ratio-d': media.aspect,
    '--ratio-m': useMobile && media.aspectMobile ? media.aspectMobile : media.aspect,
  } as CSSProperties

  if (!media.enlarge) return <div className={frame} style={frameStyle}>{picture}</div>

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={`group cursor-zoom-in ${frame}`} style={frameStyle} aria-label="Enlarge illustration">
        {picture}
        <span className="text-ui absolute right-3 bottom-3 bg-void/70 px-2 py-0.5 text-ivory opacity-90 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
          Enlarge
        </span>
      </button>
      {/* native <dialog>: focus is trapped and Esc closes it */}
      <dialog
        ref={dialog}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgb(10_9_10/0.96)]"
      >
        <div className="relative flex h-[100svh] w-screen items-center justify-center p-4 md:p-10">
          <img src={media.src} alt={media.alt} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            autoFocus
            className="text-ui absolute top-4 right-4 border border-mist bg-void/70 px-4 py-2 text-ivory hover:border-ivory"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  )
}

const width = { image: 'max-w-6xl', video: 'max-w-3xl', audio: 'max-w-md' }

/** A story media block, placed after the line named in story.md. */
export function StoryMedia({ id }: { id: string }) {
  const media = storyMedia[id]
  if (!media) {
    if (import.meta.env.DEV) console.warn(`[story] No media configured for "${id}" — add it in src/content/media.ts`)
    return null
  }
  return (
    <Reveal as="figure" className={`mx-auto my-16 w-full empty:hidden md:my-24 ${width[media.kind]}`}>
      {media.kind === 'image' && <StoryImage media={media} />}
      {media.kind === 'video' && <VideoPlayer {...media} />}
      {media.kind === 'audio' && <AudioPlayer media={media} />}
      {media.kind === 'image' && media.caption && <figcaption className="text-ui mt-4 text-center text-muted">{media.caption}</figcaption>}
    </Reveal>
  )
}
