"use client";

import { fetchChildReminders } from "@/lib/children/reminders";
import type { ChildReminder } from "@/lib/children/reminders";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationsPanelProps {
  activeChildId: string | null;
}

const URGENCY_DOT = {
  overdue: "bg-red-500",
  today: "bg-amber-500",
  this_week: "bg-[var(--primary)]",
  upcoming: "bg-muted-foreground",
} as const;

export function NotificationsPanel({ activeChildId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ChildReminder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChildId) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetchChildReminders(activeChildId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  useEffect(() => {
    if (!open || !activeChildId) return;
    fetchChildReminders(activeChildId).then(setItems).catch(() => setItems([]));
  }, [open, activeChildId]);

  const urgentCount = items.filter(
    (i) =>
      i.urgency === "overdue" ||
      i.urgency === "today" ||
      i.urgency === "this_week",
  ).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {urgentCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-[var(--primary-foreground)]">
            {urgentCount > 9 ? "9+" : urgentCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded-xl border border-border bg-background shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Reminders
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {!activeChildId ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Register a child to see health reminders.
                </p>
              ) : loading ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Loading…
                </p>
              ) : items.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No upcoming reminders right now.
                </p>
              ) : (
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            URGENCY_DOT[item.urgency],
                          )}
                        />
                        <p className="font-medium text-foreground">
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-0.5 pl-4 text-xs text-muted-foreground">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
