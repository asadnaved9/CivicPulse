import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, limit, query, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log("Using Firebase Config:");
console.log(JSON.stringify({ ...firebaseConfig, apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING" }, null, 2));

async function runDiagnostics() {
  if (!firebaseConfig.apiKey) {
    console.error("FAIL: VITE_FIREBASE_API_KEY is missing in your environment variables (.env).");
    process.exit(1);
  }

  try {
    console.log("Initializing Firebase App...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log("Attempting anonymous sign-in...");
    try {
      const userCredential = await signInAnonymously(auth);
      console.log(`✓ Sign-in SUCCESS! Authenticated as UID: ${userCredential.user.uid}`);
    } catch (authErr: any) {
      console.warn(`⚠ Anonymous Sign-in FAILED (this is okay if anonymous provider is disabled in Firebase console):`, authErr.message);
    }

    console.log("Attempting to query 'issues' collection...");
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, limit(1));
    const querySnapshot = await getDocs(q);
    console.log(`✓ Firestore connection SUCCESS! Found ${querySnapshot.docs.length} documents in 'issues'.`);

    console.log("ALL BASIC CLIENT DIAGNOSTICS PASSED!");
    process.exit(0);
  } catch (err: any) {
    console.error("FAIL: Diagnostics failed with the following error:");
    console.error(err);
    process.exit(1);
  }
}

runDiagnostics();
