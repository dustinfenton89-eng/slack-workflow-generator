"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, Disclaimer, PageShell } from "../../_components/ui";
import { errorMessage } from "../../_lib/errorMessage";
import type { OptionContract } from "../../_lib/polygon";

type Position = {
  id: string;
  underlying: string;
  option_symbol: string | null;
  contract_type: "call" | "put" | "stock";
  strike: number | null;
  expiration: string | null;
  side: string;
  quantity: number;
  avg_price: number;
};

type Order = {
  id: string;
  underlying: string;
  contract_type: string;
  side: string;
  quantity: number;
  fill_price: number;
  status: string;
  created_at: string;
};

type Account = { id: string; cash_balance: number; created_at: string };

export default function PortfolioPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketValues, setMarketValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/paper/account");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccount(data.account);
      setPositions(data.positions);
      setOrders(data.orders);
      priceCurrentPositions(data.positions);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function priceCurrentPositions(positions: Position[]) {
    const values: Record<string, number> = {};
    for (const pos of positions) {
      try {
        if (pos.contract_type === "stock") {
          const res = await fetch(`/api/market/quote?ticker=${pos.underlying}`);
          const data = await res.json();
          if (res.ok && data.price != null) values[pos.id] = data.price;
        } else if (pos.expiration) {
          const res = await fetch(`/api/market/chain?ticker=${pos.underlying}&expiration=${pos.expiration}`);
          const data: { chain?: OptionContract[] } = await res.json();
          const contract = data.chain?.find(
            (c) => c.symbol === pos.option_symbol || (c.strike === pos.strike && c.contractType === pos.contract_type)
          );
          if (contract) {
            const mid = contract.bid != null && contract.ask != null ? (contract.bid + contract.ask) / 2 : contract.last;
            if (mid != null) values[pos.id] = mid;
          }
        }
      } catch {
        // Leave this position unpriced; P&L just won't show for it this refresh.
      }
    }
    setMarketValues((prev) => ({ ...prev, ...values }));
  }

  const totalUnrealized = positions.reduce((sum, pos) => {
    const current = marketValues[pos.id];
    if (current == null) return sum;
    const multiplier = pos.contract_type === "stock" ? 1 : 100;
    return sum + (current - pos.avg_price) * pos.quantity * multiplier;
  }, 0);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold text-zinc-100">Portfolio</h1>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {account && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-zinc-500">Cash balance</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">${Number(account.cash_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">Open positions</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{positions.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">Unrealized P&L</p>
            <p className={`mt-1 text-2xl font-bold ${totalUnrealized >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300">Open positions</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-1.5 pr-3">Symbol</th>
                <th className="py-1.5 pr-3">Type</th>
                <th className="py-1.5 pr-3">Qty</th>
                <th className="py-1.5 pr-3">Avg price</th>
                <th className="py-1.5 pr-3">Current</th>
                <th className="py-1.5 pr-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const current = marketValues[pos.id];
                const multiplier = pos.contract_type === "stock" ? 1 : 100;
                const pnl = current != null ? (current - pos.avg_price) * pos.quantity * multiplier : null;
                return (
                  <tr key={pos.id} className="border-t border-zinc-800 text-zinc-300">
                    <td className="py-2 pr-3">
                      <Link href={`/symbol/${pos.underlying}`} className="text-emerald-400 hover:underline">
                        {pos.underlying}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      {pos.contract_type === "stock" ? "Stock" : `${pos.contract_type} $${pos.strike} ${pos.expiration}`}
                    </td>
                    <td className="py-2 pr-3">{pos.quantity}</td>
                    <td className="py-2 pr-3">${Number(pos.avg_price).toFixed(2)}</td>
                    <td className="py-2 pr-3">{current != null ? `$${current.toFixed(2)}` : "—"}</td>
                    <td className={`py-2 pr-3 ${pnl != null ? (pnl >= 0 ? "text-emerald-400" : "text-red-400") : ""}`}>
                      {pnl != null ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-600">
                    No open positions. Head to a symbol page to place your first paper trade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300">Order history</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-1.5 pr-3">When</th>
                <th className="py-1.5 pr-3">Symbol</th>
                <th className="py-1.5 pr-3">Side</th>
                <th className="py-1.5 pr-3">Qty</th>
                <th className="py-1.5 pr-3">Fill price</th>
                <th className="py-1.5 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-800 text-zinc-300">
                  <td className="py-2 pr-3 text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">{o.underlying}</td>
                  <td className="py-2 pr-3 capitalize">{o.side}</td>
                  <td className="py-2 pr-3">{o.quantity}</td>
                  <td className="py-2 pr-3">${Number(o.fill_price).toFixed(2)}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={o.status === "filled" ? "bullish" : "bearish"}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-600">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Disclaimer />
    </PageShell>
  );
}
