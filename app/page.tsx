"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate.");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
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
      <a
        href="/scorecard"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          marginBottom: 24,
          borderRadius: 12,
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        <span>
          📊 First 90 Days — Results Operating System
          <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 8 }}>
            flag major issues &amp; get action steps
          </span>
        </span>
        <span aria-hidden>→</span>
      </a>

      <h1 style={{ fontSize: 32, fontWeight: 900 }}>
        Free Slack Workflow Blueprint Generator
      </h1>

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
          placeholder="Describe your workflow (roles, approvals, channel, SLA, etc.)"
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
          {loading ? "Generating..." : "Generate Blueprint"}
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
    </main>
  );
}
