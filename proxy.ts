import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "./app/_lib/session";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/programs/:path*",
    "/api/links/:path*",
    "/api/conversions/:path*",
    "/api/content/:path*",
  ],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("amt_session")?.value;
  const secret = process.env.SESSION_SECRET || "";
  const valid = await verifySessionToken(token, secret);

  if (!valid) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
