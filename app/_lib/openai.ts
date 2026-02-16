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
