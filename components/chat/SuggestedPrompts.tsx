"use client";

const PROMPTS = [
  "When is the next vaccine due?",
  "Summarize last week's sleep patterns.",
  "Is 120ml per feeding normal for her age?",
  "What should I know about her allergies?",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-foreground transition-all duration-150 hover:border-foreground/25 hover:bg-muted active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
