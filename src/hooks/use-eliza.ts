'use client';

/**
 * Eliza Cloud React Hooks
 * 
 * Pre-built hooks for common Eliza Cloud operations.
 * Handles loading states, errors, and caching automatically.
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { 
  ChatMessage, 
  ChatResponse, 
  StreamChunk, 
  ImageResult, 
  Agent, 
  AgentChatResponse, 
  UploadResult,
  AppCharacter,
  Room,
  EmbeddingsResponse,
} from '@/lib/eliza';

// ============================================================================
// Chat Hooks
// ============================================================================

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (messages: ChatMessage[], model?: string): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const { chat } = await import('@/lib/eliza');
      return await chat(messages, model);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { send, loading, error, reset: useCallback(() => setError(null), []) };
}

export function useChatStream() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stream = useCallback(async function* (messages: ChatMessage[], model?: string): AsyncGenerator<StreamChunk> {
    setLoading(true);
    setError(null);
    try {
      const { chatStream } = await import('@/lib/eliza');
      yield* chatStream(messages, model);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { stream, loading, error };
}

// ============================================================================
// Image Generation
// ============================================================================

export function useImageGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);

  const generate = useCallback(async (
    prompt: string,
    options?: { model?: string; width?: number; height?: number; aspectRatio?: string }
  ): Promise<ImageResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { generateImage } = await import('@/lib/eliza');
      const imageResult = await generateImage(prompt, options as Parameters<typeof generateImage>[1]);
      setResult(imageResult);
      return imageResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error, result, reset: useCallback(() => { setResult(null); setError(null); }, []) };
}

// ============================================================================
// Video Generation
// ============================================================================

export function useVideoGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, options?: { model?: string; duration?: number }): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { generateVideo } = await import('@/lib/eliza');
      const result = await generateVideo(prompt, options);
      setVideoUrl(result.url);
      return result.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error, videoUrl, reset: useCallback(() => { setVideoUrl(null); setError(null); }, []) };
}

// ============================================================================
// Text-to-Speech
// ============================================================================

export function useTextToSpeech() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options?: { voiceId?: string }): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { textToSpeech } = await import('@/lib/eliza');
      const blob = await textToSpeech(text, options);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const play = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  }, [audioUrl]);

  return { speak, play, loading, error, audioUrl, reset: useCallback(() => { setAudioUrl(null); setError(null); }, []) };
}

// ============================================================================
// Embeddings
// ============================================================================

export function useEmbeddings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const embed = useCallback(async (input: string | string[], model?: string): Promise<EmbeddingsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const { createEmbeddings } = await import('@/lib/eliza');
      return await createEmbeddings(input, model);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { embed, loading, error };
}

// ============================================================================
// Agent Hooks
// ============================================================================

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
      setError(e instanceof Error ? e.message : 'Failed to load agents');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const chatWith = useCallback(async (agentId: string, message: string): Promise<AgentChatResponse | null> => {
    try {
      const { chatWithAgent } = await import('@/lib/eliza');
      const response = await chatWithAgent(agentId, message, roomIds[agentId]);
      if (response.roomId) setRoomIds(prev => ({ ...prev, [agentId]: response.roomId }));
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
      return null;
    }
  }, [roomIds]);

  return { agents, loading, error, refresh: fetchAgents, chatWith, roomIds };
}

export function useAgentChat(agentId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      setAgentLoading(true);
      try {
        const { getAgent } = await import('@/lib/eliza');
        setAgent(await getAgent(agentId));
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
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const { chatWithAgent } = await import('@/lib/eliza');
      const response = await chatWithAgent(agentId, message, roomId || undefined);
      if (response.roomId) setRoomId(response.roomId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      return response.text;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setLoading(false);
    }
  }, [agentId, roomId]);

  return { agent, messages, send, loading, agentLoading, error, roomId };
}

// ============================================================================
// File Upload
// ============================================================================

export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = useCallback(async (file: File, filename?: string): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { uploadFile } = await import('@/lib/eliza');
      const uploadResult = await uploadFile(file, filename);
      setResult(uploadResult);
      return uploadResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error, result, uploadedUrl: result?.url || null };
}

// ============================================================================
// Credits
// ============================================================================

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
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!refreshInterval) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { balance, loading, error, refresh };
}

// ============================================================================
// Analytics
// ============================================================================

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const track = async () => {
      try {
        const { trackPageView } = await import('@/lib/eliza');
        trackPageView(pathname);
      } catch { /* Silent */ }
    };
    track();
  }, [pathname]);
}

// ============================================================================
// App Characters
// ============================================================================

export function useAppCharacters() {
  const [characters, setCharacters] = useState<AppCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getAppCharacters } = await import('@/lib/eliza');
      setCharacters(await getAppCharacters());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { characters, loading, error, refresh };
}

export function useCharacterChat(characterId?: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; isThinking?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (charId?: string) => {
    const targetId = charId || characterId;
    if (!targetId) { setError('No character ID'); return null; }

    setRoomLoading(true);
    setError(null);
    try {
      const { createCharacterRoom } = await import('@/lib/eliza');
      const newRoom = await createCharacterRoom(targetId);
      setRoom(newRoom);
      setMessages([]);
      return newRoom;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
      return null;
    } finally {
      setRoomLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    if (characterId && !room && !roomLoading) createRoom(characterId);
  }, [characterId, room, roomLoading, createRoom]);

  const send = useCallback(async (message: string, options?: { webSearchEnabled?: boolean; createImageEnabled?: boolean }): Promise<string | null> => {
    if (!room) { setError('No active room'); return null; }

    setLoading(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isThinking: true }]);
    
    try {
      const { sendCharacterMessage } = await import('@/lib/eliza');
      let text = '';
      const result = await sendCharacterMessage(room.id, message, {
        ...options,
        onChunk: (chunk) => {
          text += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: text };
            return updated;
          });
        },
      });
      return result.text;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setLoading(false);
    }
  }, [room]);

  return { room, messages, loading, roomLoading, error, createRoom, send, reset: useCallback(() => { setMessages([]); setRoom(null); setError(null); }, []) };
}

export function useCharacterRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getCharacterRooms } = await import('@/lib/eliza');
      setRooms(await getCharacterRooms());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { rooms, loading, error, refresh };
}
