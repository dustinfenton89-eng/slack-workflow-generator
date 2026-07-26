"use client";

import { Fragment, useEffect, useState } from "react";

type Program = { id: string; name: string };

type Link = {
  id: string;
  slug: string;
  destination_url: string;
  label: string | null;
  campaign: string | null;
  active: boolean;
  program_id: string | null;
  programName: string | null;
  clickCount: number;
};

const emptyForm = {
  destinationUrl: "",
  label: "",
  campaign: "",
  slug: "",
  programId: "",
};

export default function LinksPage() {
  const [items, setItems] = useState<Link[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convAmount, setConvAmount] = useState("");
  const [origin, setOrigin] = useState("");

  async function load() {
    setLoading(true);
    const [linksRes, programsRes] = await Promise.all([
      fetch("/api/links"),
      fetch("/api/programs"),
    ]);
    const linksData = await linksRes.json();
    const programsData = await programsRes.json();
    if (linksRes.ok) setItems(linksData.items || []);
    if (programsRes.ok) setPrograms(programsData.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    setOrigin(window.location.origin);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create link.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(link: Link) {
    await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !link.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this link? Click history will be deleted too.")) return;
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    load();
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function logConversion(linkId: string) {
    const amount = Number(convAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    await fetch("/api/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, amount }),
    });
    setConvertingId(null);
    setConvAmount("");
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Affiliate Links</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Create trackable links, tag them by campaign, and watch clicks roll in.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 sm:grid-cols-2 max-w-3xl rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
      >
        <input
          value={form.destinationUrl}
          onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
          placeholder="Destination URL (required)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Label (e.g. Espresso Machine Review)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={form.campaign}
          onChange={(e) => setForm({ ...form, campaign: e.target.value })}
          placeholder="Campaign (e.g. youtube-q3)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <select
          value={form.programId}
          onChange={(e) => setForm({ ...form, programId: e.target.value })}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">No program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="Custom slug (optional, random if blank)"
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button
          disabled={submitting || !form.destinationUrl.trim()}
          className="sm:col-span-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Link"}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 pr-4">Link</th>
              <th className="py-2 pr-4">Destination</th>
              <th className="py-2 pr-4">Campaign</th>
              <th className="py-2 pr-4">Program</th>
              <th className="py-2 pr-4">Clicks</th>
              <th className="py-2 pr-4">Active</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((link) => (
              <Fragment key={link.id}>
                <tr className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => copy(`${origin}/r/${link.slug}`)}
                      className="font-mono text-xs underline"
                      title="Copy link"
                    >
                      /r/{link.slug}
                    </button>
                    {link.label && <p className="text-neutral-500">{link.label}</p>}
                  </td>
                  <td className="py-2 pr-4 max-w-[220px] truncate text-neutral-500">
                    {link.destination_url}
                  </td>
                  <td className="py-2 pr-4 text-neutral-500">{link.campaign || "—"}</td>
                  <td className="py-2 pr-4 text-neutral-500">{link.programName || "—"}</td>
                  <td className="py-2 pr-4 font-medium">{link.clickCount}</td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => toggleActive(link)}
                      className={`text-xs rounded px-1.5 py-0.5 ${
                        link.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {link.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <button
                      onClick={() => setConvertingId(convertingId === link.id ? null : link.id)}
                      className="text-xs underline mr-3"
                    >
                      Log conversion
                    </button>
                    <button onClick={() => remove(link.id)} className="text-xs text-red-600 underline">
                      Delete
                    </button>
                  </td>
                </tr>
                {convertingId === link.id && (
                  <tr className="bg-neutral-50 dark:bg-neutral-900">
                    <td colSpan={7} className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          value={convAmount}
                          onChange={(e) => setConvAmount(e.target.value)}
                          type="number"
                          step="0.01"
                          placeholder="Commission amount ($)"
                          className="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => logConversion(link.id)}
                          className="rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">No links yet — create your first above.</p>
        )}
      </div>
    </div>
  );
}
