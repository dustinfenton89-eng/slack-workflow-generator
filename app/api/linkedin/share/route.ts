import { NextResponse } from "next/server";
import { sharePost } from "../../../_lib/linkedin";

function readCookie(req: Request, name: string): string | undefined {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * POST /api/linkedin/share
 * Body: { text: string, visibility?: "PUBLIC" | "CONNECTIONS" }
 * Publishes a text post to LinkedIn as the connected member. Requires the app
 * to have been connected via the OAuth flow with the `w_member_social` scope.
 */
export async function POST(req: Request) {
  try {
    const accessToken = readCookie(req, "linkedin_access_token");
    const memberId = readCookie(req, "linkedin_member_id");
    if (!accessToken || !memberId) {
      return NextResponse.json({ error: "Not connected to LinkedIn." }, { status: 401 });
    }

    const body = await req.json();
    const text = String(body.text || "").trim();
    const visibility = body.visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC";

    if (!text) {
      return NextResponse.json({ error: "Post text is required." }, { status: 400 });
    }

    const postUrn = await sharePost(accessToken, memberId, text, visibility);
    return NextResponse.json({ posted: true, postUrn });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
