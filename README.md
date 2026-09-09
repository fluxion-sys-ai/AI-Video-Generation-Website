# AI Video Generation Website

**Live demo:** https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/

A polished, frontend-only AI video generator. Choose a model, write a prompt,
set options, generate, watch, and export. There is no real backend or AI
inference: all data and generation is mocked behind a swappable service layer.

Styled to match [Fluxion](https://fluxion-sys.ai): dark UI, JetBrains Mono
headings, sky-blue (`#7CBDF2`) accent with a warm gold (`#E0A24E`) highlight.

## ⚠️ Everything is a placeholder / stand-in

Nothing on this site is real yet. All of the following are **made-up sample
content** you should replace before showing it as real:

| Stand-in | What it currently is | Where to edit |
| --- | --- | --- |
| **Model names** (Aurora, Pulse, Volt, Nova) | invented | `lib/models.ts` → `MODELS[].name` / `slug` |
| **Model taglines & descriptions** | invented | `lib/models.ts` → `tagline`, `description` |
| **Model capabilities / durations / resolutions / aspect ratios** | invented | `lib/models.ts` → `capabilities`, `durations`, `resolutions`, `aspectRatios` |
| **Model price (credits/second)** | invented numbers | `lib/models.ts` → `creditsPerSecond` |
| **Model poster images** | Google "gtv-videos-bucket" **sample images** (external URLs) | `lib/models.ts` → `poster` |
| **Pricing plans** — names, `$0/$24/$96`, credit amounts, feature bullets | invented | `app/pricing/page.tsx` → `PLANS` array |
| **"Credits per $" figure** | derived, assuming **1 credit ≈ $0.01** (made up) | `components/plans-interactive.tsx` (`cpd`) + table below |
| **Per-model table `$ / 5s clip`** | same made-up `$0.01/credit` rate | `components/model-pricing-table.tsx` |
| **Landing stats** (`3.5K+`, `10x`, `100x`, `99.9% SLA`) | invented marketing numbers | `components/stats.tsx` → `STATS` |
| **Aspect-ratio use labels** (YouTube, Reels/TikTok…) | my guesses | `app/generate/page.tsx` → `ASPECT_USE` |
| **Contact email / links** (`hello@fluxion-sys.ai`) | placeholder | `app/info/page.tsx` |
| **Generated result video** | just replays the model's sample clip (no real AI) | mock in `app/generate/page.tsx` |
| **Sign in / accounts / credits** | fake (`localStorage` flag) | `lib/auth.ts` |

## Where to change the media (videos & images)

All swappable videos live under **`public/`**. Drop files in with the exact
names below; they show up automatically (rebuild/redeploy to publish). These are
also stand-ins — the reel/thumbnail clips are sample footage you uploaded.

| What | Location | File names |
| --- | --- | --- |
| **Hero reels** (3 slots, auto-swipe) | `public/reels/slot1/`, `slot2/`, `slot3/` | `a.mp4`, `b.mp4`, `c.mp4` per slot (each slot cycles all it has) |
| **Model card thumbnails** | `public/models/` | `aurora.mp4`, `pulse.mp4`, `volt.mp4`, `nova.mp4` (name = model slug) |
| **"See it in action" walkthrough** | `public/demos/` | `walkthrough.mp4` |
| **Model poster images** (shown before hover) | external sample URLs today | swap in `lib/models.ts` → `poster` |
| **Hero background art** | animated SVG | `public/backdrop.svg` |

Notes:
- Reels are vertical (9:16), `object-cover`, so any clip is cropped to fit.
- Keep clips small (1–3 MB) — the hero plays several at once.
- A model with no uploaded thumbnail falls back to its poster image (no black card).

## Other things you can tune (not placeholders, just settings)

| What | File |
| --- | --- |
| Reel timing / order (which slot swipes when) | `components/hero-reels.tsx` (`SLOTS`, `order`, `GAP`) |
| Accent colors, cursor, animations | `app/globals.css` |
| Background blob placement per page | `components/glow-blobs.tsx` (`VARIANTS`) |

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
