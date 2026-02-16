import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../_lib/supabaseAdmin"; // uses the file you created inside app/_lib
import { generateSlackWorkflowBlueprint } from "../../_lib/openai";
function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const inputText = String(body.inputText || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }
    if (inputText.length < 20) {
      return NextResponse.json(
        { error: "Please describe your process with more detail (20+ characters)." },
        { status: 400 }
      );
    }

    // 1) Generate blueprint
    const outputText = await generateSlackWorkflowBlueprint(inputText);

    // 2) Save lead
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .insert({ email })
      .select("id")
      .single();
    if (leadErr) throw leadErr;

    // 3) Save workflow
    const title = inputText.split("\n")[0].slice(0, 80) || "Slack Workflow Blueprint";
    const { data: wf, error: wfErr } = await supabaseAdmin
      .from("workflows")
      .insert({
        lead_id: lead.id,
        title,
        input_text: inputText,
        output_text: outputText,
      })
      .select("id")
      .single();
    if (wfErr) throw wfErr;

    // 4) Save share token
    const shareToken = makeToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const { error: shareErr } = await supabaseAdmin.from("workflow_shares").insert({
      workflow_id: wf.id,
      share_token: shareToken,
      expires_at: expiresAt,
    });
    if (shareErr) throw shareErr;

    const shareUrl = `${process.env.APP_BASE_URL}/share/${shareToken}`;

    return NextResponse.json({ title, outputText, shareUrl, expiresAt });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
