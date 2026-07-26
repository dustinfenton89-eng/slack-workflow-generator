# CalcSwap

A buyback site for graphing calculators. Students pick their model and
condition from a catalog, get an instant fixed payout quote, ship it to us
free, and get paid via Venmo, PayPal, Cash App, or Zelle once it's checked in.

There's no buyer-facing marketplace — the site itself is the only buyer, at
prices it sets. There are also no user accounts: each trade-in gets a
private, unguessable status link instead of a login.

## Setup

1. Install dependencies: `npm install`
2. Create a [Supabase](https://supabase.com) project, then run
   [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor to create the
   `trade_ins` table.
3. Copy `.env.example` to `.env.local` (or set these in your host) and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — your Supabase project's URL and service role key (server-only, never exposed to the browser)
   - `ADMIN_PASSWORD` — password for the `/admin` dashboard, where you confirm received devices and mark payouts sent
   - `SHIPPO_API_KEY` (optional) — a [Shippo](https://goshippo.com) API key. When set, submitting a
     trade-in purchases a real, prepaid USPS label the seller can print for free (Shippo bills your
     account for postage). Without it, the app issues a clearly marked demo PDF label so the whole
     flow still works end to end.
   - `WAREHOUSE_*` — the address sellers ship their calculator to. Required once `SHIPPO_API_KEY`
     is set, since a real label needs a real destination.
4. Edit the buy prices in [`app/_lib/catalog.ts`](app/_lib/catalog.ts) — the shipped values are
   placeholders, not real market rates.
5. Run the dev server: `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

## How it works

- **Get a quote** (`/`) — a student picks their calculator model and condition
  from a fixed catalog and sees the payout instantly, computed server-side
  from `catalog.ts` (never trusted from the client).
- **Submit** — they enter their name/email, which payout method to use
  (Venmo/PayPal/Cash App/Zelle) and the handle to send it to, and the address
  they're shipping from. This creates a trade-in and immediately issues a
  free shipping label to our receiving address.
- **Ship** (`/trade-ins/[id]?token=...`) — the seller's private status page:
  download/print the label, mark it shipped, or cancel while it's still
  pending.
- **Review & pay** (`/admin`, password-gated) — once the device arrives, an
  admin marks it received, manually sends the payout through their own
  Venmo/PayPal/Cash App/Zelle account (the dashboard deep-links into the right
  app with the amount prefilled), then marks it paid. An admin can also reject
  a submission (e.g. condition doesn't match) with a note shown to the seller.

**Payout methods aren't automated.** Venmo, Cash App, and Zelle have no public
API for a business to send money to an arbitrary handle, so payouts are sent
manually by whoever runs `/admin`, then marked paid in the dashboard. PayPal
does have a real Payouts API if you want to automate that one path later.

## Tech

Next.js (App Router) + Tailwind CSS, with Supabase (Postgres) for storage and
`pdf-lib` for the demo shipping label fallback.
