"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATALOG, CONDITIONS, getPayoutCents } from "./_lib/catalog";
import type { Condition, PaymentMethod } from "./_lib/types";
import { formatCents } from "./_lib/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; placeholder: string }[] = [
  { value: "venmo", label: "Venmo", placeholder: "@username" },
  { value: "paypal", label: "PayPal", placeholder: "Email on your PayPal account" },
  { value: "cashapp", label: "Cash App", placeholder: "$cashtag" },
  { value: "zelle", label: "Zelle", placeholder: "Email or phone" },
  { value: "stripe", label: "Stripe", placeholder: "Email or account reference" },
];

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const initialDetails = {
  sellerName: "",
  sellerEmail: "",
  paymentMethod: "venmo" as PaymentMethod,
  paymentHandle: "",
  shipFromName: "",
  shipFromAddress1: "",
  shipFromAddress2: "",
  shipFromCity: "",
  shipFromState: "",
  shipFromZip: "",
};

export default function Home() {
  const router = useRouter();
  const [modelKey, setModelKey] = useState("");
  const [condition, setCondition] = useState<Condition>("Good");
  const [step, setStep] = useState<"quote" | "details">("quote");
  const [details, setDetails] = useState(initialDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brands = useMemo(() => {
    const map = new Map<string, typeof CATALOG>();
    for (const m of CATALOG) {
      map.set(m.brand, [...(map.get(m.brand) || []), m]);
    }
    return map;
  }, []);

  const payoutCents = modelKey ? getPayoutCents(modelKey, condition) : null;

  function update<K extends keyof typeof initialDetails>(key: K, value: (typeof initialDetails)[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trade-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelKey, condition, ...details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit trade-in.");
      router.push(`/trade-ins/${data.id}?token=${data.sellerToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          We&rsquo;ll buy your graphing calculator.
        </h1>
        <p className="mt-3 text-slate-600">
          Pick your model and condition for an instant payout quote. Ship it to
          us free, and get paid straight to your Venmo, PayPal, Cash App, or
          Zelle once we&rsquo;ve checked it in.
        </p>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Model
            <select
              className={inputClass}
              value={modelKey}
              onChange={(e) => {
                setModelKey(e.target.value);
                setStep("quote");
              }}
            >
              <option value="">Select your calculator...</option>
              {[...brands.entries()].map(([brand, models]) => (
                <optgroup key={brand} label={brand}>
                  {models.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.model}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="grid gap-1 text-sm font-medium text-slate-700">
            Condition
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCondition(c);
                    setStep("quote");
                  }}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    condition === c
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {modelKey && payoutCents !== null && (
          <div className="mt-6 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                Your quote
              </p>
              <p className="text-2xl font-extrabold text-indigo-900">
                {formatCents(payoutCents)}
              </p>
            </div>
            {step === "quote" && (
              <button
                onClick={() => setStep("details")}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Start trade-in
              </button>
            )}
          </div>
        )}

        {modelKey && step === "details" && payoutCents !== null && (
          <form onSubmit={onSubmit} className="mt-6 grid gap-6 border-t border-slate-200 pt-6">
            <fieldset className="grid gap-4">
              <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                Your info
              </legend>
              <input
                required
                placeholder="Your name"
                className={inputClass}
                value={details.sellerName}
                onChange={(e) => update("sellerName", e.target.value)}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                className={inputClass}
                value={details.sellerEmail}
                onChange={(e) => update("sellerEmail", e.target.value)}
              />
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                How you want to get paid
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      details.paymentMethod === pm.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200"
                    }`}
                  >
                    <span className="font-medium">{pm.label}</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={details.paymentMethod === pm.value}
                      onChange={() => update("paymentMethod", pm.value)}
                    />
                  </label>
                ))}
              </div>
              <input
                required
                type={details.paymentMethod === "paypal" ? "email" : "text"}
                placeholder={
                  PAYMENT_METHODS.find((pm) => pm.value === details.paymentMethod)?.placeholder
                }
                className={inputClass}
                value={details.paymentHandle}
                onChange={(e) => update("paymentHandle", e.target.value)}
              />
              {details.paymentMethod === "paypal" && (
                <p className="-mt-1 text-xs text-slate-500">
                  We send your payout automatically to this PayPal email once your
                  calculator is checked in.
                </p>
              )}
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                Ship from (for your free label)
              </legend>
              <input
                required
                placeholder="Name on package"
                className={inputClass}
                value={details.shipFromName}
                onChange={(e) => update("shipFromName", e.target.value)}
              />
              <input
                required
                placeholder="Address line 1"
                className={inputClass}
                value={details.shipFromAddress1}
                onChange={(e) => update("shipFromAddress1", e.target.value)}
              />
              <input
                placeholder="Address line 2 (optional)"
                className={inputClass}
                value={details.shipFromAddress2}
                onChange={(e) => update("shipFromAddress2", e.target.value)}
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  required
                  placeholder="City"
                  className={inputClass}
                  value={details.shipFromCity}
                  onChange={(e) => update("shipFromCity", e.target.value)}
                />
                <input
                  required
                  maxLength={2}
                  placeholder="State"
                  className={inputClass}
                  value={details.shipFromState}
                  onChange={(e) => update("shipFromState", e.target.value.toUpperCase())}
                />
                <input
                  required
                  placeholder="ZIP"
                  className={inputClass}
                  value={details.shipFromZip}
                  onChange={(e) => update("shipFromZip", e.target.value)}
                />
              </div>
            </fieldset>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : `Confirm trade-in for ${formatCents(payoutCents)}`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
