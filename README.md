# CalcSwap

A buyback site for graphing calculators. Students pick their model and
condition from a catalog, get an instant fixed payout quote, ship it to us
free, and get paid via Venmo, PayPal, Cash App, Zelle, or Stripe once it's
checked in.

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
   - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (optional) — a PayPal REST app's credentials, from
     [developer.paypal.com](https://developer.paypal.com/dashboard/applications). Make sure
     **Payouts** is enabled on the underlying PayPal business account, or payout calls will fail.
     Without these, PayPal payouts will error when an admin tries to send one — see below.
   - `PAYPAL_API_BASE` — defaults to the sandbox API; set to `https://api-m.paypal.com` to send
     real, live money.
4. Edit the buy prices in [`app/_lib/catalog.ts`](app/_lib/catalog.ts) — the shipped values are
   placeholders, not real market rates.
5. Run the dev server: `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

## How it works

- **Get a quote** (`/`) — a student picks their calculator model and condition
  from a fixed catalog and sees the payout instantly, computed server-side
  from `catalog.ts` (never trusted from the client).
- **Submit** — they enter their name/email, which payout method to use
  (Venmo/PayPal/Cash App/Zelle/Stripe) and the handle to send it to, and the
  address they're shipping from. This creates a trade-in and immediately
  issues a free shipping label to our receiving address.
- **Ship** (`/trade-ins/[id]?token=...`) — the seller's private status page:
  download/print the label, mark it shipped, or cancel while it's still
  pending.
- **Review & pay** (`/admin`, password-gated) — once the device arrives, an
  admin marks it received. From there:
  - **PayPal** payouts are sent automatically: the admin clicks "Send PayPal
    payout," which calls the PayPal Payouts API to send money straight to the
    seller's PayPal email, then marks the trade-in paid and records the
    batch/item id for an audit trail. A "Mark paid manually" fallback is still
    there in case the automated send fails or was already handled another way.
  - **Venmo, Cash App, Zelle, and Stripe** stay manual: the admin sends the
    money by hand (the dashboard deep-links into Venmo/Cash App with the
    amount prefilled where that's supported), then clicks "Mark paid."
  - An admin can also reject a submission (e.g. condition doesn't match) with
    a note shown to the seller.

**Only PayPal payouts are automated.** Venmo, Cash App, Zelle, and Stripe have
no API for a business to push money to an arbitrary handle without the
recipient first onboarding (Stripe Connect) or without an unofficial/consumer
integration, so those stay a manual step for whoever runs `/admin`. PayPal is
the exception — its Payouts API sends directly to a PayPal email address with
no recipient onboarding required.

**Shipping labels can't be funded through the app via PayPal.** PayPal has no
public API for buying postage, so the actual label is still purchased through
Shippo (or issued as a demo PDF without a `SHIPPO_API_KEY`) — that part is
unchanged. If you want your label spend to come out of PayPal instead of a
credit card, that's a one-time setting in **your Shippo account's own billing
page** (Shippo will invoice and charge your linked PayPal), not something this
app controls per label.

## Tech

Next.js (App Router) + Tailwind CSS, with Supabase (Postgres) for storage and
`pdf-lib` for the demo shipping label fallback.
