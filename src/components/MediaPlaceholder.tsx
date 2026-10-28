import type { ReactNode } from 'react'

type Props = {
  kind: 'video' | 'image' | 'audio'
  note: string
  aspect?: string
  children?: ReactNode
}

const label = { video: 'Video placeholder', image: 'Illustration placeholder', audio: 'Audio placeholder' }

/**
 * Shown whenever a media file has not been supplied yet. It is deliberately
 * labelled as a placeholder so it can never be mistaken for final media.
 */
export function MediaPlaceholder({ kind, note, aspect, children }: Props) {
  return (
    <div
      role="img"
      aria-label={`${label[kind]}: ${note}`}
      className="placeholder-stripes relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden border border-mist/40 bg-charcoal px-5 py-10 text-center"
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      <span className="text-ui font-medium text-ivory">{label[kind]}</span>
      <span className="text-ui max-w-lg text-muted">{note}</span>
      {children && <div className="mt-3 w-full">{children}</div>}
    </div>
  )
}
