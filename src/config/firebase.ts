/// <reference types="vite/client" />
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || firebaseAppletConfig.apiKey || "placeholder-key",
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || firebaseAppletConfig.authDomain || "placeholder-auth",
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || firebaseAppletConfig.projectId || "placeholder-project",
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || firebaseAppletConfig.storageBucket || "placeholder-bucket",
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || firebaseAppletConfig.appId || "placeholder-app-id",
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || ""
};

// Check if variables are missing
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "placeholder-key";

if (!isFirebaseConfigured) {
  console.warn(
    "Firebase environment variables are missing. Please configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your Secrets panel."
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * A fetch wrapper that automatically injects the Firebase ID Token
 * for authenticated requests.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (err) {
    console.error("fetchWithAuth token retrieval error:", err);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

export { app };
export { isFirebaseConfigured };
