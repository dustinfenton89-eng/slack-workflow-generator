"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "../../../_components/PriceChart";
import { Badge, Button, Card, Disclaimer, Input, PageShell, Select } from "../../../_components/ui";
import { errorMessage } from "../../../_lib/errorMessage";
import type { Quote, Bar, OptionContract } from "../../../_lib/polygon";
import type { EntrySignal } from "../../../_lib/entrySignal";

const QUOTE_POLL_MS = 5000;

type SelectedTrade =
  | { kind: "stock" }
  | { kind: "option"; contract: OptionContract };

export default function SymbolPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker || "").toUpperCase();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [signal, setSignal] = useState<EntrySignal | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [chain, setChain] = useState<OptionContract[]>([]);
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");
  const [chainLoading, setChainLoading] = useState(false);

  const [selected, setSelected] = useState<SelectedTrade>({ kind: "stock" });
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [orderStatus, setOrderStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    refreshQuote();
    loadBars();
    loadSignal();
    loadChain();
    const interval = setInterval(refreshQuote, QUOTE_POLL_MS);
    return () => clearInterval(interval);
  }, [ticker]);

  useEffect(() => {
    if (ticker && selectedExpiration) loadChain(selectedExpiration);
  }, [selectedExpiration]);

  async function refreshQuote() {
    const res = await fetch(`/api/market/quote?ticker=${ticker}`);
    const data = await res.json();
    if (res.ok) setQuote(data);
  }

  async function loadBars() {
    const res = await fetch(`/api/market/bars?ticker=${ticker}&days=180`);
    const data = await res.json();
    if (res.ok) setBars(data.bars);
  }

  async function loadSignal() {
    setSignalLoading(true);
    try {
      const res = await fetch(`/api/analysis/entry?ticker=${ticker}`);
      const data = await res.json();
      if (res.ok) setSignal(data);
    } finally {
      setSignalLoading(false);
    }
  }

  async function loadChain(expiration?: string) {
    setChainLoading(true);
    try {
      const url = expiration
        ? `/api/market/chain?ticker=${ticker}&expiration=${expiration}`
        : `/api/market/chain?ticker=${ticker}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) return;
      setChain(data.chain);
      if (!expiration) {
        const exps = Array.from(new Set<string>(data.chain.map((c: OptionContract) => c.expiration))).sort();
        setExpirations(exps);
        if (exps.length > 0) setSelectedExpiration(exps[0]);
      }
    } finally {
      setChainLoading(false);
    }
  }

  const calls = useMemo(() => chain.filter((c) => c.contractType === "call").sort((a, b) => a.strike - b.strike), [chain]);
  const puts = useMemo(() => chain.filter((c) => c.contractType === "put").sort((a, b) => a.strike - b.strike), [chain]);

  async function placeOrder() {
    setPlacing(true);
    setOrderStatus(null);
    try {
      const body =
        selected.kind === "stock"
          ? { underlying: ticker, side, contractType: "stock", quantity }
          : {
              underlying: ticker,
              side,
              contractType: selected.contract.contractType,
              quantity,
              optionSymbol: selected.contract.symbol,
              strike: selected.contract.strike,
              expiration: selected.contract.expiration,
            };

      const res = await fetch("/api/paper/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderStatus({ ok: false, message: data.error || "Order failed." });
      } else {
        setOrderStatus({
          ok: true,
          message: `Filled at $${data.fillPrice.toFixed(2)} — ${side === "buy" ? "spent" : "received"} $${data.notional.toFixed(2)}.`,
        });
      }
    } catch (err) {
      setOrderStatus({ ok: false, message: errorMessage(err) });
    } finally {
      setPlacing(false);
    }
  }

  const up = (quote?.change ?? 0) >= 0;

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{ticker}</h1>
          {quote && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl text-zinc-100">${quote.price?.toFixed(2) ?? "—"}</span>
              <span className={`text-sm font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? "+" : ""}
                {quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
              </span>
              <span className="text-xs text-zinc-500">
                {quote.realtime ? "live" : "delayed ~15min"} · updated {new Date(quote.updated).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        {signal && <Badge tone={signal.bias === "neutral" ? "neutral" : signal.bias}>{signal.bias} bias</Badge>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-300">Price (last 180 days)</h2>
            <div className="mt-3">
              <PriceChart bars={bars} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Options chain</h2>
              {expirations.length > 0 && (
                <Select
                  value={selectedExpiration}
                  onChange={(e) => setSelectedExpiration(e.target.value)}
                  className="w-auto"
                >
                  {expirations.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            {chainLoading && <p className="mt-3 text-sm text-zinc-500">Loading chain...</p>}
            {!chainLoading && chain.length === 0 && (
              <p className="mt-3 text-sm text-zinc-500">No options data available for this ticker.</p>
            )}
            {!chainLoading && chain.length > 0 && (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <ChainTable title="Calls" contracts={calls} onTrade={(c) => { setSelected({ kind: "option", contract: c }); setSide("buy"); }} />
                <ChainTable title="Puts" contracts={puts} onTrade={(c) => { setSelected({ kind: "option", contract: c }); setSide("buy"); }} />
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Entry analysis</h2>
              <Button variant="ghost" onClick={loadSignal} disabled={signalLoading}>
                {signalLoading ? "..." : "Re-analyze"}
              </Button>
            </div>
            {!signal && <p className="mt-3 text-sm text-zinc-500">Loading...</p>}
            {signal && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Badge tone={signal.bias === "neutral" ? "neutral" : signal.bias}>{signal.bias}</Badge>
                  <span className="text-xs text-zinc-500">score {signal.score}</span>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{signal.suggestedApproach}</p>
                <ul className="mt-3 grid gap-1.5 text-xs text-zinc-400">
                  {signal.reasons.map((r, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-zinc-600">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-300">Paper trade</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {selected.kind === "stock"
                ? `${ticker} shares`
                : `${ticker} ${selected.contract.expiration} $${selected.contract.strike} ${selected.contract.contractType}`}
            </p>

            <div className="mt-3 grid gap-3">
              <div className="flex gap-2">
                <Button
                  variant={selected.kind === "stock" ? "primary" : "secondary"}
                  onClick={() => setSelected({ kind: "stock" })}
                  className="flex-1"
                >
                  Stock
                </Button>
                <Button
                  variant={selected.kind === "option" ? "primary" : "secondary"}
                  className="flex-1"
                  disabled={selected.kind !== "option"}
                >
                  Option
                </Button>
              </div>
              {selected.kind === "option" && (
                <p className="text-xs text-zinc-500">Pick a contract from the chain to change this.</p>
              )}

              <div className="flex gap-2">
                <Button variant={side === "buy" ? "primary" : "secondary"} onClick={() => setSide("buy")} className="flex-1">
                  Buy
                </Button>
                <Button variant={side === "sell" ? "danger" : "secondary"} onClick={() => setSide("sell")} className="flex-1">
                  Sell
                </Button>
              </div>

              <label className="text-xs text-zinc-400">
                Quantity {selected.kind === "option" ? "(contracts)" : "(shares)"}
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-1"
                />
              </label>

              <Button onClick={placeOrder} disabled={placing}>
                {placing ? "Placing..." : `${side === "buy" ? "Buy" : "Sell"} (paper)`}
              </Button>

              {orderStatus && (
                <p className={`text-sm ${orderStatus.ok ? "text-emerald-400" : "text-red-400"}`}>{orderStatus.message}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Disclaimer />
    </PageShell>
  );
}

function ChainTable({
  title,
  contracts,
  onTrade,
}: {
  title: string;
  contracts: OptionContract[];
  onTrade: (c: OptionContract) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-zinc-500">{title}</h3>
      <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
            <tr>
              <th className="px-2 py-1.5 text-left">Strike</th>
              <th className="px-2 py-1.5 text-right">Bid</th>
              <th className="px-2 py-1.5 text-right">Ask</th>
              <th className="px-2 py-1.5 text-right">IV</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.symbol} className="border-t border-zinc-800 text-zinc-300">
                <td className="px-2 py-1.5">${c.strike}</td>
                <td className="px-2 py-1.5 text-right">{c.bid != null ? `$${c.bid.toFixed(2)}` : "—"}</td>
                <td className="px-2 py-1.5 text-right">{c.ask != null ? `$${c.ask.toFixed(2)}` : "—"}</td>
                <td className="px-2 py-1.5 text-right">{c.impliedVolatility != null ? `${(c.impliedVolatility * 100).toFixed(0)}%` : "—"}</td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => onTrade(c)} className="text-emerald-400 hover:underline">
                    Trade
                  </button>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-zinc-600">
                  No contracts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
