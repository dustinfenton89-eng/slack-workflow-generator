import { NextResponse } from "next/server";
import { exchangeCodeForToken, getUserInfo } from "../../../_lib/linkedin";

/**
 * GET /api/linkedin/callback
 * LinkedIn redirects the member here after they authorize the app. We verify
 * the `state`, exchange the `code` for an access token, and fetch the member's
 * profile so the caller can confirm the connection works.
 *
 * The access token is stored in an HttpOnly cookie so subsequent API routes
 * (e.g. /api/linkedin/share) can act on the member's behalf.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      const description = url.searchParams.get("error_description") || error;
      return NextResponse.json({ error: `LinkedIn authorization denied: ${description}` }, { status: 400 });
    }
    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state." }, { status: 400 });
    }

    // Verify the state cookie set in /api/linkedin/auth.
    const cookieState = req.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("linkedin_oauth_state="))
      ?.split("=")[1];

    if (!cookieState || cookieState !== state) {
      return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
    }

    const token = await exchangeCodeForToken(code);
    const profile = await getUserInfo(token.access_token);

    const res = NextResponse.json({
      connected: true,
      profile: {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
    });

    // Clear the one-time state cookie.
    res.cookies.set("linkedin_oauth_state", "", { path: "/", maxAge: 0 });

    // Store the access token for follow-up API calls in this session.
    res.cookies.set("linkedin_access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in,
    });
    // The member's person id is needed to author posts; safe to keep alongside the token.
    res.cookies.set("linkedin_member_id", profile.sub, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in,
    });

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
