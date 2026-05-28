function getOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** OAuth (Google) and PKCE callbacks — exchange runs in the browser. */
export function getAuthCallbackUrl(next: string = "/chat"): string {
  return `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Email magic links with token_hash (no PKCE verifier required). */
export function getAuthConfirmUrl(next: string = "/chat"): string {
  return `${getOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`;
}
