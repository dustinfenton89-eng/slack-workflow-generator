import { supabaseAdmin } from "../../_lib/supabaseAdmin";
import { formatCents, type Listing, type Order } from "../../_lib/types";
import OrderView from "./OrderView";

export const dynamic = "force-dynamic";

async function getOrder(id: string): Promise<Order | null> {
  const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
  return (data as Order) || null;
}

async function getListing(id: string): Promise<Listing | null> {
  const { data } = await supabaseAdmin.from("listings").select("*").eq("id", id).single();
  return (data as Listing) || null;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const order = await getOrder(id);
  if (!order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">Order not found.</p>
      </main>
    );
  }

  const listing = await getListing(order.listing_id);
  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">The listing for this order could not be found.</p>
      </main>
    );
  }

  let role: "buyer" | "seller" | null = null;
  if (token && token === order.buyer_token) role = "buyer";
  else if (token && token === listing.seller_token) role = "seller";

  if (!role) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-600">
          This link is missing or has an invalid access token. Use the link you
          received when the order was placed.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Order #{order.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-slate-500">
        {listing.title} · {formatCents(order.amount_cents)}
      </p>

      <OrderView order={order} listing={listing} role={role} token={token!} />
    </main>
  );
}
