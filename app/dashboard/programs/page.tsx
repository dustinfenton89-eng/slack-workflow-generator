"use client";

import { useEffect, useState } from "react";

type Program = {
  id: string;
  name: string;
  network: string | null;
  commission_type: "percentage" | "flat";
  commission_rate: number;
  cookie_duration_days: number | null;
  payment_schedule: string | null;
  status: "active" | "paused" | "ended";
  notes: string | null;
  totalEarned: number;
};

const emptyForm = {
  name: "",
  network: "",
  commissionType: "percentage" as "percentage" | "flat",
  commissionRate: "",
  cookieDurationDays: "",
  paymentSchedule: "",
  notes: "",
};

export default function ProgramsPage() {
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/programs");
    const data = await res.json();
    if (res.ok) setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create program.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create program.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: Program["status"]) {
    await fetch(`/api/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this program? Links referencing it will be kept but unlinked.")) return;
    await fetch(`/api/programs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Affiliate Programs</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Track every program you&apos;re enrolled in, its terms, and lifetime earnings.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 sm:grid-cols-2 max-w-3xl rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Program name (required)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={form.network}
          onChange={(e) => setForm({ ...form, network: e.target.value })}
          placeholder="Network (e.g. Amazon Associates, Impact, direct)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <select
          value={form.commissionType}
          onChange={(e) =>
            setForm({ ...form, commissionType: e.target.value as "percentage" | "flat" })
          }
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="percentage">Commission %</option>
          <option value="flat">Flat fee</option>
        </select>
        <input
          value={form.commissionRate}
          onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
          placeholder={form.commissionType === "flat" ? "Flat amount ($)" : "Commission rate (%)"}
          type="number"
          step="0.01"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={form.cookieDurationDays}
          onChange={(e) => setForm({ ...form, cookieDurationDays: e.target.value })}
          placeholder="Cookie duration (days)"
          type="number"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={form.paymentSchedule}
          onChange={(e) => setForm({ ...form, paymentSchedule: e.target.value })}
          placeholder="Payment schedule (e.g. Net-30 monthly)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes"
          rows={2}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm sm:col-span-2"
        />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button
          disabled={submitting || !form.name.trim()}
          className="sm:col-span-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Program"}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 pr-4">Program</th>
              <th className="py-2 pr-4">Network</th>
              <th className="py-2 pr-4">Commission</th>
              <th className="py-2 pr-4">Cookie</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Earned</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4 font-medium">{p.name}</td>
                <td className="py-2 pr-4 text-neutral-500">{p.network || "—"}</td>
                <td className="py-2 pr-4">
                  {p.commission_type === "flat"
                    ? `$${p.commission_rate}`
                    : `${p.commission_rate}%`}
                </td>
                <td className="py-2 pr-4 text-neutral-500">
                  {p.cookie_duration_days ? `${p.cookie_duration_days}d` : "—"}
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value as Program["status"])}
                    className="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-1.5 py-0.5 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
                </td>
                <td className="py-2 pr-4 font-medium">${p.totalEarned.toFixed(2)}</td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => remove(p.id)}
                    className="text-xs text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">No programs yet — add your first above.</p>
        )}
      </div>
    </div>
  );
}
