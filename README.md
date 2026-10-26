# Behind the Red Hood

A single-page Gothic storytelling website for MMCC1050 (Macquarie University).
Built with React, TypeScript, Vite, Tailwind CSS and Motion, and hosted on Vercel.

- **Publishing (one-time setup):** see [`DEPLOY.md`](DEPLOY.md)
- **Editing text, media, colours and layout:** see [`EDITING.md`](EDITING.md)

## How publishing works

```
edit a file ──► commit to a branch ──► Vercel builds a PREVIEW link ──► check it
                                                                          │
              your permanent public URL ◄── Vercel publishes ◄── merge into main
```

Every change pushed to `main` goes live automatically within about a minute.
Changes on any other branch get their own preview URL first, so you can check them before they go live.

## Where everything lives

| You want to change… | Edit this file |
|---|---|
| The story | `src/content/story.md` |
| The closing lines | `src/content/ending.md` |
| Title, subtitle, your name, content note, credits | `src/content/site.ts` |
| Media files | upload into `public/media/` (see `public/media/README.md`) |
| Media alt text, captions, transcript, placement notes | `src/content/media.ts` |
| Colours, fonts, text size, reading width | `src/content/theme.css` |

## Running it on your own computer (optional)

You need Node.js 20 or newer.

```bash
npm install
npm run dev       # live preview at http://localhost:5173 (with a word counter)
npm run build     # the same production build Vercel runs
```
