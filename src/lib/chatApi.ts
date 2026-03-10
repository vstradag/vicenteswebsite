export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply?: string;
  error?: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  const data: ChatResponse = await res
    .json()
    .catch(() => ({ error: `Invalid server response (${res.status})` }));

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  if (!data.reply) {
    throw new Error("Empty reply from server");
  }

  return data.reply;
}