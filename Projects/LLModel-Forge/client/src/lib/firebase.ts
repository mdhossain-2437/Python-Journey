/**
 * Firebase Client Configuration
 *
 * This handles Firebase Authentication for Google and GitHub OAuth
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
  UserCredential,
} from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Initialize Firebase
export function initializeFirebase(): { app: FirebaseApp; auth: Auth } | null {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured. OAuth login will be unavailable.");
    console.warn("Set VITE_FIREBASE_* environment variables to enable OAuth.");
    return null;
  }

  if (app && auth) {
    return { app, auth };
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("✅ Firebase initialized successfully");
    return { app, auth };
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
}

// Google Sign In
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const firebase = initializeFirebase();
  if (!firebase) {
    throw new Error("Firebase not configured. Please set up Firebase environment variables.");
  }

  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  try {
    const result = await signInWithPopup(firebase.auth, provider);
    return result;
  } catch (error: any) {
    if (error.code === "auth/popup-blocked") {
      // Fallback to redirect
      await signInWithRedirect(firebase.auth, provider);
      return null;
    }
    throw error;
  }
}

// GitHub Sign In
export async function signInWithGithub(): Promise<UserCredential | null> {
  const firebase = initializeFirebase();
  if (!firebase) {
    throw new Error("Firebase not configured. Please set up Firebase environment variables.");
  }

  const provider = new GithubAuthProvider();
  provider.addScope("user:email");
  provider.addScope("read:user");

  try {
    const result = await signInWithPopup(firebase.auth, provider);
    return result;
  } catch (error: any) {
    if (error.code === "auth/popup-blocked") {
      // Fallback to redirect
      await signInWithRedirect(firebase.auth, provider);
      return null;
    }
    throw error;
  }
}

// Handle redirect result (for when popup is blocked)
export async function handleRedirectResult(): Promise<UserCredential | null> {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  try {
    const result = await getRedirectResult(firebase.auth);
    return result;
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  const firebase = initializeFirebase();
  if (!firebase) return;

  await firebaseSignOut(firebase.auth);
}

// Get current user
export function getCurrentUser(): User | null {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  return firebase.auth.currentUser;
}

// Get ID token for backend authentication
export async function getIdToken(): Promise<string | null> {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  const user = firebase.auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return null;
  }
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const firebase = initializeFirebase();
  if (!firebase) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(firebase.auth, callback);
}

// Get provider data from user
export function getProviderInfo(user: User): {
  provider: string;
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
} | null {
  if (!user.providerData || user.providerData.length === 0) {
    return null;
  }

  const providerInfo = user.providerData[0];
  return {
    provider: providerInfo.providerId.replace(".com", ""),
    providerId: providerInfo.uid || "",
    displayName: providerInfo.displayName,
    email: providerInfo.email,
    photoURL: providerInfo.photoURL,
  };
}

export default {
  isFirebaseConfigured,
  initializeFirebase,
  signInWithGoogle,
  signInWithGithub,
  handleRedirectResult,
  signOut,
  getCurrentUser,
  getIdToken,
  onAuthChange,
  getProviderInfo,
};

