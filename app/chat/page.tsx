import { ChatView } from "@/components/chat/ChatView";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <main className="h-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading your assistant…
          </div>
        }
      >
        <ChatView />
      </Suspense>
    </main>
  );
}
