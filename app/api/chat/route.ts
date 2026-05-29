import { getAuthUserId } from "@/lib/auth/get-user";
import { getChatModel } from "@/lib/ai/openrouter";
import { formatAIError, getTextFromUIMessage } from "@/lib/ai/errors";
import { buildChildContext } from "@/lib/context/buildChildContext";
import { createClient } from "@/lib/supabase/server";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

interface ChatRequestBody {
  messages: UIMessage[];
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

async function persistUserMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  content: string,
) {
  const { data: last } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last?.role === "user" && last.content === content) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
  });
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

  const { messages, childId, conversationId } = body;
  if (!messages?.length || !childId) {
    return NextResponse.json(
      { error: "messages and childId are required" },
      { status: 400 },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser ? getTextFromUIMessage(lastUser).trim() : "";

  if (!lastUserText) {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  const supabase = await createClient();
  const ownsChild = await verifyChildOwnership(supabase, childId, userId);
  if (!ownsChild) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let activeConversationId = conversationId;

  if (!activeConversationId) {
    const title =
      lastUserText.slice(0, 40) + (lastUserText.length > 40 ? "…" : "");
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

  if (!activeConversationId) {
    return NextResponse.json(
      { error: "Could not resolve conversation" },
      { status: 500 },
    );
  }

  await persistUserMessage(supabase, activeConversationId, lastUserText);

  let systemContent: string;
  try {
    systemContent = await buildChildContext(supabase, childId);
  } catch {
    return NextResponse.json(
      { error: "Child context unavailable" },
      { status: 404 },
    );
  }

  const convId = activeConversationId;

  try {
    const result = streamText({
      model: getChatModel(),
      system: systemContent,
      messages: await convertToModelMessages(messages),
      maxRetries: 1,
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": convId,
      },
      onFinish: async ({ responseMessage, isAborted }) => {
        const text = getTextFromUIMessage(responseMessage).trim();
        if (isAborted || !text) return;
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: text,
        });
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatAIError(error) },
      { status: APICallErrorStatus(error) },
    );
  }
}

function APICallErrorStatus(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode: number }).statusCode === "number"
  ) {
    const code = (error as { statusCode: number }).statusCode;
    if (code === 429) return 429;
    if (code >= 400 && code < 600) return code;
  }
  return 500;
}
