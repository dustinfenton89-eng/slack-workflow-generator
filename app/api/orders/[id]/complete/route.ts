import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const buyerToken = String(body?.buyerToken || "");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("buyer_token, status")
      .eq("id", id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.buyer_token !== buyerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (order.status !== "shipped") {
      return NextResponse.json({ error: "This order hasn't shipped yet." }, { status: 409 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "completed" })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
