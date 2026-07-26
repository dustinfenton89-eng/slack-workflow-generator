import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { generateAffiliateContent, type ContentType, CONTENT_TYPES } from "../../_lib/openai";
import { randomToken } from "../../_lib/slug";

const VALID_TYPES = new Set(CONTENT_TYPES.map((t) => t.value));

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("affiliate_content")
    .select("id, content_type, niche, product, share_token, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contentType = String(body.contentType || "") as ContentType;
    const niche = String(body.niche || "").trim();
    const product = String(body.product || "").trim();
    const brief = String(body.brief || "").trim();

    if (!VALID_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }
    if (brief.length < 10) {
      return NextResponse.json(
        { error: "Please provide more detail in the brief (10+ characters)." },
        { status: 400 }
      );
    }

    const fullBrief = [
      niche && `Niche: ${niche}`,
      product && `Product/Program: ${product}`,
      `Brief: ${brief}`,
    ]
      .filter(Boolean)
      .join("\n");

    const outputText = await generateAffiliateContent(contentType, fullBrief);
    const shareToken = randomToken();

    const { data, error } = await supabaseAdmin
      .from("affiliate_content")
      .insert({
        content_type: contentType,
        niche: niche || null,
        product: product || null,
        brief,
        output_text: outputText,
        share_token: shareToken,
      })
      .select("id, share_token, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      outputText,
      shareToken: data.share_token,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
