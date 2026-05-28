"use client";

import type { Child } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatChildAge } from "@/lib/children/actions";
import { Check, ChevronDown, UserPlus } from "lucide-react";
import { useState } from "react";

interface HeaderChildSelectorProps {
  childProfiles: Child[];
  activeChildId: string | null;
  onSelect: (id: string) => void;
  onRegister: () => void;
}

export function HeaderChildSelector({
  childProfiles,
  activeChildId,
  onSelect,
  onRegister,
}: HeaderChildSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = childProfiles.find((c) => c.id === activeChildId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span className="max-w-[140px] truncate sm:max-w-[200px]">
          {active?.name ?? "Select child"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-border bg-background py-1 shadow-lg">
            {childProfiles.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No children registered yet.
              </p>
            ) : (
              <ul>
                {childProfiles.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(child.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                        child.id === activeChildId && "bg-muted",
                      )}
                    >
                      <span>
                        <span className="font-medium text-foreground">
                          {child.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatChildAge(child.date_of_birth)}
                        </span>
                      </span>
                      {child.id === activeChildId && (
                        <Check className="h-4 w-4 shrink-0 text-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border p-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onRegister();
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <UserPlus className="h-4 w-4" />
                Register another child
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
