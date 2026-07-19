# Options Trading Coach

An educational options-trading app: real-ish-time market data, a rule-based entry signal engine, an AI coach, a
strategy builder, and a $100,000 **paper trading** (simulated money) account. No real orders are ever sent to a
broker.

## Features

- **Auth** — email/password via Supabase, each new account is seeded with $100,000 in paper cash.
- **Dashboard** — a watchlist with auto-refreshing quotes and entry-signal badges.
- **Symbol page** — quote, price chart, full options chain, entry analysis, and a paper buy/sell form.
- **Portfolio** — open positions with live unrealized P&L, cash balance, and order history.
- **Strategy builder** — templated multi-leg strategies (spreads, iron condor, straddle, ...) with instant max
  profit/loss/breakeven math and AI feedback on save.
- **AI guide** — a persistent chat coach for learning concepts and getting feedback on ideas. It never tells you
  what to trade.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4, Supabase (Postgres + Auth), Polygon.io (market data), OpenAI
(AI coach).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the
   SQL editor (Project → SQL Editor → New query → paste → Run). This creates all tables, row-level security
   policies, and a trigger that funds new signups with $100,000 in paper cash.

   If this project previously had the old Slack-workflow-generator tables (`leads`, `workflows`,
   `workflow_shares`), you can drop them first — see the comment at the top of `supabase/schema.sql`.

3. **Get API keys:**
   - Supabase: Project Settings → API → `Project URL`, `anon public` key, `service_role` key.
   - [Polygon.io](https://polygon.io/dashboard/api-keys): a free key works but returns data delayed ~15 minutes;
     an Options-tier paid plan is needed for real-time quotes and chains.
   - [OpenAI](https://platform.openai.com/api-keys): powers the AI coach and strategy feedback.

4. **Configure environment variables** — copy `.env.example` to `.env.local` and fill in the values from step 3:
   ```bash
   cp .env.example .env.local
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000), sign up, and you'll land on the dashboard with a funded
   paper account.

## Notes

- "Real-time" quotes are implemented as 5–15 second client-side polling of server API routes that call Polygon,
  not a raw WebSocket feed — this keeps the Polygon API key server-side only and works reliably on serverless
  hosting. Set `POLYGON_REALTIME=true` once you're on a paid real-time Polygon plan to change the UI's
  "delayed"/"live" label.
- Paper trading currently supports long positions only (buy to open, sell to close). Short selling and margin
  aren't modeled — a deliberate simplification for a beginner-focused, educational tool.
- The entry-signal engine and AI coach are educational tools, not financial advice. Every surface that uses them
  says so.

## Deploy

Deploy on [Vercel](https://vercel.com/new) or any Next.js host — just set the same environment variables there.
