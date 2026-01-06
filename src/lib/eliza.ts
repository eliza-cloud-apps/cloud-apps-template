/**
 * Eliza Cloud SDK
 * 
 * Pre-configured API client for Eliza Cloud services.
 * All API calls automatically use the injected API key.
 * 
 * DO NOT MODIFY THIS FILE - it's configured for your app automatically.
 */

const apiKey = process.env.NEXT_PUBLIC_ELIZA_API_KEY || '';
const apiBase = process.env.NEXT_PUBLIC_ELIZA_API_URL || 'https://elizacloud.ai';
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
}

export interface Agent {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
}

export interface AgentChatResult {
  response: string;
  roomId: string;
}

export interface UploadResult {
  id: string;
  url: string;
}

export interface BalanceResult {
  balance: number;
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
  };
  
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
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
 * Called automatically by ElizaAnalytics component.
 */
export async function trackPageView(pathname?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const path = pathname || window.location.pathname;
  if (trackedPaths.has(path)) return;
  trackedPaths.add(path);
  
  try {
    await elizaFetch('/api/v1/track/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        page_url: window.location.href,
        pathname: path,
        referrer: document.referrer,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
      }),
    });
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
 * const { url } = await generateImage('A sunset over mountains');
 * console.log(url);
 */
export async function generateImage(
  prompt: string,
  options?: { model?: string; width?: number; height?: number }
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
): Promise<{ url: string; id: string }> {
  return elizaFetch('/api/v1/generate-video', {
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
 * const { agents } = await listAgents();
 * agents.forEach(agent => console.log(agent.name));
 */
export async function listAgents(): Promise<{ agents: Agent[] }> {
  return elizaFetch('/api/v1/agents', {});
}

/**
 * Chat with a specific AI agent.
 * Pass roomId from previous response to continue conversation.
 * 
 * @example
 * const { response, roomId } = await chatWithAgent('agent-123', 'Hello!');
 * // Continue conversation:
 * const { response: reply } = await chatWithAgent('agent-123', 'How are you?', roomId);
 */
export async function chatWithAgent(
  agentId: string,
  message: string,
  roomId?: string
): Promise<AgentChatResult> {
  return elizaFetch('/api/v1/agents/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, message, roomId }),
  });
}

// ============================================================================
// Storage
// ============================================================================

/**
 * Upload a file to Eliza Cloud storage.
 * 
 * @example
 * const file = new File(['Hello'], 'test.txt');
 * const { url } = await uploadFile(file, 'test.txt');
 */
export async function uploadFile(
  file: File | Blob,
  filename: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file, filename);
  
  const res = await fetch(`${apiBase}/api/v1/storage/upload`, {
    method: 'POST',
    headers: apiKey ? { 'X-Api-Key': apiKey } : {},
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
  
  return res.json();
}

// ============================================================================
// Credits & Billing
// ============================================================================

/**
 * Get current credit balance.
 * 
 * @example
 * const { balance } = await getBalance();
 * if (balance < 5) alert('Low credits!');
 */
export async function getBalance(): Promise<BalanceResult> {
  return elizaFetch('/api/v1/credits/balance', {});
}

// ============================================================================
// Utility Exports
// ============================================================================

export const eliza = {
  chat,
  chatStream,
  generateImage,
  generateVideo,
  listAgents,
  chatWithAgent,
  uploadFile,
  getBalance,
  trackPageView,
};

export default eliza;
