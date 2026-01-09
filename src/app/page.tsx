'use client';

/**
 * Eliza Cloud App - Example Chat Interface
 * 
 * This is a WORKING example showing:
 * - Real authentication with useElizaAuth
 * - Real credit balance with useAppCredits
 * - Real AI chat with useChatStream
 * 
 * NO MOCKS. NO DEMOS. REAL SDK CALLS.
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStream } from '@/hooks/use-eliza';
import { 
  useElizaAuth,
  useAppCredits,
  SignInButton, 
  UserMenu, 
  AppCreditDisplay,
  AppLowBalanceWarning,
  PurchaseCreditsButton,
  ProtectedRoute,
} from '@/components/eliza';
import { Send, Loader2, Sparkles, MessageCircle, Bot, User, Coins } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      <Header />
      <main className="flex-1 flex flex-col">
        <ChatApp />
      </main>
    </div>
  );
}

// ============================================================================
// Header with Auth & Credits
// ============================================================================

function Header() {
  const { isAuthenticated, loading } = useElizaAuth();

  return (
    <header className="border-b border-white/[0.06] backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Eliza Chat</h1>
            <p className="text-xs text-gray-500">Powered by Eliza Cloud</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 rounded-lg bg-gray-800 animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <AppCreditDisplay showRefresh className="hidden sm:flex" />
              <PurchaseCreditsButton amount={10} variant="outline" className="hidden sm:flex text-xs">
                <Coins className="h-3.5 w-3.5" />
                Top Up
              </PurchaseCreditsButton>
              <UserMenu avatarSize={36} />
            </>
          ) : (
            <SignInButton size="sm" />
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Main Chat App - Protected
// ============================================================================

function ChatApp() {
  const { isAuthenticated, loading } = useElizaAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-eliza-orange" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return (
    <>
      <AppLowBalanceWarning className="mx-4 mt-4 max-w-4xl self-center w-full" />
      <ChatInterface />
    </>
  );
}

// ============================================================================
// Welcome Page (Not Signed In)
// ============================================================================

function WelcomePage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-8">
        {/* Animated background glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-eliza-orange/20 rounded-full blur-3xl scale-150" />
          <div className="relative h-24 w-24 mx-auto rounded-2xl bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center shadow-2xl shadow-eliza-orange/20">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white">
            Chat with AI
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Sign in to start chatting with advanced AI.
            Get instant responses powered by GPT-4o.
          </p>
        </div>

        <div className="space-y-4">
          <SignInButton size="lg" className="w-full justify-center">
            <Sparkles className="h-5 w-5" />
            Sign in to Chat
          </SignInButton>
          <p className="text-sm text-gray-500">
            New users get free credits to try it out
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-800">
          <Feature icon="⚡" label="Fast" />
          <Feature icon="🔒" label="Private" />
          <Feature icon="✨" label="Smart" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ============================================================================
// Chat Interface - REAL AI Integration
// ============================================================================

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { stream, loading } = useChatStream();
  const { balance, hasLowBalance } = useAppCredits();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check credits
    if (hasLowBalance && balance !== null && balance < 1) {
      alert('Please purchase more credits to continue chatting.');
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // REAL API CALL - using useChatStream hook
      for await (const chunk of stream(newMessages)) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content += delta;
            return updated;
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      
      // Handle insufficient credits error
      if (errorMsg.includes('INSUFFICIENT_CREDITS')) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = "⚠️ You're out of credits. Please purchase more to continue chatting.";
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = `Error: ${errorMsg}`;
          return updated;
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState onPrompt={(prompt) => {
            setInput(prompt);
          }} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} isLoading={loading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4 bg-[#09090b]/80 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:border-eliza-orange focus:outline-none focus:ring-1 focus:ring-eliza-orange"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="h-12 w-12 rounded-xl bg-eliza-orange text-white flex items-center justify-center hover:bg-eliza-orange-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by Eliza Cloud • Messages use your credits
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// UI Components
// ============================================================================

function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const prompts = [
    "Explain quantum computing simply",
    "Write a short poem about code",
    "What's the meaning of life?",
    "Help me brainstorm app ideas",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="h-16 w-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-eliza-orange" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
      <p className="text-gray-400 mb-8 max-w-md">
        Ask anything! I can help with questions, writing, coding, and more.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-700 transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, isLoading }: { message: Message; isLoading?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-eliza-orange text-white rounded-br-md'
            : 'bg-gray-800 text-gray-100 rounded-bl-md'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-gray-400">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}
