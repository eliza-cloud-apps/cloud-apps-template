'use client';

/**
 * Eliza Cloud Auth Components
 * 
 * Pre-built authentication UI components for Eliza Cloud apps.
 */

import { type ReactNode, useState, useEffect } from 'react';
import { useElizaAuth } from '@/hooks/use-eliza-auth';
import { signIn, signOut, type ElizaUser, type SignInOptions } from '@/lib/eliza-auth';
import { Loader2, LogOut, User, ChevronDown, LogIn } from 'lucide-react';

// ============================================================================
// Sign In Button
// ============================================================================

interface SignInButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Options passed to signIn */
  signInOptions?: SignInOptions;
  /** Show loading spinner while auth is loading */
  showLoading?: boolean;
}

/**
 * Sign in with Eliza Cloud button.
 * Redirects user to Eliza Cloud login then back to your app.
 * 
 * @example
 * <SignInButton />
 * <SignInButton variant="outline">Login</SignInButton>
 */
export function SignInButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  signInOptions,
  showLoading = true,
}: SignInButtonProps) {
  const { isAuthenticated, loading } = useElizaAuth();
  
  // Don't show if already authenticated
  if (isAuthenticated) return null;
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  
  const variantClasses = {
    primary: 'bg-eliza-orange text-white hover:bg-eliza-orange-hover',
    outline: 'border border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-gray-600',
    ghost: 'text-gray-200 hover:bg-gray-800',
  };
  
  const handleClick = () => {
    signIn(signInOptions);
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={loading && showLoading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-eliza-orange focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading && showLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          {children || 'Sign in with Eliza'}
        </>
      )}
    </button>
  );
}

// ============================================================================
// Sign Out Button
// ============================================================================

interface SignOutButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  className?: string;
}

/**
 * Sign out button.
 * 
 * @example
 * <SignOutButton />
 */
export function SignOutButton({
  children,
  variant = 'ghost',
  className = '',
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const variantClasses = {
    primary: 'bg-eliza-orange text-white hover:bg-eliza-orange-hover',
    outline: 'border border-gray-700 text-gray-200 hover:bg-gray-800',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  };
  
  const handleClick = async () => {
    setLoading(true);
    await signOut();
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
        transition-colors disabled:opacity-50
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          {children || 'Sign out'}
        </>
      )}
    </button>
  );
}

// ============================================================================
// User Menu
// ============================================================================

interface UserMenuProps {
  className?: string;
  /** Custom avatar size in pixels */
  avatarSize?: number;
}

/**
 * User menu dropdown with avatar, name, and sign out.
 * 
 * @example
 * <UserMenu />
 */
export function UserMenu({ className = '', avatarSize = 32 }: UserMenuProps) {
  const { user, isAuthenticated, loading } = useElizaAuth();
  const [open, setOpen] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setOpen(false);
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);
  
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div 
          className="rounded-full bg-gray-700 animate-pulse"
          style={{ width: avatarSize, height: avatarSize }}
        />
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return <SignInButton className={className} />;
  }
  
  return (
    <div className={`relative ${className}`} data-user-menu>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-800 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'User'}
            className="rounded-full object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <div 
            className="rounded-full bg-gradient-to-br from-eliza-orange to-orange-600 flex items-center justify-center"
            style={{ width: avatarSize, height: avatarSize }}
          >
            <User className="h-4 w-4 text-white" />
          </div>
        )}
        <span className="text-sm text-gray-200 hidden sm:block max-w-[120px] truncate">
          {user.name || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-800 bg-gray-900 shadow-xl z-50">
          <div className="p-3 border-b border-gray-800">
            <p className="text-sm font-medium text-white truncate">
              {user.name || 'User'}
            </p>
            {user.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>
          <div className="p-2">
            <SignOutButton 
              variant="ghost" 
              className="w-full justify-start"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Protected Route
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  /** Custom fallback when not authenticated */
  fallback?: ReactNode;
  /** Custom loading state */
  loadingFallback?: ReactNode;
}

/**
 * Protects routes that require authentication.
 * Shows sign-in prompt if not authenticated.
 * 
 * @example
 * // In a layout or page
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // With custom fallback
 * <ProtectedRoute fallback={<CustomLoginPage />}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  fallback,
  loadingFallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useElizaAuth();
  
  if (loading) {
    return loadingFallback || <DefaultLoadingState />;
  }
  
  if (!isAuthenticated) {
    return fallback || <DefaultLoginPrompt />;
  }
  
  return <>{children}</>;
}

// ============================================================================
// Default Fallback Components
// ============================================================================

function DefaultLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-eliza-orange" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function DefaultLoginPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Sign in required</h1>
          <p className="text-gray-400">
            Please sign in to access this page.
          </p>
        </div>
        <SignInButton size="lg" />
      </div>
    </div>
  );
}

// ============================================================================
// Auth Status Badge
// ============================================================================

interface AuthStatusProps {
  className?: string;
}

/**
 * Shows authentication status indicator.
 * Useful for debugging or header displays.
 */
export function AuthStatus({ className = '' }: AuthStatusProps) {
  const { isAuthenticated, loading, user } = useElizaAuth();
  
  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-gray-500 animate-pulse" />
        Loading...
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className={`h-2 w-2 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-gray-500'}`} />
      <span className={isAuthenticated ? 'text-emerald-400' : 'text-gray-400'}>
        {isAuthenticated ? user?.name || 'Signed in' : 'Not signed in'}
      </span>
    </span>
  );
}
