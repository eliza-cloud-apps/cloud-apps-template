'use client';

/**
 * Eliza Cloud React Hooks
 * 
 * Pre-built hooks for common Eliza Cloud operations.
 * These hooks handle loading states and errors automatically.
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatMessage, ChatResponse, StreamChunk } from '@/lib/eliza';

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
 * const { generate, loading, error, imageUrl } = useImageGeneration();
 * await generate('A beautiful sunset');
 * console.log(imageUrl);
 */
export function useImageGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generate = useCallback(async (
    prompt: string,
    options?: { model?: string; width?: number; height?: number }
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { generateImage } = await import('@/lib/eliza');
      const result = await generateImage(prompt, options);
      setImageUrl(result.url);
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
    setImageUrl(null);
    setError(null);
  }, []);

  return { generate, loading, error, imageUrl, reset };
}

// ============================================================================
// Agents Hook
// ============================================================================

interface Agent {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
}

/**
 * Hook for listing and chatting with agents.
 * 
 * @example
 * const { agents, loading, chatWith } = useAgents();
 * const { response } = await chatWith(agents[0].id, 'Hello!');
 */
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomIds, setRoomIds] = useState<Record<string, string>>({});

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { listAgents } = await import('@/lib/eliza');
      const result = await listAgents();
      setAgents(result.agents);
      return result.agents;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const chatWith = useCallback(async (
    agentId: string,
    message: string
  ): Promise<{ response: string; roomId: string } | null> => {
    try {
      const { chatWithAgent } = await import('@/lib/eliza');
      const result = await chatWithAgent(agentId, message, roomIds[agentId]);
      setRoomIds(prev => ({ ...prev, [agentId]: result.roomId }));
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    }
  }, [roomIds]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, fetchAgents, chatWith };
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

// ============================================================================
// File Upload Hook
// ============================================================================

/**
 * Hook for file uploads.
 * 
 * @example
 * const { upload, loading, uploadedUrl } = useFileUpload();
 * const input = document.querySelector('input[type="file"]');
 * const url = await upload(input.files[0]);
 */
export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File | Blob,
    filename?: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { uploadFile } = await import('@/lib/eliza');
      const name = filename || (file instanceof File ? file.name : 'upload');
      const result = await uploadFile(file, name);
      setUploadedUrl(result.url);
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
    setUploadedUrl(null);
    setError(null);
  }, []);

  return { upload, loading, error, uploadedUrl, reset };
}
