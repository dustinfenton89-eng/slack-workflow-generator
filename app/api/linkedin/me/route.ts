import { NextResponse } from "next/server";
import { getUserInfo } from "../../../_lib/linkedin";

function readCookie(req: Request, name: string): string | undefined {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * GET /api/linkedin/me
 * Returns the connected member's LinkedIn profile using the stored access
 * token. Responds 401 if the app is not connected (or the token expired).
 */
export async function GET(req: Request) {
  try {
    const accessToken = readCookie(req, "linkedin_access_token");
    if (!accessToken) {
      return NextResponse.json({ connected: false, error: "Not connected to LinkedIn." }, { status: 401 });
    }

    const profile = await getUserInfo(accessToken);
    return NextResponse.json({
      connected: true,
      profile: {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
