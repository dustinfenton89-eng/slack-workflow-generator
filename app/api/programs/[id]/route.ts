import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.network !== undefined) updates.network = String(body.network).trim() || null;
  if (body.commissionType !== undefined)
    updates.commission_type = body.commissionType === "flat" ? "flat" : "percentage";
  if (body.commissionRate !== undefined) updates.commission_rate = Number(body.commissionRate) || 0;
  if (body.cookieDurationDays !== undefined)
    updates.cookie_duration_days = body.cookieDurationDays ? Number(body.cookieDurationDays) : null;
  if (body.paymentSchedule !== undefined)
    updates.payment_schedule = String(body.paymentSchedule).trim() || null;
  if (body.notes !== undefined) updates.notes = String(body.notes).trim() || null;
  if (body.status !== undefined && ["active", "paused", "ended"].includes(body.status))
    updates.status = body.status;

  const { data, error } = await supabaseAdmin
    .from("affiliate_programs")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("affiliate_programs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
