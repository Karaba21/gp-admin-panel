# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

Admin panel for managing car listings, built with Next.js App Router, TypeScript, Tailwind CSS 4 and Supabase. All authenticated admin UI lives under `/admin` and is protected via Supabase Auth.

Key technologies:
- Next.js 16 (App Router, `src/app`)
- React 19
- TypeScript
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- Supabase (`@supabase/supabase-js` v2)
- Netlify deployment (via `netlify.toml` and `@netlify/plugin-nextjs`)

## Commands & workflows

All commands are run from the repo root.

### Install dependencies

```bash
npm install
```

### Local development

Runs the Next.js dev server on port 3000:

```bash
npm run dev
```

Then open `http://localhost:3000` (which immediately redirects to `/admin`).

### Production build & run

Build the app and start a production server:

```bash
npm run build
npm start
```

### Linting

ESLint is configured via `eslint.config.mjs` using `eslint-config-next` core web vitals and TypeScript presets.

Run lint:

```bash
npm run lint
```

If adding new scripts or tools, prefer wiring them through `package.json` so future agents can discover them easily.

### Tests

There is currently **no test runner configured**:
- No `test` script in `package.json`
- No Jest/Vitest/Playwright config files

If you add tests, you must also:
- Add the appropriate dev dependencies
- Add a `"test"` (and optionally `"test:watch"`) script to `package.json`

## Environment configuration

Environment variables are read from `.env.local` (for local dev) and the runtime environment (for Netlify or other deployments).

### Public environment (browser + server)

From `README.md` and `src/lib/supabaseClient.ts`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`createServerClient` will also accept the non-public variants if defined:
- `SUPABASE_URL` (falls back to `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Server-only environment (admin operations)

From `src/lib/supabaseAdmin.ts`:
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin client; must only be used in server code such as Route Handlers or Server Actions)

## High-level architecture

### Next.js App Router (`src/app`)

- `src/app/layout.tsx`
  - Root layout for the entire app.
  - Imports `./globals.css`, sets up Geist fonts, and wraps all pages in `AuthProvider` from `@/components/AuthProvider`.
  - Defines basic `metadata` (title/description) for the admin panel.

- `src/app/page.tsx`
  - Immediately redirects `/` to `/admin` using `redirect('/admin')`.

- `src/app/admin/layout.tsx`
  - Minimal layout that simply renders `{children}`.
  - Exports `export const dynamic = 'force-dynamic';` so `/admin` is always rendered dynamically (important for Supabase-backed data and auth).

- `src/app/admin/page.tsx`
  - Client component that is the main admin dashboard.
  - Uses `useAuth()` from `AuthProvider` to:
    - Show a full-screen loading state while checking the session.
    - Render `LoginForm` when there is no authenticated user.
    - Render the admin UI when `user` is present.
  - Manages the active section via local state: `agregar` (add car), `gestionar` (manage cars), `leads` (coupons/leads), `sorteo` (raffle).
  - Delegates each section to dedicated components:
    - `AdminNavbar` (top navigation + logout)
    - `AutoForm` (create car)
    - `AutosList` (list/edit/delete cars)
    - `CouponVerifier` (coupon validation/leads)
    - `SorteoSection` (monthly raffle UI)

#### Server Actions (`src/app/actions`)

- `src/app/actions/auth.ts`
  - `loginAction(formData)`
    - Uses `createServerClient` to call `supabase.auth.signInWithPassword`.
    - On success, writes `sb-access-token` and `sb-refresh-token` as HttpOnly cookies via `next/headers` `cookies()` API.
  - `logoutAction()`
    - Deletes `sb-access-token` and `sb-refresh-token` cookies.
  - `getSessionUser()`
    - Reads `sb-access-token` from cookies.
    - Uses `createServerClient` and `supabase.auth.getUser(token)` to resolve the current Supabase `user`.
    - Returns `null` on any error or missing token.

- `src/app/actions/autos.ts`
  - Uses both `createServerClient` (for reads) and `createAdminClient` (for writes and storage).
  - `getAutosAction()`
    - Reads all rows from the `Autos` table ordered by `id` desc.
    - Returns `Auto[]` (defined in `src/types/auto.ts`).
  - `deleteAutoAction(id)` / `createAutoAction(auto)` / `updateAutoAction(id, updates)`
    - All verify the current user via `getSessionUser()`.
    - Use the **admin client** to bypass RLS for table writes.
    - Call `revalidatePath('/admin')` so the admin page reflects changes.
  - `getUploadParams(filename)`
    - Authenticates via `getSessionUser()`.
    - Uses Supabase Storage admin API to generate a signed upload URL in the `autos-fotos` bucket and a corresponding public URL.
  - `deleteFileAction(filename)`
    - Authenticates via `getSessionUser()`.
    - Uses the admin client to delete objects from the `autos-fotos` bucket.

#### API Routes for coupons & raffles (`src/app/api/admin`)

All of these use `createAdminClient()` from `src/lib/supabaseAdmin.ts` and operate only on the server.

- `src/app/api/admin/coupons/route.ts` (GET)
  - Lists coupons from the `coupons_issued` table joined with `leads`.
  - Supports query params:
    - `filter` = `all` | `validated` | `unvalidated`
    - `query` for searching by coupon code or lead fields
    - `limit` for paging (default 50)
  - Returns a list formatted for the `CouponVerifier` component (flattening the joined `leads` row into a `lead` field).

- `src/app/api/admin/coupon/route.ts` (GET)
  - Fetches a single coupon by `coupon_code` (query param `code`).
  - Joins `coupons_issued` with `leads` and returns `{ found, coupon, lead }`.

- `src/app/api/admin/coupon/validate/route.ts` (POST)
  - Marks a coupon as validated (`validated = true`, `validated_at` now, `validated_by = 'admin'`).
  - Optionally updates `notes`.

- `src/app/api/admin/coupon/unvalidate/route.ts` (POST)
  - Reverts validation for a coupon (sets `validated = false` and clears `validated_at`/`validated_by`).

- `src/app/api/admin/coupon/redeem/route.ts` (POST)
  - Enforces business rules around redemption (`status` must be `issued`, not `redeemed`).
  - Updates `status` to `redeemed` and sets `redeemed_at`.

- `src/app/api/admin/draw/participants/route.ts` (GET)
  - Given a `month` query param (`YYYY-MM`), returns all **validated** coupons in that calendar month with joined lead data.

- `src/app/api/admin/draw/pick/route.ts` (POST)
  - Given `month` in the body, fetches all validated coupons for that month and picks a random winner server-side.

- `src/app/api/admin/draw/confirm/route.ts` (POST)
  - Persists the chosen winner by updating `coupons_issued` with `won = true`, `won_at` and `won_month`.
  - Enforces one winner per month (returns 409 if a winner already exists for the given month).

### Components (`src/components`)

- `AuthProvider.tsx`
  - Client-side React context for authentication.
  - On mount, calls the `getSessionUser` server action and stores `user` and `session` state.
  - Exposes `useAuth()` hook with `{ user, session, loading, signOut }`.
  - `signOut()` calls `logoutAction()`, clears local state, and performs a hard redirect to `/`.

- `AdminNavbar.tsx`
  - Top navigation for the admin page.
  - Consumes `useAuth()` to display the current user email and provide a logout button.
  - Handles both desktop tab bar and a mobile sidebar menu, and delegates section changes back up via `onSectionChange`.

- `AutoForm.tsx`
  - Client form for creating a new car.
  - Uses `compressFiles` (from `src/lib/imageCompression.ts`) to compress images client-side (~70% quality) and leave videos untouched.
  - For each file, calls `getUploadParams` to get a Supabase signed upload URL and public URL, performs a `PUT` upload, then passes the collected public URLs to `createAutoAction`.

- `AutosList.tsx`
  - Fetches current cars via `getAutosAction` on mount.
  - Renders badges for `en_oferta`, `vendido`, `reservado` and uses `Auto` type for strong typing.
  - On delete:
    - Uses `storageHelpers.getFileNameFromUrl` to resolve storage keys from public URLs.
    - Calls `deleteFileAction` for each file.
    - Calls `deleteAutoAction` to remove the DB row.
  - Integrates `EditAutoModal` (not detailed here) for updating cars and refreshes the list on save.

- `CouponVerifier.tsx`
  - Admin UI for searching, validating, and annotating coupons.
  - Talks to the coupon-related API routes listed above using `fetch`.
  - Maintains a list of recent coupons (with filters), allows editing `notes`, and triggers validate/unvalidate flows.

- `SorteoSection.tsx`
  - Admin UI for the monthly raffle.
  - Loads participants from `/api/admin/draw/participants` for a selected `month`.
  - Calls `/api/admin/draw/pick` to obtain the actual winner, then animates a "slot machine" style reveal.
  - Calls `/api/admin/draw/confirm` to persist the winner for the month.

### Libs & types (`src/lib`, `src/types`)

- `src/lib/supabaseClient.ts`
  - Factory `createServerClient()` that creates a new Supabase client per request using anon credentials.
  - Forces `fetch` with `cache: 'no-store'` to avoid stale data.
  - Reads from `SUPABASE_URL` / `SUPABASE_ANON_KEY` or their `NEXT_PUBLIC_*` fallbacks.

- `src/lib/supabaseAdmin.ts`
  - `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY`.
  - Configured with `autoRefreshToken: false` and `persistSession: false` since it is only used in server environments.

- `src/lib/imageCompression.ts`
  - Provides `compressImage` and `compressFiles` helpers implemented with a canvas pipeline.
  - Only files with `type` starting with `image/` are recompressed; others (e.g. videos) are passed through unchanged.

- `src/lib/storageHelpers.ts`
  - `getFileNameFromUrl(url)`
  - `isVideoUrl(url)` (simple extension-based detection for `.mp4`, `.webm`, `.ogg`).

- `src/types/auto.ts`
  - Defines the `Auto` interface mirroring the Supabase `Autos` table (fields like `marca`, `modelo`, `año`, `precio`, flags and `precio_oferta`).

### Styling

- `src/app/globals.css`
  - Imports Tailwind via `@import "tailwindcss";` and defines the full visual style of the admin panel (navbar, login page, cards, buttons, modals, autos list, badges, mobile nav, etc).
  - There is substantial handcrafted CSS; many components rely on these class names rather than pure Tailwind utility classes.

Tailwind configuration is minimal and handled via `postcss.config.mjs` with `"@tailwindcss/postcss"` as a plugin.

## Linting configuration

- `eslint.config.mjs`
  - Uses `eslint/config` with `nextVitals` and `nextTs` from `eslint-config-next`.
  - Overrides default ignores to only skip build outputs: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
  - `npm run lint` runs ESLint with this configuration.

If you introduce new tooling (e.g. Prettier, additional ESLint rules), ensure the configs live at the repo root so they are easy to discover.
