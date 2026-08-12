import { NextResponse } from "next/server";
import { assess, MetricValues } from "../../_lib/scorecard/engine";
import { PLAN } from "../../_lib/scorecard/model";

// POST /api/scorecard
// Body: { values: { [metricId]: number | boolean } }
// Returns the full assessment: readiness score, per-result health, and the
// prioritized list of major issues + action steps. Pure compute, no secrets.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const values = (body?.values ?? {}) as MetricValues;

    if (typeof values !== "object" || Array.isArray(values)) {
      return NextResponse.json(
        { error: "`values` must be an object keyed by metric id." },
        { status: 400 }
      );
    }

    const assessment = assess(values);
    return NextResponse.json(assessment);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/scorecard
// Returns the plan definition (results + metrics + targets) so external tools
// can discover what to report against.
export async function GET() {
  return NextResponse.json({ plan: PLAN });
}
