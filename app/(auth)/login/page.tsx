import AuthForm from "../../_components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4">
      <AuthForm mode="login" />
    </main>
  );
}
