import { site } from '../content/site'
import { countWords, type StoryBlock } from '../lib/parseStory'

/** Development-only helper; never rendered in the production build. */
export function DevWordCount({ story, ending }: { story: StoryBlock[]; ending: StoryBlock[] }) {
  const total = countWords(story) + countWords(ending)
  const { min, max } = site.wordLimit
  const inRange = total >= min && total <= max
  return (
    <div className="fixed bottom-3 left-3 z-50 rounded border border-ivory/15 bg-void/90 px-3 py-2 font-ui text-[0.65rem] text-ivory/70">
      Story words: <strong className={inRange ? 'text-ivory underline' : 'text-ivory'}>{total}</strong> / limit {min.toLocaleString()}–{max.toLocaleString()}
    </div>
  )
}
