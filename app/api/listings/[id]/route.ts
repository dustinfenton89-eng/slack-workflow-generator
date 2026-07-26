import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin.from("listings").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const sellerToken = String(body?.sellerToken || "");
    const status = String(body?.status || "");

    if (!["pending", "available", "sold", "removed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const { data: listing, error: findErr } = await supabaseAdmin
      .from("listings")
      .select("seller_token")
      .eq("id", id)
      .single();

    if (findErr || !listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.seller_token !== sellerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("listings")
      .update({ status })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
