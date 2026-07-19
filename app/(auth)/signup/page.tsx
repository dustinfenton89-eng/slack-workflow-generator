import AuthForm from "../../_components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4">
      <AuthForm mode="signup" />
    </main>
  );
}
