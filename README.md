# CalcSwap

A campus marketplace for buying and selling graphing calculators. Sellers list a
calculator and how they want to get paid (Venmo, PayPal, Cash App, and/or
Zelle). Buyers pay the seller directly through that app — CalcSwap never
touches the money — then the seller confirms payment and gets a shipping
label to send the item.

There are no user accounts. Each listing and order gets a private, unguessable
link (a "manage" link for sellers, a status link for buyers) instead of a login.

## Setup

1. Install dependencies: `npm install`
2. Create a [Supabase](https://supabase.com) project, then run
   [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor to create the
   `listings` and `orders` tables.
3. Copy `.env.example` to `.env.local` (or set these in your host) and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — the project's service role key (server-only, never exposed to the browser)
   - `SHIPPO_API_KEY` (optional) — a [Shippo](https://goshippo.com) API key. When set,
     "Confirm payment received" purchases a real USPS label the seller can print for
     free (Shippo bills your account for postage). Without it, the app issues a clearly
     marked demo PDF label so the whole flow still works end to end.
4. Run the dev server: `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

## How it works

- **Sell** (`/sell`) — a seller lists a calculator with a price, condition, at
  least one payment handle, and a ship-from address. On submit they get a
  one-time "manage" link (`/listing/[id]?seller_token=...`) that lets them see
  offers and manage the listing later.
- **Browse** (`/`) — buyers browse available listings.
- **Buy** (`/checkout/[id]`) — a buyer picks a payment method the seller
  accepts and enters their shipping address, which creates an order and a
  private status link (`/orders/[id]?token=...`).
- **Pay** — the order page deep-links into Venmo/PayPal/Cash App (or shows
  manual Zelle instructions) with the amount prefilled, then the buyer marks
  "I've sent the payment."
- **Confirm & ship** — the seller checks their payment app, confirms receipt,
  and CalcSwap generates a shipping label (real, free postage via Shippo if
  configured; otherwise a demo label). The seller marks the order shipped, and
  the buyer marks it received once it arrives.

## Tech

Next.js (App Router) + Tailwind CSS, with Supabase (Postgres) for storage and
`pdf-lib` for the demo shipping label fallback.
