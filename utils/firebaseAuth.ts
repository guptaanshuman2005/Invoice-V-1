/**
 * InvoicePro - Firebase Authentication Service
 * Seamless in-app authentication, 1-click Google Sign-In, and automated password reset emails.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

const AUTH_STORAGE_KEY = 'invoicepro_auth_session';

// Helper to sanitize environment variables
const clean = (val: string | undefined, fallback: string) => {
  if (!val) return fallback;
  const sanitized = val.trim().replace(/^["']|["']$/g, '').trim();
  return sanitized || fallback;
};

// Configuration strictly read from environment variables
const firebaseConfig = {
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY, ""),
  authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, ""),
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID, ""),
  storageBucket: clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, ""),
  messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, ""),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID, "")
};

// Check if Firebase configuration is provided via environment variables
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

// Safe initialization
const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(isFirebaseConfigured ? firebaseConfig : {
      apiKey: "AIzaSy_dev_placeholder_key",
      authDomain: "dev.firebaseapp.com",
      projectId: "dev-app"
    });
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(user: AuthUser | null) {
  listeners.forEach(fn => fn(user));
}

function mapFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    photoURL: user.photoURL || undefined
  };
}

/**
 * Sign up a new user with Name, Email & Password directly in-app
 */
export async function signUpWithFirebase(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) return { user: null, error: 'Please enter your full name.' };
    if (!trimmedEmail) return { user: null, error: 'Please enter a valid email address.' };
    if (!password || password.length < 6) return { user: null, error: 'Password must be at least 6 characters.' };

    if (!isFirebaseConfigured) {
      // Offline / Demo fallback if Firebase credentials are not yet entered in .env
      const demoUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: trimmedEmail,
        name: trimmedName
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      notifyListeners(demoUser);
      return { user: demoUser, error: null };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    if (trimmedName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: trimmedName });
    }

    const authUser = mapFirebaseUser(userCredential.user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    notifyListeners(authUser);
    return { user: authUser, error: null };
  } catch (err: any) {
    let friendlyMessage = err.message;
    if (err.code === 'auth/email-already-in-use') {
      friendlyMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (err.code === 'auth/weak-password') {
      friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      friendlyMessage = 'Please enter a valid email address.';
    }
    return { user: null, error: friendlyMessage };
  }
}

/**
 * Sign in user with Email & Password
 */
export async function signInWithFirebase(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return { user: null, error: 'Please enter your email address.' };
    if (!password) return { user: null, error: 'Please enter your password.' };

    if (!isFirebaseConfigured) {
      // Development fallback
      const demoUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: trimmedEmail,
        name: trimmedEmail.split('@')[0] || 'User'
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      notifyListeners(demoUser);
      return { user: demoUser, error: null };
    }

    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const authUser = mapFirebaseUser(userCredential.user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    notifyListeners(authUser);
    return { user: authUser, error: null };
  } catch (err: any) {
    let friendlyMessage = err.message;
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      friendlyMessage = 'Invalid email or password. Please verify and try again.';
    } else if (err.code === 'auth/too-many-requests') {
      friendlyMessage = 'Too many failed login attempts. Please reset your password or try again later.';
    }
    return { user: null, error: friendlyMessage };
  }
}

/**
 * 1-Click Google Sign-In with popup
 * No redirects, no redirect_uri_mismatch errors.
 */
export async function signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    if (!isFirebaseConfigured) {
      const demoUser: AuthUser = {
        id: `usr_google_${Date.now()}`,
        email: 'user@company.com',
        name: 'Google User'
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      notifyListeners(demoUser);
      return { user: demoUser, error: null };
    }

    const result = await signInWithPopup(auth, googleProvider);
    const authUser = mapFirebaseUser(result.user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    notifyListeners(authUser);
    return { user: authUser, error: null };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      return { user: null, error: null }; // User closed the popup, cancel gracefully
    }
    return { user: null, error: err.message || 'Failed to sign in with Google.' };
  }
}

/**
 * Send automated password reset email via Firebase
 */
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return { success: false, error: 'Please enter your email address.' };

    if (!isFirebaseConfigured) {
      return { success: true, error: null };
    }

    await sendPasswordResetEmail(auth, trimmedEmail);
    return { success: true, error: null };
  } catch (err: any) {
    let friendlyMessage = err.message;
    if (err.code === 'auth/user-not-found') {
      friendlyMessage = 'No registered account found with this email address.';
    }
    return { success: false, error: friendlyMessage };
  }
}

/**
 * Sign out current user
 */
export async function signOutFirebase(): Promise<void> {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    notifyListeners(null);
  } catch {
    notifyListeners(null);
  }
}

/**
 * Get current session from Firebase or local storage
 */
export async function getFirebaseSession(): Promise<AuthUser | null> {
  if (auth.currentUser) {
    return mapFirebaseUser(auth.currentUser);
  }
  try {
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

/**
 * Subscribe to authentication state changes
 */
export function onFirebaseAuthStateChange(callback: AuthListener): () => void {
  listeners.add(callback);

  let unsubscribeFirebase: (() => void) | null = null;
  if (isFirebaseConfigured) {
    unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = mapFirebaseUser(firebaseUser);
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        callback(user);
      } else {
        const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (!saved) {
          callback(null);
        }
      }
    });
  }

  return () => {
    listeners.delete(callback);
    if (unsubscribeFirebase) unsubscribeFirebase();
  };
}
