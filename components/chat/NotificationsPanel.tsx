"use client";

import { fetchChildNotifications } from "@/lib/children/actions";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  childName: string;
}

interface NotificationsPanelProps {
  activeChildId: string | null;
}

export function NotificationsPanel({ activeChildId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !activeChildId) return;
    setLoading(true);
    fetchChildNotifications(activeChildId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, activeChildId]);

  const count = items.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
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
                Notifications
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
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
