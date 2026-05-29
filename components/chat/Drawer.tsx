"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="drawer-title"
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl animate-in slide-in-from-right duration-200",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="drawer-title" className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
