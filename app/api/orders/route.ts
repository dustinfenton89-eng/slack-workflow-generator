import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { makeToken } from "../../_lib/tokens";
import type { PaymentMethod } from "../../_lib/types";

const PAYMENT_METHODS: PaymentMethod[] = ["venmo", "paypal", "cashapp", "zelle"];

function str(body: Record<string, unknown>, key: string): string {
  return String(body?.[key] ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const listingId = str(body, "listingId");
    const paymentMethod = str(body, "paymentMethod") as PaymentMethod;
    const buyerEmail = str(body, "buyerEmail").toLowerCase();
    const buyerName = str(body, "buyerName");
    const shipToName = str(body, "shipToName");
    const shipToAddress1 = str(body, "shipToAddress1");
    const shipToAddress2 = str(body, "shipToAddress2") || null;
    const shipToCity = str(body, "shipToCity");
    const shipToState = str(body, "shipToState");
    const shipToZip = str(body, "shipToZip");

    if (!listingId) {
      return NextResponse.json({ error: "Missing listing." }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }
    if (!buyerEmail || !buyerEmail.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }
    if (
      !buyerName ||
      !shipToName ||
      !shipToAddress1 ||
      !shipToCity ||
      !shipToState ||
      !shipToZip
    ) {
      return NextResponse.json({ error: "Please provide your full shipping address." }, { status: 400 });
    }

    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.status !== "available") {
      return NextResponse.json({ error: "This listing is no longer available." }, { status: 409 });
    }

    const methodHandleMap: Record<PaymentMethod, string | null> = {
      venmo: listing.venmo_username,
      paypal: listing.paypal_username,
      cashapp: listing.cashapp_cashtag,
      zelle: listing.zelle_contact,
    };
    if (!methodHandleMap[paymentMethod]) {
      return NextResponse.json(
        { error: "The seller doesn't accept that payment method for this listing." },
        { status: 400 }
      );
    }

    const buyerToken = makeToken();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        listing_id: listing.id,
        buyer_token: buyerToken,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        ship_to_name: shipToName,
        ship_to_address1: shipToAddress1,
        ship_to_address2: shipToAddress2,
        ship_to_city: shipToCity,
        ship_to_state: shipToState,
        ship_to_zip: shipToZip,
        payment_method: paymentMethod,
        amount_cents: listing.price_cents,
      })
      .select("id, buyer_token")
      .single();

    if (orderErr) throw orderErr;

    const { error: updateErr } = await supabaseAdmin
      .from("listings")
      .update({ status: "pending" })
      .eq("id", listing.id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ id: order.id, buyerToken: order.buyer_token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
