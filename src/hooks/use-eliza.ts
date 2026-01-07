'use client';

/**
 * Eliza Cloud React Hooks
 * 
 * Pre-built hooks for common Eliza Cloud operations.
 * These hooks handle loading states and errors automatically.
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatMessage, ChatResponse, StreamChunk, ImageResult } from '@/lib/eliza';

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
