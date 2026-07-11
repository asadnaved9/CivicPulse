import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let projectId = "civicpulse-e48de";
let databaseId = "";

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    if (config.projectId) projectId = config.projectId;
    if (config.firestoreDatabaseId !== undefined) databaseId = config.firestoreDatabaseId;
    console.error(`[FirebaseAdmin] Loaded config from firebase-applet-config.json. Project: ${projectId}, Database: ${databaseId || '(default)'}`);
  }
} catch (err) {
  console.error("[FirebaseAdmin] Error reading firebase-applet-config.json:", err);
}

if (getApps().length === 0) {
  try {
    initializeApp({
      credential: applicationDefault(),
      projectId: projectId
    });
    console.error(`[FirebaseAdmin] Initialized with applicationDefault for project: ${projectId}`);
  } catch (err) {
    console.error("[FirebaseAdmin] Failed applicationDefault initialization, trying standard:", err);
    try {
      initializeApp({
        projectId: projectId
      });
      console.error(`[FirebaseAdmin] Initialized with standard fallback for project: ${projectId}`);
    } catch (fallbackErr) {
      console.error("[FirebaseAdmin] Complete initialization failure:", fallbackErr);
    }
  }
}

export const db = databaseId ? getFirestore(databaseId) : getFirestore();
export { FieldValue };
