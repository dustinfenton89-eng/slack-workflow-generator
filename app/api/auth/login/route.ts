import { NextResponse } from "next/server";
import { createSessionToken, timingSafeEqual } from "../../../_lib/session";

export async function POST(req: Request) {
  const expected = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!expected || !secret) {
    return NextResponse.json(
      { error: "Server missing DASHBOARD_PASSWORD or SESSION_SECRET." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");

  const padded = password.padEnd(expected.length, "\0");
  if (padded.length !== expected.length || !timingSafeEqual(padded, expected)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("amt_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
