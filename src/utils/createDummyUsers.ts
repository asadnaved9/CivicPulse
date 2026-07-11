import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

let projectId = "civicpulse-e48de";

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    if (config.projectId) projectId = config.projectId;
  }
} catch (err) {
  console.error("Error reading config json:", err);
}

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: projectId
  });
}

const auth = getAuth();
const db = getFirestore();

async function createOrUpdateUser(email: string, password: string, displayName: string, role: string, extraData: any) {
  let uid = "";
  try {
    // Check if user exists
    const userRecord = await auth.getUserByEmail(email);
    uid = userRecord.uid;
    console.log(`User already exists: ${email} (UID: ${uid}). Updating password...`);
    await auth.updateUser(uid, {
      password: password,
      displayName: displayName
    });
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`Creating new user: ${email}...`);
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true
      });
      uid = userRecord.uid;
    } else {
      throw err;
    }
  }

  // Update Firestore user profile
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    uid: uid,
    displayName: displayName,
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
    points: extraData.points || 0,
    badges: extraData.badges || [],
    issuesReported: extraData.issuesReported || 0,
    issuesResolved: extraData.issuesResolved || 0,
    role: role,
    status: 'active',
    joinedAt: new Date(),
    ...extraData
  }, { merge: true });

  console.log(`Successfully configured ${role} profile for ${email} in Firestore!`);
}

async function run() {
  console.log("Starting dummy user creation/synchronization...");
  try {
    // 1. Create Admin account
    await createOrUpdateUser(
      'admin@civicpulse.gov.in',
      'password123',
      'Ward Admin',
      'admin',
      {
        points: 1200,
        badges: ["Staff", "Warden"],
        municipalityId: "Kolkata Municipality"
      }
    );

    // 2. Create Super Admin account
    await createOrUpdateUser(
      'superadmin@civicpulse.gov.in',
      'password123',
      'CTO & Platform Admin',
      'super_admin',
      {
        points: 5000,
        badges: ["Founder", "Architect"]
      }
    );

    console.log("Dummy user setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed dummy users:", error);
    process.exit(1);
  }
}

run();
