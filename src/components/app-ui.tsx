import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {sub && <p className="text-muted-foreground mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const pri: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/30 text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

export function PriorityBadge({ p }: { p: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", pri[p] ?? pri["low"])}>{p}</span>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface p-5", className)}>{children}</div>;
}
