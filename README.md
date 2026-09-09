# AI Video Generation Website

**Live demo:** https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/

A polished, frontend-only AI video generator. Choose a model, write a prompt,
set options, generate, watch, and export. There is no real backend or AI
inference: all data and generation is mocked behind a swappable service layer.

Styled to match [Fluxion](https://fluxion-sys.ai): dark UI, JetBrains Mono
headings, sky-blue (`#7CBDF2`) accent with a warm gold (`#E0A24E`) highlight.

## Where to change the media (no code needed)

All swappable videos live under **`public/`**. Drop files in with the exact
names below and they show up automatically (rebuild/redeploy to publish).

| What | Location | File names |
| --- | --- | --- |
| **Hero reels** (3 slots, auto-swipe carousel) | `public/reels/slot1/`, `public/reels/slot2/`, `public/reels/slot3/` | `a.mp4`, `b.mp4`, `c.mp4` in each slot (each slot cycles through whatever it has) |
| **Model card thumbnails** | `public/models/` | `aurora.mp4`, `pulse.mp4`, `volt.mp4`, `nova.mp4` (must match the model slug) |
| **"See it in action" walkthrough** | `public/demos/` | `walkthrough.mp4` |
| **Other demo videos** | `public/demos/` | any name; reference them where you use them |

Notes:
- Reels are vertical (9:16) and `object-cover`, so any clip is cropped to fit.
- Keep clips small (1–3 MB) — the hero plays several at once.
- A model with no uploaded thumbnail falls back to its poster image (no black card).

## Where to change the text / data

| What | File |
| --- | --- |
| Model names, taglines, descriptions, capabilities, durations, resolutions, aspect ratios, pricing-per-second | `lib/models.ts` (the `MODELS` array) |
| Pricing plans (price, credits, features) | `app/pricing/page.tsx` (the `PLANS` array) |
| Reel timing (which slot swipes when) | `components/hero-reels.tsx` (the `SLOTS` array: `startMs` / `holdMs`) |
| Info + contact details | `app/info/page.tsx` |
| Mock auth / saved-form logic | `lib/auth.ts` |

## Repo organization

```
app/                     Next.js App Router pages
  page.tsx               Landing (hero reels, models marquee, walkthrough)
  models/page.tsx        Model catalog
  generate/page.tsx      Generation tool (form + live preview)
  pricing/page.tsx       Pricing plans
  login/, signup/        Mock auth
  info/page.tsx          Info + contact
  layout.tsx             Fonts, shared <body>
  globals.css            Theme + keyframes
components/              Reusable UI
  site-header.tsx        Nav (Models dropdown, Pricing, info, auth)
  site-footer.tsx        Footer (links to fluxion-sys.ai)
  hero-reels.tsx         3-slot vertical reels carousel
  model-marquee.tsx      Auto-scrolling model row (landing)
  model-card.tsx         Single model thumbnail card
  reveal.tsx             Scroll-in animation wrapper
  brand.tsx              Logo mark + wordmark
lib/
  models.ts              Model data (edit me)
  auth.ts                Mock auth + form draft
public/
  reels/slotN/           Hero reel videos (a/b/c.mp4)
  models/                Model thumbnails (<slug>.mp4)
  demos/                 Walkthrough + demo videos
  backdrop.svg           Animated hero background
```

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Static export deployed to GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

## Routes

| Path                     | Page                 |
| ------------------------ | -------------------- |
| `/`                      | Landing              |
| `/models`                | Model catalog        |
| `/generate?model=<slug>` | Generation interface |
| `/pricing`               | Pricing              |
| `/login`, `/signup`      | Mock auth            |
| `/info`                  | Info + contact       |

## Deploy

Static export (`output: "export"`) served from the `gh-pages` branch. To
publish: build, then push the contents of `out/` to `gh-pages`.

## Note

Frontend demo only: no real authentication, payments, storage, or video
generation.
