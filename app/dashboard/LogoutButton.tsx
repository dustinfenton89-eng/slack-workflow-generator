"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      Sign out
    </button>
  );
}
