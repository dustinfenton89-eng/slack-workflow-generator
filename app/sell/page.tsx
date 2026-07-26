"use client";

import { useState } from "react";

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;

const initialForm = {
  sellerEmail: "",
  sellerName: "",
  title: "",
  brand: "",
  model: "",
  condition: "Good" as (typeof CONDITIONS)[number],
  price: "",
  description: "",
  photoUrl: "",
  venmoUsername: "",
  paypalUsername: "",
  cashappCashtag: "",
  zelleContact: "",
  shipFromName: "",
  shipFromAddress1: "",
  shipFromAddress2: "",
  shipFromCity: "",
  shipFromState: "",
  shipFromZip: "",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function SellPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; sellerToken: string } | null>(null);

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create listing.");
      setSuccess({ id: data.id, sellerToken: data.sellerToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const manageUrl = `/listing/${success.id}?seller_token=${success.sellerToken}`;
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-bold text-emerald-900">Your listing is live!</h1>
          <p className="mt-2 text-sm text-emerald-800">
            Save this manage link &mdash; it&rsquo;s the only way to see buyer orders, confirm
            payment, and generate your free shipping label. It isn&rsquo;t emailed to you.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-300 bg-white p-3 text-sm break-all">
            {manageUrl}
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href={manageUrl}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Go to manage page
            </a>
            <a
              href={`/listing/${success.id}`}
              className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              View public listing
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">List your calculator</h1>
      <p className="mt-2 text-sm text-slate-600">
        Buyers pay you directly through the payment app you choose below &mdash;
        CalcSwap never touches the money. Once you confirm you&rsquo;ve been paid,
        we generate a shipping label so you can send the item.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6">
        <fieldset className="grid gap-4">
          <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
            Your info
          </legend>
          <Field label="Your name">
            <input
              required
              className={inputClass}
              value={form.sellerName}
              onChange={(e) => update("sellerName", e.target.value)}
            />
          </Field>
          <Field label="Your email">
            <input
              required
              type="email"
              className={inputClass}
              value={form.sellerEmail}
              onChange={(e) => update("sellerEmail", e.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
            Listing details
          </legend>
          <Field label="Title">
            <input
              required
              placeholder='e.g. "TI-84 Plus CE — barely used"'
              className={inputClass}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand">
              <input
                required
                placeholder="Texas Instruments"
                className={inputClass}
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
              />
            </Field>
            <Field label="Model">
              <input
                required
                placeholder="TI-84 Plus CE"
                className={inputClass}
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Condition">
              <select
                className={inputClass}
                value={form.condition}
                onChange={(e) => update("condition", e.target.value as typeof form.condition)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (USD)">
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="60.00"
                className={inputClass}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              required
              rows={4}
              placeholder="Any scratches, missing cover, works perfectly, etc."
              className={inputClass}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field label="Photo URL (optional)">
            <input
              placeholder="https://..."
              className={inputClass}
              value={form.photoUrl}
              onChange={(e) => update("photoUrl", e.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
            How you want to get paid
          </legend>
          <p className="-mt-2 text-xs text-slate-500">
            Fill in at least one. Buyers will send money directly to these accounts.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Venmo username">
              <input
                placeholder="@username"
                className={inputClass}
                value={form.venmoUsername}
                onChange={(e) => update("venmoUsername", e.target.value.replace(/^@/, ""))}
              />
            </Field>
            <Field label="PayPal.me username">
              <input
                placeholder="username"
                className={inputClass}
                value={form.paypalUsername}
                onChange={(e) => update("paypalUsername", e.target.value)}
              />
            </Field>
            <Field label="Cash App $Cashtag">
              <input
                placeholder="cashtag"
                className={inputClass}
                value={form.cashappCashtag}
                onChange={(e) => update("cashappCashtag", e.target.value.replace(/^\$/, ""))}
              />
            </Field>
            <Field label="Zelle (email or phone)">
              <input
                placeholder="you@school.edu"
                className={inputClass}
                value={form.zelleContact}
                onChange={(e) => update("zelleContact", e.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
            Ship-from address (for your free shipping label)
          </legend>
          <Field label="Name on package">
            <input
              required
              className={inputClass}
              value={form.shipFromName}
              onChange={(e) => update("shipFromName", e.target.value)}
            />
          </Field>
          <Field label="Address line 1">
            <input
              required
              className={inputClass}
              value={form.shipFromAddress1}
              onChange={(e) => update("shipFromAddress1", e.target.value)}
            />
          </Field>
          <Field label="Address line 2 (optional)">
            <input
              className={inputClass}
              value={form.shipFromAddress2}
              onChange={(e) => update("shipFromAddress2", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City">
              <input
                required
                className={inputClass}
                value={form.shipFromCity}
                onChange={(e) => update("shipFromCity", e.target.value)}
              />
            </Field>
            <Field label="State">
              <input
                required
                maxLength={2}
                placeholder="CA"
                className={inputClass}
                value={form.shipFromState}
                onChange={(e) => update("shipFromState", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="ZIP">
              <input
                required
                className={inputClass}
                value={form.shipFromZip}
                onChange={(e) => update("shipFromZip", e.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Publishing..." : "Publish listing"}
        </button>
      </form>
    </main>
  );
}
