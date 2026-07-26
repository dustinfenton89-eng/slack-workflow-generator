import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { randomSlug } from "../../_lib/slug";

export async function GET() {
  const [{ data: links, error: linksErr }, { data: clicks, error: clicksErr }] = await Promise.all(
    [
      supabaseAdmin
        .from("affiliate_links")
        .select("*, affiliate_programs(name)")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("affiliate_clicks").select("link_id"),
    ]
  );

  if (linksErr) return NextResponse.json({ error: linksErr.message }, { status: 500 });
  if (clicksErr) return NextResponse.json({ error: clicksErr.message }, { status: 500 });

  const clickCounts = new Map<string, number>();
  for (const c of clicks || []) {
    clickCounts.set(c.link_id, (clickCounts.get(c.link_id) || 0) + 1);
  }

  const items = (links || []).map((l) => ({
    ...l,
    programName: (l as { affiliate_programs?: { name: string } }).affiliate_programs?.name || null,
    clickCount: clickCounts.get(l.id) || 0,
  }));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json();
  const destinationUrl = String(body.destinationUrl || "").trim();
  if (!destinationUrl) {
    return NextResponse.json({ error: "Destination URL is required." }, { status: 400 });
  }
  try {
    new URL(destinationUrl);
  } catch {
    return NextResponse.json({ error: "Destination URL must be a valid URL." }, { status: 400 });
  }

  const label = String(body.label || "").trim() || null;
  const campaign = String(body.campaign || "").trim() || null;
  const programId = body.programId || null;
  let slug = String(body.slug || "").trim();

  if (slug && !/^[a-zA-Z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Custom slug can only contain letters, numbers, and hyphens." },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = slug || randomSlug();
    const { data, error } = await supabaseAdmin
      .from("affiliate_links")
      .insert({
        program_id: programId,
        slug: candidate,
        destination_url: destinationUrl,
        label,
        campaign,
      })
      .select("*")
      .single();

    if (!error) return NextResponse.json({ item: { ...data, clickCount: 0 } });

    if (error.code === "23505" && !String(body.slug || "").trim()) {
      slug = "";
      continue;
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "That slug is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Could not generate a unique slug, try again." }, { status: 500 });
}
