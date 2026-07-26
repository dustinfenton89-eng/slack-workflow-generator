import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const buyerToken = String(body?.buyerToken || "");

    const { data: order, error: findErr } = await supabaseAdmin
      .from("orders")
      .select("buyer_token, status")
      .eq("id", id)
      .single();

    if (findErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.buyer_token !== buyerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (order.status !== "awaiting_payment") {
      return NextResponse.json({ error: "This order isn't awaiting payment." }, { status: 409 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "payment_claimed", buyer_marked_paid_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
