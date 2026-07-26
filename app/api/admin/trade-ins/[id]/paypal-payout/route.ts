import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "../../../../../_lib/adminAuth";
import { sendPayPalPayout } from "../../../../../_lib/paypal";
import { supabaseAdmin } from "../../../../../_lib/supabaseAdmin";
import type { TradeIn } from "../../../../../_lib/types";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const { data: tradeIn, error: findErr } = await supabaseAdmin
      .from("trade_ins")
      .select("*")
      .eq("id", id)
      .single<TradeIn>();

    if (findErr || !tradeIn) {
      return NextResponse.json({ error: "Trade-in not found." }, { status: 404 });
    }
    if (tradeIn.payment_method !== "paypal") {
      return NextResponse.json(
        { error: "This trade-in isn't set up for PayPal payout." },
        { status: 409 }
      );
    }
    if (tradeIn.status !== "received") {
      return NextResponse.json(
        { error: `Can't send a payout while status is "${tradeIn.status}".` },
        { status: 409 }
      );
    }

    const result = await sendPayPalPayout(
      tradeIn.payment_handle,
      tradeIn.payout_cents,
      `CalcSwap payout for ${tradeIn.brand} ${tradeIn.model}`,
      tradeIn.id
    );

    const { error: updateErr } = await supabaseAdmin
      .from("trade_ins")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payout_reference: `${result.batchId}:${result.itemId || ""}`,
      })
      .eq("id", id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
