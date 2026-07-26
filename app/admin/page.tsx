import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "../_lib/adminAuth";
import { supabaseAdmin } from "../_lib/supabaseAdmin";
import type { TradeIn } from "../_lib/types";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";

async function getTradeIns(): Promise<{ tradeIns: TradeIn[]; configError: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("trade_ins")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return { tradeIns: [], configError: error.message };
    }
    return { tradeIns: data as TradeIn[], configError: null };
  } catch (err) {
    return {
      tradeIns: [],
      configError: err instanceof Error ? err.message : "Server error",
    };
  }
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <AdminLogin />
      </main>
    );
  }

  const { tradeIns, configError } = await getTradeIns();

  if (configError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Not connected to a database yet.</p>
          <p className="mt-1">{configError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminDashboard tradeIns={tradeIns} />
    </main>
  );
}
