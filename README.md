This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## First 90 Days — Results Operating System

A Vercel-deployable system that turns the "First 90 days" results mandate into a
live scorecard, automatically flags the **major issues**, and hands back
**prioritized action steps**.

- **Dashboard:** [`/scorecard`](app/scorecard/page.tsx) — enter the current read
  for each result; the system scores every metric green / amber / red, rolls it
  up into an overall readiness score, and lists the major issues worst-first,
  each with owner, time horizon, and concrete steps. State is saved to the
  browser (localStorage); no backend or env vars required.
- **Engine:** [`app/_lib/scorecard/engine.ts`](app/_lib/scorecard/engine.ts) —
  pure, dependency-free scoring and issue-detection logic.
- **Plan definition:** [`app/_lib/scorecard/model.ts`](app/_lib/scorecard/model.ts)
  — the four mandate results broken into measurable metrics with targets,
  red/amber thresholds, and pre-authored remediation.
- **API:** `POST /api/scorecard` with `{ "values": { "<metricId>": number | boolean } }`
  returns the full assessment (readiness, per-result health, ranked issues +
  actions). `GET /api/scorecard` returns the plan definition to report against.

The four tracked results:

1. **Operating cadence & scorecards** — every department on one scorecard, owned by this person.
2. **Margin-expansion plan** — CEO-approved, with the top 3–5 levers in motion.
3. **AI-enablement roadmap** — all departments covered, first 2–3 automations shipped and measured.
4. **Retention read** — clear driver analysis, first improvements shipped.

### Deploy on Vercel (connect the `dustinfenton89` account)

The app builds and deploys with **zero environment variables** (the Slack
generator's Supabase/OpenAI features stay dormant until their keys are set).

1. Log in to [vercel.com](https://vercel.com) as **dustinfenton89** — the account
   that owns the deployment is whichever one is signed in here. Confirm the
   avatar/team in the top-left is the `dustinfenton89` account before continuing.
2. **Add New… → Project**, then import
   `dustinfenton89-eng/slack-workflow-generator`. (If the repo isn't listed,
   install/authorize the Vercel GitHub app for that org under the
   `dustinfenton89` account.)
3. Framework preset auto-detects **Next.js**. No env vars are needed for the
   Results OS. Click **Deploy**.
4. Open `/scorecard` on the deployed URL.

> Which Vercel account a repo deploys under is controlled entirely from the
> Vercel dashboard by the logged-in user — it can't be set from this repo. Do
> step 1 as dustinfenton89 to guarantee the deployment lands in that account.


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
