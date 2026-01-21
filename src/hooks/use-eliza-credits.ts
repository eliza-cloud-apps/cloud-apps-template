"use client";

/**
 * Eliza Cloud App Credits Hook
 *
 * React hook for managing user's app-specific credit balance.
 *
 * @example
 * function BillingPage() {
 *   const {
 *     balance,
 *     loading,
 *     purchase,
 *     hasLowBalance
 *   } = useAppCredits();
 *
 *   return (
 *     <div>
 *       <p>Balance: ${balance}</p>
 *       {hasLowBalance && <LowBalanceWarning />}
 *       <button onClick={() => purchase(50)}>Buy $50</button>
 *     </div>
 *   );
 * }
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type AppCreditBalance,
  type PurchaseParams,
  getAppCredits,
  purchaseCredits,
  hasEnoughCredits,
} from "@/lib/eliza-credits";
import { isAuthenticated } from "@/lib/eliza-auth";

export interface UseAppCreditsReturn {
  /** Current credit balance */
  balance: number;
  /** Total credits purchased */
  totalPurchased: number;
  /** Total credits spent */
  totalSpent: number;
  /** Whether balance is low */
  hasLowBalance: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh balance from server */
  refresh: () => Promise<void>;
  /** Start credit purchase flow */
  purchase: (
    amount: number,
    options?: Omit<PurchaseParams, "amount">,
  ) => Promise<void>;
  /** Check if user has enough credits */
  checkCredits: (required: number) => Promise<boolean>;
}

/**
 * Hook for managing user's app credit balance.
 * Requires user to be authenticated.
 *
 * @param options Configuration options
 * @param options.refreshInterval Auto-refresh interval in ms (default: 60 seconds, 0 to disable)
 * @param options.lowBalanceThreshold Balance below this is considered low (default: 5)
 *
 * @example
 * const { balance, purchase, hasLowBalance } = useAppCredits();
 */
export function useAppCredits(options?: {
  refreshInterval?: number;
  lowBalanceThreshold?: number;
}): UseAppCreditsReturn {
  const { refreshInterval = 60000, lowBalanceThreshold = 5 } = options || {};

  const [data, setData] = useState<AppCreditBalance>({
    balance: 0,
    totalPurchased: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthed = typeof window !== "undefined" && isAuthenticated();

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!isAuthed) {
      setData({ balance: 0, totalPurchased: 0, totalSpent: 0 });
      setLoading(false);
      return;
    }

    try {
      const balance = await getAppCredits();
      setData(balance);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthed || refreshInterval <= 0) return;
    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [isAuthed, refreshInterval, fetchBalance]);

  // Purchase handler
  const purchase = useCallback(
    async (amount: number, options?: Omit<PurchaseParams, "amount">) => {
      try {
        const { url } = await purchaseCredits({ amount, ...options });
        window.location.href = url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Purchase failed");
        throw e;
      }
    },
    [],
  );

  // Check credits handler
  const checkCredits = useCallback(async (required: number) => {
    return hasEnoughCredits(required);
  }, []);

  // Computed values
  const hasLowBalance = data.balance < lowBalanceThreshold;

  return useMemo(
    () => ({
      balance: data.balance,
      totalPurchased: data.totalPurchased,
      totalSpent: data.totalSpent,
      hasLowBalance,
      loading,
      error,
      refresh: fetchBalance,
      purchase,
      checkCredits,
    }),
    [data, hasLowBalance, loading, error, fetchBalance, purchase, checkCredits],
  );
}

export default useAppCredits;
