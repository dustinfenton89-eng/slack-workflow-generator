import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { formatCents, type TradeIn } from "../../_lib/types";
import TradeInView from "./TradeInView";

export const dynamic = "force-dynamic";

async function getTradeIn(id: string): Promise<TradeIn | null> {
  try {
    const { data } = await supabaseAdmin.from("trade_ins").select("*").eq("id", id).single();
    return (data as TradeIn) || null;
  } catch {
    return null;
  }
}

export default async function TradeInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const tradeIn = await getTradeIn(id);
  if (!tradeIn) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">Trade-in not found.</p>
      </main>
    );
  }

  if (!token || token !== tradeIn.seller_token) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">
          This link is missing or has an invalid access token. Use the link you
          received when you submitted your trade-in.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Trade-in #{tradeIn.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-slate-500">
        {tradeIn.brand} {tradeIn.model} · {tradeIn.condition} ·{" "}
        {formatCents(tradeIn.payout_cents)} payout
      </p>

      <TradeInView tradeIn={tradeIn} token={token} />
    </main>
  );
}
