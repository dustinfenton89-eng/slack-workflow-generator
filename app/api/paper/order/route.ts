import { NextResponse } from "next/server";
import { handleApiError } from "../../../_lib/apiError";
import { getOptionsChain, getQuote } from "../../../_lib/polygon";
import { requireUser } from "../../../_lib/requireUser";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

type OrderBody = {
  underlying: string;
  side: "buy" | "sell";
  contractType: "call" | "put" | "stock";
  quantity: number;
  optionSymbol?: string;
  strike?: number;
  expiration?: string;
};

// MVP scope: long positions only (buy to open, sell to close an existing long).
// Short selling / margin isn't modeled — that's a reasonable simplification for
// an educational paper-trading tool and keeps balance/position math unambiguous.
export async function POST(req: Request) {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  let body: OrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { underlying, side, contractType, quantity, optionSymbol, strike, expiration } = body;

  if (!underlying || !side || !contractType || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "underlying, side, contractType, and a positive quantity are required" }, { status: 400 });
  }
  if (contractType !== "stock" && (!strike || !expiration)) {
    return NextResponse.json({ error: "strike and expiration are required for option orders" }, { status: 400 });
  }

  try {
    const { data: account, error: accountErr } = await supabaseAdmin
      .from("paper_accounts")
      .select("id, cash_balance")
      .eq("user_id", user.id)
      .single();
    if (accountErr || !account) {
      return NextResponse.json({ error: "Paper account not found" }, { status: 404 });
    }

    const fillPrice = await resolveFillPrice({ underlying, contractType, optionSymbol, strike, expiration });
    if (fillPrice == null) {
      return NextResponse.json({ error: "Could not price that contract right now. Try again shortly." }, { status: 502 });
    }

    const multiplier = contractType === "stock" ? 1 : 100;
    const notional = fillPrice * quantity * multiplier;

    const positionQuery = supabaseAdmin
      .from("paper_positions")
      .select("*")
      .eq("account_id", account.id)
      .eq("underlying", underlying.toUpperCase())
      .eq("contract_type", contractType)
      .eq("side", "long")
      .is("closed_at", null);
    if (contractType !== "stock") {
      positionQuery.eq("strike", strike).eq("expiration", expiration);
    }
    const { data: existingPositions } = await positionQuery;
    const existing = existingPositions?.[0] ?? null;

    if (side === "buy") {
      if (notional > Number(account.cash_balance)) {
        await logOrder(account.id, body, fillPrice, "rejected", "Insufficient paper cash balance");
        return NextResponse.json({ error: "Insufficient paper cash balance for this order." }, { status: 400 });
      }

      if (existing) {
        const newQuantity = Number(existing.quantity) + quantity;
        const newAvgPrice =
          (Number(existing.avg_price) * Number(existing.quantity) + fillPrice * quantity) / newQuantity;
        await supabaseAdmin
          .from("paper_positions")
          .update({ quantity: newQuantity, avg_price: newAvgPrice })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("paper_positions").insert({
          account_id: account.id,
          underlying: underlying.toUpperCase(),
          option_symbol: optionSymbol ?? null,
          contract_type: contractType,
          strike: contractType === "stock" ? null : strike,
          expiration: contractType === "stock" ? null : expiration,
          side: "long",
          quantity,
          avg_price: fillPrice,
        });
      }

      await supabaseAdmin
        .from("paper_accounts")
        .update({ cash_balance: Number(account.cash_balance) - notional })
        .eq("id", account.id);
    } else {
      if (!existing || Number(existing.quantity) < quantity) {
        await logOrder(account.id, body, fillPrice, "rejected", "Not enough open quantity to sell");
        return NextResponse.json(
          { error: "You don't own enough of this position to sell that quantity." },
          { status: 400 }
        );
      }

      const remaining = Number(existing.quantity) - quantity;
      if (remaining === 0) {
        await supabaseAdmin
          .from("paper_positions")
          .update({ quantity: 0, closed_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("paper_positions").update({ quantity: remaining }).eq("id", existing.id);
      }

      await supabaseAdmin
        .from("paper_accounts")
        .update({ cash_balance: Number(account.cash_balance) + notional })
        .eq("id", account.id);
    }

    await logOrder(account.id, body, fillPrice, "filled");

    return NextResponse.json({ ok: true, fillPrice, notional });
  } catch (err) {
    return handleApiError(err);
  }
}

async function resolveFillPrice(opts: {
  underlying: string;
  contractType: "call" | "put" | "stock";
  optionSymbol?: string;
  strike?: number;
  expiration?: string;
}): Promise<number | null> {
  if (opts.contractType === "stock") {
    const quote = await getQuote(opts.underlying);
    return quote.price;
  }

  const chain = await getOptionsChain(opts.underlying, { expiration: opts.expiration });
  const contract = chain.find(
    (c) =>
      (opts.optionSymbol && c.symbol === opts.optionSymbol) ||
      (c.strike === opts.strike && c.expiration === opts.expiration && c.contractType === opts.contractType)
  );
  if (!contract) return null;
  if (contract.bid != null && contract.ask != null) return (contract.bid + contract.ask) / 2;
  return contract.last ?? null;
}

async function logOrder(
  accountId: string,
  body: OrderBody,
  fillPrice: number,
  status: "filled" | "rejected",
  reason?: string
) {
  await supabaseAdmin.from("paper_orders").insert({
    account_id: accountId,
    underlying: body.underlying.toUpperCase(),
    option_symbol: body.optionSymbol ?? null,
    contract_type: body.contractType,
    side: body.side,
    quantity: body.quantity,
    fill_price: fillPrice,
    status,
    reason: reason ?? null,
  });
}
