import { NextResponse } from "next/server";
import { requireUser } from "../../_lib/requireUser";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const { data, error } = await supabaseAdmin
    .from("watchlists")
    .select("id, symbol, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlist: data ?? [] });
}

export async function POST(req: Request) {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const body = await req.json().catch(() => ({}));
  const symbol = String(body.symbol || "").trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("watchlists")
    .upsert({ user_id: user.id, symbol }, { onConflict: "user_id,symbol" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const symbol = new URL(req.url).searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol query param is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("watchlists")
    .delete()
    .eq("user_id", user.id)
    .eq("symbol", symbol.toUpperCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
