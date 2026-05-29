"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export type ConnectionBannerKind = "auth" | "network" | "generic";

interface ConnectionBannerProps {
  kind: ConnectionBannerKind;
  message?: string;
  onRetry?: () => void;
}

export function ConnectionBanner({
  kind,
  message,
  onRetry,
}: ConnectionBannerProps) {
  const defaultMessage =
    kind === "auth"
      ? "Your session expired. Please sign in again."
      : kind === "network"
        ? "Can't reach the server. Check your connection and try again."
        : "Something went wrong.";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-center text-sm text-foreground sm:flex-row sm:justify-between sm:text-left">
        <p className="text-red-600 dark:text-red-400">
          {message ?? defaultMessage}
        </p>
        <div className="flex shrink-0 gap-2">
          {kind === "auth" ? (
            <Link
              href="/login?redirect=/chat"
              className="inline-flex h-8 items-center rounded-xl bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
            >
              Sign in
            </Link>
          ) : onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
