"use client";

/**
 * Eliza Cloud Auth Hook
 *
 * React hook for authentication state management.
 *
 * @example
 * function Header() {
 *   const { user, isAuthenticated, signIn, signOut, loading } = useElizaAuth();
 *
 *   if (loading) return <Spinner />;
 *
 *   return isAuthenticated ? (
 *     <UserMenu user={user} onSignOut={signOut} />
 *   ) : (
 *     <button onClick={signIn}>Sign In</button>
 *   );
 * }
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type ElizaUser,
  getUser,
  signIn as authSignIn,
  signOut as authSignOut,
  isAuthenticated as checkAuth,
  refreshSession,
  type SignInOptions,
} from "@/lib/eliza-auth";

export interface UseElizaAuthReturn {
  /** The authenticated user, or null if not signed in */
  user: ElizaUser | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is still loading */
  loading: boolean;
  /** Any auth error that occurred */
  error: string | null;
  /** Start the sign-in flow */
  signIn: (options?: SignInOptions) => void;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Refresh the user data from the server */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing authentication state.
 * Automatically fetches user on mount and handles session refresh.
 *
 * @param options Configuration options
 * @param options.refreshInterval Auto-refresh interval in ms (default: 5 minutes, 0 to disable)
 *
 * @example
 * const { user, isAuthenticated, signIn, signOut } = useElizaAuth();
 */
export function useElizaAuth(options?: {
  refreshInterval?: number;
}): UseElizaAuthReturn {
  const { refreshInterval = 5 * 60 * 1000 } = options || {};

  const [user, setUser] = useState<ElizaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a token (synchronous)
  const hasToken = typeof window !== "undefined" && checkAuth();

  // Fetch user data
  const fetchUser = useCallback(async () => {
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getUser();
      setUser(userData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Session refresh interval
  useEffect(() => {
    if (!hasToken || refreshInterval <= 0) return;

    const interval = setInterval(async () => {
      const success = await refreshSession();
      if (success) {
        fetchUser();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [hasToken, refreshInterval, fetchUser]);

  // Sign in handler
  const signIn = useCallback((options?: SignInOptions) => {
    authSignIn(options);
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    setLoading(true);
    await authSignOut();
    setUser(null);
    setLoading(false);
  }, []);

  // Refresh handler
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  // Memoize return value
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      error,
      signIn,
      signOut,
      refresh,
    }),
    [user, loading, error, signIn, signOut, refresh],
  );

  return value;
}

export default useElizaAuth;
