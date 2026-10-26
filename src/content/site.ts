/** Site-wide text. Replace every [bracketed] value before submission. */

export const site = {
  title: 'Behind the Red Hood',
  subtitle: 'A Gothic Retelling of Little Red Riding Hood',
  author: '[Your Name]',
  unit: 'MMCC1050 · Macquarie University',
  year: 2026,
  enterLabel: 'Enter the Woods',
  introEyebrow: 'The Path In',
  /** Optional short line shown above the intro film. Leave '' to hide. */
  introLine: '',
  /** Line that appears word by word when the intro film ends. Leave '' to hide. */
  introEndLine: 'She always opened the door before I knocked.',
  /** Story length limits, used by the word counter shown during `npm run dev`. */
  wordLimit: { min: 900, max: 1500 },
  /** Content warning shown discreetly before the story. Leave '' to hide. */
  contentNote:
    'Content note: this story contains psychological manipulation and the threat of violence.',
}

export type CreditItem = {
  label: string
  value: string
  /** true = still to be filled in; rendered in a visibly "pending" style. */
  pending?: boolean
}

export type CreditGroup = { heading: string; items: CreditItem[] }

export const credits: CreditGroup[] = [
  {
    heading: 'Creative Authorship',
    items: [
      { label: 'Story', value: '[Your Name]', pending: true },
      { label: 'Concept & art direction', value: '[Your Name]', pending: true },
      {
        label: 'Website',
        value:
          'Designed and built in React, TypeScript, Vite, Tailwind CSS and Motion, with AI coding assistance (Claude, Anthropic). [Describe your own role in directing and editing it.]',
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
    heading: 'AI-Generated or AI-Assisted Media',
    items: [
      { label: 'Introductory video', value: '[Tool, version, date created, prompt]', pending: true },
      { label: 'Illustration 1', value: '[Tool, version, date created, prompt]', pending: true },
      { label: 'Video 2', value: '[Tool, version, date created, prompt]', pending: true },
      { label: 'Illustration 2', value: '[Tool, version, date created, prompt]', pending: true },
    ],
  },
  {
    heading: 'Music & Sound',
    items: [
      { label: 'The voice from the bedroom', value: '[e.g. "Recorded by the author", plus any editing]', pending: true },
      { label: 'Ambient soundscape', value: '[Title, creator, source URL, licence] — or remove if using the built-in wind texture', pending: true },
      { label: 'Sound effects', value: '[Footsteps, leaves, knock, door: source and licence for each]', pending: true },
      {
        label: 'Built-in wind texture',
        value: 'Synthesised live in the browser with the Web Audio API; written for this project, no recorded samples.',
      },
    ],
  },
  {
    heading: 'Assets & Copyright',
    items: [
      {
        label: 'Hero forest',
        value: 'Vector forest generated procedurally in code for this project (AI-assisted development).',
      },
      {
        label: 'Typefaces',
        value: 'Cormorant Garamond, Crimson Pro, IM Fell English and Inter — SIL Open Font License 1.1, self-hosted via Fontsource.',
      },
      {
        label: 'Software',
        value: 'React, Vite, Tailwind CSS and Motion — MIT License.',
      },
    ],
  },
]
