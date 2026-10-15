import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Mail, NotebookPen, ListChecks, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/meetings", label: "Meetings", icon: NotebookPen },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
] as const;

function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 gap-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-sidebar-primary" /> AI Productivity
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: I }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent !opacity-100 text-sidebar-primary" }}
            >
              <I className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 text-xs">
          <div className="opacity-60 truncate">{session.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 opacity-80 hover:opacity-100">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div className="mx-auto max-w-5xl p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground grid grid-cols-5 border-t border-sidebar-border">
        {nav.map(({ to, label, icon: I }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] opacity-70" activeProps={{ className: "!opacity-100 text-sidebar-primary" }}>
            <I className="size-5" /> {label}
          </Link>
        ))}
        <button onClick={() => supabase.auth.signOut()} className="flex flex-col items-center gap-1 py-2.5 text-[11px] opacity-70">
          <LogOut className="size-5" /> Sign out
        </button>
      </nav>
    </div>
  );
}
