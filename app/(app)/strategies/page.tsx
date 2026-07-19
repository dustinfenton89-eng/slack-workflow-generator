"use client";

import { useEffect, useState } from "react";
import { Button, Card, Disclaimer, Input, PageShell, Select, Textarea } from "../../_components/ui";
import { errorMessage } from "../../_lib/errorMessage";
import { analyzeStrategy, STRATEGY_TEMPLATES, type Leg, type StrategyAnalysis } from "../../_lib/strategyMath";

type SavedStrategy = {
  id: string;
  name: string;
  underlying: string;
  legs: Leg[];
  notes: string | null;
  ai_feedback: string | null;
  created_at: string;
};

export default function StrategiesPage() {
  const [templateKey, setTemplateKey] = useState<keyof typeof STRATEGY_TEMPLATES>("long_call");
  const [name, setName] = useState("");
  const [underlying, setUnderlying] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedStrategy[]>([]);

  useEffect(() => {
    applyTemplate(templateKey);
  }, [templateKey]);

  useEffect(() => {
    loadSaved();
  }, []);

  function applyTemplate(key: keyof typeof STRATEGY_TEMPLATES) {
    const template = STRATEGY_TEMPLATES[key];
    setLegs(template.legs.map((l) => ({ ...l, strike: 0, premium: 0 })));
    setName(template.label);
  }

  async function loadSaved() {
    const res = await fetch("/api/strategies");
    const data = await res.json();
    if (res.ok) setSaved(data.strategies);
  }

  function updateLeg(index: number, patch: Partial<Leg>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  const analysis: StrategyAnalysis | null = legs.every((l) => l.strike > 0 && l.premium >= 0) && legs.length > 0
    ? analyzeStrategy(legs)
    : null;

  async function save() {
    if (!underlying.trim() || !analysis) {
      setError("Enter an underlying ticker and fill in every leg's strike and premium.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, underlying: underlying.toUpperCase(), legs, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved((prev) => [data.strategy, ...prev]);
      setNotes("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-bold text-zinc-100">Strategy builder</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pick a template, fill in strikes and premiums, and see max profit/loss and breakevens instantly. Save it to
        get AI coaching feedback.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-400">
              Template
              <Select
                className="mt-1"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as keyof typeof STRATEGY_TEMPLATES)}
              >
                {Object.entries(STRATEGY_TEMPLATES).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-zinc-400">
              Underlying ticker
              <Input className="mt-1" value={underlying} onChange={(e) => setUnderlying(e.target.value)} placeholder="e.g. AAPL" />
            </label>
          </div>

          <div className="mt-4 grid gap-3">
            {legs.map((leg, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 p-3 sm:grid-cols-5 sm:items-end">
                <div className="text-xs text-zinc-400 sm:col-span-1">
                  <p className="font-semibold text-zinc-300">
                    {leg.side} {leg.type}
                  </p>
                  <p className="text-zinc-600">leg {i + 1}</p>
                </div>
                <label className="text-xs text-zinc-400">
                  Strike
                  <Input
                    className="mt-1"
                    type="number"
                    value={leg.strike || ""}
                    onChange={(e) => updateLeg(i, { strike: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-zinc-400">
                  Premium
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    value={leg.premium || ""}
                    onChange={(e) => updateLeg(i, { premium: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-zinc-400 sm:col-span-2">
                  Quantity (contracts)
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    value={leg.quantity}
                    onChange={(e) => updateLeg(i, { quantity: Math.max(1, Number(e.target.value)) })}
                  />
                </label>
              </div>
            ))}
          </div>

          <label className="mt-4 block text-xs text-zinc-400">
            Notes (optional, shared with the AI coach)
            <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <Button className="mt-4" onClick={save} disabled={saving}>
            {saving ? "Saving & getting feedback..." : "Save & get AI feedback"}
          </Button>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-300">Live analysis</h2>
          {!analysis && <p className="mt-2 text-sm text-zinc-500">Fill in strike and premium for every leg.</p>}
          {analysis && (
            <div className="mt-3 grid gap-2 text-sm">
              <Row label="Max profit" value={analysis.maxProfit === "unlimited" ? "Unlimited" : `$${analysis.maxProfit.toFixed(2)}`} tone="pos" />
              <Row label="Max loss" value={analysis.maxLoss === "unlimited" ? "Unlimited" : `$${analysis.maxLoss.toFixed(2)}`} tone="neg" />
              <Row
                label="Net at open"
                value={`${analysis.netCredit >= 0 ? "+" : ""}$${analysis.netCredit.toFixed(2)} ${analysis.netCredit >= 0 ? "credit" : "debit"}`}
              />
              <Row label="Breakeven(s)" value={analysis.breakevens.length ? analysis.breakevens.map((b) => `$${b.toFixed(2)}`).join(", ") : "none found"} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-zinc-100">Saved strategies</h2>
        <div className="mt-3 grid gap-4">
          {saved.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-zinc-100">
                  {s.name} · {s.underlying}
                </p>
                <p className="text-xs text-zinc-500">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
              {s.ai_feedback && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{s.ai_feedback}</p>}
              {!s.ai_feedback && <p className="mt-2 text-sm text-zinc-500">AI feedback unavailable for this one.</p>}
            </Card>
          ))}
          {saved.length === 0 && <p className="text-sm text-zinc-500">No saved strategies yet.</p>}
        </div>
      </div>

      <Disclaimer />
    </PageShell>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-red-400" : "text-zinc-100";
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
