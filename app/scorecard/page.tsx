"use client";

import { useEffect, useMemo, useState } from "react";
import { Status, MetricDef } from "../_lib/scorecard/model";
import {
  assess,
  emptyValues,
  sampleValues,
  MetricValues,
} from "../_lib/scorecard/engine";

const STORAGE_KEY = "results-os:v1";

const STATUS_META: Record<
  Status,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  green: {
    label: "On track",
    dot: "#16a34a",
    text: "#166534",
    bg: "rgba(22,163,74,0.10)",
    border: "rgba(22,163,74,0.35)",
  },
  amber: {
    label: "At risk",
    dot: "#d97706",
    text: "#92400e",
    bg: "rgba(217,119,6,0.10)",
    border: "rgba(217,119,6,0.35)",
  },
  red: {
    label: "Major issue",
    dot: "#dc2626",
    text: "#991b1b",
    bg: "rgba(220,38,38,0.10)",
    border: "rgba(220,38,38,0.35)",
  },
};

function Badge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: m.text,
        background: m.bg,
        border: `1px solid ${m.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: m.dot,
          display: "inline-block",
        }}
      />
      {m.label}
    </span>
  );
}

function MetricInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDef;
  value: number | boolean | undefined;
  onChange: (v: number | boolean | undefined) => void;
}) {
  if (metric.kind === "boolean") {
    const on = value === true;
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((opt) => {
          const active =
            (opt.val === true && on) ||
            (opt.val === false && value === false);
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.val)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                border: active ? "1px solid #111" : "1px solid #d1d5db",
                background: active ? "#111" : "transparent",
                color: active ? "#fff" : "inherit",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="number"
        inputMode="decimal"
        value={value === undefined ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        placeholder="—"
        style={{
          width: 96,
          padding: "8px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
          background: "transparent",
          color: "inherit",
        }}
      />
      <span style={{ fontSize: 12, opacity: 0.6 }}>
        {metric.unit ?? ""} · target{" "}
        {metric.targetMax != null
          ? `${metric.target}-${metric.targetMax}`
          : metric.target}
        {metric.unit === "%" ? "%" : ""}
      </span>
    </div>
  );
}

export default function ScorecardPage() {
  const [values, setValues] = useState<MetricValues>(emptyValues());
  const [loaded, setLoaded] = useState(false);

  // Load persisted values on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Read from localStorage after mount to avoid an SSR hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValues({ ...emptyValues(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      /* ignore */
    }
  }, [values, loaded]);

  const assessment = useMemo(() => assess(values), [values]);

  function setMetric(id: string, v: number | boolean | undefined) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  const overall = STATUS_META[assessment.status];

  return (
    <main
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "32px 20px 80px",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          First 90 Days · Results Operating System
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: "6px 0 0" }}>
          Issue &amp; Action Dashboard
        </h1>
        <p style={{ opacity: 0.7, marginTop: 6, fontSize: 15, maxWidth: 720 }}>
          Enter the current read for each result. The system scores every metric,
          flags the major issues, and hands you a prioritized set of action steps.
        </p>
      </header>

      {/* Readiness summary */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
          alignItems: "center",
          border: `1px solid ${overall.border}`,
          background: overall.bg,
          borderRadius: 16,
          padding: 20,
          margin: "20px 0 24px",
        }}
      >
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              lineHeight: 1,
              color: overall.text,
            }}
          >
            {assessment.readiness}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
            / 100 readiness
          </div>
          <div style={{ marginTop: 8 }}>
            <Badge status={assessment.status} />
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <Count n={assessment.counts.red} label="Major issues" color="#dc2626" />
            <Count n={assessment.counts.amber} label="At risk" color="#d97706" />
            <Count n={assessment.counts.green} label="On track" color="#16a34a" />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setValues(sampleValues())}
              style={btnStyle(false)}
            >
              Load sample data
            </button>
            <button
              type="button"
              onClick={() => setValues(emptyValues())}
              style={btnStyle(true)}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Two-column: inputs + issues */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Results & metrics */}
        <div style={{ display: "grid", gap: 16 }}>
          {assessment.results.map((rh) => (
            <section
              key={rh.result.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "rgba(127,127,127,0.05)",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                    {rh.result.title}
                  </h2>
                  <p style={{ fontSize: 12.5, opacity: 0.6, margin: "4px 0 0" }}>
                    {rh.result.mandate}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Badge status={rh.status} />
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    {rh.score}/100
                  </div>
                </div>
              </div>

              <div style={{ padding: "4px 16px 12px" }}>
                {rh.metrics.map((mr) => (
                  <div
                    key={mr.metric.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(127,127,127,0.12)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: STATUS_META[mr.status].dot,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {mr.metric.label}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          opacity: 0.6,
                          margin: "4px 0 0 16px",
                        }}
                      >
                        {mr.metric.help}
                      </p>
                    </div>
                    <div style={{ justifySelf: "end" }}>
                      <MetricInput
                        metric={mr.metric}
                        value={mr.value}
                        onChange={(v) => setMetric(mr.metric.id, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Issues & actions */}
        <aside
          style={{
            position: "sticky",
            top: 20,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>
            Major issues &amp; action steps
          </h2>
          <p style={{ fontSize: 12.5, opacity: 0.6, margin: "0 0 14px" }}>
            Ranked worst-first, then by how soon to act.
          </p>

          {assessment.issues.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                borderRadius: 10,
                background: STATUS_META.green.bg,
                border: `1px solid ${STATUS_META.green.border}`,
                color: STATUS_META.green.text,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              No open issues. Every tracked result is on target.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {assessment.issues.map((issue) => {
                const m = STATUS_META[issue.severity];
                return (
                  <div
                    key={issue.id}
                    style={{
                      border: `1px solid ${m.border}`,
                      borderLeft: `4px solid ${m.dot}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      background: m.bg,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          opacity: 0.7,
                        }}
                      >
                        {issue.resultTitle}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: m.text,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {issue.action.horizon}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        margin: "4px 0 2px",
                      }}
                    >
                      {issue.action.title}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.75 }}>
                      {issue.metricLabel} — {issue.readout}
                    </div>
                    <ul
                      style={{
                        margin: "8px 0 6px",
                        paddingLeft: 18,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {issue.action.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: 11.5, opacity: 0.65 }}>
                      Owner: <strong>{issue.action.owner}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      <footer
        style={{
          marginTop: 32,
          fontSize: 12,
          opacity: 0.5,
          textAlign: "center",
        }}
      >
        Data is saved to this browser only. Programmatic access:{" "}
        <code>POST /api/scorecard</code> · <code>GET /api/scorecard</code> for
        the plan definition.
      </footer>
    </main>
  );
}

function Count({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function btnStyle(secondary: boolean): React.CSSProperties {
  return {
    padding: "9px 16px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    border: secondary ? "1px solid #d1d5db" : "1px solid #111",
    background: secondary ? "transparent" : "#111",
    color: secondary ? "inherit" : "#fff",
  };
}
