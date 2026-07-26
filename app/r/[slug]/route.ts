import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { hashIp } from "../../_lib/slug";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: link } = await supabaseAdmin
    .from("affiliate_links")
    .select("id, destination_url, active")
    .eq("slug", slug)
    .single();

  if (!link || !link.active) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

  await supabaseAdmin.from("affiliate_clicks").insert({
    link_id: link.id,
    referrer: req.headers.get("referer") || null,
    user_agent: req.headers.get("user-agent") || null,
    ip_hash: hashIp(ip),
  });

  return NextResponse.redirect(link.destination_url, { status: 302 });
}
