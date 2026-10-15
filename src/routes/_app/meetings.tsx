import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, ListPlus, Mail, Trash2 } from "lucide-react";
import { Card, PageHeader, PriorityBadge } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { summarizeMeeting } from "@/lib/ai.functions";
import { useAddTasks, useDelete, useMeetings, addDays, type ActionItem, type Meeting } from "@/lib/data";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — AI Productivity" },
      { name: "description", content: "Summarize meeting notes into key points, decisions and action items." },
      { property: "og:title", content: "Meeting Summarizer — AI Productivity" },
      { property: "og:description", content: "Summarize meeting notes into key points, decisions and action items." },
    ],
  }),
  component: Meetings,
});

function Meetings() {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const meetings = useMeetings().data ?? [];

  async function run() {
    setBusy(true);
    try {
      const r = await summarizeMeeting({ data: { notes } });
      const { error } = await supabase.from("meetings").insert({ ...r, notes });
      if (error) throw error;
      setNotes("");
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting summarized");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Meeting Notes" sub="Paste raw notes or a transcript — get the essentials." />
      <Card className="mb-6 space-y-3">
        <Textarea rows={8} placeholder="e.g. Sync with design team. Sara will finalize mockups by Friday. We agreed to ship v2 in March…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={run} disabled={busy || notes.trim().length < 10}>
            <Sparkles className="size-4" /> {busy ? "Summarizing…" : "Summarize"}
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        {meetings.map((m) => <MeetingCard key={m.id} m={m} />)}
      </div>
    </>
  );
}

function MeetingCard({ m }: { m: Meeting }) {
  const navigate = useNavigate();
  const addTasks = useAddTasks();
  const del = useDelete("meetings");
  const items = (m.action_items as ActionItem[]) ?? [];
  const keyPoints = (m.key_points as string[]) ?? [];
  const decisions = (m.decisions as string[]) ?? [];

  function toTasks() {
    addTasks.mutate(
      items.map((a) => ({
        title: a.task,
        description: a.owner && a.owner !== "Unassigned" ? `Owner: ${a.owner}` : "",
        priority: a.priority,
        category: m.title,
        meeting_id: m.id,
        due_date: addDays(a.priority === "high" ? 1 : a.priority === "medium" ? 3 : 7),
      })),
      { onSuccess: () => toast.success(`${items.length} tasks added`), onError: (e) => toast.error(e.message) },
    );
  }

  return (
    <Card>
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-xl">{m.title}</h2>
          <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Delete meeting" onClick={() => del.mutate(m.id)}><Trash2 className="size-4" /></Button>
      </div>
      <p className="mt-3 text-sm">{m.summary}</p>
      <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
        <Section title="Key points" items={keyPoints} />
        <Section title="Decisions" items={decisions} />
      </div>
      {items.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-sans font-semibold mb-2">Action items</h3>
          <ul className="space-y-1.5">
            {items.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <PriorityBadge p={a.priority} /> <span className="flex-1">{a.task}</span>
                <span className="text-xs text-muted-foreground">{a.owner}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-5">
        {items.length > 0 && (
          <Button variant="secondary" size="sm" onClick={toTasks} disabled={addTasks.isPending}>
            <ListPlus className="size-4" /> Add action items to tasks
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => navigate({ to: "/emails", search: { meeting: m.id } })}>
          <Mail className="size-4" /> Draft follow-up email
        </Button>
      </div>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-sans font-semibold mb-1">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}
