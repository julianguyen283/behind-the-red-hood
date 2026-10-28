import { Fragment } from 'react'

/** Typographic (curly) quotes and apostrophes, so the source text can use plain ones. */
export const smartQuotes = (text: string) =>
  text
    .replace(/(^|[\s([{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{—–-])'(?=\w)/g, '$1‘')
    .replace(/'/g, '’')

/** Renders *italic* spans inside a paragraph of story text. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {smartQuotes(text)
        .split(/(\*[^*]+\*)/g)
        .map((part, i) =>
          part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
            <em key={i}>{part.slice(1, -1)}</em>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  )
}
