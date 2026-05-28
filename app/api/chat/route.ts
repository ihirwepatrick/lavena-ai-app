import { getAuthUserId } from "@/lib/auth/get-user";
import { buildChildContext } from "@/lib/context/buildChildContext";
import { streamChatCompletion, type ChatCompletionMessage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ChatRequestBody {
  message: string;
  childId: string;
  conversationId?: string;
}

async function verifyChildOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("user_id", userId)
    .single();

  return !error && !!data;
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, childId, conversationId } = body;
  if (!message?.trim() || !childId) {
    return NextResponse.json(
      { error: "message and childId are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const ownsChild = await verifyChildOwnership(supabase, childId, userId);
  if (!ownsChild) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let activeConversationId = conversationId;

  if (!activeConversationId) {
    const title =
      message.trim().slice(0, 40) + (message.trim().length > 40 ? "…" : "");
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        child_id: childId,
        title,
      })
      .select("id")
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: convError?.message ?? "Could not create conversation" },
        { status: 500 },
      );
    }
    activeConversationId = conv.id;
  } else {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", activeConversationId)
      .eq("user_id", userId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    role: "user",
    content: message.trim(),
  });

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", activeConversationId)
    .order("created_at", { ascending: true })
    .limit(30);

  let systemContent: string;
  try {
    systemContent = await buildChildContext(supabase, childId);
  } catch {
    return NextResponse.json({ error: "Child context unavailable" }, { status: 404 });
  }

  const chatMessages: ChatCompletionMessage[] = [
    { role: "system", content: systemContent },
    ...(history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
  ];

  let openRouterResponse: Response;
  try {
    openRouterResponse = await streamChatCompletion(chatMessages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OpenRouter error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!openRouterResponse.ok || !openRouterResponse.body) {
    const errText = await openRouterResponse.text();
    return NextResponse.json(
      { error: errText || "OpenRouter request failed" },
      { status: openRouterResponse.status },
    );
  }

  const convId = activeConversationId;
  const encoder = new TextEncoder();
  let fullAssistant = "";

  const stream = new ReadableStream({
    async start(controller) {
      const sendMeta = () => {
        controller.enqueue(
          encoder.encode(
            `event: meta\ndata: ${JSON.stringify({ conversationId: convId })}\n\n`,
          ),
        );
      };
      sendMeta();

      const reader = openRouterResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullAssistant += token;
                controller.enqueue(
                  encoder.encode(
                    `event: token\ndata: ${JSON.stringify({ content: token })}\n\n`,
                  ),
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        if (fullAssistant.trim()) {
          await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: fullAssistant.trim(),
          });
        }

        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ conversationId: convId })}\n\n`),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
