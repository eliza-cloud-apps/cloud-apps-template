import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ElizaProvider } from "@/components/eliza";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eliza Cloud | Build AI-Powered Apps",
  description:
    "The complete platform for building, deploying, and scaling AI applications. Ship production-ready AI features in minutes with Eliza Cloud.",
  keywords: ["AI", "Eliza Cloud", "AI agents", "app builder", "chat", "API"],
  authors: [{ name: "Eliza Labs" }],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
  },
  openGraph: {
    title: "Eliza Cloud | Build AI-Powered Apps",
    description:
      "The complete platform for building, deploying, and scaling AI applications.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ElizaProvider>{children}</ElizaProvider>
      </body>
    </html>
  );
}
