"use client";

/**
 * ElizaProvider - Main provider component for Eliza Cloud apps.
 *
 * Wraps your app with:
 * - Analytics tracking (automatic page views)
 * - Credits context (balance management)
 *
 * @example
 * // In layout.tsx:
 * import { ElizaProvider } from '@/components/eliza';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ElizaProvider>{children}</ElizaProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

// ============================================================================
// Types
// ============================================================================

interface CreditsContextType {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasLowBalance: boolean;
}

interface ElizaContextType {
  credits: CreditsContextType;
  appId: string | null;
  isReady: boolean;
}

// ============================================================================
// Context
// ============================================================================

const ElizaContext = createContext<ElizaContextType | null>(null);

// ============================================================================
// Analytics Component
// ============================================================================

function ElizaAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const track = async () => {
      try {
        const { trackPageView } = await import("@/lib/eliza");
        trackPageView(pathname);
      } catch {
        // Silent fail - don't break app for analytics
      }
    };
    track();
  }, [pathname]);

  return null;
}

// ============================================================================
// Provider Component
// ============================================================================

interface ElizaProviderProps {
  children: ReactNode;
  /**
   * Auto-refresh credits interval in milliseconds.
   * Set to 0 to disable auto-refresh.
   * @default 60000 (1 minute)
   */
  creditsRefreshInterval?: number;
  /**
   * Balance threshold to consider "low".
   * @default 10
   */
  lowBalanceThreshold?: number;
  /**
   * Disable analytics tracking.
   * @default false
   */
  disableAnalytics?: boolean;
}

export function ElizaProvider({
  children,
  creditsRefreshInterval = 60000,
  lowBalanceThreshold = 10,
  disableAnalytics = false,
}: ElizaProviderProps) {
  // Credits state
  const [balance, setBalance] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  // App state
  const [isReady, setIsReady] = useState(false);
  const appId =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_ELIZA_APP_ID || null
      : null;

  // Refresh credits
  const refreshCredits = useCallback(async () => {
    setCreditsLoading(true);
    setCreditsError(null);
    try {
      const { getBalance } = await import("@/lib/eliza");
      const result = await getBalance();
      setBalance(result.balance);
    } catch (e) {
      setCreditsError(
        e instanceof Error ? e.message : "Failed to fetch balance",
      );
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshCredits().then(() => setIsReady(true));
  }, [refreshCredits]);

  // Auto-refresh credits
  useEffect(() => {
    if (creditsRefreshInterval <= 0) return;
    const interval = setInterval(refreshCredits, creditsRefreshInterval);
    return () => clearInterval(interval);
  }, [refreshCredits, creditsRefreshInterval]);

  const credits: CreditsContextType = {
    balance,
    loading: creditsLoading,
    error: creditsError,
    refresh: refreshCredits,
    hasLowBalance: balance !== null && balance < lowBalanceThreshold,
  };

  const contextValue: ElizaContextType = {
    credits,
    appId,
    isReady,
  };

  return (
    <ElizaContext.Provider value={contextValue}>
      {!disableAnalytics && <ElizaAnalytics />}
      {children}
    </ElizaContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the Eliza context.
 * Must be used within an ElizaProvider.
 * Returns null during SSR to prevent hydration errors.
 */
export function useEliza() {
  const context = useContext(ElizaContext);
  if (!context) {
    // During SSR or if ElizaProvider is missing, return a safe default
    // instead of throwing to prevent build/render errors
    if (typeof window === "undefined") {
      return {
        credits: {
          balance: null,
          loading: true,
          error: null,
          refresh: async () => {},
          hasLowBalance: false,
        },
        appId: null,
        isReady: false,
      } as ElizaContextType;
    }
    throw new Error("useEliza must be used within an ElizaProvider");
  }
  return context;
}

/**
 * Access credits balance and management.
 *
 * @example
 * const { balance, hasLowBalance, refresh } = useElizaCredits();
 * if (hasLowBalance) showWarning();
 */
export function useElizaCredits() {
  const { credits } = useEliza();
  return credits;
}

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Display credit balance with optional warning styling.
 *
 * @example
 * <CreditDisplay showWarning />
 */
export function CreditDisplay({
  showWarning = true,
  className = "",
}: {
  showWarning?: boolean;
  className?: string;
}) {
  const { balance, loading, hasLowBalance } = useElizaCredits();

  if (loading) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-sm text-gray-400 ${className}`}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-500" />
        Loading...
      </span>
    );
  }

  const isLow = showWarning && hasLowBalance;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        isLow ? "text-amber-400" : "text-gray-300"
      } ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isLow ? "bg-amber-400" : "bg-emerald-400"
        }`}
      />
      {balance !== null ? `${balance.toLocaleString()} credits` : "— credits"}
    </span>
  );
}

/**
 * Low balance warning banner.
 * Only shows when balance is below threshold.
 *
 * @example
 * <LowBalanceWarning />
 */
export function LowBalanceWarning({
  message = "Your credit balance is low. Top up to continue using AI features.",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  const { hasLowBalance, balance } = useElizaCredits();

  if (!hasLowBalance) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ${className}`}
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>
        {message} ({balance} remaining)
      </span>
    </div>
  );
}
