"use client";

import { Drawer } from "@/components/chat/Drawer";
import { CHAT_PRESETS, PRESET_CATEGORIES } from "@/lib/chat/presets";
import { cn } from "@/lib/utils";
import {
  Apple,
  HeartPulse,
  MessageSquare,
  Moon,
} from "lucide-react";

const CATEGORY_ICONS = {
  health: HeartPulse,
  nutrition: Apple,
  sleep: Moon,
  general: MessageSquare,
} as const;

interface PresetDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function PresetDrawer({
  open,
  onClose,
  onSelect,
  disabled,
}: PresetDrawerProps) {
  function handleSelect(prompt: string) {
    onSelect(prompt);
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Quick prompts">
      <div className="space-y-6 p-4">
        {PRESET_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          const presets = CHAT_PRESETS.filter((p) => p.category === cat.id);
          if (presets.length === 0) return null;

          return (
            <section key={cat.id}>
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat.label}
                </h3>
              </div>
              <ul className="space-y-1">
                {presets.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelect(preset.prompt)}
                      className={cn(
                        "w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Drawer>
  );
}
