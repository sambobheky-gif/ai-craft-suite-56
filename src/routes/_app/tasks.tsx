import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { Card, PageHeader, PriorityBadge } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { planTasks } from "@/lib/ai.functions";
import { addDays, priorityRank, useAddTasks, useDelete, useTasks, useUpdateTask } from "@/lib/data";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Productivity" },
      { name: "description", content: "Create, prioritize and schedule tasks with AI." },
      { property: "og:title", content: "AI Task Planner — AI Productivity" },
      { property: "og:description", content: "Create, prioritize and schedule tasks with AI." },
    ],
  }),
  component: Tasks,
});

function Tasks() {
  const tasks = useTasks().data ?? [];
  const add = useAddTasks();
  const update = useUpdateTask();
  const del = useDelete("tasks");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("open");

  async function plan() {
    setBusy(true);
    try {
      const r = await planTasks({ data: { goal, today: new Date().toISOString().slice(0, 10) } });
      await add.mutateAsync(r.tasks.map((t) => ({ title: t.title, description: t.description, priority: t.priority, category: t.category, due_date: addDays(t.due_in_days) })));
      setGoal("");
      toast.success(`${r.tasks.length} tasks planned`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    add.mutate([{ title, priority, due_date: due || null }], { onSuccess: () => { setTitle(""); setDue(""); } });
  }

  const shown = useMemo(() => {
    const f = tasks.filter((t) => (filter === "all" ? true : filter === "done" ? t.status === "done" : t.status !== "done"));
    return f.sort((a, b) => (priorityRank[a.priority] - priorityRank[b.priority]) || (a.due_date ?? "9").localeCompare(b.due_date ?? "9"));
  }, [tasks, filter]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Task Planner" sub="Brain-dump a goal and let AI break it down, or add tasks yourself." />
      <Card className="mb-4 space-y-3">
        <Textarea rows={3} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Launch the new pricing page by end of next week" />
        <div className="flex justify-end">
          <Button onClick={plan} disabled={busy || goal.trim().length < 3}><Sparkles className="size-4" /> {busy ? "Planning…" : "Plan with AI"}</Button>
        </div>
      </Card>
      <form onSubmit={quickAdd} className="surface p-3 mb-6 flex flex-wrap gap-2">
        <Input className="flex-1 min-w-48" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
        </Select>
        <Input type="date" className="w-40" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <Button type="submit" variant="secondary"><Plus className="size-4" /> Add</Button>
      </form>
      <Tabs value={filter} onValueChange={setFilter} className="mb-3">
        <TabsList><TabsTrigger value="open">Open</TabsTrigger><TabsTrigger value="done">Done</TabsTrigger><TabsTrigger value="all">All</TabsTrigger></TabsList>
      </Tabs>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No tasks here yet.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((t) => (
            <Card key={t.id} className="p-4 flex items-start gap-3">
              <Checkbox className="mt-1" checked={t.status === "done"} onCheckedChange={(c) => update.mutate({ id: t.id, status: c ? "done" : "todo" })} aria-label="Toggle done" />
              <div className="flex-1 min-w-0">
                <div className={t.status === "done" ? "line-through text-muted-foreground text-sm" : "text-sm font-medium"}>{t.title}</div>
                {t.description && <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <PriorityBadge p={t.priority} />
                  {t.category && <span className="text-xs text-muted-foreground">{t.category}</span>}
                  {t.due_date && <span className={`text-xs ${t.status !== "done" && t.due_date < today ? "text-destructive font-semibold" : "text-muted-foreground"}`}>Due {t.due_date}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Delete task" onClick={() => del.mutate(t.id)}><Trash2 className="size-4" /></Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
