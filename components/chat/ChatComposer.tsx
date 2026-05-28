"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { KeyboardEvent, useRef, useEffect } from "react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: "home" | "dock";
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Message Lavena AI…",
  variant = "dock",
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  const isHome = variant === "home";

  return (
    <div
      className={cn(
        isHome ? "w-full" : "border-t border-border bg-background/90 px-4 py-4 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-end gap-2",
          isHome
            ? "rounded-3xl border border-border bg-background p-2 shadow-sm"
            : "max-w-3xl",
        )}
      >
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0",
            isHome ? "min-h-[48px] text-[15px]" : "min-h-[52px]",
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={cn(
            "mb-0.5 shrink-0 rounded-full",
            isHome && "h-9 w-9",
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      {!isHome && (
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Not a substitute for professional medical advice.
        </p>
      )}
    </div>
  );
}
