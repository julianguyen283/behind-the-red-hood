/** Site-wide text. Replace every [bracketed] value before submission. */

export const site = {
  title: 'Behind the Red Hood',
  subtitle: 'A Gothic Retelling of Little Red Riding Hood',
  author: '[Your Name]',
  unit: 'MMCC1050, Macquarie University',
  year: 2026,
  enterLabel: 'Enter',
  /** Shown on the first screen, under the title. Leave '' to hide. */
  contentNote: 'This story contains psychological manipulation and threatened violence.',
  listeningNote: 'Best with headphones',
  /** Story length limits, used by the word counter shown during `npm run dev`. */
  wordLimit: { min: 900, max: 1500 },
}

export type CreditItem = {
  label: string
  value: string
  /** optional link to the source (Freesound page, tool website, licence…) */
  href?: string
  /** true = still to be filled in; marked with a red bar so it is easy to spot */
  pending?: boolean
}

export type CreditGroup = { heading: string; items: CreditItem[] }

/*
  Fill these in as you make each asset (tool + version, date, licence).
  Call AI-made media "AI-generated", not "original".
  Full prompts belong in your AI log / reference list, not here.
*/
export const credits: CreditGroup[] = [
  {
    heading: 'Authorship',
    items: [
      { label: 'Story', value: '[Your Name]', pending: true },
      {
        label: 'Website',
        value:
          'Built in React, TypeScript, Vite, Tailwind CSS and Motion, with AI coding assistance (Claude, Anthropic). [Describe your own role in directing and editing it.]',
        pending: true,
      },
      {
        label: 'Source tale',
        value:
          '“Little Red Riding Hood”, traditional European folk tale; versions by Charles Perrault (1697) and the Brothers Grimm (1812) are in the public domain.',
      },
    ],
  },
  {
    heading: 'AI-Generated Media',
    items: [
      { label: 'Opening video (shots 1, 3, 5, 6)', value: 'AI-generated with [tool, version], [date]; edited by the author in [editor].', pending: true },
      { label: 'Illustration 1: the bedroom', value: 'AI-generated with [tool, version], [date]; [manual edits].', pending: true },
      { label: 'Video 2: the room behind Red', value: 'AI-generated with [tool, version], [date].', pending: true },
      { label: 'Illustration 2: the hood on the thorns', value: 'AI-generated with [tool, version], [date]; [manual edits].', pending: true },
    ],
  },
  {
    heading: 'Sound',
    items: [
      { label: 'Footsteps, knocks, hinge', value: 'Recorded by the author.', pending: true },
      { label: 'The voice from the bedroom', value: 'Recorded by the author; pitch and reverb in Audacity.', pending: true },
      {
        label: 'Background drone (if used)',
        value: '[Title] by [creator], Freesound, [CC0 / CC BY 4.0]. Delete this line if not used.',
        href: 'https://freesound.org/',
        pending: true,
      },
    ],
  },
  {
    heading: 'Type & Code',
    items: [
      {
        label: 'Typefaces',
        value: 'Cormorant Garamond, EB Garamond and Inter: SIL Open Font License 1.1, self-hosted via Fontsource.',
        href: 'https://openfontlicense.org/',
      },
      { label: 'Software', value: 'React, Vite, Tailwind CSS and Motion: MIT License.' },
      { label: 'Title-screen forest', value: 'Vector forest generated procedurally in code for this project (AI-assisted development).' },
    ],
  },
]
