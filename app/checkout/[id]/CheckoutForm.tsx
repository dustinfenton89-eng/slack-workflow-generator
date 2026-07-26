"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaymentMethod } from "../../_lib/types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  venmo: "Venmo",
  paypal: "PayPal",
  cashapp: "Cash App",
  zelle: "Zelle",
};

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function CheckoutForm({
  listingId,
  availableMethods,
}: {
  listingId: string;
  availableMethods: { method: PaymentMethod; handle: string }[];
}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(availableMethods[0]?.method);
  const [form, setForm] = useState({
    buyerEmail: "",
    buyerName: "",
    shipToName: "",
    shipToAddress1: "",
    shipToAddress2: "",
    shipToCity: "",
    shipToState: "",
    shipToZip: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, paymentMethod, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to place order.");
      router.push(`/orders/${data.id}?token=${data.buyerToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
          How you&rsquo;ll pay
        </legend>
        {availableMethods.map(({ method }) => (
          <label
            key={method}
            className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm ${
              paymentMethod === method
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="font-medium">{METHOD_LABELS[method]}</span>
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === method}
              onChange={() => setPaymentMethod(method)}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
          Your info
        </legend>
        <input
          required
          placeholder="Your name"
          className={inputClass}
          value={form.buyerName}
          onChange={(e) => update("buyerName", e.target.value)}
        />
        <input
          required
          type="email"
          placeholder="Your email"
          className={inputClass}
          value={form.buyerEmail}
          onChange={(e) => update("buyerEmail", e.target.value)}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
          Shipping address
        </legend>
        <input
          required
          placeholder="Full name"
          className={inputClass}
          value={form.shipToName}
          onChange={(e) => update("shipToName", e.target.value)}
        />
        <input
          required
          placeholder="Address line 1"
          className={inputClass}
          value={form.shipToAddress1}
          onChange={(e) => update("shipToAddress1", e.target.value)}
        />
        <input
          placeholder="Address line 2 (optional)"
          className={inputClass}
          value={form.shipToAddress2}
          onChange={(e) => update("shipToAddress2", e.target.value)}
        />
        <div className="grid grid-cols-3 gap-4">
          <input
            required
            placeholder="City"
            className={inputClass}
            value={form.shipToCity}
            onChange={(e) => update("shipToCity", e.target.value)}
          />
          <input
            required
            maxLength={2}
            placeholder="State"
            className={inputClass}
            value={form.shipToState}
            onChange={(e) => update("shipToState", e.target.value.toUpperCase())}
          />
          <input
            required
            placeholder="ZIP"
            className={inputClass}
            value={form.shipToZip}
            onChange={(e) => update("shipToZip", e.target.value)}
          />
        </div>
      </fieldset>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        disabled={loading || !paymentMethod}
        className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}
