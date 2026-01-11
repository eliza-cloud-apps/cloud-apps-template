'use client';

/**
 * Eliza Cloud App Template
 * 
 * A polished, production-ready template showcasing:
 * - Real authentication with useElizaAuth
 * - Real credit balance with useAppCredits
 * - Real AI chat with useChatStream
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
} from '@/components/eliza';
import { 
  Send, 
  Loader2, 
  Zap, 
  Bot, 
  User, 
  Coins, 
  ArrowRight,
  Code2,
  Sparkles,
  Shield,
  Cpu,
  Terminal,
  Layers,
} from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#030305] bg-mesh">
      {/* Decorative orbs */}
      <div className="orb orb-orange w-[600px] h-[600px] -top-[200px] -left-[200px] fixed opacity-40" />
      <div className="orb orb-purple w-[500px] h-[500px] top-[50%] -right-[200px] fixed opacity-30" />
      <div className="orb orb-cyan w-[400px] h-[400px] -bottom-[100px] left-[30%] fixed opacity-20" />
      
      <Header />
      <main className="flex-1 flex flex-col relative z-10">
        <ChatApp />
      </main>
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================

function Header() {
  const { isAuthenticated, loading } = useElizaAuth();

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-eliza-orange via-orange-500 to-amber-500 flex items-center justify-center glow-orange">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-tight">Eliza Cloud</h1>
            <p className="text-[11px] text-gray-500 tracking-wide uppercase">App Template</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <a href="https://docs.elizacloud.ai" target="_blank" rel="noopener noreferrer" 
             className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Docs
          </a>
          <a href="https://elizacloud.ai/dashboard" target="_blank" rel="noopener noreferrer" 
             className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <AppCreditDisplay showRefresh className="hidden sm:flex" />
              <PurchaseCreditsButton amount={10} variant="outline" className="hidden sm:flex text-xs">
                <Coins className="h-3.5 w-3.5" />
                Get Credits
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
// Main App
// ============================================================================

function ChatApp() {
  const { isAuthenticated, loading } = useElizaAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-eliza-orange/30 border-t-eliza-orange animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
      <AppLowBalanceWarning className="mx-6 mt-4 max-w-4xl self-center w-full" />
      <ChatInterface />
    </>
  );
}

// ============================================================================
// Landing Page (Unauthenticated)
// ============================================================================

function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-down">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eliza-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-eliza-orange"></span>
            </span>
            <span className="text-sm text-gray-300">Powered by Eliza Cloud Infrastructure</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient">Build AI Apps</span>
            <br />
            <span className="text-gradient-orange">in Minutes</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            This template demonstrates the complete Eliza Cloud SDK. 
            Authentication, credits, and AI chat—all wired up and ready for production.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton size="lg" className="w-full sm:w-auto justify-center px-8">
              <Zap className="h-5 w-5" />
              Start Building
              <ArrowRight className="h-4 w-4 ml-1" />
            </SignInButton>
            <a 
              href="https://github.com/elizaos/eliza-cloud-template" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Code2 className="h-4 w-4" />
              View Source
            </a>
          </div>

          {/* Trust indicator */}
          <p className="mt-8 text-sm text-gray-600">
            Free credits included • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Production-ready components and hooks for building AI-powered applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Shield className="h-6 w-6" />}
              title="Secure Auth"
              description="OAuth integration with Eliza Cloud. Users sign in once, access everywhere."
            />
            <FeatureCard 
              icon={<Coins className="h-6 w-6" />}
              title="Credit System"
              description="Built-in billing with usage-based pricing. Monetize your app from day one."
            />
            <FeatureCard 
              icon={<Cpu className="h-6 w-6" />}
              title="AI Integration"
              description="Stream responses from frontier models. Real-time, low-latency AI chat."
            />
            <FeatureCard 
              icon={<Layers className="h-6 w-6" />}
              title="Multi-Agent Ready"
              description="Deploy AI agents with unique personalities and capabilities."
            />
            <FeatureCard 
              icon={<Terminal className="h-6 w-6" />}
              title="Developer First"
              description="TypeScript SDK with React hooks. Build faster with great DX."
            />
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6" />}
              title="Production Ready"
              description="Battle-tested infrastructure. Scale from prototype to millions of users."
            />
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-20 px-6 border-t border-white/5 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple Integration</h2>
            <p className="text-gray-400">Get started with just a few lines of code.</p>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-gray-500 ml-2 font-mono">app.tsx</span>
            </div>
            <pre className="p-6 text-sm overflow-x-auto">
              <code className="font-mono text-gray-300">
{`import { ElizaProvider, useElizaAuth } from '@/components/eliza';
import { useChatStream } from '@/hooks/use-eliza';

function App() {
  const { isAuthenticated, user } = useElizaAuth();
  const { stream, loading } = useChatStream();
  
  // Your AI app logic here...
}`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-eliza-orange" />
            <span className="text-sm text-gray-500">Eliza Cloud Template</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://elizacloud.ai" target="_blank" rel="noopener noreferrer" 
               className="text-sm text-gray-500 hover:text-white transition-colors">
              elizacloud.ai
            </a>
            <a href="https://github.com/elizaos" target="_blank" rel="noopener noreferrer" 
               className="text-sm text-gray-500 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://discord.gg/eliza" target="_blank" rel="noopener noreferrer" 
               className="text-sm text-gray-500 hover:text-white transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 spotlight hover:scale-[1.02] transition-transform duration-300">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-eliza-orange/20 to-eliza-orange/5 flex items-center justify-center mb-4 text-eliza-orange">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================================================
// Chat Interface
// ============================================================================

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { stream, loading } = useChatStream();
  const { balance, hasLowBalance } = useAppCredits();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (hasLowBalance && balance !== null && balance < 1) {
      alert('Please purchase more credits to continue.');
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
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
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong';
      
      if (errorMsg.includes('INSUFFICIENT_CREDITS')) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = "You've run out of credits. Please top up to continue.";
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState onPrompt={(prompt) => setInput(prompt)} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble 
              key={i} 
              message={msg} 
              isLoading={loading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 pt-4">
        <div className="glass-card rounded-2xl p-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-eliza-orange to-orange-600 text-white flex items-center justify-center hover:from-eliza-orange-hover hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-orange"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 text-center">
          Powered by Eliza Cloud • Each message uses credits
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Chat Components
// ============================================================================

function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const prompts = [
    { text: "Explain quantum computing", icon: <Cpu className="h-4 w-4" /> },
    { text: "Write a haiku about code", icon: <Sparkles className="h-4 w-4" /> },
    { text: "Debug this JavaScript", icon: <Terminal className="h-4 w-4" /> },
    { text: "Brainstorm startup ideas", icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-eliza-orange/20 rounded-full blur-2xl scale-150" />
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center glow-orange">
          <Bot className="h-10 w-10 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-semibold text-white mb-3">How can I help?</h3>
      <p className="text-gray-400 mb-10 max-w-md">
        I can assist with questions, coding, writing, analysis, and more.
      </p>
      
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPrompt(prompt.text)}
            className="glass-card p-4 rounded-xl text-left hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-eliza-orange/70 group-hover:text-eliza-orange transition-colors">
                {prompt.icon}
              </span>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {prompt.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, isLoading }: { message: Message; isLoading?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-up`}>
      <div className={`flex-shrink-0 ${isUser ? 'order-last' : ''}`}>
        {isUser ? (
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-300" />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center glow-orange">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block rounded-2xl px-5 py-3 ${
            isUser
              ? 'bg-gradient-to-br from-eliza-orange to-orange-600 text-white rounded-br-md'
              : 'glass-card text-gray-100 rounded-bl-md'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
