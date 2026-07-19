"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Disclaimer, Input, PageShell } from "../../_components/ui";
import { errorMessage } from "../../_lib/errorMessage";
import type { Quote } from "../../_lib/polygon";
import type { EntrySignal } from "../../_lib/entrySignal";

type WatchlistItem = { id: string; symbol: string };

const QUOTE_POLL_MS = 15000;

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [signals, setSignals] = useState<Record<string, EntrySignal>>({});
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) return;
    refreshQuotes(watchlist.map((w) => w.symbol));
    const interval = setInterval(() => refreshQuotes(watchlist.map((w) => w.symbol)), QUOTE_POLL_MS);
    return () => clearInterval(interval);
  }, [watchlist]);

  async function loadWatchlist() {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWatchlist(data.watchlist);
      for (const item of data.watchlist as WatchlistItem[]) {
        loadSignal(item.symbol);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refreshQuotes(symbols: string[]) {
    for (const symbol of symbols) {
      try {
        const res = await fetch(`/api/market/quote?ticker=${symbol}`);
        const data = await res.json();
        if (res.ok) setQuotes((prev) => ({ ...prev, [symbol]: data }));
      } catch {
        // Silently skip a failed tick; the next poll will retry.
      }
    }
  }

  async function loadSignal(symbol: string) {
    try {
      const res = await fetch(`/api/analysis/entry?ticker=${symbol}`);
      const data = await res.json();
      if (res.ok) setSignals((prev) => ({ ...prev, [symbol]: data }));
    } catch {
      // Non-critical; badge just stays absent.
    }
  }

  async function addSymbol(e: React.FormEvent) {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    setNewSymbol("");
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    if (res.ok) loadWatchlist();
  }

  async function removeSymbol(symbol: string) {
    await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-bold text-zinc-100">Watchlist</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Quotes refresh automatically every {QUOTE_POLL_MS / 1000}s. Entry signals are rule-based reads on trend,
        momentum, and volatility — tap a symbol for the full breakdown.
      </p>

      <form onSubmit={addSymbol} className="mt-4 flex gap-2">
        <Input
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Add a ticker, e.g. AAPL"
          className="max-w-xs"
        />
        <Button type="submit">Add</Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-zinc-500">Loading...</p>}
        {!loading && watchlist.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-400">
              Your watchlist is empty. Add a ticker above to start tracking quotes and entry signals.
            </p>
          </Card>
        )}
        {watchlist.map((item) => {
          const quote = quotes[item.symbol];
          const signal = signals[item.symbol];
          const up = (quote?.change ?? 0) >= 0;
          return (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <Link href={`/symbol/${item.symbol}`} className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-zinc-100">{item.symbol}</span>
                  {signal && <Badge tone={signal.bias === "neutral" ? "neutral" : signal.bias}>{signal.bias}</Badge>}
                </div>
                {quote ? (
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl text-zinc-100">${quote.price?.toFixed(2) ?? "—"}</span>
                    <span className={`text-sm font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {up ? "+" : ""}
                      {quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                    </span>
                    <span className="text-xs text-zinc-500">{quote.realtime ? "live" : "delayed"}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">Loading quote...</p>
                )}
              </Link>
              <Button variant="ghost" onClick={() => removeSymbol(item.symbol)}>
                Remove
              </Button>
            </Card>
          );
        })}
      </div>

      <Disclaimer />
    </PageShell>
  );
}
