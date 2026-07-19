import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily constructed so importing this module never throws at build time
// (Next.js evaluates route modules while collecting page data, before any
// request-time env vars are guaranteed to be checked) — the clear "not
// configured" error instead surfaces the first time a route actually runs.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
