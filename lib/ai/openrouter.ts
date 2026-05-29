import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/** OpenRouter allows at most 3 models when using route: "fallback". */
const MAX_FALLBACK_MODELS = 3;

const DEFAULT_FALLBACKS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
];

export function getOpenRouter() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    compatibility: "strict",
    appName: "Lavena AI",
    appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });
}

/** Ordered list (max 3) for OpenRouter native model fallback routing. */
export function getFallbackModels(): string[] {
  const primary = process.env.OPENROUTER_MODEL?.trim();
  const extra =
    process.env.OPENROUTER_MODEL_FALLBACKS?.split(",")
      .map((m) => m.trim())
      .filter(Boolean) ?? DEFAULT_FALLBACKS;

  const list = primary
    ? [primary, ...extra.filter((m) => m !== primary)]
    : extra;

  return [...new Set(list)].slice(0, MAX_FALLBACK_MODELS);
}

export function getChatModel() {
  const openrouter = getOpenRouter();
  const models = getFallbackModels();

  return openrouter.chat(models[0], {
    extraBody: {
      models,
      route: "fallback",
    },
  });
}
