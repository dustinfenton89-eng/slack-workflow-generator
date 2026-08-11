import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthorizationUrl } from "../../../_lib/linkedin";

/**
 * GET /api/linkedin/auth
 * Starts the LinkedIn OAuth flow by redirecting the browser to LinkedIn's
 * consent screen. A random `state` value is stored in an HttpOnly cookie and
 * verified in the callback to protect against CSRF.
 */
export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const url = getAuthorizationUrl(state);

    const res = NextResponse.redirect(url);
    res.cookies.set("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
