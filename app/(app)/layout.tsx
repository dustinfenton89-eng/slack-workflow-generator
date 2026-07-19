import type { ReactNode } from "react";
import NavBar from "../_components/NavBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <NavBar />
      {children}
    </div>
  );
}
