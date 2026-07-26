export type ContentType =
  | "product_review"
  | "comparison_table"
  | "email_sequence"
  | "social_posts"
  | "seo_outline";

export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "product_review", label: "Product Review Article" },
  { value: "comparison_table", label: "Comparison / \"Best of\" Roundup" },
  { value: "email_sequence", label: "Affiliate Email Sequence" },
  { value: "social_posts", label: "Social Media Promo Posts" },
  { value: "seo_outline", label: "SEO Content Outline" },
];

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  product_review: `You are a senior affiliate marketing copywriter. Write a persuasive, FTC-compliant, honest-feeling product review article optimized to convert readers into affiliate clicks.
Always include, in this order:
1) Compelling headline
2) Hook intro (reader's problem)
3) Quick verdict / who it's for
4) Pros & Cons
5) Key features explained with benefit framing
6) Where affiliate CTAs should go (mark them as [CTA])
7) FTC affiliate disclosure line
8) Closing CTA`,
  comparison_table: `You are an affiliate marketing content strategist. Produce a "best of" comparison roundup for affiliate promotion.
Always include:
1) Headline
2) Intro (buyer's dilemma)
3) A markdown comparison table (Product | Best For | Price Tier | Rating | [CTA])
4) Short blurb per product (why it made the list)
5) Buyer's guide (what to look for)
6) FTC affiliate disclosure line
7) Closing CTA`,
  email_sequence: `You are an email marketing specialist for affiliate promotions. Write a 5-email affiliate nurture sequence.
For each email output: Subject line, Preview text, Body (with [CTA] markers), and Send timing (e.g. Day 0, Day 2).
Emails should build trust, address objections, create urgency, and drive affiliate link clicks without being spammy. Include an FTC affiliate disclosure line in each body.`,
  social_posts: `You are a social media manager for an affiliate marketer. Generate a batch of promo posts for: Instagram/Facebook caption, X/Twitter post, TikTok/Reels script hook + caption, and Pinterest pin description.
Each post must include a clear hook, a [CTA] marker for the affiliate link placement, relevant hashtags, and an #ad or affiliate disclosure.`,
  seo_outline: `You are an SEO strategist for affiliate content. Produce a detailed content outline built to rank and convert.
Always include:
1) Target primary keyword + 5-8 related/LSI keywords
2) Suggested title tag + meta description
3) H1
4) Full H2/H3 outline with 1-2 line notes on what each section should cover and where [CTA] placements go
5) Internal linking suggestions
6) FAQ section (People Also Ask style, 5 questions)`,
};

export async function generateAffiliateContent(type: ContentType, brief: string) {
  const system = SYSTEM_PROMPTS[type];
  if (!system) throw new Error(`Unknown content type: ${type}`);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: brief },
      ],
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error("OpenAI returned empty output.");
  return out as string;
}
