import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "./supabaseServer";

type RequireUserResult = { user: User; error: null } | { user: null; error: NextResponse };

/** Shared auth guard for API routes: resolves the current user or a ready-to-return NextResponse error. */
export async function requireUser(): Promise<RequireUserResult> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
    }
    return { user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication is not configured correctly.";
    return { user: null, error: NextResponse.json({ error: message }, { status: 500 }) };
  }
}
