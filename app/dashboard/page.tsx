import { supabaseAdmin } from "../_lib/supabaseAdmin";
import { daysAgoIso } from "../_lib/dates";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const thirtyDaysAgo = daysAgoIso(30);

  const [programsRes, linksRes, clicksRes, conversionsRes, recentClicksRes] = await Promise.all([
    supabaseAdmin.from("affiliate_programs").select("id, status"),
    supabaseAdmin.from("affiliate_links").select("id, active"),
    supabaseAdmin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .gte("clicked_at", thirtyDaysAgo),
    supabaseAdmin.from("affiliate_conversions").select("amount, converted_at"),
    supabaseAdmin
      .from("affiliate_clicks")
      .select("clicked_at, affiliate_links(label, slug)")
      .order("clicked_at", { ascending: false })
      .limit(8),
  ]);

  const activePrograms = (programsRes.data || []).filter((p) => p.status === "active").length;
  const totalLinks = (linksRes.data || []).length;
  const clicksLast30Days = clicksRes.count || 0;
  const totalEarned = (conversionsRes.data || []).reduce((sum, c) => sum + Number(c.amount), 0);
  const earnedLast30Days = (conversionsRes.data || [])
    .filter((c) => c.converted_at >= thirtyDaysAgo)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const recentClicks = recentClicksRes.data || [];

  return (
    <div>
      <h1 className="text-xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-neutral-500">Your affiliate business at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Programs" value={String(activePrograms)} />
        <StatCard label="Tracked Links" value={String(totalLinks)} />
        <StatCard label="Clicks (30d)" value={String(clicksLast30Days)} />
        <StatCard label="Earned (30d)" value={`$${earnedLast30Days.toFixed(2)}`} />
      </div>

      <div className="mt-4">
        <StatCard label="Lifetime Earnings" value={`$${totalEarned.toFixed(2)}`} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-500">Recent clicks</h2>
        <ul className="mt-3 space-y-2">
          {recentClicks.map((c, i) => {
            const link = (
              c as unknown as { affiliate_links?: { label: string | null; slug: string } }
            ).affiliate_links;
            return (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm"
              >
                <span>{link?.label || `/r/${link?.slug}`}</span>
                <span className="text-neutral-500">
                  {new Date(c.clicked_at).toLocaleString()}
                </span>
              </li>
            );
          })}
          {recentClicks.length === 0 && (
            <p className="text-sm text-neutral-500">No clicks recorded yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
