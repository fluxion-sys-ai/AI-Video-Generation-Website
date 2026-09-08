# AI Video Generation Website

**Live demo:** https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/

A polished, frontend-only AI video generator. Choose a model, write a prompt,
set options, generate, watch, and export. There is no real backend or AI
inference: all data and generation is mocked behind a swappable service layer.

Styled to match [Fluxion](https://fluxion-sys.ai): dark UI, converging-line
motif, sky-blue (`#7CBDF2`) accent with a warm gold highlight, JetBrains Mono
headings.

## Features

- **Landing page** with an animated background (gradient plus orange dots that
  flow into the demo video), scroll-reveal sections, and an auto-scrolling row
  of model cards.
- **Model catalog** with hover-to-play video previews.
- **Generation page** (`/generate?model=<slug>`):
  - Prompt, optional image upload, aspect ratio (with a live shape preview),
    resolution, duration (3-15s), and an audio toggle.
  - Options shown adapt to what each model supports.
  - Mock generation with an indeterminate "Hang tight" state, then a result
    video with Download / Regenerate.
  - If signed out, it saves the form, sends you to sign in, and refills it
    afterward (mock auth via `localStorage`).
  - Sidebar with per-model pricing estimate, Examples, and Other Models.
- **Pricing page** with a plan grid and a dots-around-the-plans animation.
- **Login / Signup** (mock, including a "Continue with Google" button).
- **Info page** with basic info and contact details.
- Responsive layout, sticky nav with a Models dropdown, and a Fluxion favicon.

## Sample content is placeholder

The model **names, descriptions, taglines, capabilities, and demo/result
videos are sample data** and are meant to be replaced later. They live in one
file: [`lib/models.ts`](lib/models.ts). Edit that array to change model info,
or swap the video URLs (currently public sample clips) for real ones.

- Hero video: replace `public/hero.mp4`.
- Model demo/result videos and posters: the `demoVideo` / `poster` fields in
  `lib/models.ts`.
- Pricing plans: the `PLANS` array in `app/pricing/page.tsx`.

Mock services (auth, drafts) live in [`lib/auth.ts`](lib/auth.ts) so they can be
swapped for real APIs later.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Static export deployed to GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path                    | Page                            |
| ----------------------- | ------------------------------- |
| `/`                     | Landing                         |
| `/models`               | Model catalog                   |
| `/generate?model=<slug>`| Generation interface            |
| `/pricing`              | Pricing                         |
| `/login`                | Login (mock)                    |
| `/signup`               | Signup (mock)                   |
| `/info`                 | Info and contact                |

## Deploy

The site is a static export (`output: "export"`) served from the `gh-pages`
branch. To publish changes: build, then push the contents of `out/` to
`gh-pages`.

## Note

Frontend demo only: no real authentication, payments, storage, or video
generation.
