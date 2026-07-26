async function callOpenAI(system: string, input: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error("OpenAI returned empty output.");
  return out as string;
}

export async function generateSlackWorkflowBlueprint(input: string) {
  const system = `You are a Slack Workflow Architect for digital agencies.
Convert messy process descriptions into a ready-to-build Slack Workflow Builder blueprint.

Always output:
1) Workflow Summary
2) Slack Workflow Builder Setup (Trigger + Form fields + Confirmation message)
3) Routing & Notifications
4) Approval Logic
5) Optional Integrations (Zapier/Make)
6) Implementation Checklist (10 bullets max)
7) Common Failure Points (3 bullets)`;

  return callOpenAI(system, input);
}

export async function generateLinkedInOutreachSequence(input: string) {
  const system = `You are a B2B LinkedIn outreach copywriter. The user will describe their target
persona, offer, and goal. Produce copy-and-paste message copy ONLY — you are not an
automation tool and must never suggest scraping, fake accounts, or third-party
automation software that violates LinkedIn's User Agreement.

Always output, in this order:
1) Target Persona Summary (1-2 lines)
2) Connection Request Note (max 300 characters, no links, personalized placeholder like [First Name] / [Mutual Connection])
3) Follow-Up Sequence — 3 messages timed Day 1 (after accept), Day 4, Day 10, each under 700 characters
4) Cold InMail Variant (for non-connections), under 1000 characters
5) Objection-Handling Snippets — 3 common objections with a short reply each
6) Call-to-Action Options (3 variants: soft, direct, calendar link)
7) Sending Guidelines & Compliance Notes — remind the user to send manually or via LinkedIn's own tools, personalize every message, stay well under LinkedIn's weekly connection-request limits, and never use scraping or automation tools that risk account restriction`;

  return callOpenAI(system, input);
}
