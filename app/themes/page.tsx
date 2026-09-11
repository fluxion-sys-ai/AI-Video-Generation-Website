"use client";

/* ============================================================================
   TEMP — Theme concept preview gallery (/themes)
   ----------------------------------------------------------------------------
   A throwaway showcase so we can eyeball whole-site theme directions before
   committing to re-skinning the real app pages. Each concept is a SELF-CONTAINED
   mini "landing + app surfaces" mockup rendered inside a scoped wrapper
   (`.tp .tp-<name>`) with its own stylesheet block, so nothing here touches the
   live design tokens in app/globals.css. Header/footer content stays the same;
   only the layout, type, and color language change.

   Concepts:
     azure       — white background, blue type, clean corporate (marketing site)
     editorial   — warm frosted-glass "food magazine" (glassmorphism)
     expedition  — rugged cinematic mountain with brush/ink section edges

   Remove this route (and the TEMP "Themes" link in components/site-header.tsx)
   once a direction is chosen.
   ============================================================================ */

import { useState } from "react";
import Link from "next/link";

type ThemeKey = "azure" | "editorial" | "expedition";

const TABS: { key: ThemeKey; label: string; blurb: string }[] = [
  { key: "azure", label: "Azure", blurb: "White + blue, clean corporate" },
  { key: "editorial", label: "Editorial", blurb: "Warm frosted glass" },
  { key: "expedition", label: "Expedition", blurb: "Rugged cinematic" },
];

export default function ThemesPage() {
  const [active, setActive] = useState<ThemeKey>("azure");

  return (
    <div className="min-h-screen bg-base text-fg">
      {/* Load the concept fonts (scoped by usage in the CSS below). */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@700&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Space+Grotesk:wght@400;500;700&display=swap"
      />
      <style>{THEME_CSS}</style>

      {/* Control strip (uses the live app tokens, not the concept themes). */}
      <div className="sticky top-0 z-20 border-b border-line bg-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-accent-ink">
            Theme preview
          </span>
          <span className="text-xs text-dim">Temporary — pick a direction and we&apos;ll roll it out to the real pages.</span>
          <div className="ml-auto flex gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`rounded-none border px-3 py-1.5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                  active === t.key
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                }`}
                title={t.blurb}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link href="/" className="text-xs text-dim underline decoration-dotted hover:text-fg">
            ← back to site
          </Link>
        </div>
      </div>

      {/* The selected concept. */}
      <div className="tp">
        {active === "azure" && <Azure />}
        {active === "editorial" && <Editorial />}
        {active === "expedition" && <Expedition />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ AZURE --- */
function Azure() {
  return (
    <div className="tp-azure">
      <header className="az-head">
        <div className="az-logo">
          fluxion <span>AI</span>
        </div>
        <nav className="az-nav">
          <span>Models</span>
          <span>Pricing</span>
          <span>Docs</span>
          <button className="az-btn">Sign up</button>
        </nav>
      </header>

      <section className="az-hero">
        <p className="az-eyebrow">AI video generation</p>
        <h1>
          Your words, <span>in motion.</span>
        </h1>
        <p className="az-sub">
          Turn a prompt into a finished shot. Cinematic models, real controls, and a playground built for
          iteration — no hero reels, just the work.
        </p>
        <div className="az-cta">
          <button className="az-btn">Start generating</button>
          <button className="az-btn ghost">Browse models →</button>
        </div>
      </section>

      <section className="az-grid">
        {[
          ["Aurora", "Cinematic text-to-video"],
          ["Pulse", "Fast drafts"],
          ["Volt", "Image-to-video"],
          ["Nova", "High resolution"],
        ].map(([n, t]) => (
          <div className="az-card" key={n}>
            <div className="az-thumb" />
            <h3>{n}</h3>
            <p>{t}</p>
            <span className="az-link">Open →</span>
          </div>
        ))}
      </section>

      <section className="az-app">
        <h2>The same app, restyled</h2>
        <div className="az-appwrap">
          <div className="az-panel">
            <p className="az-panel-title">Dashboard</p>
            <div className="az-stat-row">
              <div><b>128</b><span>Generations</span></div>
              <div><b>$42</b><span>This month</span></div>
              <div><b>4</b><span>Favorites</span></div>
            </div>
          </div>
          <div className="az-panel">
            <p className="az-panel-title">Library</p>
            <div className="az-lib">
              {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
            </div>
          </div>
        </div>
      </section>

      <footer className="az-foot">
        <span>fluxion AI</span>
        <span>© 2026 · Your words, in motion.</span>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------- EDITORIAL --- */
function Editorial() {
  return (
    <div className="tp-editorial">
      <div className="ed-blur" aria-hidden="true" />
      <div className="ed-glass">
        <header className="ed-head">
          <div className="ed-logo">fluxion <span>AI</span></div>
          <nav className="ed-nav">
            <span>Models</span>
            <span>Pricing</span>
            <span>Docs</span>
            <button className="ed-pill">Sign up →</button>
          </nav>
        </header>

        <section className="ed-hero">
          <div className="ed-hero-text">
            <p className="ed-kick">AI VIDEO STUDIO</p>
            <h1>Prompt it. Plate it. Ship it.</h1>
            <p className="ed-sub">
              A boutique studio for motion. Write a line, pick a model, and watch it come together — crisp
              content served over a warm, unhurried canvas.
            </p>
            <button className="ed-pill big">Start generating →</button>
          </div>
          <div className="ed-hero-card">
            <div className="ed-photo" />
            <div className="ed-photo-meta">
              <span className="ed-heart">♥</span>
              <div><b>Aurora</b><small>Cinematic · 1080p</small></div>
              <span className="ed-cart">↗</span>
            </div>
          </div>
        </section>

        {/* zigzag rhythm */}
        {[
          ["Bold type, quiet UI", "Chunky black headlines do the talking; the interface stays out of the way.", false],
          ["Everything feels tactile", "Rounded cards, soft shadows, small circular icon buttons — app-like and warm.", true],
        ].map(([h, b, flip], i) => (
          <section className={`ed-zig ${flip ? "flip" : ""}`} key={i}>
            <div className="ed-zig-photo" />
            <div className="ed-zig-text">
              <h2>{h}</h2>
              <p>{b}</p>
              <span className="ed-arrow">Learn more →</span>
            </div>
          </section>
        ))}

        <section className="ed-app">
          <h2>Your library, served warm</h2>
          <div className="ed-lib">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="ed-tile" key={i}><span className="ed-tile-heart">♥</span></div>
            ))}
          </div>
        </section>

        <footer className="ed-foot">
          <span className="ed-logo">fluxion <span>AI</span></span>
          <span>© 2026 · A boutique studio for motion.</span>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- EXPEDITION --- */
function Expedition() {
  return (
    <div className="tp-expedition">
      <header className="xp-head">
        <div className="xp-logo">Fluxion</div>
        <nav className="xp-nav">
          <span>MODELS</span>
          <span>PRICING</span>
          <span>DOCS</span>
          <span className="xp-navbtn">SIGN UP</span>
        </nav>
      </header>

      <section className="xp-hero">
        <div className="xp-mtn" aria-hidden="true">
          <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="xpsky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#20262b" />
                <stop offset="1" stopColor="#3c4a44" />
              </linearGradient>
            </defs>
            <rect width="1440" height="500" fill="url(#xpsky)" />
            <polygon points="0,500 260,210 470,500" fill="#2b3a33" />
            <polygon points="300,500 640,150 980,500" fill="#223029" />
            <polygon points="760,500 1080,240 1440,500" fill="#2b3a33" />
            <polygon points="640,150 700,205 660,235 720,300 620,290 560,340 520,270" fill="#e7ebe6" opacity="0.9" />
          </svg>
        </div>
        <div className="xp-hero-inner">
          <p className="xp-tag">EST. 2026 — MOTION EXPEDITIONS</p>
          <h1 className="xp-brush">Into the wild render.</h1>
          <p className="xp-sub">
            Chart a course from prompt to picture. Epic models, honest controls, and a playground built for the
            long haul.
          </p>
          <span className="xp-underlink">Plan your first generation →</span>
        </div>
        <BrushEdge />
      </section>

      <section className="xp-routes">
        <p className="xp-side">DESTINATIONS</p>
        <h2 className="xp-serif">Choose your route</h2>
        <div className="xp-route-list">
          {[
            ["01", "Aurora", "Cinematic text-to-video"],
            ["02", "Pulse", "Fast drafts, low cost"],
            ["03", "Volt", "Animate a still image"],
            ["04", "Nova", "High-resolution finals"],
          ].map(([n, t, d]) => (
            <div className="xp-route" key={n}>
              <b>{n}</b>
              <div><span className="xp-route-t">{t}</span><span className="xp-route-d">{d}</span></div>
              <span className="xp-route-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      <section className="xp-app">
        <BrushEdge flip />
        <div className="xp-app-inner">
          <p className="xp-side light">FIELD LOG</p>
          <h2 className="xp-serif light">Your library</h2>
          <div className="xp-lib">
            {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
          </div>
        </div>
      </section>

      <footer className="xp-foot">
        <span className="xp-brush sm">Fluxion</span>
        <span>© 2026 — Into the wild render.</span>
      </footer>
    </div>
  );
}

// Rough hand-painted section edge (SVG). `flip` points it the other way.
function BrushEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg className={`xp-brushedge ${flip ? "flip" : ""}`} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,40 C120,10 240,55 360,38 C500,18 560,52 700,44 C840,36 900,8 1040,26 C1180,44 1280,20 1440,36 L1440,60 L0,60 Z" />
    </svg>
  );
}

/* --------------------------------------------------------------- STYLES ----- */
const THEME_CSS = `
.tp { --edge: 0; }
.tp * { box-sizing: border-box; }

/* ===== AZURE ============================================================== */
.tp-azure { background: #ffffff; color: #0b1b3a; font-family: "Space Grotesk", system-ui, sans-serif; }
.tp-azure .az-head { display:flex; align-items:center; justify-content:space-between; padding:22px 40px; border-bottom:1px solid #e4ebf5; position:sticky; top:52px; background:#fff; }
.tp-azure .az-logo { font-weight:700; font-size:20px; letter-spacing:-0.02em; color:#0b1b3a; }
.tp-azure .az-logo span { color:#1f6fe0; }
.tp-azure .az-nav { display:flex; align-items:center; gap:26px; font-size:14px; color:#4a5b7a; text-transform:uppercase; letter-spacing:0.06em; }
.tp-azure .az-nav span { cursor:default; }
.tp-azure .az-btn { background:#1f6fe0; color:#fff; border:none; border-radius:999px; padding:10px 20px; font-family:inherit; font-weight:500; font-size:14px; cursor:pointer; }
.tp-azure .az-btn.ghost { background:transparent; color:#1f6fe0; border:1px solid #bcd3f5; }
.tp-azure .az-hero { max-width:900px; margin:0 auto; padding:96px 40px 70px; text-align:center; }
.tp-azure .az-eyebrow { color:#1f6fe0; text-transform:uppercase; letter-spacing:0.16em; font-size:13px; margin:0 0 18px; }
.tp-azure .az-hero h1 { font-size:clamp(40px,7vw,76px); line-height:1.02; margin:0; font-weight:700; letter-spacing:-0.03em; color:#0b1b3a; }
.tp-azure .az-hero h1 span { color:#1f6fe0; }
.tp-azure .az-sub { max-width:560px; margin:24px auto 0; color:#54648a; font-family:"Inter",sans-serif; font-size:17px; line-height:1.6; font-weight:300; }
.tp-azure .az-cta { display:flex; gap:14px; justify-content:center; margin-top:34px; }
.tp-azure .az-grid { max-width:1080px; margin:0 auto; padding:20px 40px 80px; display:grid; grid-template-columns:repeat(4,1fr); gap:22px; }
.tp-azure .az-card { border:1px solid #e4ebf5; border-radius:16px; padding:16px; transition:box-shadow .2s,transform .2s; }
.tp-azure .az-card:hover { box-shadow:0 14px 40px -18px rgba(31,111,224,.4); transform:translateY(-3px); }
.tp-azure .az-thumb { aspect-ratio:16/10; border-radius:10px; background:linear-gradient(135deg,#e8f0fe,#cfe0fb); }
.tp-azure .az-card h3 { margin:14px 0 2px; font-size:18px; color:#0b1b3a; }
.tp-azure .az-card p { margin:0; font-family:"Inter",sans-serif; font-size:13px; color:#6b7aa9; }
.tp-azure .az-link { display:inline-block; margin-top:10px; color:#1f6fe0; font-size:13px; text-transform:uppercase; letter-spacing:0.06em; }
.tp-azure .az-app { background:#f5f8fd; border-top:1px solid #e4ebf5; padding:70px 40px; }
.tp-azure .az-app h2 { text-align:center; font-size:32px; margin:0 0 34px; color:#0b1b3a; letter-spacing:-0.02em; }
.tp-azure .az-appwrap { max-width:980px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.tp-azure .az-panel { background:#fff; border:1px solid #e4ebf5; border-radius:16px; padding:22px; }
.tp-azure .az-panel-title { margin:0 0 16px; text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:#1f6fe0; }
.tp-azure .az-stat-row { display:flex; gap:14px; }
.tp-azure .az-stat-row div { flex:1; background:#f5f8fd; border-radius:12px; padding:16px; text-align:center; }
.tp-azure .az-stat-row b { display:block; font-size:26px; color:#0b1b3a; }
.tp-azure .az-stat-row span { font-family:"Inter",sans-serif; font-size:12px; color:#6b7aa9; }
.tp-azure .az-lib { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.tp-azure .az-lib span { aspect-ratio:1; border-radius:10px; background:linear-gradient(135deg,#e8f0fe,#cfe0fb); }
.tp-azure .az-foot { display:flex; justify-content:space-between; padding:26px 40px; border-top:1px solid #e4ebf5; font-family:"Inter",sans-serif; font-size:13px; color:#6b7aa9; }
.tp-azure .az-foot span:first-child { color:#0b1b3a; font-weight:600; font-family:"Space Grotesk"; }

/* ===== EDITORIAL ========================================================== */
.tp-editorial { position:relative; font-family:"Inter",sans-serif; color:#1a1a1a; overflow:hidden; padding:26px; min-height:100vh; }
.tp-editorial .ed-blur { position:absolute; inset:-60px; z-index:0;
  background:
    radial-gradient(40% 50% at 20% 20%, #ffd9c2, transparent 70%),
    radial-gradient(45% 55% at 80% 15%, #ffc7d9, transparent 70%),
    radial-gradient(55% 60% at 60% 85%, #ffe4b8, transparent 70%),
    radial-gradient(50% 60% at 15% 80%, #f7d7ff, transparent 70%),
    linear-gradient(135deg,#fff3e9,#ffe9f0);
  filter:blur(40px); }
.tp-editorial .ed-glass { position:relative; z-index:1; max-width:1160px; margin:0 auto; border-radius:28px;
  background:rgba(255,255,255,.55); backdrop-filter:blur(24px) saturate(1.3); -webkit-backdrop-filter:blur(24px) saturate(1.3);
  border:1px solid rgba(255,255,255,.7); box-shadow:0 40px 120px -40px rgba(120,60,40,.4); padding:0 0 40px; overflow:hidden; }
.tp-editorial .ed-head { display:flex; align-items:center; justify-content:space-between; padding:22px 36px; }
.tp-editorial .ed-logo { font-family:"Archivo Black",sans-serif; font-size:20px; color:#111; }
.tp-editorial .ed-logo span { color:#c8663a; }
.tp-editorial .ed-nav { display:flex; align-items:center; gap:24px; font-size:14px; color:#555; }
.tp-editorial .ed-pill { background:#111; color:#fff; border:none; border-radius:999px; padding:10px 18px; font-family:inherit; font-size:14px; cursor:pointer; }
.tp-editorial .ed-pill.big { padding:14px 26px; font-size:15px; margin-top:26px; }
.tp-editorial .ed-hero { display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:center; padding:40px 36px 60px; }
.tp-editorial .ed-kick { text-transform:uppercase; letter-spacing:0.2em; font-size:12px; color:#c8663a; margin:0 0 18px; }
.tp-editorial .ed-hero h1 { font-family:"Archivo Black",sans-serif; font-size:clamp(38px,5.5vw,68px); line-height:1.02; margin:0; color:#141414; }
.tp-editorial .ed-sub { max-width:440px; margin:22px 0 0; color:#5c5c5c; font-size:16px; line-height:1.6; font-weight:300; }
.tp-editorial .ed-hero-card { background:#fff; border-radius:22px; box-shadow:0 30px 60px -24px rgba(120,60,40,.5); padding:14px; }
.tp-editorial .ed-photo { aspect-ratio:4/5; border-radius:16px; background:
  radial-gradient(60% 50% at 40% 35%, #ffcf9e, transparent 70%),
  linear-gradient(150deg,#f3894e,#c8452f 60%,#7a2a20); }
.tp-editorial .ed-photo-meta { display:flex; align-items:center; gap:12px; padding:14px 8px 4px; }
.tp-editorial .ed-photo-meta b { display:block; font-family:"Archivo Black"; font-size:15px; }
.tp-editorial .ed-photo-meta small { color:#888; font-size:12px; }
.tp-editorial .ed-photo-meta div { flex:1; }
.tp-editorial .ed-heart,.tp-editorial .ed-cart { width:36px; height:36px; border-radius:999px; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; }
.tp-editorial .ed-zig { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; padding:34px 36px; }
.tp-editorial .ed-zig.flip .ed-zig-photo { order:2; }
.tp-editorial .ed-zig-photo { aspect-ratio:16/11; border-radius:20px; background:
  radial-gradient(50% 60% at 30% 30%, #ffe1b0, transparent 70%),
  linear-gradient(140deg,#ffb27a,#e8683f); box-shadow:0 24px 50px -26px rgba(120,60,40,.5); }
.tp-editorial .ed-zig-text h2 { font-family:"Archivo Black"; font-size:32px; margin:0 0 12px; color:#161616; }
.tp-editorial .ed-zig-text p { color:#5c5c5c; font-size:15px; line-height:1.6; font-weight:300; margin:0; }
.tp-editorial .ed-arrow { display:inline-block; margin-top:16px; font-weight:600; font-size:14px; border-bottom:2px solid #111; padding-bottom:2px; }
.tp-editorial .ed-app { padding:34px 36px 10px; }
.tp-editorial .ed-app h2 { font-family:"Archivo Black"; font-size:28px; margin:0 0 22px; }
.tp-editorial .ed-lib { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.tp-editorial .ed-tile { position:relative; aspect-ratio:1; border-radius:16px; background:linear-gradient(140deg,#ffd0a6,#f08a54); box-shadow:0 16px 34px -20px rgba(120,60,40,.5); }
.tp-editorial .ed-tile-heart { position:absolute; top:8px; right:8px; width:26px; height:26px; border-radius:999px; background:rgba(255,255,255,.85); display:flex; align-items:center; justify-content:center; font-size:12px; color:#c8452f; }
.tp-editorial .ed-foot { display:flex; justify-content:space-between; align-items:center; padding:28px 36px 6px; font-size:13px; color:#7a7a7a; }

/* ===== EXPEDITION ========================================================= */
.tp-expedition { background:#20262b; color:#e7ebe6; font-family:"Inter",sans-serif; }
.tp-expedition .xp-head { display:flex; align-items:center; justify-content:space-between; padding:22px 44px; position:relative; z-index:3; }
.tp-expedition .xp-logo { font-family:"Caveat",cursive; font-size:34px; color:#f2ede4; line-height:1; }
.tp-expedition .xp-nav { display:flex; align-items:center; gap:26px; font-size:12px; letter-spacing:0.18em; color:#c6cdc4; }
.tp-expedition .xp-navbtn { color:#d98a4f; border:1px solid #d98a4f; padding:8px 14px; }
.tp-expedition .xp-hero { position:relative; }
.tp-expedition .xp-mtn { position:absolute; inset:0; z-index:0; }
.tp-expedition .xp-mtn svg { width:100%; height:100%; display:block; }
.tp-expedition .xp-hero-inner { position:relative; z-index:2; max-width:760px; padding:90px 44px 150px; }
.tp-expedition .xp-tag { letter-spacing:0.24em; font-size:11px; color:#d98a4f; margin:0 0 20px; }
.tp-expedition .xp-brush { font-family:"Caveat",cursive; font-weight:700; font-size:clamp(52px,9vw,104px); line-height:.9; margin:0; color:#f4efe6; }
.tp-expedition .xp-brush.sm { font-size:30px; }
.tp-expedition .xp-sub { max-width:460px; margin:20px 0 0; color:#c6cdc4; font-size:16px; line-height:1.6; font-weight:300; }
.tp-expedition .xp-underlink { display:inline-block; margin-top:24px; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#f2ede4; border-bottom:1px solid #d98a4f; padding-bottom:4px; }
.tp-expedition .xp-brushedge { position:absolute; left:0; right:0; bottom:-1px; width:100%; height:56px; z-index:2; display:block; fill:#f4f1ea; }
.tp-expedition .xp-brushedge.flip { transform:rotate(180deg); top:-1px; bottom:auto; fill:#20262b; }
.tp-expedition .xp-routes { background:#f4f1ea; color:#2a2f2b; padding:74px 44px; position:relative; }
.tp-expedition .xp-side { position:absolute; left:14px; top:120px; transform:rotate(180deg); writing-mode:vertical-rl; letter-spacing:0.3em; font-size:11px; color:#9aa39a; }
.tp-expedition .xp-side.light { color:#7f8a86; }
.tp-expedition .xp-serif { font-family:"Playfair Display",serif; font-weight:800; font-size:clamp(30px,4vw,46px); margin:0 0 34px; color:#22271f; }
.tp-expedition .xp-serif.light { color:#f4efe6; }
.tp-expedition .xp-route-list { max-width:820px; }
.tp-expedition .xp-route { display:flex; align-items:center; gap:22px; padding:20px 6px; border-top:1px solid #d9d3c6; }
.tp-expedition .xp-route:last-child { border-bottom:1px solid #d9d3c6; }
.tp-expedition .xp-route b { font-family:"Playfair Display",serif; font-size:30px; color:#c07a3e; min-width:52px; }
.tp-expedition .xp-route div { flex:1; display:flex; flex-direction:column; }
.tp-expedition .xp-route-t { font-family:"Playfair Display",serif; font-size:20px; color:#22271f; }
.tp-expedition .xp-route-d { font-size:13px; color:#6f776d; }
.tp-expedition .xp-route-arrow { color:#c07a3e; font-size:20px; }
.tp-expedition .xp-app { background:#20262b; position:relative; padding:0 0 70px; }
.tp-expedition .xp-app-inner { position:relative; padding:80px 44px 0; }
.tp-expedition .xp-lib { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; max-width:820px; margin-top:8px; }
.tp-expedition .xp-lib span { aspect-ratio:16/10; border-radius:4px; background:linear-gradient(150deg,#3c4a44,#2b3a33); border:1px solid #46534c; }
.tp-expedition .xp-foot { display:flex; justify-content:space-between; align-items:center; padding:28px 44px; border-top:1px solid #333b3a; font-size:13px; color:#9aa39a; }

@media (max-width:760px){
  .tp-azure .az-grid{grid-template-columns:repeat(2,1fr);}
  .tp-azure .az-appwrap{grid-template-columns:1fr;}
  .tp-azure .az-nav span,.tp-editorial .ed-nav span,.tp-expedition .xp-nav span{display:none;}
  .tp-editorial .ed-hero,.tp-editorial .ed-zig{grid-template-columns:1fr;}
  .tp-editorial .ed-zig.flip .ed-zig-photo{order:0;}
  .tp-editorial .ed-lib{grid-template-columns:repeat(2,1fr);}
  .tp-expedition .xp-lib{grid-template-columns:repeat(2,1fr);}
}
@media (prefers-reduced-motion: reduce){
  .tp-azure .az-card{transition:none;}
}
`;
