export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at?: string;
}

export interface Child {
  id: string;
  name: string;
  date_of_birth: string;
}

export interface Conversation {
  id: string;
  title: string;
  child_id: string;
  created_at: string;
}
