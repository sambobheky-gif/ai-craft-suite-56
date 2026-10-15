import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, NotebookPen, ListChecks, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Productivity — Emails, meetings & tasks with AI" },
      { name: "description", content: "Write emails, summarize meetings and plan tasks with AI, all in one dashboard." },
      { property: "og:title", content: "AI Productivity" },
      { property: "og:description", content: "Write emails, summarize meetings and plan tasks with AI, all in one dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up" && !data.session) toast.success("Check your inbox to confirm your email.");
  }

  const features = [
    { icon: Mail, t: "Smart Email Generator", d: "Professional emails from a topic, purpose and tone." },
    { icon: NotebookPen, t: "Meeting Summarizer", d: "Key points, decisions and action items in seconds." },
    { icon: ListChecks, t: "AI Task Planner", d: "Turn goals into prioritized, scheduled tasks." },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="bg-hero text-sidebar-foreground p-8 sm:p-14 flex flex-col justify-between gap-12">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-sidebar-primary" /> AI Productivity
        </div>
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl sm:text-6xl leading-[1.05]">
            Less busywork.<br />
            <span className="text-sidebar-primary italic">More done.</span>
          </h1>
          <p className="text-lg opacity-80">
            Three AI tools that talk to each other — meeting action items become tasks, summaries become follow-up emails.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: I, t, d }) => (
            <li key={t} className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
              <I className="size-5 text-sidebar-primary mb-2" />
              <div className="font-semibold text-sm">{t}</div>
              <div className="text-xs opacity-70 mt-1">{d}</div>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-3xl">{mode === "in" ? "Welcome back" : "Create your account"}</h2>
            <p className="text-muted-foreground text-sm mt-1">Your workspace is private to you.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </Button>
          <button type="button" className="text-sm text-muted-foreground hover:text-foreground w-full" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
