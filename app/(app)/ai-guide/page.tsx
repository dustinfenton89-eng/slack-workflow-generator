"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Disclaimer, PageShell, Textarea } from "../../_components/ui";
import { errorMessage } from "../../_lib/errorMessage";

type Message = { id?: string; role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "Explain the difference between a call and a put like I'm brand new to this.",
  "What is IV rank and why does it matter for choosing a strategy?",
  "Walk me through how theta decay affects a long option vs a short option.",
  "How do I think about position sizing in a paper trading account?",
];

export default function AiGuidePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const res = await fetch("/api/ai/chat");
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function send(content: string) {
    if (!content.trim() || loading) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-bold text-zinc-100">AI trading guide</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Ask about concepts, get feedback on ideas, or work through what a setup means. Educational only — this coach
        never tells you what to trade.
      </p>

      <Card className="mt-6 flex h-[60vh] flex-col">
        <div className="flex-1 overflow-y-auto pr-1">
          {historyLoading && <p className="text-sm text-zinc-500">Loading conversation...</p>}
          {!historyLoading && messages.length === 0 && (
            <div className="grid gap-2">
              <p className="text-sm text-zinc-500">Try asking:</p>
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-300 hover:border-emerald-700 hover:text-emerald-400"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-3">
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-emerald-500 text-black"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="max-w-[85%] rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-400">Thinking...</div>}
          </div>
          <div ref={bottomRef} />
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask the AI guide anything about options trading..."
            rows={2}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            Send
          </Button>
        </form>
      </Card>

      <Disclaimer />
    </PageShell>
  );
}
