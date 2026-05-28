"use client";

import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const supabase = createClient();
      const next = safeNextPath(searchParams.get("next"));

      const oauthError =
        searchParams.get("error_description") ?? searchParams.get("error");

      if (oauthError) {
        router.replace(
          `/login?error=auth&reason=${encodeURIComponent(oauthError)}`,
        );
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        setStatus("Completing sign-in…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (error) {
          router.replace(
            `/login?error=auth&reason=${encodeURIComponent(error.message)}`,
          );
          return;
        }

        router.replace(next);
        return;
      }

      if (tokenHash && type) {
        setStatus("Verifying email…");
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (cancelled) return;

        if (error) {
          router.replace(
            `/login?error=auth&reason=${encodeURIComponent(error.message)}`,
          );
          return;
        }

        router.replace(next);
        return;
      }

      router.replace(
        "/login?error=auth&reason=Missing%20auth%20parameters",
      );
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
      {status}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-background text-muted-foreground">
          Signing you in…
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
