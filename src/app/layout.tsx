import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ElizaProvider } from '@/components/eliza';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Eliza Chat - AI Assistant',
  description: 'Chat with an intelligent AI assistant powered by Eliza Cloud. Real-time responses, secure authentication, and credit-based billing.',
  keywords: ['AI', 'chat', 'assistant', 'Eliza Cloud', 'GPT-4'],
  authors: [{ name: 'Eliza Cloud' }],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>',
  },
  openGraph: {
    title: 'Eliza Chat - AI Assistant',
    description: 'Chat with an intelligent AI assistant powered by Eliza Cloud',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-white`}>
        <ElizaProvider>
          {children}
        </ElizaProvider>
        <Analytics />
      </body>
    </html>
  );
}
