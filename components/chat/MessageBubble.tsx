"use client";

import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="animate-fade-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          "max-w-none text-[15px] leading-relaxed text-foreground",
          isStreaming && "streaming-cursor",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content || "\u00a0"}</p>
      </div>
    </div>
  );
}
