import type { Leg, StrategyAnalysis } from "./strategyMath";

const COACH_SYSTEM_PROMPT = `You are an options trading coach embedded in a paper-trading (simulated money) education app.

Your job:
- Teach options concepts clearly (calls, puts, spreads, greeks, IV, theta decay, risk/reward) at whatever level the user is at.
- Give balanced, educational feedback on strategies and trade ideas the user shares, including risks and what could go wrong — never one-sided hype.
- When given portfolio or market context, ground your answer in the specific numbers provided rather than generic advice.
- Never give personalized financial advice, never say "you should buy/sell X now", and never imply certainty about future price moves. Frame suggestions as "one way to think about this" or "worth considering", and note real trade-offs.
- Keep responses focused and practical. Use short paragraphs or bullet points over long essays.
- Always remember: everything in this app is simulated (paper) trading. Remind the user of that when relevant, especially if they ask about real-money execution.`;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function callOpenAI(messages: ChatMessage[], temperature = 0.4): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
      messages,
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error("OpenAI returned empty output.");
  return out as string;
}

export async function generateCoachReply(history: ChatMessage[], contextNote?: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    ...(contextNote ? [{ role: "system" as const, content: contextNote }] : []),
    ...history,
  ];
  return callOpenAI(messages);
}

export async function generateStrategyFeedback(input: {
  underlying: string;
  legs: Leg[];
  analysis: StrategyAnalysis;
  notes?: string | null;
}): Promise<string> {
  const legsDesc = input.legs
    .map((l) => `${l.side} ${l.type} @ strike $${l.strike}, premium $${l.premium}, qty ${l.quantity}`)
    .join("; ");

  const prompt = `A user built this options strategy on ${input.underlying}:
Legs: ${legsDesc}
Computed max profit: ${input.analysis.maxProfit}
Computed max loss: ${input.analysis.maxLoss}
Breakeven price(s): ${input.analysis.breakevens.join(", ") || "none found"}
Net credit/debit at open: ${input.analysis.netCredit} (positive = credit received, negative = debit paid)
${input.notes ? `User notes: ${input.notes}` : ""}

Give a short (4-6 sentence) educational review: what market view this strategy expresses, the main risk, and one or two things a beginner might overlook about it. Do not tell them whether to place the trade.`;

  return callOpenAI([
    { role: "system", content: COACH_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);
}
