"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { getTextFromUIMessage } from "@/lib/ai/errors";

interface MessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
        {messages.map((msg, i) => {
          const isLastAssistant =
            isStreaming &&
            i === messages.length - 1 &&
            msg.role === "assistant";

          return (
            <MessageBubble
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={getTextFromUIMessage(msg)}
              isStreaming={isLastAssistant}
            />
          );
        })}
        {isStreaming && messages.at(-1)?.role === "user" ? (
          <div className="animate-fade-in flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
          </div>
        ) : null}
        <div ref={bottomRef} className="h-4 shrink-0" />
      </div>
    </div>
  );
}
