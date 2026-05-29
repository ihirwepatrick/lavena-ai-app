"use client";

import { cn } from "@/lib/utils";
import { Children, useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TAIL_LENGTH = 28;

const DATE_PATTERNS = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\bweek\s+\d{1,3}\b/gi,
  /\b\d{1,2}\s+months?\s+old\b/gi,
];

function highlightPlainText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const matches: { start: number; end: number; text: string }[] = [];

  for (const pattern of DATE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const merged: typeof matches = [];
  for (const match of matches) {
    const prev = merged[merged.length - 1];
    if (prev && match.start < prev.end) continue;
    merged.push(match);
  }

  for (const match of merged) {
    if (match.start > lastIndex) {
      parts.push(text.slice(lastIndex, match.start));
    }
    parts.push(
      <span
        key={`${match.start}-${match.text}`}
        className="font-semibold text-foreground"
      >
        {match.text}
      </span>,
    );
    lastIndex = match.end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function processChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return <>{highlightPlainText(child)}</>;
    }
    return child;
  });
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-3 last:mb-0">{processChildren(children)}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-relaxed">{processChildren(children)}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="rounded-sm bg-muted px-0.5 font-semibold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),
};

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function AssistantMessage({
  content,
  isStreaming,
  className,
}: AssistantMessageProps) {
  const { stable, tail } = useMemo(() => {
    if (!isStreaming || content.length <= TAIL_LENGTH) {
      return { stable: content, tail: "" };
    }
    return {
      stable: content.slice(0, -TAIL_LENGTH),
      tail: content.slice(-TAIL_LENGTH),
    };
  }, [content, isStreaming]);

  if (!content && isStreaming) {
    return (
      <span
        className={cn(
          "assistant-prose inline-block min-h-[1.5em] text-[15px]",
          className,
        )}
      >
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-muted-foreground/70" />
      </span>
    );
  }

  if (!content) {
    return null;
  }

  const displayStable = isStreaming ? stable : content;

  return (
    <div
      className={cn(
        "assistant-prose max-w-none text-[15px] leading-[1.7] text-foreground",
        className,
      )}
    >
      {displayStable ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {displayStable}
        </ReactMarkdown>
      ) : null}
      {tail ? (
        <span className="stream-tail whitespace-pre-wrap">{tail}</span>
      ) : null}
      {isStreaming ? (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-muted-foreground/70 align-[-0.1em]" />
      ) : null}
    </div>
  );
}
