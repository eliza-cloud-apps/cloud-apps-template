/**
 * Eliza Cloud Components
 * 
 * Complete component library for Eliza Cloud apps.
 * Import from '@/components/eliza' in your app.
 */

// ============================================================================
// Provider and Context
// ============================================================================

export {
  ElizaProvider,
  useEliza,
  useElizaCredits,
  // Legacy org-level credit display (for apps using org credits)
  CreditDisplay,
  LowBalanceWarning,
} from './eliza-provider';

// ============================================================================
// Authentication Components
// ============================================================================

export {
  SignInButton,
  SignOutButton,
  UserMenu,
  ProtectedRoute,
  AuthStatus,
} from './auth-components';

// ============================================================================
// App Credit Components (User-specific credits)
// ============================================================================

export {
  AppCreditDisplay,
  AppLowBalanceWarning,
  PurchaseCreditsButton,
  PurchaseCreditsModal,
  CreditBalanceCard,
  UsageMeter,
} from './credit-components';

// ============================================================================
// Re-export Hooks
// ============================================================================

export { useElizaAuth } from '@/hooks/use-eliza-auth';
export { useAppCredits } from '@/hooks/use-eliza-credits';

// ============================================================================
// Re-export Types
// ============================================================================

export type { ElizaUser, SignInOptions } from '@/lib/eliza-auth';
export type { AppCreditBalance, PurchaseParams } from '@/lib/eliza-credits';
