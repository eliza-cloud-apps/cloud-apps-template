/**
 * Eliza Cloud SDK
 *
 * Pre-configured API client for Eliza Cloud services.
 * All API calls automatically use the injected API key.
 * When user is authenticated, their credits are used.
 *
 * Available APIs:
 * - Chat: chat, chatStream
 * - Generation: generateImage, generateVideo, textToSpeech
 * - Embeddings: createEmbeddings
 * - Agents: listAgents, getAgent, chatWithAgent, chatWithAgentStream
 * - Characters: getAppCharacters, createCharacterRoom, sendCharacterMessage
 * - Files: uploadFile
 * - Credits: getBalance
 * - Analytics: trackPageView
 */

import { getAuthHeaders, isAuthenticated } from "./eliza-auth";

const apiBase =
  process.env.NEXT_PUBLIC_ELIZA_API_URL || "https://www.elizacloud.ai";
const appId = process.env.NEXT_PUBLIC_ELIZA_APP_ID || "";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: { content?: string; role?: string };
    finish_reason: string | null;
  }>;
}

export interface ImageResult {
  url: string;
  id: string;
  images?: Array<{
    url?: string;
    image?: string;
    mimeType?: string;
  }>;
}

export interface VideoResult {
  url: string;
  id: string;
  jobId?: string;
  status?: "pending" | "processing" | "completed" | "failed";
}

export interface EmbeddingResult {
  embedding: number[];
  index: number;
}

export interface EmbeddingsResponse {
  data: EmbeddingResult[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface BalanceResult {
  balance: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  status: "active" | "inactive";
}

export interface AgentChatResponse {
  text: string;
  roomId: string;
  agentId: string;
}

export interface AppCharacter {
  id: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | string[];
  is_public?: boolean;
}

export interface Room {
  id: string;
  characterId: string;
  characterName?: string;
  characterAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface StreamingMessage {
  id: string;
  entityId: string;
  content: { text: string; thought?: string };
  createdAt: number;
  isAgent: boolean;
  type: "user" | "agent" | "thinking" | "error";
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ============================================================================
// Core Fetch Utility
// ============================================================================

async function elizaFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${apiBase}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...getAuthHeaders(),
  };

  if (appId) {
    headers["X-App-Id"] = appId;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 402) {
      throw new Error(
        "INSUFFICIENT_CREDITS: Not enough credits. Please purchase more.",
      );
    }
    throw new Error(`Eliza API Error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ============================================================================
// Analytics
// ============================================================================

const trackedPaths = new Set<string>();

export async function trackPageView(pathname?: string): Promise<void> {
  if (typeof window === "undefined") return;

  const path = pathname || window.location.pathname;
  if (trackedPaths.has(path)) return;
  trackedPaths.add(path);

  try {
    const payload = {
      app_id: appId,
      page_url: window.location.href,
      pathname: path,
      referrer: document.referrer,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    };
    const url = `${apiBase}/api/v1/track/pageview`;
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    navigator.sendBeacon?.(url, blob) ||
      fetch(url, { method: "POST", body: blob, keepalive: true });
  } catch {
    // Silent fail
  }
}

// ============================================================================
// Chat
// ============================================================================

export async function chat(
  messages: ChatMessage[],
  model = "gpt-4o",
): Promise<ChatResponse> {
  return elizaFetch<ChatResponse>("/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  });
}

export async function* chatStream(
  messages: ChatMessage[],
  model = "gpt-4o",
): AsyncGenerator<StreamChunk> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, model, stream: true }),
  });

  if (!res.ok)
    throw new Error(`Eliza API Error (${res.status}): ${await res.text()}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          /* skip */
        }
      }
    }
  }
}

// ============================================================================
// Image Generation
// ============================================================================

export async function generateImage(
  prompt: string,
  options?: {
    model?: string;
    width?: number;
    height?: number;
    numImages?: number;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    stylePreset?: string;
  },
): Promise<ImageResult> {
  return elizaFetch<ImageResult>("/api/v1/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...options }),
  });
}

// ============================================================================
// Video Generation
// ============================================================================

export async function generateVideo(
  prompt: string,
  options?: { model?: string; duration?: number },
): Promise<VideoResult> {
  return elizaFetch<VideoResult>("/api/v1/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...options }),
  });
}

// ============================================================================
// Text-to-Speech
// ============================================================================

export async function textToSpeech(
  text: string,
  options?: { voiceId?: string; modelId?: string },
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/elevenlabs/tts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text,
      voiceId: options?.voiceId,
      modelId: options?.modelId,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "TTS failed");
  }

  return res.blob();
}

export async function listVoices(): Promise<
  Array<{ id: string; name: string; category: string }>
> {
  return elizaFetch<{
    voices: Array<{ voice_id: string; name: string; category: string }>;
  }>("/api/elevenlabs/voices").then((r) =>
    r.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
    })),
  );
}

// ============================================================================
// Embeddings
// ============================================================================

export async function createEmbeddings(
  input: string | string[],
  model = "text-embedding-3-small",
): Promise<EmbeddingsResponse> {
  return elizaFetch<EmbeddingsResponse>("/api/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, model }),
  });
}

// ============================================================================
// Agents
// ============================================================================

export async function listAgents(): Promise<Agent[]> {
  const result = await elizaFetch<{ agents: Agent[] }>("/api/v1/agents", {});
  return result.agents || [];
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    return await elizaFetch<Agent>(`/api/v1/agents/${agentId}`, {});
  } catch {
    return null;
  }
}

export async function chatWithAgent(
  agentId: string,
  message: string,
  roomId?: string,
): Promise<AgentChatResponse> {
  return elizaFetch<AgentChatResponse>(`/api/v1/agents/${agentId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, roomId }),
  });
}

export async function* chatWithAgentStream(
  agentId: string,
  message: string,
  roomId?: string,
): AsyncGenerator<{ text: string; roomId?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/v1/agents/${agentId}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, roomId }),
  });

  if (!res.ok)
    throw new Error(`Agent chat error (${res.status}): ${await res.text()}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          /* skip */
        }
      }
    }
  }
}

// ============================================================================
// App Characters
// ============================================================================

export async function getAppCharacters(): Promise<AppCharacter[]> {
  if (!appId) return [];
  try {
    const result = await elizaFetch<{
      success: boolean;
      characters: AppCharacter[];
    }>(`/api/v1/apps/${appId}/characters`);
    return result.characters || [];
  } catch {
    return [];
  }
}

export async function createCharacterRoom(characterId: string): Promise<Room> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/eliza/rooms`, {
    method: "POST",
    headers,
    body: JSON.stringify({ characterId }),
  });

  if (!res.ok)
    throw new Error(
      `Failed to create room (${res.status}): ${await res.text()}`,
    );

  const data = await res.json();
  return {
    id: data.roomId || data.room?.id,
    characterId,
    characterName: data.characterName,
    characterAvatar: data.characterAvatar,
  };
}

export async function getCharacterRooms(): Promise<Room[]> {
  const headers: Record<string, string> = { ...getAuthHeaders() };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/eliza/rooms`, { headers });
  if (!res.ok)
    throw new Error(`Failed to get rooms (${res.status}): ${await res.text()}`);

  const data = await res.json();
  return (data.rooms || []).map(
    (room: {
      id: string;
      agentId: string;
      agentName?: string;
      agentAvatar?: string;
      lastMessage?: string;
      lastMessageAt?: string;
    }) => ({
      id: room.id,
      characterId: room.agentId,
      characterName: room.agentName,
      characterAvatar: room.agentAvatar,
      lastMessage: room.lastMessage,
      lastMessageAt: room.lastMessageAt,
    }),
  );
}

export async function* sendCharacterMessageStream(
  roomId: string,
  message: string,
  options?: {
    webSearchEnabled?: boolean;
    createImageEnabled?: boolean;
    imageModel?: string;
  },
): AsyncGenerator<
  | { type: "chunk"; text: string; messageId: string }
  | { type: "message"; message: StreamingMessage }
  | { type: "thinking"; message: StreamingMessage }
  | { type: "error"; error: string }
  | { type: "done" }
> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(
    `${apiBase}/api/eliza/rooms/${roomId}/messages/stream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: message,
        appId,
        webSearchEnabled: options?.webSearchEnabled ?? true,
        createImageEnabled: options?.createImageEnabled ?? false,
        ...(options?.imageModel && { imageModel: options.imageModel }),
      }),
    },
  );

  if (!res.ok) {
    yield {
      type: "error",
      error: `Failed to send message (${res.status}): ${await res.text()}`,
    };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield { type: "error", error: "No response body" };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";

    for (const msg of messages) {
      if (!msg.trim()) continue;

      const lines = msg.split("\n");
      let eventType = "message";
      let dataStr = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataStr += line.slice(6);
      }

      if (!dataStr) continue;

      try {
        const data = JSON.parse(dataStr);
        switch (eventType) {
          case "chunk":
            yield {
              type: "chunk",
              text: data.chunk,
              messageId: data.messageId,
            };
            break;
          case "message":
            yield data.type === "thinking"
              ? { type: "thinking", message: data }
              : { type: "message", message: data };
            break;
          case "error":
            yield {
              type: "error",
              error: data.message || data.error || "Unknown error",
            };
            break;
          case "done":
            yield { type: "done" };
            break;
        }
      } catch {
        /* skip */
      }
    }
  }

  yield { type: "done" };
}

export async function sendCharacterMessage(
  roomId: string,
  message: string,
  options?: {
    webSearchEnabled?: boolean;
    createImageEnabled?: boolean;
    imageModel?: string;
    onChunk?: (text: string) => void;
    onThinking?: () => void;
  },
): Promise<{ text: string; roomId: string }> {
  let fullText = "";

  for await (const event of sendCharacterMessageStream(
    roomId,
    message,
    options,
  )) {
    switch (event.type) {
      case "chunk":
        fullText += event.text;
        options?.onChunk?.(event.text);
        break;
      case "thinking":
        options?.onThinking?.();
        break;
      case "error":
        throw new Error(event.error);
    }
  }

  return { text: fullText, roomId };
}

// ============================================================================
// File Upload
// ============================================================================

export async function uploadFile(
  file: File,
  filename?: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file, filename || file.name);

  const headers: Record<string, string> = { ...getAuthHeaders() };
  if (appId) headers["X-App-Id"] = appId;

  const res = await fetch(`${apiBase}/api/v1/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok)
    throw new Error(`Upload error (${res.status}): ${await res.text()}`);
  return res.json();
}

// ============================================================================
// Credits
// ============================================================================

export async function getBalance(): Promise<BalanceResult> {
  if (isAuthenticated() && appId) {
    return elizaFetch<BalanceResult>(
      `/api/v1/app-credits/balance?app_id=${appId}`,
    );
  }
  return elizaFetch<BalanceResult>("/api/v1/credits/balance");
}

// ============================================================================
// Export
// ============================================================================

export const eliza = {
  // Chat
  chat,
  chatStream,
  // Agents
  listAgents,
  getAgent,
  chatWithAgent,
  chatWithAgentStream,
  // Characters
  getAppCharacters,
  createCharacterRoom,
  getCharacterRooms,
  sendCharacterMessage,
  sendCharacterMessageStream,
  // Generation
  generateImage,
  generateVideo,
  textToSpeech,
  listVoices,
  // Embeddings
  createEmbeddings,
  // Files
  uploadFile,
  // Credits
  getBalance,
  // Analytics
  trackPageView,
};

export default eliza;
