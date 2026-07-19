import { NextResponse } from "next/server";
import { handleApiError } from "../../../_lib/apiError";
import { getQuote } from "../../../_lib/polygon";

export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param is required" }, { status: 400 });
  }

  try {
    const quote = await getQuote(ticker);
    return NextResponse.json(quote);
  } catch (err) {
    return handleApiError(err);
  }
}
