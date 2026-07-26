"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ListingStatus } from "../../_lib/types";

export default function ListingActions({
  listingId,
  status,
  isSeller,
  sellerToken,
  latestOrderId,
}: {
  listingId: string;
  status: ListingStatus;
  isSeller: boolean;
  sellerToken: string;
  latestOrderId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeListing() {
    if (!confirm("Remove this listing? Buyers will no longer be able to purchase it.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerToken, status: "removed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to remove listing.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  }

  if (isSeller) {
    return (
      <div className="mt-6 grid gap-3">
        <p className="text-sm font-semibold text-slate-700">
          Status: <span className="capitalize">{status}</span>
        </p>
        {latestOrderId && (
          <a
            href={`/orders/${latestOrderId}?token=${sellerToken}`}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-indigo-700"
          >
            View order & get shipping label
          </a>
        )}
        {status === "available" && (
          <button
            onClick={removeListing}
            disabled={loading}
            className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {loading ? "Removing..." : "Remove listing"}
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (status !== "available") {
    return (
      <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
        This item is no longer available.
      </p>
    );
  }

  return (
    <a
      href={`/checkout/${listingId}`}
      className="mt-6 block rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-indigo-700"
    >
      Buy now
    </a>
  );
}
