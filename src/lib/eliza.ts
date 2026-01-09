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

const apiKey = process.env.NEXT_PUBLIC_ELIZA_API_KEY || '';
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
    ...getAuthHeaders(), // Include user auth if authenticated
  };
  
  // App API key (always include)
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  
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
      ...(apiKey ? { api_key: apiKey } : {}),
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
  const res = await fetch(`${apiBase}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
    },
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
  
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
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
  
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
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
