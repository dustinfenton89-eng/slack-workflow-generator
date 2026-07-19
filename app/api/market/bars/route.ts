import { NextResponse } from "next/server";
import { handleApiError } from "../../../_lib/apiError";
import { getAggregates } from "../../../_lib/polygon";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const ticker = params.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param is required" }, { status: 400 });
  }

  const days = Number(params.get("days") ?? 180);

  try {
    const bars = await getAggregates(ticker, { days });
    return NextResponse.json({ bars });
  } catch (err) {
    return handleApiError(err);
  }
}
