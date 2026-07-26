"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildPaymentLink } from "../../_lib/paymentLinks";
import { formatCents, type Listing, type Order } from "../../_lib/types";

const STEPS: { key: Order["status"]; label: string }[] = [
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "payment_claimed", label: "Payment sent" },
  { key: "label_created", label: "Payment confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Delivered" },
];

function currentStepIndex(status: Order["status"]) {
  if (status === "payment_confirmed") return 2;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

const METHOD_HANDLE_KEY: Record<Order["payment_method"], keyof Listing> = {
  venmo: "venmo_username",
  paypal: "paypal_username",
  cashapp: "cashapp_cashtag",
  zelle: "zelle_contact",
};

function Timeline({ status }: { status: Order["status"] }) {
  if (status === "cancelled") {
    return <p className="mt-4 text-sm font-semibold text-red-600">This order was cancelled.</p>;
  }
  const active = currentStepIndex(status);
  return (
    <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium">
      {STEPS.map((step, i) => (
        <li
          key={step.key}
          className={i <= active ? "text-indigo-600" : "text-slate-400"}
        >
          {i + 1}. {step.label}
        </li>
      ))}
    </ol>
  );
}

export default function OrderView({
  order,
  listing,
  role,
  token,
}: {
  order: Order;
  listing: Listing;
  role: "buyer" | "seller";
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(path: string, tokenField: "buyerToken" | "sellerToken") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [tokenField]: token }),
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

  const shippingAddress = (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-700">Shipping to</p>
      <p>{order.ship_to_name}</p>
      <p>{order.ship_to_address1}</p>
      {order.ship_to_address2 && <p>{order.ship_to_address2}</p>}
      <p>
        {order.ship_to_city}, {order.ship_to_state} {order.ship_to_zip}
      </p>
    </div>
  );

  return (
    <div>
      <Timeline status={order.status} />
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4">
        {role === "buyer" && (
          <>
            {order.status === "awaiting_payment" && (
              <BuyerPaymentStep
                order={order}
                listing={listing}
                loading={loading}
                onMarkPaid={() => action("mark-paid", "buyerToken")}
              />
            )}
            {order.status === "payment_claimed" && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Thanks! We&rsquo;re waiting for the seller to confirm your payment arrived.
              </p>
            )}
            {(order.status === "payment_confirmed" || order.status === "label_created") && (
              <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                The seller confirmed your payment and is preparing your shipment.
              </p>
            )}
            {order.status === "shipped" && (
              <div className="grid gap-3">
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Your calculator has shipped via {order.carrier}. Tracking #:{" "}
                  <span className="font-mono font-semibold">{order.tracking_number}</span>
                </p>
                <button
                  onClick={() => action("complete", "buyerToken")}
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Mark as received"}
                </button>
              </div>
            )}
            {order.status === "completed" && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Delivered! Thanks for using CalcSwap.
              </p>
            )}
          </>
        )}

        {role === "seller" && (
          <>
            {shippingAddress}
            {(order.status === "awaiting_payment" || order.status === "payment_claimed") && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-700">Payment</p>
                <p className="mt-1">
                  Buyer is paying {formatCents(order.amount_cents)} via{" "}
                  <span className="font-semibold capitalize">{order.payment_method}</span>.
                </p>
                {order.status === "payment_claimed" ? (
                  <>
                    <p className="mt-2 text-amber-700">
                      Buyer says they&rsquo;ve sent it. Check your {order.payment_method} account for{" "}
                      {formatCents(order.amount_cents)}, then confirm below.
                    </p>
                    <button
                      onClick={() => action("confirm-payment", "sellerToken")}
                      disabled={loading}
                      className="mt-3 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {loading ? "Confirming..." : "Confirm payment received & get label"}
                    </button>
                  </>
                ) : (
                  <p className="mt-2 text-slate-500">Waiting for the buyer to send payment.</p>
                )}
                <button
                  onClick={() => action("cancel", "sellerToken")}
                  disabled={loading}
                  className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel order & relist
                </button>
              </div>
            )}
            {(order.status === "payment_confirmed" || order.status === "label_created") && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-700">Free shipping label</p>
                {order.label_is_demo && (
                  <p className="mt-1 text-xs text-amber-700">
                    Demo mode: this is a placeholder PDF, not valid for mailing. Set the
                    SHIPPO_API_KEY environment variable to issue real, free postage.
                  </p>
                )}
                <p className="mt-2">
                  Carrier: {order.carrier} · Tracking #:{" "}
                  <span className="font-mono font-semibold">{order.tracking_number}</span>
                </p>
                {order.label_url && (
                  <a
                    href={order.label_url}
                    download={`label-${order.id.slice(0, 8)}.pdf`}
                    className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                  >
                    Download label
                  </a>
                )}
                <button
                  onClick={() => action("ship", "sellerToken")}
                  disabled={loading}
                  className="mt-3 ml-3 rounded-lg border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Mark as shipped"}
                </button>
              </div>
            )}
            {order.status === "shipped" && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Shipped via {order.carrier}, tracking #{" "}
                <span className="font-mono">{order.tracking_number}</span>. Waiting for the
                buyer to confirm delivery.
              </p>
            )}
            {order.status === "completed" && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Order complete. Funds are already in your {order.payment_method} account.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BuyerPaymentStep({
  order,
  listing,
  loading,
  onMarkPaid,
}: {
  order: Order;
  listing: Listing;
  loading: boolean;
  onMarkPaid: () => void;
}) {
  const handle = String(listing[METHOD_HANDLE_KEY[order.payment_method]] || "");
  const amountDollars = (order.amount_cents / 100).toFixed(2);
  const link = buildPaymentLink(
    order.payment_method,
    handle,
    amountDollars,
    `CalcSwap order ${order.id.slice(0, 8)}`
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-700">
        Pay {formatCents(order.amount_cents)} via {link.label.replace("Pay with ", "")}
      </p>
      {link.href && (
        <a
          href={link.href}
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
        >
          {link.label}
        </a>
      )}
      <p className="mt-3 text-slate-600">{link.manualInstructions}</p>
      <button
        onClick={onMarkPaid}
        disabled={loading}
        className="mt-4 rounded-lg border border-indigo-300 px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
      >
        {loading ? "Saving..." : "I've sent the payment"}
      </button>
    </div>
  );
}
