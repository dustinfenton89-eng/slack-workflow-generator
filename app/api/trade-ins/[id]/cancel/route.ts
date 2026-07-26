import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const sellerToken = String(body?.sellerToken || "");

    const { data: tradeIn, error: findErr } = await supabaseAdmin
      .from("trade_ins")
      .select("seller_token, status")
      .eq("id", id)
      .single();

    if (findErr || !tradeIn) {
      return NextResponse.json({ error: "Trade-in not found." }, { status: 404 });
    }
    if (tradeIn.seller_token !== sellerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (tradeIn.status !== "awaiting_shipment") {
      return NextResponse.json(
        { error: "This trade-in can no longer be cancelled." },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabaseAdmin
      .from("trade_ins")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
