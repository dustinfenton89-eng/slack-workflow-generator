"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../_lib/supabaseBrowser";
import { Button, Card, Input } from "./ui";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = supabaseBrowser();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      setNotice(
        "Account created. Check your email to confirm, then sign in below. You'll start with a $100,000 paper trading balance."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="text-xl font-bold text-zinc-100">
        {mode === "login" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {mode === "login"
          ? "Welcome back to your paper trading desk."
          : "Get a free $100,000 simulated account. No real money, ever."}
      </p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button disabled={loading} type="submit">
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-400">{notice}</p>}

      <p className="mt-5 text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <a href="/signup" className="text-emerald-400 hover:underline">
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="text-emerald-400 hover:underline">
              Sign in
            </a>
          </>
        )}
      </p>
    </Card>
  );
}
