import { NextResponse } from "next/server";
import { handleApiError } from "../../../_lib/apiError";
import { getOptionsChain } from "../../../_lib/polygon";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const ticker = params.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param is required" }, { status: 400 });
  }

  try {
    const chain = await getOptionsChain(ticker, {
      expiration: params.get("expiration") ?? undefined,
    });
    return NextResponse.json({ chain });
  } catch (err) {
    return handleApiError(err);
  }
}
