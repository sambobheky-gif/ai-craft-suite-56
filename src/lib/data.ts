import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type Email = Database["public"]["Tables"]["emails"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type ActionItem = { task: string; owner: string; priority: "high" | "medium" | "low" };

function list<T extends "tasks" | "meetings" | "emails">(table: T) {
  return async () => {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };
}

export const useTasks = () => useQuery({ queryKey: ["tasks"], queryFn: list("tasks") });
export const useMeetings = () => useQuery({ queryKey: ["meetings"], queryFn: list("meetings") });
export const useEmails = () => useQuery({ queryKey: ["emails"], queryFn: list("emails") });

export function useAddTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: TaskInsert[]) => {
      const { error } = await supabase.from("tasks").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDelete(table: "tasks" | "meetings" | "emails") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

const ranks: Record<string, number> = { high: 0, medium: 1, low: 2 };
export const priorityRank = (p: string) => ranks[p] ?? 1;

export function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
