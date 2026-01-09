'use client';

/**
 * Eliza Cloud React Hooks
 * 
 * Pre-built hooks for common Eliza Cloud operations.
 * These hooks handle loading states and errors automatically.
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatMessage, ChatResponse, StreamChunk, ImageResult, Agent, AgentChatResponse, UploadResult } from '@/lib/eliza';

// ============================================================================
// Chat Hooks
// ============================================================================

/**
 * Hook for non-streaming chat.
 * 
 * @example
 * const { send, loading, error } = useChat();
 * const response = await send([{ role: 'user', content: 'Hello!' }]);
 */
export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (
    messages: ChatMessage[],
    model?: string
  ): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const { chat } = await import('@/lib/eliza');
      return await chat(messages, model);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { send, loading, error, reset };
}

/**
 * Hook for streaming chat responses.
 * 
 * @example
 * const { stream, loading } = useChatStream();
 * for await (const chunk of stream([{ role: 'user', content: 'Hello!' }])) {
 *   const content = chunk.choices?.[0]?.delta?.content;
 *   if (content) setMessage(prev => prev + content);
 * }
 */
export function useChatStream() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stream = useCallback(async function* (
    messages: ChatMessage[],
    model?: string
  ): AsyncGenerator<StreamChunk> {
    setLoading(true);
    setError(null);
    try {
      const { chatStream } = await import('@/lib/eliza');
      yield* chatStream(messages, model);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stream, loading, error };
}

// ============================================================================
// Image Generation Hook
// ============================================================================

/**
 * Hook for image generation.
 * 
 * @example
 * const { generate, loading, error, result } = useImageGeneration();
 * await generate('A beautiful sunset');
 * console.log(result?.images?.[0]?.url);
 */
export function useImageGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);

  const generate = useCallback(async (
    prompt: string,
    options?: { 
      model?: string; 
      width?: number; 
      height?: number;
      numImages?: number;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    }
  ): Promise<ImageResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { generateImage } = await import('@/lib/eliza');
      const imageResult = await generateImage(prompt, options);
      setResult(imageResult);
      return imageResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, loading, error, result, reset };
}

// ============================================================================
// Video Generation Hook
// ============================================================================

/**
 * Hook for video generation.
 * 
 * @example
 * const { generate, loading, videoUrl } = useVideoGeneration();
 * await generate('A timelapse of clouds');
 */
export function useVideoGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const generate = useCallback(async (
    prompt: string,
    options?: { model?: string; duration?: number }
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { generateVideo } = await import('@/lib/eliza');
      const result = await generateVideo(prompt, options);
      setVideoUrl(result.url);
      return result.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVideoUrl(null);
    setError(null);
  }, []);

  return { generate, loading, error, videoUrl, reset };
}

// ============================================================================
// Agent Hooks
// ============================================================================

/**
 * Hook for listing and chatting with AI agents.
 * 
 * @example
 * const { agents, loading, chat, selectedAgent } = useAgents();
 * 
 * // List is auto-fetched on mount
 * agents.map(agent => <AgentCard agent={agent} />);
 * 
 * // Chat with an agent
 * const response = await chat(agent.id, 'Hello!');
 */
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomIds, setRoomIds] = useState<Record<string, string>>({});

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { listAgents } = await import('@/lib/eliza');
      const result = await listAgents();
      setAgents(result);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load agents';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const chatWith = useCallback(async (
    agentId: string,
    message: string
  ): Promise<AgentChatResponse | null> => {
    try {
      const { chatWithAgent } = await import('@/lib/eliza');
      const roomId = roomIds[agentId];
      const response = await chatWithAgent(agentId, message, roomId);
      
      // Store room ID for continued conversation
      if (response.roomId) {
        setRoomIds(prev => ({ ...prev, [agentId]: response.roomId }));
      }
      
      return response;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chat failed';
      setError(msg);
      return null;
    }
  }, [roomIds]);

  const resetConversation = useCallback((agentId: string) => {
    setRoomIds(prev => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  }, []);

  return { 
    agents, 
    loading, 
    error, 
    refresh: fetchAgents, 
    chatWith,  // Named to match the pattern in knowledge-context
    resetConversation,
    roomIds,
  };
}

/**
 * Hook for chatting with a specific agent.
 * Handles conversation state and streaming.
 * 
 * @example
 * const { messages, send, loading, agent } = useAgentChat('agent-id');
 * 
 * // Send a message
 * await send('Hello!');
 * 
 * // Messages are automatically updated
 * messages.map(m => <Message {...m} />);
 */
export function useAgentChat(agentId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent info
  useEffect(() => {
    const fetchAgent = async () => {
      setAgentLoading(true);
      try {
        const { getAgent } = await import('@/lib/eliza');
        const result = await getAgent(agentId);
        setAgent(result);
      } catch {
        setError('Failed to load agent');
      } finally {
        setAgentLoading(false);
      }
    };
    fetchAgent();
  }, [agentId]);

  const send = useCallback(async (message: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const { chatWithAgent } = await import('@/lib/eliza');
      const response = await chatWithAgent(agentId, message, roomId || undefined);
      
      if (response.roomId) {
        setRoomId(response.roomId);
      }
      
      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      
      return response.text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chat failed';
      setError(msg);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setLoading(false);
    }
  }, [agentId, roomId]);

  const sendStream = useCallback(async function* (message: string) {
    setLoading(true);
    setError(null);
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    try {
      const { chatWithAgentStream } = await import('@/lib/eliza');
      
      for await (const chunk of chatWithAgentStream(agentId, message, roomId || undefined)) {
        if (chunk.text) {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content += chunk.text;
            return updated;
          });
          yield chunk.text;
        }
        if (chunk.roomId) {
          setRoomId(chunk.roomId);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chat failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [agentId, roomId]);

  const reset = useCallback(() => {
    setMessages([]);
    setRoomId(null);
    setError(null);
  }, []);

  return {
    agent,
    agentLoading,
    messages,
    loading,
    error,
    send,
    sendStream,
    reset,
    roomId,
  };
}

// ============================================================================
// File Upload Hook
// ============================================================================

/**
 * Hook for file uploads.
 * 
 * @example
 * const { upload, loading, uploadedUrl } = useFileUpload();
 * 
 * const handleFileChange = async (e) => {
 *   const file = e.target.files[0];
 *   const result = await upload(file);
 *   console.log('Uploaded to:', result.url);
 * };
 */
export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = useCallback(async (
    file: File,
    filename?: string
  ): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { uploadFile } = await import('@/lib/eliza');
      const uploadResult = await uploadFile(file, filename);
      setResult(uploadResult);
      return uploadResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { 
    upload, 
    loading, 
    error, 
    result,
    uploadedUrl: result?.url || null,
    reset,
  };
}

// ============================================================================
// Credits Hook
// ============================================================================

/**
 * Hook for checking credit balance.
 * Auto-refreshes at specified interval.
 * 
 * @example
 * const { balance, loading, refresh } = useCredits();
 * console.log(`You have ${balance} credits`);
 */
export function useCredits(refreshInterval?: number) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getBalance } = await import('@/lib/eliza');
      const result = await getBalance();
      setBalance(result.balance);
      return result.balance;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { balance, loading, error, refresh };
}

// ============================================================================
// Analytics Hook
// ============================================================================

/**
 * Hook for automatic page view tracking.
 * Add to your layout or root component.
 * 
 * @example
 * function RootLayout({ children }) {
 *   usePageTracking();
 *   return <>{children}</>;
 * }
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const track = async () => {
      try {
        const { trackPageView } = await import('@/lib/eliza');
        trackPageView(pathname);
      } catch {
        // Silent fail
      }
    };
    track();
  }, [pathname]);
}
