"use client";

import { CHAT_PRESETS, HOME_PROMPT_IDS } from "@/lib/chat/presets";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  const prompts = HOME_PROMPT_IDS.map(
    (id) => CHAT_PRESETS.find((p) => p.id === id)!,
  ).filter(Boolean);

  return (
    <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
      {prompts.map((preset) => (
        <button
          key={preset.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(preset.prompt)}
          className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-foreground transition-all duration-150 hover:border-foreground/25 hover:bg-muted active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
