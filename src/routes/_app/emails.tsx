import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Copy, Trash2 } from "lucide-react";
import { z } from "zod";
import { Card, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateEmail } from "@/lib/ai.functions";
import { useDelete, useEmails, useMeetings, type ActionItem } from "@/lib/data";

export const Route = createFileRoute("/_app/emails")({
  validateSearch: z.object({ meeting: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Productivity" },
      { name: "description", content: "Generate professional emails from a topic, purpose and tone." },
      { property: "og:title", content: "Smart Email Generator — AI Productivity" },
      { property: "og:description", content: "Generate professional emails from a topic, purpose and tone." },
    ],
  }),
  component: Emails,
});

const tones = ["Professional", "Friendly", "Formal", "Persuasive", "Apologetic", "Concise"];

function Emails() {
  const { meeting } = Route.useSearch();
  const meetings = useMeetings().data ?? [];
  const emails = useEmails().data ?? [];
  const del = useDelete("emails");
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("Professional");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const linked = meetings.find((m) => m.id === meeting);

  useEffect(() => {
    if (linked) {
      setTopic(`Follow-up: ${linked.title}`);
      setPurpose("Recap the meeting, confirm decisions and list action items with owners.");
    }
  }, [linked]);

  async function run() {
    setBusy(true);
    try {
      const context = linked
        ? `${linked.summary}\nDecisions: ${(linked.decisions as string[]).join("; ")}\nAction items: ${(linked.action_items as ActionItem[]).map((a) => `${a.task} (${a.owner})`).join("; ")}`
        : undefined;
      const r = await generateEmail({ data: { topic, purpose, tone, context } });
      setDraft(r);
      await supabase.from("emails").insert({ topic, purpose, tone, ...r, meeting_id: linked?.id ?? null });
      qc.invalidateQueries({ queryKey: ["emails"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function copy(s: string, b: string) {
    navigator.clipboard.writeText(`Subject: ${s}\n\n${b}`);
    toast.success("Copied to clipboard");
  }

  return (
    <>
      <PageHeader title="Email Generator" sub={linked ? `Using summary from “${linked.title}”` : "Describe it — get a polished draft."} />
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <Card className="space-y-4">
          <div className="space-y-2"><Label htmlFor="topic">Topic</Label><Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Project deadline extension" /></div>
          <div className="space-y-2"><Label htmlFor="purpose">Purpose</Label><Textarea id="purpose" rows={4} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Ask the client for one more week and explain why" /></div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={busy || !topic.trim()} className="w-full"><Sparkles className="size-4" /> {busy ? "Writing…" : "Generate email"}</Button>
        </Card>
        <Card className="min-h-64">
          {draft ? (
            <div className="space-y-3">
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="font-semibold" />
              <Textarea rows={14} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              <Button variant="secondary" size="sm" onClick={() => copy(draft.subject, draft.body)}><Copy className="size-4" /> Copy</Button>
            </div>
          ) : (
            <div className="h-full grid place-items-center text-sm text-muted-foreground text-center">Your draft will appear here.</div>
          )}
        </Card>
      </div>
      {emails.length > 0 && (
        <>
          <h2 className="text-2xl mb-3">History</h2>
          <div className="space-y-2">
            {emails.map((e) => (
              <Card key={e.id} className="p-4 flex items-center gap-3">
                <button className="flex-1 text-left min-w-0" onClick={() => setDraft({ subject: e.subject, body: e.body })}>
                  <div className="font-medium text-sm truncate">{e.subject}</div>
                  <div className="text-xs text-muted-foreground">{e.tone} · {new Date(e.created_at).toLocaleDateString()}</div>
                </button>
                <Button variant="ghost" size="icon" aria-label="Copy" onClick={() => copy(e.subject, e.body)}><Copy className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => del.mutate(e.id)}><Trash2 className="size-4" /></Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
