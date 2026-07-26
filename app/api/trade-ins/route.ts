import { NextResponse } from "next/server";
import { getPayoutCents, findModel } from "../../_lib/catalog";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { generateShippingLabel } from "../../_lib/shipping";
import { makeToken } from "../../_lib/tokens";
import type { Condition, PaymentMethod } from "../../_lib/types";
import { getWarehouseAddress } from "../../_lib/warehouse";

const PAYMENT_METHODS: PaymentMethod[] = ["venmo", "paypal", "cashapp", "zelle"];

function str(body: Record<string, unknown>, key: string): string {
  return String(body?.[key] ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const modelKey = str(body, "modelKey");
    const condition = str(body, "condition") as Condition;
    const sellerName = str(body, "sellerName");
    const sellerEmail = str(body, "sellerEmail").toLowerCase();
    const paymentMethod = str(body, "paymentMethod") as PaymentMethod;
    const paymentHandle = str(body, "paymentHandle");
    const shipFromName = str(body, "shipFromName");
    const shipFromAddress1 = str(body, "shipFromAddress1");
    const shipFromAddress2 = str(body, "shipFromAddress2") || null;
    const shipFromCity = str(body, "shipFromCity");
    const shipFromState = str(body, "shipFromState");
    const shipFromZip = str(body, "shipFromZip");

    const model = findModel(modelKey);
    if (!model) {
      return NextResponse.json({ error: "Unknown calculator model." }, { status: 400 });
    }

    // The payout is always computed server-side from the catalog, never trusted from the client.
    const payoutCents = getPayoutCents(modelKey, condition);
    if (!payoutCents) {
      return NextResponse.json({ error: "Invalid condition for this model." }, { status: 400 });
    }

    if (!sellerName || !sellerEmail || !sellerEmail.includes("@")) {
      return NextResponse.json({ error: "Please provide your name and a valid email." }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod) || !paymentHandle) {
      return NextResponse.json(
        { error: "Please choose a payout method and provide your account handle." },
        { status: 400 }
      );
    }
    if (!shipFromName || !shipFromAddress1 || !shipFromCity || !shipFromState || !shipFromZip) {
      return NextResponse.json(
        { error: "Please provide the full address you're shipping from." },
        { status: 400 }
      );
    }

    if (process.env.SHIPPO_API_KEY && !process.env.WAREHOUSE_ADDRESS1) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: set WAREHOUSE_* environment variables before issuing real shipping labels.",
        },
        { status: 500 }
      );
    }

    const sellerToken = makeToken();
    const addressFrom = {
      name: shipFromName,
      address1: shipFromAddress1,
      address2: shipFromAddress2,
      city: shipFromCity,
      state: shipFromState,
      zip: shipFromZip,
    };
    const addressTo = getWarehouseAddress();

    const { data: tradeIn, error: insertErr } = await supabaseAdmin
      .from("trade_ins")
      .insert({
        seller_token: sellerToken,
        model_key: model.key,
        brand: model.brand,
        model: model.model,
        condition,
        payout_cents: payoutCents,
        seller_name: sellerName,
        seller_email: sellerEmail,
        payment_method: paymentMethod,
        payment_handle: paymentHandle,
        ship_from_name: shipFromName,
        ship_from_address1: shipFromAddress1,
        ship_from_address2: shipFromAddress2,
        ship_from_city: shipFromCity,
        ship_from_state: shipFromState,
        ship_from_zip: shipFromZip,
      })
      .select("id, seller_token")
      .single();

    if (insertErr) throw insertErr;

    const label = await generateShippingLabel(addressFrom, addressTo, tradeIn.id);

    const { error: updateErr } = await supabaseAdmin
      .from("trade_ins")
      .update({
        label_url: label.labelUrl,
        label_is_demo: label.isDemo,
        tracking_number: label.trackingNumber,
        carrier: label.carrier,
      })
      .eq("id", tradeIn.id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ id: tradeIn.id, sellerToken: tradeIn.seller_token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
