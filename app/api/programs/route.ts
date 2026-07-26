import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export async function GET() {
  const [{ data: programs, error: programsErr }, { data: conversions, error: convErr }] =
    await Promise.all([
      supabaseAdmin
        .from("affiliate_programs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("affiliate_conversions").select("program_id, amount"),
    ]);

  if (programsErr) return NextResponse.json({ error: programsErr.message }, { status: 500 });
  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

  const earnedByProgram = new Map<string, number>();
  for (const c of conversions || []) {
    if (!c.program_id) continue;
    earnedByProgram.set(c.program_id, (earnedByProgram.get(c.program_id) || 0) + Number(c.amount));
  }

  const items = (programs || []).map((p) => ({
    ...p,
    totalEarned: earnedByProgram.get(p.id) || 0,
  }));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Program name is required." }, { status: 400 });

  const commissionType = body.commissionType === "flat" ? "flat" : "percentage";
  const commissionRate = Number(body.commissionRate) || 0;
  const cookieDurationDays = body.cookieDurationDays ? Number(body.cookieDurationDays) : null;
  const paymentSchedule = String(body.paymentSchedule || "").trim() || null;
  const network = String(body.network || "").trim() || null;
  const notes = String(body.notes || "").trim() || null;
  const status = ["active", "paused", "ended"].includes(body.status) ? body.status : "active";

  const { data, error } = await supabaseAdmin
    .from("affiliate_programs")
    .insert({
      name,
      network,
      commission_type: commissionType,
      commission_rate: commissionRate,
      cookie_duration_days: cookieDurationDays,
      payment_schedule: paymentSchedule,
      notes,
      status,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: { ...data, totalEarned: 0 } });
}
