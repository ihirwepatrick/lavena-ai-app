import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function loginErrorRedirect(
  request: NextRequest,
  reason?: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("error", "auth");
  if (reason) {
    url.searchParams.set("reason", reason.slice(0, 200));
  }
  return NextResponse.redirect(url);
}

/**
 * Server-side email confirmation via token_hash (no PKCE verifier needed).
 * Update the Supabase Magic Link email template to link here — see README.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));

  if (!tokenHash || !type) {
    return loginErrorRedirect(
      request,
      "Invalid confirmation link. Update the Supabase email template (see README).",
    );
  }

  const redirectUrl = new URL(next, request.nextUrl.origin);
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteHandlerClient(request, response);

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return loginErrorRedirect(request, error.message);
  }

  return response;
}
