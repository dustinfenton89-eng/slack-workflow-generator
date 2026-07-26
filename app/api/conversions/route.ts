import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("affiliate_conversions")
    .select("*, affiliate_links(label, slug), affiliate_programs(name)")
    .order("converted_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "A valid, non-negative amount is required." }, { status: 400 });
  }

  const linkId = body.linkId || null;
  let programId = body.programId || null;
  const notes = String(body.notes || "").trim() || null;
  const convertedAt = body.convertedAt ? new Date(body.convertedAt).toISOString() : new Date().toISOString();

  if (!programId && linkId) {
    const { data: link } = await supabaseAdmin
      .from("affiliate_links")
      .select("program_id")
      .eq("id", linkId)
      .single();
    programId = link?.program_id || null;
  }

  const { data, error } = await supabaseAdmin
    .from("affiliate_conversions")
    .insert({ link_id: linkId, program_id: programId, amount, notes, converted_at: convertedAt })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
