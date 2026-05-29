# Lavena AI

Infant healthcare chat for parents — Next.js, Supabase, OpenRouter (Vercel AI SDK).

## Quick start

1. Copy [`.env.local.example`](.env.local.example) → `.env.local` and fill in keys.
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the Supabase SQL editor.
3. Configure Supabase Auth (below).
4. `npm install && npm run dev` → [http://localhost:3000/login](http://localhost:3000/login)

## Supabase Auth

### Redirect URLs

In **Authentication → URL configuration**, set:

- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:**
  - `http://localhost:3000/auth/callback**`
  - `http://localhost:3000/auth/confirm**`

### Google OAuth

Enable Google under **Authentication → Providers**. Users complete sign-in in the same browser via `/auth/callback`.

### Email magic links (cross-device)

Magic links must use **`/auth/confirm`** (server-side `token_hash`), not `/auth/callback` (PKCE), so links work when opened on another device or in an email app.

1. In **Authentication → Email Templates → Magic Link**, set the link to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/chat">Sign in to Lavena AI</a>
```

2. The app already sends `emailRedirectTo` to `/auth/confirm` from the login page.

## OpenRouter

- Default model: `openrouter/free` with up to **3** fallback models (OpenRouter API limit).
- Optional: `OPENROUTER_MODEL_FALLBACKS` (comma-separated, max 2 extra if you set `OPENROUTER_MODEL`).

## Troubleshooting

| Issue | What to do |
|--------|------------|
| **401** on Supabase REST | Sign in again; session may have expired. |
| **ERR_TIMED_OUT** | Check network; confirm Supabase project is not paused. |
| **PKCE code verifier not found** | Use the Magic Link template above (`/auth/confirm`); open Google OAuth in the same browser you started from. |
| Chat appears all at once | Fixed via stable stream session — restart dev server after pulling latest. |

## Docs

See [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) for schema, RLS, and chat flow.
