'use client';

/**
 * Eliza Cloud App Credit Components
 * 
 * UI components for managing user's app-specific credit balance.
 */

import { type ReactNode, useState } from 'react';
import { useAppCredits } from '@/hooks/use-eliza-credits';
import { CREDIT_PRESETS } from '@/lib/eliza-credits';
import { Coins, AlertTriangle, Plus, Loader2, RefreshCw, X, Check } from 'lucide-react';

// ============================================================================
// App Credit Display
// ============================================================================

interface AppCreditDisplayProps {
  /** Show warning styling when balance is low */
  showWarning?: boolean;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Displays the user's credit balance for this app.
 * Different from org-level CreditDisplay - this shows user's app-specific balance.
 * 
 * @example
 * <AppCreditDisplay />
 * <AppCreditDisplay showRefresh showWarning />
 */
export function AppCreditDisplay({
  showWarning = true,
  showRefresh = false,
  className = '',
}: AppCreditDisplayProps) {
  const { balance, loading, hasLowBalance, refresh } = useAppCredits();
  
  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm text-gray-400 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" />
        Loading...
      </span>
    );
  }
  
  const isLow = showWarning && hasLowBalance;
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        isLow ? 'text-amber-400' : 'text-gray-300'
      } ${className}`}
    >
      <Coins className="h-4 w-4" />
      <span className="font-medium">${balance.toFixed(2)}</span>
      {showRefresh && (
        <button
          onClick={refresh}
          className="p-1 rounded hover:bg-gray-800 transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ============================================================================
// Low Balance Warning
// ============================================================================

interface AppLowBalanceWarningProps {
  /** Custom warning message */
  message?: string;
  /** Show purchase button */
  showPurchaseButton?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Warning banner when user's app credits are low.
 * Only shows when balance is below threshold.
 * 
 * @example
 * <AppLowBalanceWarning />
 */
export function AppLowBalanceWarning({
  message = "Your credit balance is low. Top up to continue using AI features.",
  showPurchaseButton = true,
  className = '',
}: AppLowBalanceWarningProps) {
  const { balance, hasLowBalance, purchase } = useAppCredits();
  const [purchasing, setPurchasing] = useState(false);
  
  if (!hasLowBalance) return null;
  
  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchase(10); // Quick $10 top-up
    } catch {
      setPurchasing(false);
    }
  };
  
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-3 text-sm text-amber-200">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span>{message} (${balance.toFixed(2)} remaining)</span>
      </div>
      {showPurchaseButton && (
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {purchasing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Top up
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Purchase Credits Button
// ============================================================================

interface PurchaseCreditsButtonProps {
  /** Credit amount to purchase (in dollars) */
  amount?: number;
  /** Button children/label */
  children?: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'outline';
  /** Custom class name */
  className?: string;
}

/**
 * Button to purchase credits.
 * Redirects to Stripe checkout.
 * 
 * @example
 * <PurchaseCreditsButton amount={50} />
 * <PurchaseCreditsButton>Buy more credits</PurchaseCreditsButton>
 */
export function PurchaseCreditsButton({
  amount = 10,
  children,
  variant = 'primary',
  className = '',
}: PurchaseCreditsButtonProps) {
  const { purchase } = useAppCredits();
  const [loading, setLoading] = useState(false);
  
  const variantClasses = {
    primary: 'bg-eliza-orange text-white hover:bg-eliza-orange-hover',
    outline: 'border border-gray-700 text-gray-200 hover:bg-gray-800',
  };
  
  const handleClick = async () => {
    setLoading(true);
    try {
      await purchase(amount);
    } catch (e) {
      console.error('Purchase failed:', e);
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Plus className="h-4 w-4" />
          {children || `Buy $${amount} credits`}
        </>
      )}
    </button>
  );
}

// ============================================================================
// Purchase Credits Modal
// ============================================================================

interface PurchaseCreditsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Custom preset amounts */
  presets?: number[];
}

/**
 * Modal for selecting credit amount to purchase.
 * 
 * @example
 * const [open, setOpen] = useState(false);
 * 
 * <button onClick={() => setOpen(true)}>Buy Credits</button>
 * <PurchaseCreditsModal open={open} onClose={() => setOpen(false)} />
 */
export function PurchaseCreditsModal({
  open,
  onClose,
  presets = CREDIT_PRESETS.map(p => p.amount),
}: PurchaseCreditsModalProps) {
  const { balance, purchase } = useAppCredits();
  const [selected, setSelected] = useState<number>(presets[1] || 10);
  const [loading, setLoading] = useState(false);
  
  if (!open) return null;
  
  const handlePurchase = async () => {
    setLoading(true);
    try {
      await purchase(selected);
    } catch (e) {
      console.error('Purchase failed:', e);
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Purchase Credits</h2>
            <p className="text-sm text-gray-400">Current balance: ${balance.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Preset amounts */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Select amount:</p>
          <div className="grid grid-cols-3 gap-3">
            {presets.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelected(amount)}
                className={`
                  relative p-4 rounded-xl border-2 text-center transition-all
                  ${selected === amount 
                    ? 'border-eliza-orange bg-eliza-orange/10' 
                    : 'border-gray-700 hover:border-gray-600'
                  }
                `}
              >
                {selected === amount && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-eliza-orange" />
                  </div>
                )}
                <span className="text-xl font-bold text-white">${amount}</span>
              </button>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-400">New balance:</span>
              <span className="font-medium text-white">${(balance + selected).toFixed(2)}</span>
            </div>
            
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full btn-eliza justify-center"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Coins className="h-5 w-5" />
                  Purchase ${selected}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Credit Balance Card
// ============================================================================

interface CreditBalanceCardProps {
  /** Custom class name */
  className?: string;
}

/**
 * Card component showing credit balance with purchase option.
 * Great for billing/settings pages.
 * 
 * @example
 * <CreditBalanceCard />
 */
export function CreditBalanceCard({ className = '' }: CreditBalanceCardProps) {
  const { balance, totalSpent, loading, refresh, hasLowBalance } = useAppCredits();
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div className={`card-eliza ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-eliza-orange" />
            Credit Balance
          </h3>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className={`text-4xl font-bold ${hasLowBalance ? 'text-amber-400' : 'text-white'}`}>
              ${balance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Total spent: ${totalSpent.toFixed(2)}
            </p>
          </div>
          
          {hasLowBalance && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Balance is running low
            </div>
          )}
          
          <button
            onClick={() => setShowModal(true)}
            className="w-full btn-eliza justify-center"
          >
            <Plus className="h-4 w-4" />
            Purchase Credits
          </button>
        </div>
      </div>
      
      <PurchaseCreditsModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}

// ============================================================================
// Usage Meter
// ============================================================================

interface UsageMeterProps {
  /** Current usage amount */
  used: number;
  /** Total/limit amount */
  total: number;
  /** Label */
  label?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Visual meter showing credit usage.
 * 
 * @example
 * <UsageMeter used={75} total={100} label="Monthly usage" />
 */
export function UsageMeter({
  used,
  total,
  label = 'Usage',
  className = '',
}: UsageMeterProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const isHigh = percentage > 80;
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${isHigh ? 'text-amber-400' : 'text-white'}`}>
          ${used.toFixed(2)} / ${total.toFixed(2)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isHigh ? 'bg-amber-400' : 'bg-eliza-orange'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
