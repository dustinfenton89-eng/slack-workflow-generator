import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { makeToken } from "../../_lib/tokens";
import type { Condition } from "../../_lib/types";

const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair"];

function str(body: Record<string, unknown>, key: string): string {
  return String(body?.[key] ?? "").trim();
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ listings: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sellerEmail = str(body, "sellerEmail").toLowerCase();
    const sellerName = str(body, "sellerName");
    const title = str(body, "title");
    const brand = str(body, "brand");
    const model = str(body, "model");
    const condition = str(body, "condition") as Condition;
    const description = str(body, "description");
    const photoUrl = str(body, "photoUrl") || null;

    const venmo = str(body, "venmoUsername") || null;
    const paypal = str(body, "paypalUsername") || null;
    const cashapp = str(body, "cashappCashtag") || null;
    const zelle = str(body, "zelleContact") || null;

    const shipFromName = str(body, "shipFromName");
    const shipFromAddress1 = str(body, "shipFromAddress1");
    const shipFromAddress2 = str(body, "shipFromAddress2") || null;
    const shipFromCity = str(body, "shipFromCity");
    const shipFromState = str(body, "shipFromState");
    const shipFromZip = str(body, "shipFromZip");

    const priceDollars = Number(body?.price);

    if (!sellerEmail || !sellerEmail.includes("@")) {
      return NextResponse.json({ error: "Valid seller email required." }, { status: 400 });
    }
    if (!sellerName || !title || !brand || !model || !description) {
      return NextResponse.json({ error: "Please fill in all listing details." }, { status: 400 });
    }
    if (!CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: "Invalid condition." }, { status: 400 });
    }
    if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
      return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    }
    if (!venmo && !paypal && !cashapp && !zelle) {
      return NextResponse.json(
        { error: "Add at least one payment method (Venmo, PayPal, Cash App, or Zelle)." },
        { status: 400 }
      );
    }
    if (!shipFromName || !shipFromAddress1 || !shipFromCity || !shipFromState || !shipFromZip) {
      return NextResponse.json(
        { error: "Please provide the full pickup/ship-from address." },
        { status: 400 }
      );
    }

    const sellerToken = makeToken();
    const priceCents = Math.round(priceDollars * 100);

    const { data, error } = await supabaseAdmin
      .from("listings")
      .insert({
        seller_token: sellerToken,
        seller_email: sellerEmail,
        seller_name: sellerName,
        title,
        brand,
        model,
        condition,
        price_cents: priceCents,
        description,
        photo_url: photoUrl,
        venmo_username: venmo,
        paypal_username: paypal,
        cashapp_cashtag: cashapp,
        zelle_contact: zelle,
        ship_from_name: shipFromName,
        ship_from_address1: shipFromAddress1,
        ship_from_address2: shipFromAddress2,
        ship_from_city: shipFromCity,
        ship_from_state: shipFromState,
        ship_from_zip: shipFromZip,
      })
      .select("id, seller_token")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, sellerToken: data.seller_token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
