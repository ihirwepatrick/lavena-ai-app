"use client";

import type { ChildReminder } from "@/lib/children/reminders";
import { cn } from "@/lib/utils";
import { AlertCircle, Apple, Calendar, Syringe } from "lucide-react";

const URGENCY_STYLES = {
  overdue: "border-red-500/30 bg-red-500/5",
  today: "border-amber-500/40 bg-amber-500/10",
  this_week: "border-[var(--primary)]/30 bg-muted",
  upcoming: "border-border bg-background",
} as const;

const URGENCY_LABELS = {
  overdue: "Overdue",
  today: "Due today",
  this_week: "This week",
  upcoming: "Coming up",
} as const;

interface HomeRemindersProps {
  reminders: ChildReminder[];
  loading?: boolean;
  onAskAbout?: (prompt: string) => void;
}

export function HomeReminders({
  reminders,
  loading,
  onAskAbout,
}: HomeRemindersProps) {
  const priority = reminders.filter(
    (r) => r.urgency === "overdue" || r.urgency === "today" || r.urgency === "this_week",
  );
  const display = priority.length > 0 ? priority.slice(0, 4) : reminders.slice(0, 3);

  if (loading) {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Loading reminders…
      </div>
    );
  }

  if (display.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Reminders & milestones
        </h2>
      </div>
      <ul className="space-y-2">
        {display.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition-colors",
              URGENCY_STYLES[item.urgency],
            )}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-muted-foreground">
                {item.kind === "vaccine" ? (
                  <Syringe className="h-4 w-4" />
                ) : item.kind === "nutrition" ? (
                  <Apple className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      item.urgency === "overdue" &&
                        "bg-red-500/15 text-red-700 dark:text-red-400",
                      item.urgency === "today" &&
                        "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                      item.urgency === "this_week" &&
                        "bg-muted text-muted-foreground",
                      item.urgency === "upcoming" &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {URGENCY_LABELS[item.urgency]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                {onAskAbout && (
                  <button
                    type="button"
                    onClick={() =>
                      onAskAbout(
                        item.kind === "nutrition"
                          ? `Tell me more about: ${item.title}. ${item.body}`
                          : `What should I know about ${item.title}? ${item.body}`,
                      )
                    }
                    className="mt-2 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Ask Lavena about this
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
