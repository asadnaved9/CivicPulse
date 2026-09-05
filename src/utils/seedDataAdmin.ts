import { db, Timestamp } from '../config/firebaseAdmin';
import { BANGALORE_ISSUES, SEED_USERS, SEED_ACTIVITIES } from './seedData';

// Helper to calculate relative timestamp
function daysAgo(num: number) {
  const date = new Date();
  date.setDate(date.getDate() - num);
  return date;
}

export async function seedFirestoreIfEmptyAdmin() {
  try {
    const issuesRef = db.collection('issues');
    const snapshot = await issuesRef.limit(5).get();

    if (snapshot.size >= 5) {
      console.log("[Admin Seeder] Firestore is already populated with issues. Ensuring seed images/data are perfectly aligned...");
      const batch = db.batch();
      BANGALORE_ISSUES.forEach((issue: any, index) => {
        const issueId = `seed_issue_${index + 1}`;
        const issueDocRef = issuesRef.doc(issueId);
        batch.set(issueDocRef, {
          imageUrl: issue.imageUrl || "",
          resolvedImageUrl: issue.resolvedImageUrl || null,
          title: issue.title,
          description: issue.description
        }, { merge: true });
      });
      await batch.commit();
      console.log("[Admin Seeder] Seed issues images matched and synchronized successfully!");
      return;
    }

    console.log("[Admin Seeder] Firestore has fewer than 5 issues. Seeding Bangalore data via Admin SDK...");

    // Batch seed issues
    const batch = db.batch();
    
    BANGALORE_ISSUES.forEach((issue: any, index) => {
      const issueId = `seed_issue_${index + 1}`;
      const issueDocRef = issuesRef.doc(issueId);
      
      const issueData = {
        ...issue,
        id: issueId,
        imageUrl: issue.imageUrl || "",
        resolvedImageUrl: issue.resolvedImageUrl || null,
        reportedBy: issue.reportedBy || "seed_reporter_bbmp",
        reporterName: issue.reporterName || "BBMP Citizen Warden",
        createdAt: issue.createdAt ? Timestamp.fromDate(issue.createdAt) : Timestamp.now(),
        updatedAt: issue.updatedAt ? Timestamp.fromDate(issue.updatedAt) : Timestamp.now(),
        resolvedAt: issue.resolvedAt ? Timestamp.fromDate(issue.resolvedAt) : null,
        escalatedAt: issue.escalatedAt ? Timestamp.fromDate(issue.escalatedAt) : null,
        verificationReason: issue.verificationReason || ""
      };
      
      batch.set(issueDocRef, issueData);
    });

    // Batch seed leaderboard users
    SEED_USERS.forEach((user) => {
      const userDocRef = db.collection('users').doc(user.uid);
      batch.set(userDocRef, {
        ...user,
        joinedAt: Timestamp.fromDate(daysAgo(30))
      });
    });

    // Batch seed custom recent resolutions in activities
    SEED_ACTIVITIES.forEach((activity, index) => {
      const activityDocRef = db.collection('activities').doc(`seed_activity_${index + 1}`);
      batch.set(activityDocRef, {
        ...activity,
        createdAt: Timestamp.fromDate(daysAgo(index))
      });
    });

    await batch.commit();
    console.log("[Admin Seeder] Seeding of Bangalore issues, users, and activities completed successfully via Admin SDK!");
  } catch (error) {
    console.error("[Admin Seeder] Seeding error:", error);
  }
}
