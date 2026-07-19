import { NextResponse } from "next/server";
import { requireUser } from "../../../_lib/requireUser";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const { data: account, error: accountErr } = await supabaseAdmin
    .from("paper_accounts")
    .select("id, cash_balance, created_at")
    .eq("user_id", user.id)
    .single();

  if (accountErr || !account) {
    return NextResponse.json({ error: "Paper account not found" }, { status: 404 });
  }

  const [{ data: positions }, { data: orders }] = await Promise.all([
    supabaseAdmin
      .from("paper_positions")
      .select("*")
      .eq("account_id", account.id)
      .is("closed_at", null)
      .order("opened_at", { ascending: false }),
    supabaseAdmin
      .from("paper_orders")
      .select("*")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({ account, positions: positions ?? [], orders: orders ?? [] });
}
