"use client";

import { useState } from "react";
import Link from "next/link";

export default function LinkedInOutreach() {
  const [email, setEmail] = useState("");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    outputText: string;
    shareUrl: string;
    expiresAt: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/linkedin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate.");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>
        Free LinkedIn Outreach Sequence Generator
      </h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Generates connection-request copy, follow-up messages, and objection
        handling for you to send yourself. This is a copywriting tool, not an
        automation bot — always send manually or via LinkedIn&apos;s own
        features to stay within LinkedIn&apos;s terms.
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 20, display: "grid", gap: 12 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (required)"
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}
        />

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your target persona, offer, and goal (e.g. 'VP of Sales at Series A SaaS companies, offering a demo of our outbound tool, goal is to book a 15-min call')"
          rows={8}
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}
        />

        <button
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #111",
            background: loading ? "#eee" : "#111",
            color: loading ? "#111" : "#fff",
            fontWeight: 800,
          }}
        >
          {loading ? "Generating..." : "Generate Outreach Sequence"}
        </button>
      </form>

      {error && <p style={{ marginTop: 12, color: "red" }}>{error}</p>}

      {result && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>{result.title}</h2>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => copy(result.shareUrl)} style={{ marginRight: 10 }}>
              Copy Share Link
            </button>
            <a href={result.shareUrl} target="_blank">
              Open Share Page
            </a>
          </div>

          <pre
            style={{
              marginTop: 16,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {result.outputText}
          </pre>
        </section>
      )}

      <p style={{ marginTop: 32 }}>
        <Link href="/">← Back to Slack Workflow Generator</Link>
      </p>
    </main>
  );
}
