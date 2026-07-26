import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.destinationUrl !== undefined) {
    const url = String(body.destinationUrl).trim();
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Destination URL must be a valid URL." }, { status: 400 });
    }
    updates.destination_url = url;
  }
  if (body.label !== undefined) updates.label = String(body.label).trim() || null;
  if (body.campaign !== undefined) updates.campaign = String(body.campaign).trim() || null;
  if (body.programId !== undefined) updates.program_id = body.programId || null;
  if (body.active !== undefined) updates.active = Boolean(body.active);

  const { data, error } = await supabaseAdmin
    .from("affiliate_links")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("affiliate_links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
