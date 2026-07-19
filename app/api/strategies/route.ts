import { NextResponse } from "next/server";
import { analyzeStrategy, type Leg } from "../../_lib/strategyMath";
import { generateStrategyFeedback } from "../../_lib/openai";
import { requireUser } from "../../_lib/requireUser";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const { data, error } = await supabaseAdmin
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ strategies: data ?? [] });
}

export async function POST(req: Request) {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const underlying = String(body.underlying || "").trim().toUpperCase();
  const legs: Leg[] = Array.isArray(body.legs) ? body.legs : [];
  const notes = body.notes ? String(body.notes) : null;

  if (!name || !underlying || legs.length === 0) {
    return NextResponse.json({ error: "name, underlying, and at least one leg are required" }, { status: 400 });
  }

  const analysis = analyzeStrategy(legs);

  let aiFeedback: string | null = null;
  try {
    aiFeedback = await generateStrategyFeedback({ underlying, legs, analysis, notes });
  } catch {
    aiFeedback = null; // AI feedback is best-effort; the strategy still saves without it.
  }

  const { data, error } = await supabaseAdmin
    .from("strategies")
    .insert({ user_id: user.id, name, underlying, legs, notes, ai_feedback: aiFeedback })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ strategy: data, analysis });
}
