"use client";

import { RegisterChildDialog } from "@/components/child/RegisterChildDialog";
import { AppShell } from "@/components/chat/AppShell";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHome } from "@/components/chat/ChatHome";
import { MessageList } from "@/components/chat/MessageList";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Child, Conversation } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

function parseSSEChunk(
  buffer: string,
  onToken: (content: string) => void,
  onMeta: (conversationId: string) => void,
  onError: (error: string) => void,
): string {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data = line.slice(5).trim();
    }

    if (!data) continue;

    try {
      const parsed = JSON.parse(data) as Record<string, string>;
      if (event === "token" && parsed.content) onToken(parsed.content);
      if (event === "meta" && parsed.conversationId)
        onMeta(parsed.conversationId);
      if (event === "error" && parsed.error) onError(parsed.error);
    } catch {
      // ignore
    }
  }

  return remainder;
}

export function ChatView() {
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const activeChild = childList.find((c) => c.id === activeChildId);
  const isHomeView = messages.length === 0 && !isStreaming;

  const loadChildren = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("children")
      .select("id, name, date_of_birth")
      .order("created_at", { ascending: true });

    if (err) throw new Error(err.message);
    return data as Child[];
  }, []);

  const loadConversations = useCallback(async (childId: string) => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("conversations")
      .select("id, title, child_id, created_at")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (err) throw new Error(err.message);
    return data as Conversation[];
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true });

    if (err) throw new Error(err.message);
    return (data ?? []) as ChatMessage[];
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const kids = await loadChildren();
        setChildList(kids);
        const firstId = kids[0]?.id ?? null;
        setActiveChildId(firstId);

        if (firstId) {
          const convs = await loadConversations(firstId);
          setConversations(convs);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadChildren, loadConversations]);

  useEffect(() => {
    if (!activeChildId) {
      setConversations([]);
      return;
    }
    loadConversations(activeChildId)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [activeChildId, loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversationId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeConversationId, loadMessages]);

  function handleChildSelect(childId: string) {
    setActiveChildId(childId);
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
  }

  function handleChildCreated(child: Child, addAnother: boolean) {
    setChildList((prev) => {
      if (prev.some((c) => c.id === child.id)) return prev;
      return [...prev, child];
    });
    if (!addAnother) {
      setActiveChildId(child.id);
      handleNewChat();
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !activeChildId || isStreaming) return;

    setInput("");
    setError(null);
    setIsStreaming(true);

    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantId = `temp-assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          childId: activeChildId,
          conversationId: activeConversationId ?? undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ?? "Chat request failed",
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let newConvId = activeConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSEChunk(
          buffer,
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m,
              ),
            );
          },
          (conversationId) => {
            newConvId = conversationId;
            setActiveConversationId(conversationId);
          },
          (err) => setError(err),
        );
      }

      if (newConvId && activeChildId) {
        const convs = await loadConversations(activeChildId);
        setConversations(convs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading your assistant…
      </div>
    );
  }

  return (
    <>
      <AppShell
        childProfiles={childList}
        activeChildId={activeChildId}
        onChildSelect={handleChildSelect}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={setActiveConversationId}
        onNewChat={handleNewChat}
        onRegisterChild={() => setRegisterOpen(true)}
        onSignOut={handleSignOut}
        sidebarLoading={loading}
        main={
          <>
            {error && (
              <div className="mx-auto max-w-3xl px-4 pt-3">
                <p className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {isHomeView ? (
              <ChatHome
                childName={activeChild?.name}
                hasChild={!!activeChildId}
                input={input}
                onInputChange={setInput}
                onSend={() => handleSend()}
                onSuggestedPrompt={(p) => handleSend(p)}
                onRegisterChild={() => setRegisterOpen(true)}
                disabled={isStreaming}
              />
            ) : (
              <>
                <MessageList messages={messages} isStreaming={isStreaming} />
                <ChatComposer
                  variant="dock"
                  value={input}
                  onChange={setInput}
                  onSend={() => handleSend()}
                  disabled={isStreaming || !activeChildId}
                />
              </>
            )}
          </>
        }
      />

      <RegisterChildDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={handleChildCreated}
      />
    </>
  );
}
