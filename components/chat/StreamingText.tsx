"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

const TAIL_LENGTH = 28;

export function StreamingText({
  text,
  isStreaming,
  className,
}: StreamingTextProps) {
  const { stable, tail } = useMemo(() => {
    if (!isStreaming || text.length <= TAIL_LENGTH) {
      return { stable: text, tail: "" };
    }
    return {
      stable: text.slice(0, -TAIL_LENGTH),
      tail: text.slice(-TAIL_LENGTH),
    };
  }, [text, isStreaming]);

  if (!text) {
    return <span className={className}>&nbsp;</span>;
  }

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      <span>{stable}</span>
      {tail ? (
        <span key={tail.length} className="stream-tail">
          {tail}
        </span>
      ) : null}
      {isStreaming ? (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-muted-foreground/70 align-[-0.1em]" />
      ) : null}
    </span>
  );
}
