# Backend integration guide

This is a **frontend-only demo**. Every "server" behavior (auth, generation,
billing) is faked in the browser with `localStorage` and `setTimeout`. This guide
is the map for making it real: it lists each **seam** — a small file of functions
the UI calls — and the endpoint you'd swap in behind it.

**Golden rule:** the UI never talks to a backend directly. It only calls the
functions in `lib/*.ts`. To go live, replace the *bodies* of those functions with
real `fetch()` calls and **keep the names, arguments, and return shapes the
same**. Nothing in `app/` or `components/` needs to change.

Everything you can safely edit is marked with a `MOCK:` comment. Find them all:

```bash
grep -rn "MOCK:" lib/
```

---

## The seams (in priority order)

### 1. Video generation — `lib/api.ts`  ⭐ start here
The single place a render backend plugs in. Two functions, both async:

| Function | Called from | Replace mock with |
| --- | --- | --- |
| `generateVideo(params)` | `app/generate/page.tsx` → `onGenerate()` | `POST /api/generate`, poll the job, resolve `{ videoUrl }` |
| `refineVideo(params, refinements)` | `app/generate/page.tsx` → `regen()` | `POST /api/refine` with the prior job id + new instructions |

`params` (`GenerateParams`): `{ slug, prompt, aspect, resolution, duration, audio, images? }`
Return (`GenerateResult`): `{ videoUrl }`

The mock resolves the model's sample clip after a random delay. Swap the body for
a real request and the whole playground (progress state, preview, refine loop,
download) keeps working as-is.

### 2. Billing & the generation gate — `lib/billing.ts`
Payment methods, credit balance, and the **entitlement check** that decides
whether a user may generate.

| Function | Replace mock with |
| --- | --- |
| `getCards()` | `GET /api/billing/cards` |
| `addCard(card)` | `POST /api/billing/cards` (tokenize via Stripe/etc — never send raw PANs) |
| `removeCard(id)` | `DELETE /api/billing/cards/:id` |
| `hasPaymentMethod()` | derive from the server (subscription/credits). **Never trust the client for real billing.** |
| `getCredits()` / `addCredits(n)` | `GET /api/billing/credits` / server-side after a real payment |

The gate lives in `onGenerate()` (`app/generate/page.tsx`): if
`hasPaymentMethod()` is false the user is sent to `Profile → Payment` with a
toast, instead of generating. To require credits too, tighten that one `if`.

### 3. Auth & accounts — `lib/auth.ts`
| Function | Replace mock with |
| --- | --- |
| `isSignedIn()` | session/JWT check |
| `signIn(email)` | `POST /api/auth/login` (also wire Google in `components/auth-form.tsx`) |
| `signOut()` | `POST /api/auth/logout` |
| `getUser()` / `setUser(u)` | `GET/PATCH /api/me` |

`saveDraft`/`loadDraft`/`clearDraft` are pure UX (they preserve the generation
form across a sign-in redirect) — leave them client-side.

### 4. User content — `lib/prefs.ts`
Favorites, recently-used models, uploaded library images, settings, theme. Fine
to leave in `localStorage`, or back with a `GET/PUT /api/me/...` per group. Theme
functions are pure UI — keep them client-side.

### 5. Model catalog — `lib/models.ts`
The `MODELS` array (names, capabilities, prices, sample media). Replace
`getModels()` / `getModel(slug)` with `GET /api/models` if the catalog should be
server-driven. Media paths point at `public/models/<slug>.{mp4,jpg}`.

---

## What's mocked but has no seam yet
These are inline sample values, not functions. Swap where noted (all listed in
the README's mock table):

- Generation history + dashboard recents seed — `app/profile/page.tsx`
  (`mockHistory`), `lib/prefs.ts`
- Usage/spend chart values — `components/usage-chart.tsx` (`DEFAULT`)
- Docs endpoints & code snippets — `app/docs/page.tsx`, `components/api-docs.tsx`
- Pricing math — `components/cost-estimator.tsx`, `components/model-pricing-table.tsx`

If you want these server-driven too, lift each into a `lib/*.ts` function first
(same pattern as the seams above), then wire the endpoint.

---

## Quick checklist to go live
1. `lib/api.ts` → real generate/refine calls.
2. `lib/auth.ts` → real login/session.
3. `lib/billing.ts` → real cards/credits; enforce the gate **server-side** too.
4. (optional) `lib/prefs.ts`, `lib/models.ts` → server-backed.
5. Turn off the static export in `next.config.*` if you now need server routes.

The demo runs fully without any of this — swap seams one at a time.
