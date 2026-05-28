"use client";

import type { Child } from "@/lib/types";
import { HeaderChildSelector } from "./HeaderChildSelector";
import { NotificationsPanel } from "./NotificationsPanel";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface ChatHeaderProps {
  childProfiles: Child[];
  activeChildId: string | null;
  onChildSelect: (id: string) => void;
  onRegisterChild: () => void;
  onNewChat: () => void;
}

export function ChatHeader({
  childProfiles,
  activeChildId,
  onChildSelect,
  onRegisterChild,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
      <HeaderChildSelector
        childProfiles={childProfiles}
        activeChildId={activeChildId}
        onSelect={onChildSelect}
        onRegister={onRegisterChild}
      />
      <div className="flex items-center gap-1">
        <NotificationsPanel activeChildId={activeChildId} />
        <QuickActionsMenu
          onNewChat={onNewChat}
          onRegisterChild={onRegisterChild}
          hasChild={!!activeChildId}
        />
      </div>
    </header>
  );
}
