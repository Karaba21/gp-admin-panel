# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # local dev server on :3000
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # ESLint via eslint-config-next
```

No test runner is configured. If you add tests, also add `"test"` to `package.json` scripts and install the necessary dev deps.

## Environment variables

Copy `.env.local.example` to `.env.local`. All three variables are required:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The `NEXT_PUBLIC_*` variants also work as fallbacks (the code checks both). `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never expose it to the client.

## Architecture

### Two Supabase clients

- `src/lib/supabaseClient.ts` — `createServerClient()`: anon key, `no-store` cache, used for reads.
- `src/lib/supabaseAdmin.ts` — `createAdminClient()`: service role key, bypasses RLS; **only used in Server Actions and API Routes**.

All mutating operations (create/update/delete cars, storage writes, coupon writes) use the admin client. Always call `getSessionUser()` to verify auth before using the admin client in Server Actions.

### Auth flow

Auth is cookie-based with no Supabase session on the client. `loginAction` writes `sb-access-token` and `sb-refresh-token` as HttpOnly cookies. `getSessionUser()` reads the access token cookie and calls `supabase.auth.getUser(token)` to validate. The client-side `AuthProvider` calls `getSessionUser` as a Server Action on mount to populate `user`/`session` state.

### Admin page sections

`src/app/admin/page.tsx` is the single admin dashboard. It is protected client-side via `useAuth()` (shows `LoginForm` when unauthenticated). Navigation state (`agregar` / `gestionar` / `leads` / `sorteo`) lives in local state and switches between four components:

- `AutoForm` — create a car; compresses images client-side before signed-URL upload
- `AutosList` + `EditAutoModal` — list, edit, delete cars
- `CouponVerifier` — search/validate/annotate coupons via fetch to `/api/admin/coupon/*`
- `SorteoSection` — monthly raffle: load participants → pick winner → confirm winner

`src/app/admin/layout.tsx` exports `export const dynamic = 'force-dynamic'` to prevent static caching.

### API routes

`src/app/api/admin/` contains two groups:

**Coupons** (`/api/admin/coupon/*` and `/api/admin/coupons`): GET a single coupon by code, GET paginated list with filters, POST validate/unvalidate/redeem. All join `coupons_issued` with `leads`.

**Raffle** (`/api/admin/draw/*`): GET participants for a month, POST pick a random winner, POST confirm/persist winner. Confirm enforces one winner per month (409 on duplicate).

### Styling

`src/app/globals.css` contains substantial handcrafted CSS for the admin UI (navbar, cards, modals, badges, mobile nav). Many components rely on class names defined there rather than Tailwind utility classes. Tailwind is imported via `@import "tailwindcss"` and configured only through `postcss.config.mjs`.

### File uploads

`AutoForm` and `EditAutoModal` call `getUploadParams(filename)` (Server Action) to get a Supabase signed upload URL, then `PUT` the file directly to storage from the browser. Images are compressed client-side (~70% quality) via the canvas pipeline in `src/lib/imageCompression.ts`; videos are passed through unchanged. Deleting a car requires calling `deleteFileAction` for each file URL first (resolved via `storageHelpers.getFileNameFromUrl`), then `deleteAutoAction`.

### Deployment

Netlify via `netlify.toml` + `@netlify/plugin-nextjs`. Set the three env vars in the Netlify dashboard.
