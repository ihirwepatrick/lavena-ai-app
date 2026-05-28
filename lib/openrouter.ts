export const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export function getOpenRouterHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    "X-Title": "Lavena AI",
  };
}

export function getModel(): string {
  return (
    process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash:free"
  );
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChatCompletion(
  messages: ChatCompletionMessage[],
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model: getModel(),
      messages,
      stream: true,
    }),
  });
}
