// 90-Day Results Operating System — issue-detection & action engine
//
// Pure, dependency-free logic. Given the current values for each metric it:
//   1. scores every metric green/amber/red against its target & thresholds,
//   2. rolls metric health up to each result and to an overall readiness score,
//   3. surfaces "major issues" (anything red, plus amber gates), and
//   4. emits prioritized, pre-authored action steps for each issue.

import {
  PLAN,
  Status,
  MetricDef,
  ResultDef,
  ActionTemplate,
  allMetrics,
} from "./model";

/** User-supplied current values, keyed by metric id. */
export type MetricValues = Record<string, number | boolean | undefined>;

export interface MetricResult {
  metric: MetricDef;
  resultId: string;
  resultTitle: string;
  value: number | boolean | undefined;
  status: Status;
  /** 0-100 contribution used for rollups. */
  score: number;
  /** Human-readable read on where the value sits vs. target. */
  readout: string;
}

export interface ResultHealth {
  result: ResultDef;
  status: Status;
  score: number; // 0-100
  metrics: MetricResult[];
}

export interface Issue {
  id: string;
  resultId: string;
  resultTitle: string;
  metricLabel: string;
  severity: Status; // "red" (major) or "amber" (watch)
  readout: string;
  action: ActionTemplate;
}

export interface Assessment {
  readiness: number; // weighted 0-100
  status: Status;
  results: ResultHealth[];
  issues: Issue[]; // sorted: red before amber, then by horizon
  counts: { green: number; amber: number; red: number };
}

const STATUS_SCORE: Record<Status, number> = { green: 100, amber: 55, red: 15 };

function bandForNumber(
  value: number,
  m: MetricDef
): { status: Status; score: number } {
  // Higher-is-better unless inverted.
  if (m.invert) {
    if (value <= m.target) return { status: "green", score: 100 };
    if (value <= m.amber) return { status: "amber", score: STATUS_SCORE.amber };
    return { status: "red", score: STATUS_SCORE.red };
  }

  // Count metrics can have an upper healthy bound (e.g. 3-5 levers). Exceeding
  // the max is not a failure but signals lost focus -> amber, not red.
  if (m.targetMax != null && value > m.targetMax) {
    return { status: "amber", score: STATUS_SCORE.amber };
  }

  if (value >= m.target) return { status: "green", score: 100 };
  if (value >= m.amber) return { status: "amber", score: STATUS_SCORE.amber };
  return { status: "red", score: STATUS_SCORE.red };
}

export function scoreMetric(
  m: MetricDef,
  raw: number | boolean | undefined
): { status: Status; score: number; readout: string } {
  if (raw === undefined || raw === null) {
    return {
      status: "red",
      score: 0,
      readout: "No data yet — enter a value to assess this result.",
    };
  }

  if (m.kind === "boolean") {
    const ok = raw === true;
    return {
      status: ok ? "green" : "red",
      score: ok ? 100 : STATUS_SCORE.red,
      readout: ok ? "In place." : "Not in place — this is a required gate.",
    };
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    return { status: "red", score: 0, readout: "Invalid value." };
  }

  const { status, score } = bandForNumber(value, m);
  const unit = m.unit ? `${m.unit === "%" ? "" : " "}${m.unit}` : "";
  const shown = `${value}${m.unit === "%" ? "%" : unit}`;

  let readout: string;
  if (m.targetMax != null) {
    readout =
      status === "green"
        ? `${shown} — within the target band of ${m.target}-${m.targetMax}.`
        : value > m.targetMax
          ? `${shown} — above ${m.targetMax}; focus may be spread too thin.`
          : `${shown} — below the target of ${m.target}.`;
  } else if (m.invert) {
    readout =
      status === "green"
        ? `${shown} — at or below the ${m.target}${m.unit === "%" ? "%" : ""} target.`
        : `${shown} — above the ${m.target}${m.unit === "%" ? "%" : ""} target.`;
  } else {
    readout =
      status === "green"
        ? `${shown} — meets the ${m.target}${m.unit === "%" ? "%" : ""} target.`
        : `${shown} — short of the ${m.target}${m.unit === "%" ? "%" : ""} target.`;
  }

  return { status, score, readout };
}

function worst(a: Status, b: Status): Status {
  const order: Status[] = ["green", "amber", "red"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function statusFromScore(score: number): Status {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

const HORIZON_RANK: Record<ActionTemplate["horizon"], number> = {
  "this week": 0,
  "this month": 1,
  "this quarter": 2,
};

export function assess(values: MetricValues): Assessment {
  const results: ResultHealth[] = PLAN.map((result: ResultDef) => {
    const metrics: MetricResult[] = result.metrics.map((metric) => {
      const { status, score, readout } = scoreMetric(metric, values[metric.id]);
      return {
        metric,
        resultId: result.id,
        resultTitle: result.title,
        value: values[metric.id],
        status,
        score,
        readout,
      };
    });

    const avg =
      metrics.reduce((sum, m) => sum + m.score, 0) / (metrics.length || 1);
    // A single red gate should keep the result out of "green".
    const anyRed = metrics.some((m) => m.status === "red");
    const rollupStatus = anyRed
      ? worst("amber", statusFromScore(avg)) === "green"
        ? "amber"
        : statusFromScore(avg)
      : statusFromScore(avg);

    return {
      result,
      status: anyRed && rollupStatus === "green" ? "amber" : rollupStatus,
      score: Math.round(avg),
      metrics,
    };
  });

  const totalWeight = PLAN.reduce((s, r) => s + r.weight, 0);
  const readiness = Math.round(
    results.reduce((sum, r) => sum + r.score * r.result.weight, 0) / totalWeight
  );

  // Build the issue list from every amber/red metric.
  const issues: Issue[] = [];
  for (const rh of results) {
    for (const mr of rh.metrics) {
      if (mr.status === "green") continue;
      const action =
        mr.status === "red"
          ? mr.metric.actions.red
          : mr.metric.actions.amber;
      issues.push({
        id: `${rh.result.id}:${mr.metric.id}`,
        resultId: rh.result.id,
        resultTitle: rh.result.title,
        metricLabel: mr.metric.label,
        severity: mr.status,
        readout: mr.readout,
        action,
      });
    }
  }

  issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "red" ? -1 : 1;
    return HORIZON_RANK[a.action.horizon] - HORIZON_RANK[b.action.horizon];
  });

  const flat = allMetrics().map(({ metric }) =>
    scoreMetric(metric, values[metric.id]).status
  );
  const counts = {
    green: flat.filter((s) => s === "green").length,
    amber: flat.filter((s) => s === "amber").length,
    red: flat.filter((s) => s === "red").length,
  };

  return {
    readiness,
    status: statusFromScore(readiness),
    results,
    issues,
    counts,
  };
}

/** Default values used by the "load sample data" button. */
export function sampleValues(): MetricValues {
  const v: MetricValues = {};
  for (const { metric } of allMetrics()) {
    if (metric.sample !== undefined) v[metric.id] = metric.sample;
  }
  return v;
}

/** Empty starting state (all metrics blank). */
export function emptyValues(): MetricValues {
  const v: MetricValues = {};
  for (const { metric } of allMetrics()) v[metric.id] = undefined;
  return v;
}
