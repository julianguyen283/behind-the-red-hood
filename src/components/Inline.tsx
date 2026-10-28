import { Fragment } from 'react'

/** Typographic (curly) quotes and apostrophes, so the source text can use plain ones. */
export const smartQuotes = (text: string) =>
  text
    .replace(/(^|[\s([{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{—–-])'(?=\w)/g, '$1‘')
    .replace(/'/g, '’')

/** Renders *italic* spans and the inline [[thread-end]] marker. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {smartQuotes(text)
        .split(/(\*[^*]+\*|\[\[thread-end\]\])/g)
        .map((part, i) => {
          if (part === '[[thread-end]]') return <span key={i} data-thread-end aria-hidden="true" />
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
          return <Fragment key={i}>{part}</Fragment>
        })}
    </>
  )
}
