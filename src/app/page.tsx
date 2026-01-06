'use client';

import { CreditDisplay } from '@/components/eliza';
import { Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

/**
 * Eliza Cloud App - Welcome Page
 * 
 * A beautiful, minimal landing page for Eliza Cloud apps.
 * Replace this with your own content!
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] via-transparent to-violet-500/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-orange-500/[0.08] to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ElizaLogo className="h-7 text-white" />
          </div>
          <CreditDisplay className="text-xs" />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            Built on Eliza Cloud
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-white">Build your</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              dreams
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            Your AI-powered app starts here. Chat, generate images, 
            connect with agents—all powered by Eliza Cloud.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a 
              href="https://elizacloud.ai/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a 
              href="https://elizacloud.ai/docs/api" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-gray-300 font-medium transition-all hover:bg-white/[0.03] hover:border-white/20"
            >
              View API Docs
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto animate-slide-up">
          <FeatureCard 
            icon={Zap}
            title="AI Chat"
            description="Streaming responses with GPT-4o and other models"
          />
          <FeatureCard 
            icon={Shield}
            title="Pre-configured"
            description="SDK, hooks, and credits ready to use"
          />
          <FeatureCard 
            icon={Globe}
            title="Agents"
            description="Connect with AI agents in the ecosystem"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            Edit <code className="px-1.5 py-0.5 rounded bg-white/[0.03] text-gray-400 font-mono text-xs">src/app/page.tsx</code> to get started
          </p>
          <a
            href="https://elizacloud.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition-colors"
          >
            elizacloud.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Zap; 
  title: string; 
  description: string;
}) {
  return (
    <div className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.1] transition-all">
      <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
        <Icon className="h-4.5 w-4.5 text-orange-400" />
      </div>
      <h3 className="font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ElizaLogo({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 180 70" 
      fill="currentColor" 
      className={className}
      aria-label="Eliza Cloud"
    >
      <path d="M43.3,43.7c0,3-1.1,5.4-3.2,7.5-2.2,2.1-4.7,3.1-7.8,3.1s-5.7-1-7.8-3.1c-2.2-2.1-3.2-4.6-3.2-7.5v-17.6c0-2.9,1.1-5.3,3.2-7.4,2.2-2.1,4.8-3.1,7.8-3.1s4.2.6,5.9,1.7c3.5,2.2,5,5.3,5,7.8s-.6,1.6-1.6,1.6h-3.2c-1,0-1.6-.5-1.7-1.6-.3-1.5-1.9-3.4-4.4-3.4s-4.4,1.9-4.4,4.1v18.2c0,2.2,2,4.1,4.4,4.1s4.7-1.7,4.7-4.5.7-1.6,1.6-1.6h3.1c.9,0,1.6.7,1.6,1.6h0ZM52.9,16.2h3.2c.9,0,1.6.7,1.6,1.6v29.8h13.7c.9,0,1.6.7,1.6,1.6v3.1c0,.9-.7,1.6-1.6,1.6h-18.5c-.9,0-1.6-.7-1.6-1.6V17.8c0-.9.7-1.6,1.6-1.6ZM101.1,26.2v17.7c0,2.9-1.1,5.4-3.2,7.5-2.1,2-4.7,3.1-7.9,3.1s-5.8-1-8-3.1-3.2-4.6-3.2-7.5v-17.6c0-2.9,1.1-5.4,3.2-7.4,2.2-2.1,4.8-3.1,8-3.1s5.8,1,7.9,3.1c2.2,2,3.2,4.5,3.2,7.4h0ZM94.7,44.1v-18.3c0-2.2-2.2-4.1-4.7-4.1s-4.7,1.9-4.7,4.1v18.2c0,2.2,2.2,4.2,4.7,4.2s4.7-1.9,4.7-4.1ZM130.2,17.8v26.1c0,2.9-1.1,5.4-3.2,7.5-2.1,2-4.7,3.1-7.9,3.1s-5.8-1-8-3.1-3.2-4.6-3.2-7.5v-26c0-.9.7-1.6,1.6-1.6h3.2c.9,0,1.6.7,1.6,1.6v26.3c0,2.2,2.2,4.2,4.8,4.2s4.7-1.9,4.7-4.1v-26.4c0-.9.7-1.6,1.6-1.6h3.2c.9,0,1.6.7,1.6,1.6h0ZM148.2,53.8h-9.1c-.9,0-1.6-.7-1.6-1.6V17.8c0-.9.7-1.6,1.6-1.6h9.1c2.9,0,5.4,1,7.4,3.1,2,2,3.1,4.5,3.1,7.4v16.7c0,2.9-1,5.4-3.1,7.4-2,2-4.5,3.1-7.4,3.1h0ZM152.1,43.6v-17.2c0-2.2-1.8-4-4-4h-4.1v25.1h4.1c2.2,0,4-1.7,4-3.9Z"/>
      <polygon points="180 53.7 180 70 163.7 70 163.7 67 177 67 177 53.7 180 53.7"/>
      <polygon points="16.3 67 16.3 70 0 70 0 53.7 3 53.7 3 67 16.3 67"/>
      <polygon points="16.3 0 16.3 3 3 3 3 16.3 0 16.3 0 0 16.3 0"/>
      <polygon points="180 0 180 16.3 177 16.3 177 3 163.7 3 163.7 0 180 0"/>
    </svg>
  );
}
