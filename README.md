# AI Video Generation Website

**Live demo:** https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/

A polished, frontend-only AI video generator. Choose a model, write a prompt,
set options, generate, watch, and export — no real backend or AI inference.
All data and generation is mocked behind a swappable service layer.

Styled to match [Fluxion](https://fluxion-sys.ai) — dark UI, converging-line
motif, sky-blue (`#7CBDF2`) accent.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- shadcn/ui (Base UI)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path              | Page                  |
| ----------------- | --------------------- |
| `/`               | Landing               |
| `/generate`       | Generation interface  |
| `/models`         | Model catalog         |
| `/projects`       | History               |
| `/projects/[id]`  | Generation details    |
| `/pricing`        | Pricing               |
| `/login`          | Login                 |
| `/signup`         | Signup                |
| `/settings`       | Settings              |

## Note

Frontend demo only — no real authentication, payments, storage, or video
generation. Mock services live in the service layer so they can later be
swapped for real APIs.
