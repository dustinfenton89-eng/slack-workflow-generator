"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildPaymentLink } from "../_lib/paymentLinks";
import { formatCents, type TradeIn } from "../_lib/types";

const STATUS_LABELS: Record<TradeIn["status"], string> = {
  awaiting_shipment: "Awaiting shipment",
  shipped: "Shipped",
  received: "Received",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function AdminDashboard({ tradeIns }: { tradeIns: TradeIn[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    if (status === "rejected") {
      const reason = prompt("Reason for rejecting this trade-in (shown to the seller):");
      if (reason === null) return;
      await patch(id, status, reason);
      return;
    }
    await patch(id, status);
  }

  async function patch(id: string, status: string, adminNotes?: string) {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/trade-ins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoadingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const active = tradeIns.filter((t) => !["paid", "rejected", "cancelled"].includes(t.status));
  const closed = tradeIns.filter((t) => ["paid", "rejected", "cancelled"].includes(t.status));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Trade-in admin</h1>
        <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Log out
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        Active ({active.length})
      </h2>
      <div className="grid gap-3">
        {active.length === 0 && <p className="text-sm text-slate-500">Nothing in progress.</p>}
        {active.map((t) => (
          <TradeInRow
            key={t.id}
            tradeIn={t}
            loading={loadingId === t.id}
            onUpdate={(status) => updateStatus(t.id, status)}
          />
        ))}
      </div>

      {closed.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            History ({closed.length})
          </h2>
          <div className="grid gap-3">
            {closed.map((t) => (
              <TradeInRow key={t.id} tradeIn={t} loading={false} onUpdate={() => {}} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TradeInRow({
  tradeIn,
  loading,
  onUpdate,
}: {
  tradeIn: TradeIn;
  loading: boolean;
  onUpdate: (status: string) => void;
}) {
  const payLink =
    tradeIn.status === "received"
      ? buildPaymentLink(
          tradeIn.payment_method,
          tradeIn.payment_handle,
          (tradeIn.payout_cents / 100).toFixed(2),
          `CalcSwap payout ${tradeIn.id.slice(0, 8)}`
        )
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {tradeIn.brand} {tradeIn.model} · {tradeIn.condition} ·{" "}
            {formatCents(tradeIn.payout_cents)}
          </p>
          <p className="text-slate-500">
            {tradeIn.seller_name} ({tradeIn.seller_email}) · {STATUS_LABELS[tradeIn.status]}
          </p>
        </div>
        <a href={`/trade-ins/${tradeIn.id}?token=${tradeIn.seller_token}`} className="text-indigo-600 hover:underline">
          View seller page
        </a>
      </div>

      {tradeIn.tracking_number && (
        <p className="mt-2 text-slate-600">
          Tracking: <span className="font-mono">{tradeIn.tracking_number}</span> ({tradeIn.carrier})
        </p>
      )}

      {tradeIn.status === "received" && payLink && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="text-amber-800">
            Send {formatCents(tradeIn.payout_cents)} to {tradeIn.payment_handle} via{" "}
            {tradeIn.payment_method}, then mark paid.
          </p>
          {payLink.href && (
            <a
              href={payLink.href}
              className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              {payLink.label}
            </a>
          )}
        </div>
      )}

      {tradeIn.admin_notes && tradeIn.status === "rejected" && (
        <p className="mt-2 text-red-600">Reason: {tradeIn.admin_notes}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {tradeIn.status === "shipped" && (
          <button
            onClick={() => onUpdate("received")}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Mark received
          </button>
        )}
        {tradeIn.status === "received" && (
          <button
            onClick={() => onUpdate("paid")}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Mark paid
          </button>
        )}
        {(tradeIn.status === "awaiting_shipment" ||
          tradeIn.status === "shipped" ||
          tradeIn.status === "received") && (
          <button
            onClick={() => onUpdate("rejected")}
            disabled={loading}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}
