import { APICallError } from "ai";
import type { UIMessage } from "ai";

export function getTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function formatAIError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return "Free models are rate-limited right now. Please wait a moment and try again.";
    }

    try {
      const body = error.responseBody;
      if (typeof body === "string") {
        const parsed = JSON.parse(body) as {
          error?: { message?: string; metadata?: { raw?: string } };
        };
        return (
          parsed.error?.metadata?.raw ??
          parsed.error?.message ??
          error.message
        );
      }
    } catch {
      // fall through
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
