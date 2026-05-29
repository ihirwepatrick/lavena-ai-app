"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConnectionBannerKind } from "@/components/chat/ConnectionBanner";
import type { Child, Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogOut, MessageSquarePlus, X } from "lucide-react";

interface SidebarProps {
  childProfiles: Child[];
  activeChildId: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  loading?: boolean;
  conversationsError?: {
    kind: ConnectionBannerKind;
    message: string;
  } | null;
  onRetryConversations?: () => void;
  className?: string;
  onClose?: () => void;
}

export function Sidebar({
  childProfiles,
  activeChildId,
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewChat,
  onSignOut,
  loading,
  conversationsError,
  onRetryConversations,
  className,
  onClose,
}: SidebarProps) {
  const activeChild = childProfiles.find((c) => c.id === activeChildId);
  const isNewChat = !activeConversationId;

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-sidebar",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Lavena AI
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 py-2 text-sm text-muted-foreground">
        {activeChild?.name ?? "No child selected"}
      </div>

      <div className="px-2 py-2">
        <Button
          variant={isNewChat ? "default" : "outline"}
          className="w-full justify-start gap-2 font-normal"
          onClick={() => {
            onNewChat();
            onClose?.();
          }}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        {loading ? (
          <div className="space-y-2 px-2 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : conversationsError ? (
          <div className="space-y-2 px-2 py-2">
            <p className="text-xs text-red-600 dark:text-red-400">
              {conversationsError.message}
            </p>
            {onRetryConversations && (
              <button
                type="button"
                onClick={onRetryConversations}
                className="text-xs font-medium text-foreground underline"
              >
                Retry
              </button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => {
                    onConversationSelect(conv.id);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full cursor-pointer truncate rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    conv.id === activeConversationId &&
                      "bg-muted font-medium text-foreground",
                  )}
                >
                  {conv.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onSignOut}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
