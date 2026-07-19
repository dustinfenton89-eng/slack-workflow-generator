import Link from "next/link";
import { Button, Card } from "./_components/ui";

const FEATURES = [
  {
    title: "Live market data",
    body: "Streaming-refreshed quotes, price charts, and full options chains powered by Polygon.io.",
  },
  {
    title: "Entry point analysis",
    body: "A rule-based read on trend, momentum, and implied-vs-realized volatility for every ticker — with the reasoning shown, not a black box.",
  },
  {
    title: "AI trading coach",
    body: "Ask questions, get strategy feedback, and build real understanding of options mechanics — never a buy/sell signal.",
  },
  {
    title: "Strategy builder",
    body: "Model spreads, condors, and straddles with instant max profit/loss and breakeven math.",
  },
  {
    title: "$100,000 paper account",
    body: "Practice everything with simulated money against real market prices. No real trades, ever.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
          Learn options trading with real data and zero real risk.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Real-time-ish quotes and options chains, an explainable entry-signal engine, an AI coach, and a strategy
          builder — all running against a simulated $100,000 account.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button className="px-6 py-3 text-base">Start paper trading</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="px-6 py-3 text-base">
              Sign in
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <h2 className="font-semibold text-zinc-100">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{f.body}</p>
          </Card>
        ))}
      </div>

      <p className="mx-auto max-w-2xl px-4 pb-12 text-center text-xs text-zinc-600">
        Educational tool only. All trading is simulated with fake money. Nothing in this app is financial advice or a
        recommendation to buy or sell any security.
      </p>
    </main>
  );
}
