/**
 * Eliza Cloud SDK
 * 
 * Pre-configured API client for Eliza Cloud services.
 * All API calls automatically use the injected API key.
 * When user is authenticated, their credits are used instead of org credits.
 * 
 * Available APIs:
 * - chat / chatStream: AI chat completions (OpenAI-compatible)
 * - generateImage: AI image generation
 * - generateVideo: AI video generation  
 * - getBalance: Check credit balance (org balance or user's app balance)
 * - trackPageView: Analytics tracking
 */

import { getAuthHeaders, isAuthenticated } from './eliza-auth';

const apiBase = process.env.NEXT_PUBLIC_ELIZA_API_URL || 'https://www.elizacloud.ai';
const appId = process.env.NEXT_PUBLIC_ELIZA_APP_ID || '';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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
}

export interface BalanceResult {
  balance: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  status: 'active' | 'inactive';
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
  content: {
    text: string;
    thought?: string;
  };
  createdAt: number;
  isAgent: boolean;
  type: 'user' | 'agent' | 'thinking' | 'error';
}

export interface StreamChunkData {
  messageId: string;
  chunk: string;
  timestamp: number;
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
  options: RequestInit = {}
): Promise<T> {
  const url = `${apiBase}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...getAuthHeaders(), // Include user auth token
  };
  
  // App ID for routing and billing
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    
    // Handle insufficient credits error
    if (res.status === 402) {
      throw new Error('INSUFFICIENT_CREDITS: Not enough credits. Please purchase more.');
    }
    
    throw new Error(`Eliza API Error (${res.status}): ${errorText}`);
  }
  
  return res.json();
}

// ============================================================================
// Analytics
// ============================================================================

const trackedPaths = new Set<string>();

/**
 * Track a page view for analytics.
 * Uses sendBeacon for reliable delivery even on page unload.
 */
export async function trackPageView(pathname?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
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
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        body: blob,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silent fail - don't break app for analytics
  }
}

// ============================================================================
// AI Chat
// ============================================================================

/**
 * Send a chat completion request (non-streaming).
 * 
 * @example
 * const response = await chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * console.log(response.choices[0].message.content);
 */
export async function chat(
  messages: ChatMessage[],
  model = 'gpt-4o'
): Promise<ChatResponse> {
  return elizaFetch<ChatResponse>('/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
}

/**
 * Send a streaming chat completion request.
 * Returns an async generator that yields chunks as they arrive.
 * 
 * @example
 * for await (const chunk of chatStream([{ role: 'user', content: 'Hello!' }])) {
 *   const content = chunk.choices?.[0]?.delta?.content;
 *   if (content) console.log(content);
 * }
 */
export async function* chatStream(
  messages: ChatMessage[],
  model = 'gpt-4o'
): AsyncGenerator<StreamChunk> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, model, stream: true }),
  });
  
  if (!res.ok) {
    throw new Error(`Eliza API Error (${res.status}): ${await res.text()}`);
  }
  
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Generate an image from a text prompt.
 * 
 * @example
 * const result = await generateImage('A sunset over mountains');
 * // result.images[0].url contains the image URL
 */
export async function generateImage(
  prompt: string,
  options?: { 
    model?: string; 
    width?: number; 
    height?: number;
    numImages?: number;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    stylePreset?: string;
  }
): Promise<ImageResult> {
  return elizaFetch<ImageResult>('/api/v1/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options }),
  });
}

// ============================================================================
// Video Generation
// ============================================================================

/**
 * Generate a video from a text prompt.
 * 
 * @example
 * const { url } = await generateVideo('A timelapse of clouds');
 */
export async function generateVideo(
  prompt: string,
  options?: { model?: string; duration?: number }
): Promise<VideoResult> {
  return elizaFetch<VideoResult>('/api/v1/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options }),
  });
}

// ============================================================================
// Agents
// ============================================================================

/**
 * List available AI agents.
 * 
 * @example
 * const agents = await listAgents();
 * console.log(agents[0].name);
 */
export async function listAgents(): Promise<Agent[]> {
  const result = await elizaFetch<{ agents: Agent[] }>('/api/v1/agents', {});
  return result.agents || [];
}

/**
 * Get a specific agent by ID.
 * 
 * @example
 * const agent = await getAgent('agent-id');
 * console.log(agent.name);
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    return await elizaFetch<Agent>(`/api/v1/agents/${agentId}`, {});
  } catch {
    return null;
  }
}

/**
 * Chat with a specific AI agent.
 * Agent conversations are persisted in rooms.
 * 
 * @example
 * const response = await chatWithAgent('agent-id', 'Hello!');
 * console.log(response.text);
 * 
 * // Continue conversation in same room
 * const response2 = await chatWithAgent('agent-id', 'Tell me more', response.roomId);
 */
export async function chatWithAgent(
  agentId: string,
  message: string,
  roomId?: string
): Promise<AgentChatResponse> {
  return elizaFetch<AgentChatResponse>(`/api/v1/agents/${agentId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message,
      roomId,
    }),
  });
}

/**
 * Stream chat with a specific AI agent.
 * Returns an async generator that yields text chunks.
 * 
 * @example
 * let fullResponse = '';
 * for await (const chunk of chatWithAgentStream('agent-id', 'Hello!')) {
 *   fullResponse += chunk.text;
 *   console.log(chunk.text);
 * }
 */
export async function* chatWithAgentStream(
  agentId: string,
  message: string,
  roomId?: string
): AsyncGenerator<{ text: string; roomId?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/v1/agents/${agentId}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, roomId }),
  });
  
  if (!res.ok) {
    throw new Error(`Agent chat error (${res.status}): ${await res.text()}`);
  }
  
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

// ============================================================================
// File Upload
// ============================================================================

/**
 * Upload a file to Eliza Cloud storage.
 * Returns the URL of the uploaded file.
 * 
 * @example
 * const file = document.querySelector('input[type="file"]').files[0];
 * const result = await uploadFile(file);
 * console.log(result.url);
 */
export async function uploadFile(
  file: File,
  filename?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file, filename || file.name);
  
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/v1/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error(`Upload error (${res.status}): ${await res.text()}`);
  }
  
  return res.json();
}

// ============================================================================
// Credits & Billing
// ============================================================================

/**
 * Get current credit balance.
 * If user is authenticated, returns their app-specific balance.
 * Otherwise, returns the org's balance.
 * 
 * @example
 * const { balance } = await getBalance();
 * if (balance < 5) alert('Low credits!');
 */
export async function getBalance(): Promise<BalanceResult> {
  // If user is authenticated, get their app-specific balance
  if (isAuthenticated() && appId) {
    return elizaFetch<BalanceResult>(`/api/v1/app-credits/balance?app_id=${appId}`, {});
  }
  // Otherwise, get org balance (fallback)
  return elizaFetch<BalanceResult>('/api/v1/credits/balance', {});
}

// ============================================================================
// App Characters - Real Character Chat with Rooms & Streaming
// ============================================================================

/**
 * Get characters linked to this app.
 * Returns the AI characters that have been configured for this app.
 * 
 * @example
 * const characters = await getAppCharacters();
 * console.log(characters[0].name); // "Assistant"
 */
export async function getAppCharacters(): Promise<AppCharacter[]> {
  if (!appId) {
    console.warn('No app ID configured - cannot fetch app characters');
    return [];
  }
  
  try {
    const result = await elizaFetch<{ success: boolean; characters: AppCharacter[] }>(
      `/api/v1/apps/${appId}/characters`,
      {}
    );
    return result.characters || [];
  } catch (error) {
    console.error('Failed to fetch app characters:', error);
    return [];
  }
}

/**
 * Create a new chat room with a character.
 * Returns a room ID that can be used for subsequent messages.
 * 
 * @example
 * const room = await createCharacterRoom('character-id');
 * console.log(room.id); // Use this for sendCharacterMessage
 */
export async function createCharacterRoom(characterId: string): Promise<Room> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/eliza/rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ characterId }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to create room (${res.status}): ${await res.text()}`);
  }
  
  const data = await res.json();
  return {
    id: data.roomId || data.room?.id,
    characterId,
    characterName: data.characterName,
    characterAvatar: data.characterAvatar,
  };
}

/**
 * Get existing rooms for the authenticated user.
 * Returns rooms with last message preview.
 * 
 * @example
 * const rooms = await getCharacterRooms();
 * rooms.forEach(room => console.log(room.characterName, room.lastMessage));
 */
export async function getCharacterRooms(): Promise<Room[]> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/eliza/rooms`, {
    headers,
  });
  
  if (!res.ok) {
    throw new Error(`Failed to get rooms (${res.status}): ${await res.text()}`);
  }
  
  const data = await res.json();
  return (data.rooms || []).map((room: {
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
  }));
}

/**
 * Send a message to a character and get streaming response.
 * Returns an async generator that yields chunks as they arrive.
 * 
 * @example
 * // Create or get a room first
 * const room = await createCharacterRoom('character-id');
 * 
 * // Stream the response
 * let fullText = '';
 * for await (const chunk of sendCharacterMessageStream(room.id, 'Hello!')) {
 *   if (chunk.type === 'chunk') {
 *     fullText += chunk.text;
 *     console.log(chunk.text); // Print each chunk as it arrives
 *   } else if (chunk.type === 'message') {
 *     console.log('Complete message:', chunk.message);
 *   }
 * }
 */
export async function* sendCharacterMessageStream(
  roomId: string,
  message: string,
  options?: {
    webSearchEnabled?: boolean;
    createImageEnabled?: boolean;
    imageModel?: string;
  }
): AsyncGenerator<
  | { type: 'chunk'; text: string; messageId: string }
  | { type: 'message'; message: StreamingMessage }
  | { type: 'thinking'; message: StreamingMessage }
  | { type: 'error'; error: string }
  | { type: 'done' }
> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  const res = await fetch(`${apiBase}/api/eliza/rooms/${roomId}/messages/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: message,
      appId,
      webSearchEnabled: options?.webSearchEnabled ?? true,
      createImageEnabled: options?.createImageEnabled ?? false,
      ...(options?.imageModel && { imageModel: options.imageModel }),
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    yield { type: 'error', error: `Failed to send message (${res.status}): ${errorText}` };
    return;
  }
  
  const reader = res.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: 'No response body' };
    return;
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';
    
    for (const message of messages) {
      if (!message.trim()) continue;
      
      const lines = message.split('\n');
      let eventType = 'message';
      let dataStr = '';
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          dataStr += line.slice(6);
        }
      }
      
      if (!dataStr) continue;
      
      try {
        const data = JSON.parse(dataStr);
        
        switch (eventType) {
          case 'chunk':
            yield { type: 'chunk', text: data.chunk, messageId: data.messageId };
            break;
          case 'message':
            if (data.type === 'thinking') {
              yield { type: 'thinking', message: data };
            } else {
              yield { type: 'message', message: data };
            }
            break;
          case 'error':
            yield { type: 'error', error: data.message || data.error || 'Unknown error' };
            break;
          case 'done':
            yield { type: 'done' };
            break;
        }
      } catch {
        // Skip malformed data
      }
    }
  }
  
  yield { type: 'done' };
}

/**
 * Send a message to a character and get the full response.
 * For real-time streaming, use sendCharacterMessageStream instead.
 * 
 * @example
 * const room = await createCharacterRoom('character-id');
 * const response = await sendCharacterMessage(room.id, 'Hello!');
 * console.log(response.text);
 */
export async function sendCharacterMessage(
  roomId: string,
  message: string,
  options?: {
    webSearchEnabled?: boolean;
    createImageEnabled?: boolean;
    imageModel?: string;
    onChunk?: (text: string) => void;
    onThinking?: () => void;
  }
): Promise<{ text: string; roomId: string }> {
  let fullText = '';
  
  for await (const event of sendCharacterMessageStream(roomId, message, options)) {
    switch (event.type) {
      case 'chunk':
        fullText += event.text;
        options?.onChunk?.(event.text);
        break;
      case 'thinking':
        options?.onThinking?.();
        break;
      case 'error':
        throw new Error(event.error);
    }
  }
  
  return { text: fullText, roomId };
}

// ============================================================================
// Utility Exports
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
  // App Characters (Real Chat Flow)
  getAppCharacters,
  createCharacterRoom,
  getCharacterRooms,
  sendCharacterMessage,
  sendCharacterMessageStream,
  // Generation
  generateImage,
  generateVideo,
  // Files
  uploadFile,
  // Credits
  getBalance,
  // Analytics
  trackPageView,
};

export default eliza;
