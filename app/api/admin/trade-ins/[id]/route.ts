import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "../../../../_lib/adminAuth";
import { supabaseAdmin } from "../../../../_lib/supabaseAdmin";
import type { TradeInStatus } from "../../../../_lib/types";

const NEXT_STATUS: Record<string, TradeInStatus[]> = {
  awaiting_shipment: ["rejected"],
  shipped: ["received", "rejected"],
  received: ["paid", "rejected"],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const status = String(body?.status || "") as TradeInStatus;
    const adminNotes = body?.adminNotes !== undefined ? String(body.adminNotes) : undefined;

    const { data: tradeIn, error: findErr } = await supabaseAdmin
      .from("trade_ins")
      .select("status")
      .eq("id", id)
      .single();

    if (findErr || !tradeIn) {
      return NextResponse.json({ error: "Trade-in not found." }, { status: 404 });
    }

    const allowed = NEXT_STATUS[tradeIn.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Can't move a trade-in from "${tradeIn.status}" to "${status}".` },
        { status: 409 }
      );
    }

    const update: Record<string, unknown> = { status };
    if (adminNotes !== undefined) update.admin_notes = adminNotes;
    if (status === "received") update.received_at = new Date().toISOString();
    if (status === "paid") update.paid_at = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin.from("trade_ins").update(update).eq("id", id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
