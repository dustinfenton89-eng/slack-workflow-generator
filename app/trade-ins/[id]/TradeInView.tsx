"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents, type TradeIn } from "../../_lib/types";

const STEPS: { key: TradeIn["status"]; label: string }[] = [
  { key: "awaiting_shipment", label: "Awaiting shipment" },
  { key: "shipped", label: "Shipped" },
  { key: "received", label: "Received" },
  { key: "paid", label: "Paid" },
];

function currentStepIndex(status: TradeIn["status"]) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function Timeline({ status }: { status: TradeIn["status"] }) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <p className="mt-4 text-sm font-semibold text-red-600">
        This trade-in was {status === "cancelled" ? "cancelled" : "rejected"}.
      </p>
    );
  }
  const active = currentStepIndex(status);
  return (
    <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium">
      {STEPS.map((step, i) => (
        <li key={step.key} className={i <= active ? "text-indigo-600" : "text-slate-400"}>
          {i + 1}. {step.label}
        </li>
      ))}
    </ol>
  );
}

export default function TradeInView({ tradeIn, token }: { tradeIn: TradeIn; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(path: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trade-ins/${tradeIn.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Timeline status={tradeIn.status} />
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4">
        {(tradeIn.status === "awaiting_shipment" || tradeIn.status === "shipped") && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <p className="font-semibold text-slate-700">Your free shipping label</p>
            {tradeIn.label_is_demo && (
              <p className="mt-1 text-xs text-amber-700">
                Demo mode: this is a placeholder PDF, not valid for mailing. The site
                operator needs to configure SHIPPO_API_KEY for real, free postage.
              </p>
            )}
            <p className="mt-2">
              Carrier: {tradeIn.carrier} · Tracking #:{" "}
              <span className="font-mono font-semibold">{tradeIn.tracking_number}</span>
            </p>
            {tradeIn.label_url && (
              <a
                href={tradeIn.label_url}
                download={`label-${tradeIn.id.slice(0, 8)}.pdf`}
                className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
              >
                Download label
              </a>
            )}
          </div>
        )}

        {tradeIn.status === "awaiting_shipment" && (
          <div className="flex gap-3">
            <button
              onClick={() => action("ship")}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "I've shipped it"}
            </button>
            <button
              onClick={() => action("cancel")}
              disabled={loading}
              className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Cancel trade-in
            </button>
          </div>
        )}

        {tradeIn.status === "shipped" && (
          <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            We&rsquo;ll check in your calculator once it arrives and confirm its condition.
          </p>
        )}

        {tradeIn.status === "received" && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            We&rsquo;ve received your calculator and confirmed the condition. Your{" "}
            {formatCents(tradeIn.payout_cents)} payout via {tradeIn.payment_method} is on its way.
          </p>
        )}

        {tradeIn.status === "paid" && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Paid! {formatCents(tradeIn.payout_cents)} sent to your {tradeIn.payment_method} (
            {tradeIn.payment_handle}).
          </p>
        )}

        {tradeIn.status === "rejected" && tradeIn.admin_notes && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {tradeIn.admin_notes}
          </p>
        )}
      </div>
    </div>
  );
}
