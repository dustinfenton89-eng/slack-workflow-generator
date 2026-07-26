import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";
import { generateShippingLabel } from "../../../../_lib/shipping";
import type { Listing, Order } from "../../../../_lib/types";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const sellerToken = String(body?.sellerToken || "");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single<Order>();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("id", order.listing_id)
      .single<Listing>();

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.seller_token !== sellerToken) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (order.status !== "payment_claimed" && order.status !== "awaiting_payment") {
      return NextResponse.json(
        { error: "This order has already been confirmed." },
        { status: 409 }
      );
    }

    const label = await generateShippingLabel(listing, order);

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "label_created",
        seller_confirmed_at: new Date().toISOString(),
        label_url: label.labelUrl,
        label_is_demo: label.isDemo,
        tracking_number: label.trackingNumber,
        carrier: label.carrier,
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    await supabaseAdmin.from("listings").update({ status: "sold" }).eq("id", listing.id);

    return NextResponse.json({ ok: true, label });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
