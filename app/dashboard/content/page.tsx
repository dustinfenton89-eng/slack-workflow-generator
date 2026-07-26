"use client";

import { useEffect, useState } from "react";
import { CONTENT_TYPES } from "../../_lib/openai";

type ContentItem = {
  id: string;
  content_type: string;
  niche: string | null;
  product: string | null;
  share_token: string;
  created_at: string;
};

export default function ContentPage() {
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].value);
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ outputText: string; shareToken: string } | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);

  async function loadItems() {
    const res = await fetch("/api/content");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, niche, product, brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate.");
      setResult(data);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  function shareUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/content/${token}`;
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-xl font-bold">Content Generator</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Turn a niche or product into ready-to-publish affiliate content.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 max-w-xl">
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as typeof contentType)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Niche (e.g. home espresso machines)"
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
          />

          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Product / affiliate program (optional)"
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
          />

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Brief: audience, angle, key selling points, tone, target keyword..."
            rows={6}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
          />

          <button
            disabled={loading || brief.trim().length < 10}
            className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Content"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <section className="mt-6 max-w-xl rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => copy(shareUrl(result.shareToken))}
                className="text-sm font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5"
              >
                Copy Share Link
              </button>
              <a
                href={`/share/content/${result.shareToken}`}
                target="_blank"
                className="text-sm underline"
              >
                Open
              </a>
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {result.outputText}
            </pre>
          </section>
        )}
      </div>

      <aside>
        <h2 className="text-sm font-semibold text-neutral-500">Recent generations</h2>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-sm"
            >
              <p className="font-medium">
                {item.product || item.niche || "Untitled"}
              </p>
              <p className="text-neutral-500">
                {CONTENT_TYPES.find((t) => t.value === item.content_type)?.label}
              </p>
              <a
                href={`/share/content/${item.share_token}`}
                target="_blank"
                className="mt-1 inline-block text-xs underline"
              >
                View
              </a>
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-neutral-500">No content generated yet.</p>
          )}
        </ul>
      </aside>
    </div>
  );
}
