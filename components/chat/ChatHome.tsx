"use client";

import { ChatComposer } from "./ChatComposer";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface ChatHomeProps {
  childName?: string;
  hasChild: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestedPrompt: (prompt: string) => void;
  onRegisterChild: () => void;
  disabled?: boolean;
}

export function ChatHome({
  childName,
  hasChild,
  input,
  onInputChange,
  onSend,
  onSuggestedPrompt,
  onRegisterChild,
  disabled,
}: ChatHomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {hasChild
              ? `How can I help${childName ? ` with ${childName}` : ""}?`
              : "Welcome to Lavena AI"}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-[15px]">
            {hasChild
              ? "Ask about vaccines, feeding, sleep, or growth."
              : "Register your child to start personalized healthcare conversations."}
          </p>
        </div>

        <div className="w-full">
          <ChatComposer
            variant="home"
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            disabled={disabled || !hasChild}
            placeholder={
              hasChild ? "Ask anything about your child…" : "Register a child to begin…"
            }
          />
        </div>

        {hasChild ? (
          <SuggestedPrompts
            onSelect={onSuggestedPrompt}
            disabled={disabled}
          />
        ) : (
          <button
            type="button"
            onClick={onRegisterChild}
            className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Register a child
          </button>
        )}
      </div>
    </div>
  );
}
