import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily construct the Supabase admin client. Instantiating at module load
// crashes `next build` (and any Vercel deploy) when the env vars are absent —
// which they are unless Supabase is configured. Deferring construction lets the
// app build and deploy with zero env config; routes that actually need
// Supabase surface a clear error at request time instead.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Proxy that forwards property access to the real client, built on first use.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
