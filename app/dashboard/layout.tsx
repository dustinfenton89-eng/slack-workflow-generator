import Nav from "./Nav";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        <aside className="w-56 shrink-0">
          <p className="px-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Affiliate Command Center
          </p>
          <div className="mt-6">
            <Nav />
          </div>
          <div className="mt-6 px-3">
            <LogoutButton />
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
