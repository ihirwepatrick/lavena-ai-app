"use client";

import type { ConnectionBannerKind } from "@/components/chat/ConnectionBanner";
import type { Child, Conversation } from "@/lib/types";
import { Menu, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { ChatHeader } from "./ChatHeader";

interface AppShellProps {
  childProfiles: Child[];
  activeChildId: string | null;
  onChildSelect: (id: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
  onRegisterChild: () => void;
  onSignOut: () => void;
  sidebarLoading?: boolean;
  conversationsError?: {
    kind: ConnectionBannerKind;
    message: string;
  } | null;
  onRetryConversations?: () => void;
  main: React.ReactNode;
}

export function AppShell({
  childProfiles,
  activeChildId,
  onChildSelect,
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewChat,
  onRegisterChild,
  onSignOut,
  sidebarLoading,
  conversationsError,
  onRetryConversations,
  main,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar
          childProfiles={childProfiles}
          activeChildId={activeChildId}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          onNewChat={onNewChat}
          onSignOut={onSignOut}
          loading={sidebarLoading}
          conversationsError={conversationsError}
          onRetryConversations={onRetryConversations}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 z-50 shadow-xl">
            <Sidebar
              childProfiles={childProfiles}
              activeChildId={activeChildId}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onConversationSelect={onConversationSelect}
              onNewChat={onNewChat}
              onSignOut={onSignOut}
              loading={sidebarLoading}
              conversationsError={conversationsError}
              onRetryConversations={onRetryConversations}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex-1 text-sm font-semibold text-foreground">
            Lavena AI
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <ChatHeader
          childProfiles={childProfiles}
          activeChildId={activeChildId}
          onChildSelect={onChildSelect}
          onRegisterChild={onRegisterChild}
          onNewChat={onNewChat}
        />

        <div className="flex min-h-0 flex-1 flex-col">{main}</div>
      </div>
    </div>
  );
}
