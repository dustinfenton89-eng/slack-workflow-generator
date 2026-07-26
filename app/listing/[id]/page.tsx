import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { formatCents, type Listing, type Order } from "../../_lib/types";
import ListingActions from "./ListingActions";

export const dynamic = "force-dynamic";

async function getListing(id: string): Promise<Listing | null> {
  const { data } = await supabaseAdmin.from("listings").select("*").eq("id", id).single();
  return (data as Listing) || null;
}

async function getLatestOrder(listingId: string): Promise<Order | null> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Order) || null;
}

const PAYMENT_LABELS: Record<string, string> = {
  venmo_username: "Venmo",
  paypal_username: "PayPal",
  cashapp_cashtag: "Cash App",
  zelle_contact: "Zelle",
};

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seller_token?: string }>;
}) {
  const { id } = await params;
  const { seller_token: sellerTokenParam } = await searchParams;

  const listing = await getListing(id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">Listing not found. It may have been removed.</p>
      </main>
    );
  }

  const isSeller = !!sellerTokenParam && sellerTokenParam === listing.seller_token;
  const latestOrder = isSeller ? await getLatestOrder(listing.id) : null;

  const paymentMethods = (["venmo_username", "paypal_username", "cashapp_cashtag", "zelle_contact"] as const)
    .filter((key) => listing[key])
    .map((key) => PAYMENT_LABELS[key]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {listing.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.photo_url} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl">🖩</span>
          )}
        </div>

        <div>
          {isSeller && (
            <div className="mb-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
              You&rsquo;re viewing this as the seller
            </div>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight">{listing.title}</h1>
          <p className="mt-1 text-slate-500">
            {listing.brand} {listing.model} · {listing.condition}
          </p>
          <p className="mt-4 text-3xl font-extrabold">{formatCents(listing.price_cents)}</p>

          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{listing.description}</p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
            Accepts {paymentMethods.join(", ")}
          </p>

          <ListingActions
            listingId={listing.id}
            status={listing.status}
            isSeller={isSeller}
            sellerToken={sellerTokenParam || ""}
            latestOrderId={latestOrder?.id || null}
          />
        </div>
      </div>
    </main>
  );
}
