import { db, FieldValue } from '../config/firebaseAdmin';

/**
 * Awards points to a user and updates their badge progress (Server/Admin version)
 */
export async function awardPoints(uid: string, pointsAmount: number, reason: string) {
  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.warn(`User ${uid} does not exist in Firestore. Cannot award points.`);
      return;
    }

    const userData = userSnap.data() || {};
    const currentPoints = userData.points || 0;
    const newPoints = currentPoints + pointsAmount;
    
    const currentBadges = userData.badges || [];
    const newBadges = [...currentBadges];

    if (newPoints >= 100 && !newBadges.includes('Civic Champion')) {
      newBadges.push('Civic Champion');
    }
    if (newPoints >= 500 && !newBadges.includes('Community Guardian')) {
      newBadges.push('Community Guardian');
    }

    await userRef.update({
      points: newPoints,
      badges: newBadges,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.error(`[PointsEngineAdmin] Awarded ${pointsAmount} pts to ${uid} for: ${reason}. New total: ${newPoints}`);
  } catch (error) {
    console.error(`Failed to award points to user ${uid}:`, error);
  }
}

/**
 * Creates a notification in Firestore for a user (Server/Admin version)
 */
export async function createNotification(userId: string, message: string, issueId: string) {
  try {
    const notifRef = db.collection('notifications');
    await notifRef.add({
      userId,
      message,
      issueId,
      read: false,
      createdAt: FieldValue.serverTimestamp()
    });
    console.error(`[PointsEngineAdmin] Created notification for user ${userId}: "${message}"`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
