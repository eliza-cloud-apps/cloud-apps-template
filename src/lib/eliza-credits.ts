/**
 * Eliza Cloud App Credits
 *
 * Manages user credit balances using organization credits.
 *
 * @example
 * import { getAppCredits, purchaseCredits } from '@/lib/eliza-credits';
 *
 * // Get user's balance
 * const { balance } = await getAppCredits();
 *
 * // Purchase more credits
 * const { url } = await purchaseCredits({ amount: 50 });
 * window.location.href = url;
 */

import { getAuthHeaders, isAuthenticated } from "./eliza-auth";

const apiBase =
  process.env.NEXT_PUBLIC_ELIZA_API_URL || "https://www.elizacloud.ai";
const appId = process.env.NEXT_PUBLIC_ELIZA_APP_ID || "";

// Use organization credits by default. Set to true for app-specific credits.
const USE_APP_CREDITS = process.env.NEXT_PUBLIC_USE_APP_CREDITS === "true";

// ============================================================================
// Types
// ============================================================================

export interface AppCreditBalance {
  /** Current credit balance */
  balance: number;
  /** Total credits ever purchased in this app */
  totalPurchased: number;
  /** Total credits spent in this app */
  totalSpent: number;
  /** Whether the balance is low (below threshold) */
  isLow?: boolean;
}

export interface CheckoutSession {
  /** Stripe checkout URL - redirect user here */
  url: string;
  /** Session ID for verification */
  sessionId: string;
}

export interface PurchaseParams {
  /** Amount of credits to purchase (in dollars) */
  amount: number;
  /** URL to redirect after successful purchase */
  successUrl?: string;
  /** URL to redirect if user cancels */
  cancelUrl?: string;
}

export interface CreditUsageRecord {
  id: string;
  operation: string;
  creditsUsed: number;
  description?: string;
  createdAt: string;
}

export interface PurchaseRecord {
  id: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the user's credit balance.
 * Uses organization credits by default, or app-specific credits if USE_APP_CREDITS is true.
 * Requires the user to be authenticated.
 *
 * @example
 * const { balance, isLow } = await getAppCredits();
 * if (isLow) showTopUpPrompt();
 */
export async function getAppCredits(): Promise<AppCreditBalance> {
  if (!isAuthenticated()) {
    return { balance: 0, totalPurchased: 0, totalSpent: 0, isLow: true };
  }

  // Use organization credits endpoint by default
  const endpoint = USE_APP_CREDITS
    ? `${apiBase}/api/v1/app-credits/balance?app_id=${appId}`
    : `${apiBase}/api/v1/credits/balance`;

  const res = await fetch(endpoint, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch credits: ${res.statusText}`);
  }

  const data = await res.json();
  const balance = data.balance ?? 0;

  return {
    balance,
    totalPurchased: data.totalPurchased ?? 0,
    totalSpent: data.totalSpent ?? 0,
    isLow: data.isLow ?? balance < 5,
  };
}

/**
 * Create a checkout session to purchase credits.
 * Returns a URL to redirect the user to Stripe checkout.
 *
 * @example
 * const { url } = await purchaseCredits({ amount: 50 });
 * window.location.href = url;
 */
export async function purchaseCredits(
  params: PurchaseParams,
): Promise<CheckoutSession> {
  if (!isAuthenticated()) {
    throw new Error("Must be signed in to purchase credits");
  }

  const successUrl =
    params.successUrl || `${window.location.origin}/billing/success`;
  const cancelUrl = params.cancelUrl || `${window.location.origin}/billing`;

  // Use app-specific checkout for app credits, otherwise use main checkout
  const endpoint = USE_APP_CREDITS
    ? `${apiBase}/api/v1/app-credits/checkout`
    : `${apiBase}/api/v1/credits/checkout`;

  const body = USE_APP_CREDITS
    ? {
        app_id: appId,
        amount: params.amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }
    : {
        credits: params.amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Failed to create checkout session");
  }

  return res.json();
}

/**
 * Verify a purchase was successful.
 * Call this on your success page with the session ID.
 *
 * @example
 * const success = await verifyPurchase(sessionId);
 * if (success) showSuccessMessage();
 */
export async function verifyPurchase(sessionId: string): Promise<boolean> {
  const endpoint = USE_APP_CREDITS
    ? `${apiBase}/api/v1/app-credits/verify?session_id=${sessionId}`
    : `${apiBase}/api/v1/credits/verify?session_id=${sessionId}`;

  const res = await fetch(endpoint, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return false;

  const data = await res.json();
  return data.success === true;
}

/**
 * Get credit usage history for the current user.
 * Note: For org credits, this returns transaction history. For app credits, returns app-specific usage.
 *
 * @param limit Maximum number of records to return
 */
export async function getUsageHistory(
  limit = 50,
): Promise<CreditUsageRecord[]> {
  if (!isAuthenticated()) {
    return [];
  }

  const endpoint = USE_APP_CREDITS
    ? `${apiBase}/api/v1/app-credits/usage?app_id=${appId}&limit=${limit}`
    : `${apiBase}/api/v1/credits/transactions?limit=${limit}`;

  const res = await fetch(endpoint, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    // Org credits might not have a transactions endpoint - gracefully fail
    if (!USE_APP_CREDITS) return [];
    throw new Error("Failed to fetch usage history");
  }

  const data = await res.json();
  return data.usage || data.transactions || [];
}

/**
 * Get purchase history for the current user.
 * Note: For org credits, this returns payment history. For app credits, returns app-specific purchases.
 *
 * @param limit Maximum number of records to return
 */
export async function getPurchaseHistory(
  limit = 50,
): Promise<PurchaseRecord[]> {
  if (!isAuthenticated()) {
    return [];
  }

  const endpoint = USE_APP_CREDITS
    ? `${apiBase}/api/v1/app-credits/history?app_id=${appId}&limit=${limit}`
    : `${apiBase}/api/v1/credits/purchases?limit=${limit}`;

  const res = await fetch(endpoint, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    // Org credits might not have a purchases endpoint - gracefully fail
    if (!USE_APP_CREDITS) return [];
    throw new Error("Failed to fetch purchase history");
  }

  const data = await res.json();
  return data.purchases || [];
}

/**
 * Check if user has enough credits for an operation.
 * Use this before expensive operations to show warnings.
 *
 * @param requiredCredits The minimum credits needed
 */
export async function hasEnoughCredits(
  requiredCredits: number,
): Promise<boolean> {
  try {
    const { balance } = await getAppCredits();
    return balance >= requiredCredits;
  } catch {
    return false;
  }
}

// ============================================================================
// Presets for Common Amounts
// ============================================================================

export const CREDIT_PRESETS = [
  { amount: 5, label: "$5" },
  { amount: 10, label: "$10" },
  { amount: 25, label: "$25" },
  { amount: 50, label: "$50" },
  { amount: 100, label: "$100" },
] as const;

// ============================================================================
// Utility Exports
// ============================================================================

export const elizaCredits = {
  getAppCredits,
  purchaseCredits,
  verifyPurchase,
  getUsageHistory,
  getPurchaseHistory,
  hasEnoughCredits,
  CREDIT_PRESETS,
};

export default elizaCredits;
