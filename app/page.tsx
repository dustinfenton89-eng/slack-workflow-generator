import { supabaseAdmin } from "./_lib/supabaseAdmin";
import { formatCents, type Listing } from "./_lib/types";

export const dynamic = "force-dynamic";

async function getListings(): Promise<{ listings: Listing[]; configError: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      return { listings: [], configError: error.message };
    }
    return { listings: data as Listing[], configError: null };
  } catch (err) {
    return {
      listings: [],
      configError: err instanceof Error ? err.message : "Server error",
    };
  }
}

export default async function Home() {
  const { listings, configError } = await getListings();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Sell your graphing calculator. Get paid instantly.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          List a TI-84, TI-Nspire, Casio, or HP calculator, get paid straight
          to your Venmo, PayPal, Cash App, or Zelle, then ship it with a free
          shipping label — no meetups, no cash, no hassle.
        </p>
      </section>

      {configError ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">CalcSwap isn&rsquo;t connected to a database yet.</p>
          <p className="mt-1">
            Set the <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variables (see{" "}
            <code>supabase/schema.sql</code> for the schema to run), then reload this page.
          </p>
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">
            No calculators listed yet. Be the first to{" "}
            <a href="/sell" className="font-semibold text-indigo-600 hover:underline">
              sell one
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <a
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
                {listing.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photo_url}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🖩</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600">
                    {listing.title}
                  </h2>
                  <span className="whitespace-nowrap font-bold text-slate-900">
                    {formatCents(listing.price_cents)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {listing.brand} {listing.model} · {listing.condition}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
