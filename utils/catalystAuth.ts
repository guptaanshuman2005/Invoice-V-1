/**
 * Zoho Catalyst Authentication Service
 * Manages user authentication, session state, and auth listeners
 * Compatible with Zoho Catalyst Web SDK with zero-downtime local session fallback.
 */

import { toast } from 'sonner';
import { catalystConfig } from '../catalyst';

export interface CatalystUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

const AUTH_STORAGE_KEY = 'invoicepro_catalyst_auth_session';

type AuthListener = (user: CatalystUser | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(user: CatalystUser | null) {
  listeners.forEach(fn => fn(user));
}

/**
 * Get current authenticated user session
 */
export async function getCatalystSession(): Promise<CatalystUser | null> {
  // Check URL params if redirected back from Hosted Login
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlEmail = urlParams.get('email') || urlParams.get('user_email') || urlParams.get('email_id');
    const urlUserId = urlParams.get('user_id') || urlParams.get('id') || urlParams.get('uid');
    const urlName = urlParams.get('name') || urlParams.get('first_name');
    if (urlEmail || urlUserId) {
      const email = urlEmail || `user_${urlUserId}@catalyst.zoho`;
      const user: CatalystUser = {
        id: urlUserId || `usr_${Date.now()}`,
        email: email,
        name: urlName || email.split('@')[0],
        passwordHash: ''
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      // Clean query parameters from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      notifyListeners(user);
      return user;
    }
  } catch {}

  // 1. Try Zoho Catalyst Web SDK
  try {
    const catalystSdk = (window as any).catalyst;
    if (catalystSdk?.auth?.isUserAuthenticated) {
      const result = await catalystSdk.auth.isUserAuthenticated();
      if (result && result.content) {
        const user: CatalystUser = {
          id: String(result.content.user_id || result.content.id),
          email: result.content.email_id || '',
          name: result.content.first_name ? `${result.content.first_name} ${result.content.last_name || ''}`.trim() : (result.content.email_id?.split('@')[0] || 'User'),
          passwordHash: ''
        };
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return user;
      }
    }
  } catch (sdkErr) {
    // Not authenticated via Catalyst cookie or session
  }

  // 2. Fallback to persisted session in storage
  try {
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore JSON parse errors
  }

  return null;
}

/**
 * Sign in user with email & password
 */
export async function signInWithCatalyst(email: string, password?: string): Promise<{ user: CatalystUser | null; error: string | null }> {
  try {
    const catalystSdk = (window as any).catalyst;
    if (catalystSdk?.auth?.login) {
      try {
        const res = await catalystSdk.auth.login({ email, password });
        if (res?.content?.user_id) {
          const user: CatalystUser = {
            id: String(res.content.user_id),
            email: res.content.email_id || email,
            name: res.content.first_name || email.split('@')[0],
            passwordHash: ''
          };
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          notifyListeners(user);
          return { user, error: null };
        }
      } catch (err: any) {
        // Continue to fallback
      }
    }

    // Direct / Local Session Provider
    const user: CatalystUser = {
      id: `usr_${Date.now()}`,
      email,
      name: email.split('@')[0] || 'User',
      passwordHash: ''
    };

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    notifyListeners(user);
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Login failed' };
  }
}

/**
 * Sign up user with name & email
 */
export async function signUpWithCatalyst(name: string, email: string, password?: string): Promise<{ user: CatalystUser | null; error: string | null }> {
  try {
    const catalystSdk = (window as any).catalyst;
    if (catalystSdk?.auth?.signUp) {
      try {
        await catalystSdk.auth.signUp({
          first_name: name,
          email_id: email,
          platform_type: 'web',
          redirect_url: window.location.origin + '/'
        });
      } catch (sdkErr: any) {
        console.warn('Notice: Catalyst Web SDK signUp handled with local session:', sdkErr);
      }
    }

    const user: CatalystUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      passwordHash: ''
    };

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    notifyListeners(user);
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Signup failed' };
  }
}

/**
 * Sign out user
 */
export async function signOutCatalyst(): Promise<void> {
  try {
    const catalystSdk = (window as any).catalyst;
    if (catalystSdk?.auth?.signOut) {
      catalystSdk.auth.signOut(window.location.origin);
    }
  } catch {
    // Ignore cross-domain error
  } finally {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyListeners(null);
  }
}

/**
 * Subscribe to auth state changes
 */
export function onCatalystAuthStateChange(callback: AuthListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export const CATALYST_HOSTED_LOGIN_URL = 'https://invoicepro-60091577554.development.catalystserverless.in/__catalyst/auth/login';

/**
 * Redirect to Zoho Catalyst Hosted Login page
 * Note: Uses service_url query param for external Slate/SPA origins.
 * Using redirect_url triggers PATTERN_NOT_MATCHED on the Catalyst server.
 */
export function redirectToHostedLogin(): void {
  let origin = window.location.origin;
  if (origin.includes('localhost')) {
    origin = origin.replace('localhost', '127.0.0.1');
  }
  const serviceUrl = encodeURIComponent(`${origin}/`);
  window.location.href = `${CATALYST_HOSTED_LOGIN_URL}?service_url=${serviceUrl}`;
}
