import { NextResponse } from "next/server";
import { PolygonError } from "./polygon";

export function handleApiError(err: unknown) {
  if (err instanceof PolygonError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
