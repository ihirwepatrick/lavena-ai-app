"use client";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHome } from "@/components/chat/ChatHome";
import { MessageList } from "@/components/chat/MessageList";
import { PresetDrawer } from "@/components/chat/PresetDrawer";
import { formatAIError } from "@/lib/ai/errors";
import type { ChatMessage } from "@/lib/types";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
  }));
}

interface ChatThreadProps {
  threadKey: string;
  initialMessages: ChatMessage[];
  childId: string;
  conversationId: string | null;
  childName?: string;
  dateOfBirth?: string;
  onConversationId: (id: string) => void;
  onRefreshConversations: () => void;
  onRegisterChild: () => void;
  onStreamActivityChange?: (active: boolean) => void;
}

export function ChatThread({
  threadKey,
  initialMessages,
  childId,
  conversationId,
  childName,
  dateOfBirth,
  onConversationId,
  onRefreshConversations,
  onRegisterChild,
  onStreamActivityChange,
}: ChatThreadProps) {
  const [input, setInput] = useState("");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const conversationIdRef = useRef(conversationId);
  const pendingConversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            childId,
            conversationId: conversationIdRef.current ?? undefined,
          },
        }),
        fetch: async (url, init) => {
          const response = await fetch(url, init);
          const newConvId = response.headers.get("X-Conversation-Id");
          if (newConvId) {
            pendingConversationIdRef.current = newConvId;
            conversationIdRef.current = newConvId;
          }

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(
              (payload as { error?: string }).error ??
                `Request failed (${response.status})`,
            );
          }

          return response;
        },
      }),
    [childId],
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    id: threadKey,
    messages: toUIMessages(initialMessages),
    transport,
    experimental_throttle: 20,
    onFinish: () => {
      const newId = pendingConversationIdRef.current;
      if (newId) {
        onConversationId(newId);
        pendingConversationIdRef.current = null;
      }
      onRefreshConversations();
    },
    onError: (err) => {
      setLocalError(formatAIError(err));
    },
  });

  useEffect(() => {
    if (error) {
      setLocalError(formatAIError(error));
    }
  }, [error]);

  const isBusy = status === "streaming" || status === "submitted";
  const isHomeView = messages.length === 0 && !isBusy;

  useEffect(() => {
    onStreamActivityChange?.(isBusy);
  }, [isBusy, onStreamActivityChange]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isBusy) return;

    setInput("");
    setLocalError(null);
    clearError();

    try {
      await sendMessage({ text: content });
    } catch (err) {
      setLocalError(formatAIError(err));
    }
  }

  return (
    <>
      {localError && (
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-sm text-red-600 dark:text-red-400">
            {localError}
          </p>
        </div>
      )}

      {isHomeView ? (
        <ChatHome
          childName={childName}
          childId={childId}
          dateOfBirth={dateOfBirth}
          hasChild={!!childId}
          input={input}
          onInputChange={setInput}
          onSend={() => handleSend()}
          onSuggestedPrompt={(p) => handleSend(p)}
          onRegisterChild={onRegisterChild}
          onOpenPresets={() => setPresetsOpen(true)}
          disabled={isBusy}
        />
      ) : (
        <>
          <MessageList messages={messages} isStreaming={isBusy} />
          <ChatComposer
            variant="dock"
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            disabled={isBusy}
            showPresetsButton
            onOpenPresets={() => setPresetsOpen(true)}
          />
        </>
      )}

      <PresetDrawer
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        onSelect={(p) => handleSend(p)}
        disabled={isBusy}
      />
    </>
  );
}
