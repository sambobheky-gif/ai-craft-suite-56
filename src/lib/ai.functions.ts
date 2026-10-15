import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ai() {
  return import("./ai.server");
}

const emailOut = z.object({ subject: z.string(), body: z.string() });

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topic: string; purpose: string; tone: string; context?: string | undefined }) =>
    z
      .object({
        topic: z.string().min(1).max(500),
        purpose: z.string().max(1000),
        tone: z.string().max(50),
        context: z.string().max(20000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { generateStructured } = await ai();
    return generateStructured(
      emailOut,
      "You write clear, professional emails. Return a concise subject and a complete email body with greeting and sign-off. Use [Name] placeholders where names are unknown. Plain text only.",
      `Topic: ${data.topic}\nPurpose: ${data.purpose}\nTone: ${data.tone}${data.context ? `\n\nContext (meeting summary):\n${data.context}` : ""}`,
    );
  });

const meetingOut = z.object({
  title: z.string(),
  summary: z.string(),
  key_points: z.array(z.string()),
  decisions: z.array(z.string()),
  action_items: z.array(
    z.object({ task: z.string(), owner: z.string(), priority: z.enum(["high", "medium", "low"]) }),
  ),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { notes: string }) => z.object({ notes: z.string().min(10).max(50000) }).parse(d))
  .handler(async ({ data }) => {
    const { generateStructured } = await ai();
    return generateStructured(
      meetingOut,
      "You summarize meeting notes. Give a short title, a 2-4 sentence summary, key points, decisions made, and concrete action items (owner is a name or 'Unassigned').",
      data.notes,
    );
  });

const planOut = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      category: z.string(),
      due_in_days: z.number(),
    }),
  ),
});

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goal: string; today: string }) =>
    z.object({ goal: z.string().min(3).max(5000), today: z.string().max(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateStructured } = await ai();
    const res = await generateStructured(
      planOut,
      "You are a productivity planner. Break the user's goal or brain-dump into 3-8 actionable tasks, prioritize them, group by a short category, and schedule each with due_in_days (0 = today) relative to today.",
      `Today: ${data.today}\n\n${data.goal}`,
    );
    return { tasks: res.tasks.slice(0, 10).map((t) => ({ ...t, due_in_days: Math.max(0, Math.round(t.due_in_days)) })) };
  });
