# AI Video Generation Website

**Live demo:** https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/

A polished, **frontend-only** AI video generator, choose a model, write a
prompt, set options, generate, watch, and export. There is **no real backend or
AI inference**: all accounts, credits, payments, and "generation" are mocked in
the browser (`localStorage` + a swappable data layer). It replays sample clips
instead of generating anything.

Styled to match [Fluxion](https://fluxion-sys.ai): **JetBrains Mono** for
headings/UI (all buttons use it too), **Geist** for body, **Sora** for the logo
wordmark. Sky-blue (`#7CBDF2`) accent with a warm gold/orange (`#E0A24E` /
`#FF8A1E`) highlight. Two themes: a near-black **dark** UI (default) and a soft
blue-grey **light** UI (`#eef2f8` canvas); decorative glows are warm
orange/yellow in light mode. All of it is token-driven, see
[Design tokens & theming](#design-tokens--theming).

---

## Two experiences: public site + signed-in app

The same header switches between two "modes":

- **Public (marketing) mode**, the landing page, model catalog, pricing, info,
  docs. Nav shows **Models · Pricing · info**. When you're signed in, a small
  **`+ Create`** button appears next to your avatar.
- **Dashboard (app) mode**, entered with the **Create** button. Nav becomes
  **Dashboard · Generate · Library · Settings**. The logo always returns you to
  the public home (you stay signed in).

**How the mode is decided** (`components/site-header.tsx`):
- Marketing routes (`/`, `/pricing`, `/info`, `/login`, `/signup`) always show
  the public bar.
- App routes (`/dashboard`, `/library`, `/settings`) always show the app bar.
- Shared routes (`/profile`, `/generate`, `/models`, `/docs`) inherit the last
  mode (stored in `localStorage` as `fluxion.mode`). This is why clicking your
  profile photo from a public page **keeps** you in public mode, only the
  Create button (or an app page) switches you into the dashboard.

---

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Landing | Hero reels, stats, model marquee, walkthrough, pricing teaser |
| `/models` | Model catalog | Cards with hover-preview, **search**, **tag filter**, **sort** (popular / price / A–Z), **heart to favorite** |
| `/generate?model=<slug>` | Generation playground | Form + live preview + **multi-image upload** (thumbnails, lightbox, hover-to-delete) + **floating refine chatbot**; **API** tab with code snippets |
| `/pricing` | Pricing | Pay-as-you-go rate + **cost estimator** + per-model rate table |
| `/docs` | Documentation | fal.ai-style docs: section sidebar + quickstart/auth/API/etc. |
| `/login` | Mock auth | Email/Google (mock), sets a `localStorage` flag |
| `/signup` | **Guided onboarding slideshow** | Multi-step wizard: account → name (email autofilled) → who-are-you → payment + billing (optional) → add credits (optional) → dashboard |
| `/info` | Info + contact | Placeholder contact links |
| `/dashboard` | **App** dashboard | Getting-started checklist, quick actions, snapshot, recents + favorites |
| `/library` | **App** library | Videos (hover-play) + images. Images: multi-select, delete (with confirm), upload, drag-into / right-click-into **folders**, and "upload to a model" → opens that model's playground with the images loaded |
| `/profile` | **App** account hub | Left sidebar: Account · Billing · Payment · Usage · Settings. **Avatar editor** (crop/zoom/rotate/filter) on photo change; theme toggle with **system/dark/light** icons; payment methods sort the **default card first**; Usage shows a **searchable, scrollable** generation history |
| `/settings` | Redirect | Sends you to `/profile?tab=preferences` |

Deep links: the profile hub reads `?tab=` (e.g. `/profile?tab=billing`), used by
the avatar dropdown and the dashboard/Settings nav.

---

## ⚠️ Everything is a placeholder / stand-in

Nothing here is real. Replace this made-up sample content before showing it as real:

| Stand-in | What it currently is | Where to edit |
| --- | --- | --- |
| **Model names** (Aurora, Pulse, Volt, Nova) | invented | `lib/models.ts` → `MODELS[].name` / `slug` |
| **Model taglines & descriptions** | invented | `lib/models.ts` → `tagline`, `description` |
| **Capabilities / durations / resolutions / aspect ratios** | invented | `lib/models.ts` |
| **Price (`creditsPerSecond`)** | invented numbers | `lib/models.ts` → `creditsPerSecond` |
| **Model poster images** | self-hosted first-frame JPGs in `public/models/<slug>.jpg` (extracted from the clips) | `lib/models.ts` → `poster` |
| **Pay-as-you-go rate** (`from $0.03 / second`, feature bullets) | invented | `app/pricing/page.tsx` → `PAYG` |
| **Cost estimator math** | `1 credit ≈ $0.01`, resolution multipliers `480p/720p/1080p = 1 / 1.5 / 2.5` | `components/cost-estimator.tsx` (`PER_CREDIT`, `RES_MULT`) |
| **Per-model table `≈ $ / 5s clip`** | same made-up `$0.01/credit` rate | `components/model-pricing-table.tsx` |
| **Landing stats** (`3.5K+`, `10x`, …) | invented marketing numbers | `components/stats.tsx` → `STATS` |
| **Daily usage / spend charts** | random sample values | `components/usage-chart.tsx` (`DEFAULT`) |
| **Aspect-ratio use labels** (YouTube, Reels/TikTok…) | guesses | `app/generate/page.tsx` → `ASPECT_USE` |
| **Generation history** (Library videos + Profile usage) | seeded sample history, appended to on each generate | `lib/generations.ts` |
| **Uploaded library images, dashboard recents seed** | invented | `app/library/page.tsx`, `lib/prefs.ts` |
| **Billing / payment / usage numbers** (`$0.00`, Visa •••• 4242, dates) | fake | `app/profile/page.tsx` |
| **Docs content** (endpoints, code snippets, `api.fluxion-sys.ai`) | illustrative | `app/docs/page.tsx`, `components/api-docs.tsx` |
| **Contact email / links** (`hello@fluxion-sys.ai`) | placeholder | `app/info/page.tsx`, `components/site-footer.tsx` |
| **Generated result video** | replays the model's sample clip (no real AI) | **`lib/api.ts`** (`generateVideo` / `refineVideo`), the one place to wire a real render backend |
| **Payment methods, credits, "can generate?" gate** | fake (`localStorage`) | **`lib/billing.ts`** |
| **Sign in / accounts / favorites** | fake (`localStorage`) | `lib/auth.ts`, `lib/prefs.ts` |
| **Sign-up onboarding** (persona list, credit presets, card entry) | mock, nothing sent anywhere | `components/onboarding.tsx` |

> **Backend integration:** see **[BACKEND.md](BACKEND.md)**, it lists every seam
> (`lib/api.ts`, `lib/billing.ts`, `lib/auth.ts`, …), the exact function to replace,
> and the real endpoint it should call. The demo keeps working untouched.

### `localStorage` keys used
| Key | Meaning | Set in |
| --- | --- | --- |
| `fluxion.signedIn` | signed-in flag | `lib/auth.ts` |
| `fluxion.user` | `{ name, username, email, avatar? }` | `lib/auth.ts` |
| `fluxion.genDraft` | generation form draft (survives a sign-in detour) | `lib/auth.ts` |
| `fluxion.mode` | `public` \| `dashboard` (which nav to show) | `components/site-header.tsx` |
| `fluxion.favorites` | array of favorited model slugs | `lib/prefs.ts` |
| `fluxion.recents` | recently-used model slugs (max 8) | `lib/prefs.ts` |
| `fluxion.theme` | `dark` \| `light` \| `system` (follows the OS) | `lib/prefs.ts` + `app/layout.tsx` |
| `fluxion.persona` | who-are-you answer from onboarding (student, developer, …) | `components/onboarding.tsx` |
| `fluxion.cards` | saved payment methods `{ id, brand, last4, exp, primary }[]` (source of truth for the generation gate) | `lib/billing.ts` |
| `fluxion.hasCard` | legacy `1`/`0` mirror of "has a card" (kept in sync by `lib/billing.ts`) | `lib/billing.ts` |
| `fluxion.credits` | credit balance (set during signup, topped up in Profile) | `lib/billing.ts` |
| `fluxion.generations` | past generations `{ id, slug, prompt, videoUrl, poster, createdAt }[]` (Library videos + Profile history) | `lib/generations.ts` |
| `fluxion.pendingImages` | images handed off from the library to a model's playground | `lib/prefs.ts` |
| `fluxion.libraryImages` | persisted library images (samples + uploads, incl. those uploaded to a model) | `lib/prefs.ts` |
| `fluxion.libraryFolders` | user-created image folders `{ id, name, imageIds[] }` | `app/library/page.tsx` |

---

## Where to change the media (videos & images)

All swappable videos live under **`public/`**. Drop files in with the exact
names below; they show up automatically (rebuild/redeploy to publish).

| What | Location | File names |
| --- | --- | --- |
| **Hero reels** (3 slots, auto-swipe) | `public/reels/slot1/`, `slot2/`, `slot3/` | `a.mp4`, `b.mp4`, `c.mp4` per slot |
| **Model card thumbnails** | `public/models/` | `aurora.mp4`, `pulse.mp4`, `volt.mp4`, `nova.mp4` (name = model slug) |
| **"See it in action" walkthrough** | `public/demos/` | `walkthrough.mp4` |
| **Model poster images** (thumbnail) | `public/models/<slug>.jpg` (first frame of the clip) | replace the file, or in `lib/models.ts` → `poster` |
| **Hero background art** | animated SVG | `public/backdrop.svg` |

Notes:
- Reels are vertical (9:16), `object-cover`, so any clip is cropped to fit.
- Keep clips small (1–3 MB), the hero plays several at once.
- A model with no uploaded thumbnail falls back to its poster image.

---

## Design tokens & theming

All color, font, and shape decisions live in **`app/globals.css`** as semantic
CSS variables (no hardcoded hex in pages/components), the one place to restyle
the app. Values are declared under `:root` (dark, default) and overridden under
`.light`, then exposed to Tailwind via `@theme inline`, so you style with
semantic utilities (`bg-base`, `text-fg`, `border-line`, `bg-accent`, …) instead
of raw hex. Fonts (`next/font` in `app/layout.tsx`) and shape radii are tokens
too. Decorative background art (glow orbs, moving line-dots) reads its colors
from the same vars, so it recolors per theme rather than being invert-filtered.

**Theme switch** (Settings → Appearance): Dark / Light / System (follows the OS
`prefers-color-scheme`, live-updated via `watchSystemTheme`). Switching only
swaps `:root` → `.light` values, no per-page edits. Persisted as `fluxion.theme`
and applied before paint by a script in `app/layout.tsx` (no flash); logic lives
in `lib/prefs.ts`.

**To retheme:** edit the variables in `app/globals.css`. **To add a color:** add
`--c-name` under both `:root` and `.light`, map it in `@theme inline`, then use
`bg-name` / `text-name` / `border-name`. Full token list and inline comments are
in `app/globals.css` itself.

## Other things you can tune (settings, not placeholders)

| What | File |
| --- | --- |
| Reel timing / order (which slot swipes when) | `components/hero-reels.tsx` (`SLOTS`, `order`, `GAP`) |
| Color/font/shape tokens (dark + light), marquee keyframes, button font | `app/globals.css` |
| Static glow-blob placement per page | `components/glow-blobs.tsx` (`VARIANTS`) |
| Moving line-dot field (paths, speed, opacity) | `components/plans-dots.tsx` |
| Dashboard getting-started steps & quick links | `app/dashboard/page.tsx` (`STEPS`, `LINKS`) |
| Docs sections / sidebar | `app/docs/page.tsx` (`NAV`) |

---

## Repo organization

```
app/                     Next.js App Router pages
  page.tsx               Landing (hero reels, stats, marquee, walkthrough, pricing teaser)
  models/page.tsx        Model catalog (search + favorite hearts)
  generate/page.tsx      Generation playground + API docs tab
  pricing/page.tsx       Pay-as-you-go rate + estimator + rate table
  docs/page.tsx          Documentation (sidebar + sections)
  dashboard/page.tsx     Signed-in app home (getting started, recents, favorites)
  library/page.tsx       Generated videos + uploaded images
  profile/page.tsx       Account hub: Account/Billing/Payment/Usage/Settings (sidebar)
  settings/page.tsx      Redirects to /profile?tab=preferences
  login/, signup/        Mock auth
  info/page.tsx          Info + contact
  layout.tsx             Fonts, shared <body>
  globals.css            Theme + keyframes + button font
components/              Reusable UI
  site-header.tsx        Nav; public/dashboard mode switch; profile avatar dropdown
  site-footer.tsx        Footer (links to fluxion-sys.ai)
  hero-reels.tsx         3-slot vertical reels carousel
  model-marquee.tsx      Auto-scrolling model row (landing)
  model-card.tsx         Model thumbnail card + favorite heart
  model-catalog.tsx      Catalog grid + search + tag filter + sort
  model-pricing-table.tsx  Per-model rate table
  cost-estimator.tsx     Pricing clip cost estimator
  usage-chart.tsx        Daily usage/spend bar chart (axes)
  api-docs.tsx           Per-model API reference (JS/Python/cURL)
  glow-blobs.tsx         Static background glow orbs
  plans-dots.tsx         Animated line-and-dot background field
  stats.tsx              Landing stats row
  reveal.tsx             Scroll-in animation wrapper
  brand.tsx              Logo mark + wordmark
  onboarding.tsx         Sign-up "slideshow" wizard (account → name → persona → payment → credits)
  auth-form.tsx          Mock login form (used by /login)
  spotlight.tsx          Cursor-following glow + OS-theme sync
  avatar-editor.tsx      Profile-photo editor (crop/zoom/rotate + filters → PNG)
  copy-button.tsx        Click-to-copy icon button (docs/API snippets)
  toaster.tsx            Toast host (listens for lib/toast events)
  docs-sidebar.tsx       Docs navigation sidebar
  empty-state.tsx        Reusable "nothing here yet" placeholder (icon + action)
  skeleton.tsx           Shimmering image placeholder shown until media loads
lib/                     Backend seams (see BACKEND.md), swap mock bodies for real API calls
  api.ts                 Video generate/refine (the render-backend seam)
  billing.ts             Payment methods, credits, "can generate?" gate
  generations.ts         Past generations (Library videos + Profile history)
  auth.ts                Mock auth + sign-in form draft
  models.ts              Model catalog data (edit me)
  prefs.ts               Favorites, recents, library images, settings, theme (localStorage)
  toast.ts               Fire-a-toast helper
  use-escape-key.ts      Esc-to-close hook
  utils.ts               className merge helper
public/
  reels/slotN/           Hero reel videos (a/b/c.mp4)
  models/                Model thumbnails (<slug>.mp4)
  demos/                 Walkthrough video
  backdrop.svg           Animated hero background
```

---

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4**
- **Static export** (`output: "export"`) deployed to **GitHub Pages**

Fonts are loaded with `next/font` (JetBrains Mono, Geist, Sora). No animation
libraries, reveals use `IntersectionObserver`, backgrounds use SVG + CSS.

---

## Getting started (local dev)

```bash
npm install
npm run dev
```

Then open the local URL Next prints (usually `http://localhost:3000`).

`basePath`/`assetPrefix` are only applied in production
(`next.config.ts`), so local dev serves from `/`.

---

## Deploy (GitHub Pages)

The site is a **static export** served from the **`gh-pages`** branch (this
repo's token can't push GitHub Actions workflows, so deploys are manual):

```bash
npm run build          # emits ./out (static site)
# publish ./out to the gh-pages branch, e.g. via a worktree:
git fetch origin gh-pages
git worktree add /tmp/ghpages gh-pages
rm -rf /tmp/ghpages/*            # keep .git
cp -r out/. /tmp/ghpages/
touch /tmp/ghpages/.nojekyll     # keep _next/ assets
cd /tmp/ghpages && git add -A && git commit -m "Redeploy" && git push origin gh-pages
git worktree remove /tmp/ghpages --force
```

`.nojekyll` is required so GitHub Pages serves the `_next/` asset folder.

---

## Note

Frontend demo only: no real authentication, payments, storage, API, or video
generation. To make it real, swap the seam functions in `lib/` (`api.ts`,
`billing.ts`, `auth.ts`, …) for calls to an actual service, see
**[BACKEND.md](BACKEND.md)** for the per-function map and endpoints.
