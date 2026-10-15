import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, NotebookPen, ListChecks, ArrowRight } from "lucide-react";
import { Card, PageHeader, PriorityBadge } from "@/components/app-ui";
import { useEmails, useMeetings, useTasks, useUpdateTask, priorityRank } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Productivity" },
      { name: "description", content: "Your tasks, meetings and emails at a glance." },
      { property: "og:title", content: "Dashboard — AI Productivity" },
      { property: "og:description", content: "Your tasks, meetings and emails at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const tasks = useTasks().data ?? [];
  const meetings = useMeetings().data ?? [];
  const emails = useEmails().data ?? [];
  const update = useUpdateTask();
  const open = tasks.filter((t) => t.status !== "done");
  const today = new Date().toISOString().slice(0, 10);
  const due = open
    .filter((t) => t.due_date && t.due_date <= today)
    .length;
  const focus = [...open]
    .sort((a, b) => (priorityRank[a.priority] - priorityRank[b.priority]) || (a.due_date ?? "9").localeCompare(b.due_date ?? "9"))
    .slice(0, 6);

  const stats = [
    { label: "Open tasks", value: open.length, to: "/tasks" as const, icon: ListChecks },
    { label: "Due today or overdue", value: due, to: "/tasks" as const, icon: ListChecks },
    { label: "Meetings summarized", value: meetings.length, to: "/meetings" as const, icon: NotebookPen },
    { label: "Emails drafted", value: emails.length, to: "/emails" as const, icon: Mail },
  ];

  return (
    <>
      <PageHeader title="Good to see you" sub="Here's what needs your attention." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="surface p-4 hover:border-primary transition-colors">
            <s.icon className="size-4 text-primary" />
            <div className="text-3xl font-display mt-2">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl">Focus list</h2>
            <Link to="/tasks" className="text-sm text-primary flex items-center gap-1">All tasks <ArrowRight className="size-3" /></Link>
          </div>
          {focus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nothing pending. Plan something in Tasks.</p>
          ) : (
            <ul className="divide-y">
              {focus.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <Checkbox checked={false} onCheckedChange={() => update.mutate({ id: t.id, status: "done" })} aria-label={`Complete ${t.title}`} />
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  {t.due_date && <span className="text-xs text-muted-foreground">{t.due_date}</span>}
                  <PriorityBadge p={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl">Recent meetings</h2>
            <Link to="/meetings" className="text-sm text-primary flex items-center gap-1">Summarize <ArrowRight className="size-3" /></Link>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Paste your first meeting notes.</p>
          ) : (
            <ul className="space-y-3">
              {meetings.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <div className="font-medium text-sm">{m.title}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
