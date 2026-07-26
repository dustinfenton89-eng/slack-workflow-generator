import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const sellerToken = String(body?.sellerToken || "");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, listing_id, status")
      .eq("id", id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("seller_token")
      .eq("id", order.listing_id)
      .single();

    if (listingErr || !listing || listing.seller_token !== sellerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (order.status !== "awaiting_payment" && order.status !== "payment_claimed") {
      return NextResponse.json(
        { error: "This order can no longer be cancelled." },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (updateErr) throw updateErr;

    await supabaseAdmin.from("listings").update({ status: "available" }).eq("id", order.listing_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
