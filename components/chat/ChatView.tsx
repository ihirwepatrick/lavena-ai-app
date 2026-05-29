"use client";

import { RegisterChildDialog } from "@/components/child/RegisterChildDialog";
import { AppShell } from "@/components/chat/AppShell";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatHome } from "@/components/chat/ChatHome";
import {
  ConnectionBanner,
  type ConnectionBannerKind,
} from "@/components/chat/ConnectionBanner";
import { createClient } from "@/lib/supabase/client";
import {
  SupabaseAuthError,
  SupabaseNetworkError,
  withSupabaseQuery,
} from "@/lib/supabase/query";
import type { ChatMessage, Child, Conversation } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function newSessionKey(): string {
  return crypto.randomUUID();
}

function mapLoadError(err: unknown): {
  kind: ConnectionBannerKind;
  message: string;
} {
  if (err instanceof SupabaseAuthError) {
    return { kind: "auth", message: err.message };
  }
  if (err instanceof SupabaseNetworkError) {
    return { kind: "network", message: err.message };
  }
  return {
    kind: "generic",
    message: err instanceof Error ? err.message : "Failed to load",
  };
}

export function ChatView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<{
    kind: ConnectionBannerKind;
    message: string;
  } | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [sessionKey, setSessionKey] = useState(newSessionKey);
  const [loadedMessages, setLoadedMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    kind: ConnectionBannerKind;
    message: string;
  } | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isThreadStreaming, setIsThreadStreaming] = useState(false);
  const initRef = useRef(false);

  const activeChild = childList.find((c) => c.id === activeChildId);
  const threadKey = `${activeChildId ?? "none"}-${sessionKey}`;

  const loadChildren = useCallback(async () => {
    return withSupabaseQuery(async (supabase) => {
      const { data, error: err } = await supabase
        .from("children")
        .select("id, name, date_of_birth")
        .order("created_at", { ascending: true });
      return { data: (data ?? []) as Child[], error: err };
    });
  }, []);

  const loadConversations = useCallback(async (childId: string) => {
    return withSupabaseQuery(async (supabase) => {
      const { data, error: err } = await supabase
        .from("conversations")
        .select("id, title, child_id, created_at")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(30);
      return { data: (data ?? []) as Conversation[], error: err };
    });
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    return withSupabaseQuery(async (supabase) => {
      const { data, error: err } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true });
      return { data: (data ?? []) as ChatMessage[], error: err };
    });
  }, []);

  useEffect(() => {
    const authError = searchParams.get("error");
    const reason = searchParams.get("reason");
    if (authError === "auth") {
      const q = reason
        ? `?error=auth&reason=${encodeURIComponent(reason)}`
        : "?error=auth";
      router.replace(`/login${q}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const supabase = createClient();

    async function ensureSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?redirect=/chat");
        return false;
      }
      return true;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login?redirect=/chat");
      }
    });

    ensureSession();

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchConversations = useCallback(
    async (childId: string) => {
      setConversationsLoading(true);
      setConversationsError(null);
      try {
        const convs = await loadConversations(childId);
        setConversations(convs);
      } catch (e) {
        const mapped = mapLoadError(e);
        setConversationsError(mapped);
        if (mapped.kind !== "network") {
          setConversations([]);
        }
      } finally {
        setConversationsLoading(false);
      }
    },
    [loadConversations],
  );

  const runInit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kids = await loadChildren();
      setChildList(kids);
      const firstId = kids[0]?.id ?? null;
      setActiveChildId(firstId);
      if (firstId) {
        await fetchConversations(firstId);
      }
    } catch (e) {
      setError(mapLoadError(e));
    } finally {
      setLoading(false);
    }
  }, [loadChildren, fetchConversations]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    runInit();
  }, [runInit]);

  useEffect(() => {
    if (!activeChildId) {
      setConversations([]);
      return;
    }
    fetchConversations(activeChildId);
  }, [activeChildId, fetchConversations]);

  useEffect(() => {
    if (!activeConversationId || isThreadStreaming) {
      if (!activeConversationId) {
        setLoadedMessages([]);
      }
      return;
    }
    loadMessages(activeConversationId)
      .then(setLoadedMessages)
      .catch((e) => {
        setError(mapLoadError(e));
        setLoadedMessages([]);
      });
  }, [activeConversationId, loadMessages, isThreadStreaming]);

  function handleChildSelect(childId: string) {
    setActiveChildId(childId);
    setActiveConversationId(null);
    setSessionKey(newSessionKey());
    setLoadedMessages([]);
    setError(null);
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setSessionKey(newSessionKey());
    setLoadedMessages([]);
    setError(null);
  }

  function handleConversationSelect(id: string) {
    setActiveConversationId(id);
    setSessionKey(id);
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

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  const refreshConversations = useCallback(() => {
    if (!activeChildId) return;
    fetchConversations(activeChildId);
  }, [activeChildId, fetchConversations]);

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
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onRegisterChild={() => setRegisterOpen(true)}
        onSignOut={handleSignOut}
        sidebarLoading={loading || conversationsLoading}
        conversationsError={conversationsError}
        onRetryConversations={
          activeChildId
            ? () => fetchConversations(activeChildId)
            : undefined
        }
        main={
          <>
            {error && (
              <ConnectionBanner
                kind={error.kind}
                message={error.message}
                onRetry={
                  error.kind === "network" ? () => runInit() : undefined
                }
              />
            )}

            {activeChildId ? (
              <ChatThread
                key={threadKey}
                threadKey={threadKey}
                initialMessages={loadedMessages}
                childId={activeChildId}
                conversationId={activeConversationId}
                childName={activeChild?.name}
                onConversationId={setActiveConversationId}
                onRefreshConversations={refreshConversations}
                onRegisterChild={() => setRegisterOpen(true)}
                onStreamActivityChange={setIsThreadStreaming}
              />
            ) : (
              <ChatHome
                hasChild={false}
                input=""
                onInputChange={() => {}}
                onSend={() => {}}
                onSuggestedPrompt={() => {}}
                onRegisterChild={() => setRegisterOpen(true)}
                disabled
              />
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
