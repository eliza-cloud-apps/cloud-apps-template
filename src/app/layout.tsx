import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ElizaProvider } from '@/components/eliza';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Eliza Cloud App',
  description: 'AI-powered app built on Eliza Cloud',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
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
      </body>
    </html>
  );
}
