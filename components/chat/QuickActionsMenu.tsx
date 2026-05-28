"use client";

import {
  MessageSquarePlus,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

interface QuickActionsMenuProps {
  onNewChat: () => void;
  onRegisterChild: () => void;
  hasChild: boolean;
}

export function QuickActionsMenu({
  onNewChat,
  onRegisterChild,
  hasChild,
}: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: "New chat",
      icon: MessageSquarePlus,
      onClick: onNewChat,
      show: hasChild,
    },
    {
      label: "Register child",
      icon: UserPlus,
      onClick: onRegisterChild,
      show: true,
    },
  ].filter((a) => a.show);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Quick actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-border bg-background py-1 shadow-lg">
            {actions.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onClick();
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
