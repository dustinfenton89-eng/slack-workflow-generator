import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";
export async function GET() {
  const { data, error } = await supabaseAdmin.from("leads").select("*").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
