/**
 * Eliza Cloud App Credits
 * 
 * Manages user-specific credit balances for apps.
 * Users have their own credit balance per app they use.
 * 
 * @example
 * import { getAppCredits, purchaseCredits } from '@/lib/eliza-credits';
 * 
 * // Get user's balance in this app
 * const { balance } = await getAppCredits();
 * 
 * // Purchase more credits
 * const { url } = await purchaseCredits({ amount: 50 });
 * window.location.href = url;
 */

import { getAuthHeaders, isAuthenticated } from './eliza-auth';

const apiBase = process.env.NEXT_PUBLIC_ELIZA_API_URL || 'https://www.elizacloud.ai';
const appId = process.env.NEXT_PUBLIC_ELIZA_APP_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ELIZA_API_KEY || '';

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
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the user's credit balance for this app.
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
  
  const res = await fetch(`${apiBase}/api/v1/app-credits/balance?app_id=${appId}`, {
    headers: {
      ...getAuthHeaders(),
      'X-Api-Key': apiKey,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch credits: ${res.statusText}`);
  }
  
  const data = await res.json();
  return {
    balance: data.balance ?? 0,
    totalPurchased: data.totalPurchased ?? 0,
    totalSpent: data.totalSpent ?? 0,
    isLow: data.isLow ?? (data.balance < 5),
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
export async function purchaseCredits(params: PurchaseParams): Promise<CheckoutSession> {
  if (!isAuthenticated()) {
    throw new Error('Must be signed in to purchase credits');
  }
  
  const successUrl = params.successUrl || `${window.location.origin}/billing/success`;
  const cancelUrl = params.cancelUrl || `${window.location.origin}/billing`;
  
  const res = await fetch(`${apiBase}/api/v1/app-credits/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      app_id: appId,
      amount: params.amount,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Failed to create checkout session');
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
  const res = await fetch(`${apiBase}/api/v1/app-credits/verify?session_id=${sessionId}`, {
    headers: {
      ...getAuthHeaders(),
      'X-Api-Key': apiKey,
    },
  });
  
  if (!res.ok) return false;
  
  const data = await res.json();
  return data.success === true;
}

/**
 * Get credit usage history for the current user in this app.
 * 
 * @param limit Maximum number of records to return
 */
export async function getUsageHistory(limit = 50): Promise<CreditUsageRecord[]> {
  if (!isAuthenticated()) {
    return [];
  }
  
  const res = await fetch(
    `${apiBase}/api/v1/app-credits/usage?app_id=${appId}&limit=${limit}`,
    {
      headers: {
        ...getAuthHeaders(),
        'X-Api-Key': apiKey,
      },
    }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch usage history');
  }
  
  const data = await res.json();
  return data.usage || [];
}

/**
 * Get purchase history for the current user in this app.
 * 
 * @param limit Maximum number of records to return
 */
export async function getPurchaseHistory(limit = 50): Promise<PurchaseRecord[]> {
  if (!isAuthenticated()) {
    return [];
  }
  
  const res = await fetch(
    `${apiBase}/api/v1/app-credits/history?app_id=${appId}&limit=${limit}`,
    {
      headers: {
        ...getAuthHeaders(),
        'X-Api-Key': apiKey,
      },
    }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch purchase history');
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
export async function hasEnoughCredits(requiredCredits: number): Promise<boolean> {
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
  { amount: 5, label: '$5' },
  { amount: 10, label: '$10' },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
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
