import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../_lib/supabaseAdmin";
import { CONTENT_TYPES } from "../../../_lib/openai";

export default async function SharedContentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data } = await supabaseAdmin
    .from("affiliate_content")
    .select("content_type, niche, product, output_text, created_at")
    .eq("share_token", token)
    .single();

  if (!data) notFound();

  const typeLabel =
    CONTENT_TYPES.find((t) => t.value === data.content_type)?.label || data.content_type;

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {typeLabel}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {data.product || data.niche || "Affiliate Content"}
        </h1>
        <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {data.output_text}
        </pre>
      </div>
    </main>
  );
}
