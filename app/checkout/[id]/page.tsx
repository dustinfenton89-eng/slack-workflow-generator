import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { formatCents, type Listing, type PaymentMethod } from "../../_lib/types";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

async function getListing(id: string): Promise<Listing | null> {
  const { data } = await supabaseAdmin.from("listings").select("*").eq("id", id).single();
  return (data as Listing) || null;
}

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">Listing not found.</p>
      </main>
    );
  }

  if (listing.status !== "available") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">This item is no longer available.</p>
      </main>
    );
  }

  const availableMethods: { method: PaymentMethod; handle: string }[] = [
    listing.venmo_username && { method: "venmo" as const, handle: listing.venmo_username },
    listing.paypal_username && { method: "paypal" as const, handle: listing.paypal_username },
    listing.cashapp_cashtag && { method: "cashapp" as const, handle: listing.cashapp_cashtag },
    listing.zelle_contact && { method: "zelle" as const, handle: listing.zelle_contact },
  ].filter(Boolean) as { method: PaymentMethod; handle: string }[];

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="font-semibold">{listing.title}</p>
          <p className="text-sm text-slate-500">
            {listing.brand} {listing.model} · {listing.condition}
          </p>
        </div>
        <p className="text-xl font-extrabold">{formatCents(listing.price_cents)}</p>
      </div>

      <CheckoutForm listingId={listing.id} availableMethods={availableMethods} />
    </main>
  );
}
