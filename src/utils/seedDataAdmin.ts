import { db, Timestamp } from '../config/firebaseAdmin';
import { RANCHI_ISSUES, SEED_USERS, SEED_ACTIVITIES } from './seedData';

// Helper to calculate relative timestamp
function daysAgo(num: number) {
  const date = new Date();
  date.setDate(date.getDate() - num);
  return date;
}

export async function seedFirestoreIfEmptyAdmin(force = false) {
  try {
    const issuesRef = db.collection('issues');
    const snapshot = await issuesRef.get();

    const nonRanchiRegex = /kolkata|kmc|cesc|bbmp|bangalore|bengaluru|salt lake|park street|koramangala|indiranagar|whitefield|mg road bangalore/i;

    // Purge outdated non-Ranchi issues
    let deletedCount = 0;
    const deleteBatch = db.batch();
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const text = `${data.address || ''} ${data.title || ''} ${data.description || ''}`;
      if (nonRanchiRegex.test(text)) {
        deleteBatch.delete(docSnap.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await deleteBatch.commit();
      console.log(`[Admin Seeder] Purged ${deletedCount} non-Ranchi documents.`);
    }

    if (!force && snapshot.size >= 10 && deletedCount === 0) {
      console.log("[Admin Seeder] Firestore already populated with valid Ranchi issues.");
      return { success: true, count: snapshot.size };
    }

    console.log("[Admin Seeder] Seeding/Updating all 20 Ranchi issues via Admin SDK...");

    // Batch seed issues
    const batch = db.batch();
    
    RANCHI_ISSUES.forEach((issue: any, index) => {
      const issueId = `seed_issue_${index + 1}`;
      const issueDocRef = issuesRef.doc(issueId);
      
      const issueData = {
        ...issue,
        id: issueId,
        imageUrl: issue.imageUrl || "",
        resolvedImageUrl: issue.resolvedImageUrl || null,
        reportedBy: issue.reportedBy || `citizen_rmc_${index + 1}`,
        reporterName: issue.reporterName || `RMC Citizen Warden ${index + 1}`,
        assignedDepartment: issue.category === 'pothole' ? 'Road Construction Department (RCD)' 
          : issue.category === 'streetlight' ? 'RMC Electrical & Streetlighting Cell'
          : issue.category === 'water' ? 'Drinking Water & Sanitation Department (DWSD)'
          : issue.category === 'waste' ? 'RMC Solid Waste Management Cell'
          : 'Jharkhand Bijli Vitran Nigam Limited (JBVNL)',
        createdAt: issue.createdAt ? Timestamp.fromDate(issue.createdAt) : Timestamp.fromDate(daysAgo(Math.max(1, 10 - index))),
        updatedAt: issue.updatedAt ? Timestamp.fromDate(issue.updatedAt) : Timestamp.fromDate(daysAgo(Math.max(1, 5 - Math.floor(index / 2)))),
        resolvedAt: issue.resolvedAt ? Timestamp.fromDate(issue.resolvedAt) : null,
        escalatedAt: issue.escalatedAt ? Timestamp.fromDate(issue.escalatedAt) : null,
        verificationReason: issue.verificationReason || (issue.verified ? "Validated by RMC field inspection & AI image confidence match." : "")
      };
      
      batch.set(issueDocRef, issueData, { merge: true });
    });

    // Batch seed leaderboard users
    SEED_USERS.forEach((user) => {
      const userDocRef = db.collection('users').doc(user.uid);
      batch.set(userDocRef, {
        ...user,
        joinedAt: Timestamp.fromDate(daysAgo(30))
      }, { merge: true });
    });

    // Batch seed custom recent resolutions in activities
    SEED_ACTIVITIES.forEach((activity, index) => {
      const activityDocRef = db.collection('activities').doc(`seed_activity_${index + 1}`);
      batch.set(activityDocRef, {
        ...activity,
        createdAt: Timestamp.fromDate(daysAgo(index))
      }, { merge: true });
    });

    await batch.commit();
    console.log("[Admin Seeder] Seeding of 20 Ranchi issues, users, and activities completed successfully via Admin SDK!");
    return { success: true, count: RANCHI_ISSUES.length };
  } catch (error) {
    console.error("[Admin Seeder] Seeding error:", error);
    return { success: false, error };
  }
}
