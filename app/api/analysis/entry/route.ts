import { NextResponse } from "next/server";
import { handleApiError } from "../../../_lib/apiError";
import { computeEntrySignal } from "../../../_lib/entrySignal";
import { getAggregates, getOptionsChain } from "../../../_lib/polygon";

export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param is required" }, { status: 400 });
  }

  try {
    const [bars, chain] = await Promise.all([
      getAggregates(ticker, { days: 120 }),
      getOptionsChain(ticker).catch(() => []),
    ]);

    const signal = computeEntrySignal(bars, chain);
    return NextResponse.json(signal);
  } catch (err) {
    return handleApiError(err);
  }
}
