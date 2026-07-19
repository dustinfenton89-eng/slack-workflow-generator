import { NextResponse } from "next/server";
import { generateCoachReply } from "../../../_lib/openai";
import { requireUser } from "../../../_lib/requireUser";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";

const HISTORY_LIMIT = 20;

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const { data, error } = await supabaseAdmin
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request) {
  const { user, error: authError } = await requireUser();
  if (!user) return authError;

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const { data: recent } = await supabaseAdmin
    .from("ai_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = (recent ?? []).reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }));
  history.push({ role: "user", content });

  await supabaseAdmin.from("ai_messages").insert({ user_id: user.id, role: "user", content });

  let reply: string;
  try {
    reply = await generateCoachReply(history);
  } catch (err) {
    const message = err instanceof Error ? err.message : "The AI coach is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await supabaseAdmin.from("ai_messages").insert({ user_id: user.id, role: "assistant", content: reply });

  return NextResponse.json({ reply });
}
