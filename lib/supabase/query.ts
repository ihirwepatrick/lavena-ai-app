import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type QueryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export class SupabaseAuthError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SupabaseAuthError";
  }
}

export class SupabaseNetworkError extends Error {
  constructor(message = "Could not reach the server. Check your connection.") {
    super(message);
    this.name = "SupabaseNetworkError";
  }
}

function isAuthError(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    code === "PGRST301" ||
    lower.includes("jwt") ||
    lower.includes("not authenticated") ||
    lower.includes("invalid claim")
  );
}

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("failed to fetch")
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new SupabaseNetworkError()),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function withSupabaseQuery<T>(
  fn: (client: SupabaseClient) => Promise<QueryResult<T>>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const supabase = createClient();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new SupabaseAuthError();
  }

  async function runOnce(): Promise<T> {
    let result: QueryResult<T>;
    try {
      result = await withTimeout(fn(supabase), timeoutMs);
    } catch (err) {
      if (err instanceof SupabaseNetworkError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(msg)) {
        throw new SupabaseNetworkError(msg);
      }
      throw err;
    }

    if (result.error) {
      if (isAuthError(result.error.message, result.error.code)) {
        throw new SupabaseAuthError(result.error.message);
      }
      if (isNetworkError(result.error.message)) {
        throw new SupabaseNetworkError(result.error.message);
      }
      throw new Error(result.error.message);
    }
    return result.data;
  }

  try {
    return await runOnce();
  } catch (err) {
    if (err instanceof SupabaseAuthError) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new SupabaseAuthError(refreshError.message);
      }
      return runOnce();
    }
    throw err;
  }
}
