/**
 * Eliza Cloud Authentication
 * 
 * Allows app users to sign in with their Eliza Cloud accounts.
 * Users get their own credit balance per app.
 * 
 * @example
 * import { signIn, signOut, getUser, isAuthenticated } from '@/lib/eliza-auth';
 * 
 * // Start sign in flow
 * signIn();
 * 
 * // Check if user is logged in
 * if (isAuthenticated()) {
 *   const user = await getUser();
 * }
 * 
 * // Sign out
 * signOut();
 */

const apiBase = process.env.NEXT_PUBLIC_ELIZA_API_URL || 'https://www.elizacloud.ai';
const appId = process.env.NEXT_PUBLIC_ELIZA_APP_ID || '';

// ============================================================================
// Types
// ============================================================================

export interface ElizaUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: ElizaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignInOptions {
  /** Custom redirect URL after sign in. Defaults to current page. */
  redirectUrl?: string;
  /** Optional state to preserve across the auth flow */
  state?: string;
}

// ============================================================================
// Token Storage
// ============================================================================

const TOKEN_KEY = 'eliza_app_token';
const USER_CACHE_KEY = 'eliza_app_user';
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedUser {
  user: ElizaUser;
  cachedAt: number;
}

/**
 * Get the stored auth token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the auth token
 */
function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear the auth token
 */
function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
}

/**
 * Get cached user (if still valid)
 */
function getCachedUser(): ElizaUser | null {
  if (typeof window === 'undefined') return null;
  
  const cached = localStorage.getItem(USER_CACHE_KEY);
  if (!cached) return null;
  
  try {
    const parsed: CachedUser = JSON.parse(cached);
    if (Date.now() - parsed.cachedAt < USER_CACHE_TTL) {
      return parsed.user;
    }
    localStorage.removeItem(USER_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache the user data
 */
function setCachedUser(user: ElizaUser): void {
  if (typeof window === 'undefined') return;
  const cached: CachedUser = { user, cachedAt: Date.now() };
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cached));
}

// ============================================================================
// Auth Headers
// ============================================================================

/**
 * Get authorization headers for API calls.
 * Include these in requests to authenticate the user.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  
  return headers;
}

// ============================================================================
// Core Auth Functions
// ============================================================================

/**
 * Check if the current user is authenticated.
 * This is a synchronous check of the token presence.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Check if app-specific authentication is available.
 * Returns false when running standalone without NEXT_PUBLIC_ELIZA_APP_ID.
 */
export function isAppAuthAvailable(): boolean {
  return !!appId;
}

/**
 * Initiate sign in with Eliza Cloud.
 * Redirects user to Eliza Cloud login page, then back to your app.
 * 
 * NOTE: Requires NEXT_PUBLIC_ELIZA_APP_ID to be set. 
 * When running standalone, create an app at elizacloud.ai/dashboard/apps first.
 * 
 * @example
 * // Simple sign in
 * signIn();
 * 
 * // With custom redirect
 * signIn({ redirectUrl: '/dashboard' });
 */
export function signIn(options?: SignInOptions): void {
  if (typeof window === 'undefined') return;
  
  // Validate appId is configured
  if (!appId) {
    const errorMessage = `
[Eliza Auth] NEXT_PUBLIC_ELIZA_APP_ID is not configured.

To enable user authentication in your app:

1. Go to https://www.elizacloud.ai/dashboard/apps
2. Create a new app (or use an existing one)
3. Copy the App ID
4. Add to your .env.local:
   NEXT_PUBLIC_ELIZA_APP_ID=your-app-id-here

For standalone testing without user auth, you can use the API key method instead:
- Set NEXT_PUBLIC_ELIZA_API_KEY for server-side API access
`.trim();
    
    console.error(errorMessage);
    throw new Error('App ID not configured. Set NEXT_PUBLIC_ELIZA_APP_ID in your environment. See console for details.');
  }
  
  const redirectUrl = options?.redirectUrl || window.location.href;
  const callbackUrl = new URL('/auth/callback', window.location.origin).toString();
  
  // Store the intended redirect for after callback
  sessionStorage.setItem('eliza_auth_redirect', redirectUrl);
  
  const loginUrl = new URL(`${apiBase}/app-auth/authorize`);
  loginUrl.searchParams.set('app_id', appId);
  loginUrl.searchParams.set('redirect_uri', callbackUrl);
  
  if (options?.state) {
    loginUrl.searchParams.set('state', options.state);
  }
  
  window.location.href = loginUrl.toString();
}

/**
 * Sign out the current user.
 * Clears local tokens and optionally notifies the server.
 */
export async function signOut(): Promise<void> {
  const token = getToken();
  
  // Notify server (best-effort)
  if (token) {
    try {
      await fetch(`${apiBase}/api/v1/app-auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-App-Id': appId,
        },
      });
    } catch {
      // Ignore server errors - still clear local state
    }
  }
  
  clearToken();
  
  // Reload to clear any cached state
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Get the current authenticated user.
 * Returns null if not authenticated or session is invalid.
 * 
 * @example
 * const user = await getUser();
 * if (user) {
 *   console.log(`Hello, ${user.name}!`);
 * }
 */
export async function getUser(): Promise<ElizaUser | null> {
  const token = getToken();
  if (!token) return null;
  
  // Check cache first
  const cached = getCachedUser();
  if (cached) return cached;
  
  try {
    const res = await fetch(`${apiBase}/api/v1/app-auth/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-App-Id': appId,
      },
    });
    
    if (!res.ok) {
      // Token is invalid - clear it
      if (res.status === 401) {
        clearToken();
      }
      return null;
    }
    
    const data = await res.json();
    if (data.user) {
      setCachedUser(data.user);
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Handle the OAuth callback.
 * Call this on your /auth/callback page to complete sign-in.
 * 
 * @example
 * // In app/auth/callback/page.tsx
 * useEffect(() => {
 *   handleCallback()
 *     .then(user => {
 *       if (user) router.push('/dashboard');
 *     })
 *     .catch(console.error);
 * }, []);
 */
export async function handleCallback(): Promise<ElizaUser | null> {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  
  if (error) {
    throw new Error(errorDescription || error);
  }
  
  if (!token) {
    throw new Error('No authentication token received');
  }
  
  // Store the token
  setToken(token);
  
  // Clear URL parameters
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);
  
  // Get and return user info
  return getUser();
}

/**
 * Get the stored redirect URL after auth callback.
 * Used by the callback page to redirect users.
 */
export function getPostAuthRedirect(): string {
  if (typeof window === 'undefined') return '/';
  const redirect = sessionStorage.getItem('eliza_auth_redirect');
  sessionStorage.removeItem('eliza_auth_redirect');
  return redirect || '/';
}

/**
 * Refresh the auth session.
 * Call this periodically to keep the session alive.
 */
export async function refreshSession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  
  try {
    const res = await fetch(`${apiBase}/api/v1/app-auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-App-Id': appId,
      },
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        clearToken();
      }
      return false;
    }
    
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Utility Exports
// ============================================================================

export const elizaAuth = {
  signIn,
  signOut,
  getUser,
  isAuthenticated,
  isAppAuthAvailable,
  handleCallback,
  getPostAuthRedirect,
  refreshSession,
  getToken,
  getAuthHeaders,
};

export default elizaAuth;
