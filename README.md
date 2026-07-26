# Affiliate Command Center

A single-user internal tool for running and scaling an affiliate marketing business:

- **Content Generator** — turn a niche/product brief into ready-to-publish affiliate content
  (product reviews, comparison roundups, email sequences, social posts, SEO outlines) via OpenAI,
  each with a shareable public link.
- **Link Tracker** — create short trackable links (`/r/<slug>`) tagged by program/campaign; every
  click is logged (referrer, user agent, hashed IP) and redirected to the real destination URL.
- **Program & Commission Manager** — track every affiliate program you're enrolled in (network,
  commission rate, cookie duration, payment schedule, status) and log conversions against a
  program or a specific link to see lifetime and 30-day earnings.

The whole dashboard sits behind a simple password gate (see [Auth](#auth) below) since it exposes
your business data — the `/r/<slug>` redirects themselves stay public so real visitors can use them.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Environment Variables

Create a `.env.local` with:

```bash
# Supabase (service role key — server-side only, never exposed to the client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (used by the content generator)
OPENAI_API_KEY=sk-...

# Dashboard auth
DASHBOARD_PASSWORD=choose-a-strong-password
SESSION_SECRET=a-long-random-string   # used to sign session cookies + hash IPs
```

## Database Setup

Run the SQL in [`supabase/migrations/0001_affiliate_schema.sql`](./supabase/migrations/0001_affiliate_schema.sql)
against your Supabase project (SQL editor, or `supabase db push` if you use the CLI). It creates:

- `affiliate_programs` — programs you're enrolled in and their terms
- `affiliate_links` — trackable links, each with a unique `slug`
- `affiliate_clicks` — one row per click on a tracked link
- `affiliate_conversions` — manually logged commissions, tied to a link and/or program
- `affiliate_content` — generated content pieces + their public share tokens

These tables are additive and don't touch any pre-existing tables in your project. All access
happens server-side with the service role key, so no Row Level Security policies are required.

## Auth

There's no multi-user auth system — this is meant for a single operator. Signing in at `/login`
with `DASHBOARD_PASSWORD` sets an HMAC-signed, httpOnly session cookie (signed with
`SESSION_SECRET`, 7-day expiry) via `middleware.ts`, which gates `/dashboard/*` and the
programs/links/conversions/content APIs. `/r/<slug>` and `/share/content/<token>` are intentionally
left public.

## Deploy

Any Next.js host (e.g. Vercel) works. Set the environment variables above in your hosting
provider's dashboard before deploying.
