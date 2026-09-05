import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Awards points to a user and updates their badge progress
 */
export async function awardPoints(uid: string, pointsAmount: number, reason: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn(`User ${uid} does not exist in Firestore. Cannot award points.`);
      return;
    }

    const userData = userSnap.data();
    const currentPoints = userData.points || 0;
    const newPoints = currentPoints + pointsAmount;
    
    // Badge unlocking logic based on total points or actions
    const currentBadges = userData.badges || [];
    const newBadges = [...currentBadges];

    // Badge 1: First Report (handled on report submission)
    // Badge 2: Civic Champion (5 reports)
    // Badge 3: Community Guardian (10 reports)
    // Badge 4: Truth Teller (first AI-verified report)
    // Badge 5: Upvote King (25 upvotes given)
    // Badge 6: Problem Solver (3 issues resolved)

    // Check points-based badges
    if (newPoints >= 100 && !newBadges.includes('Civic Champion')) {
      newBadges.push('Civic Champion');
    }
    if (newPoints >= 500 && !newBadges.includes('Community Guardian')) {
      newBadges.push('Community Guardian');
    }

    await updateDoc(userRef, {
      points: newPoints,
      badges: newBadges,
      updatedAt: serverTimestamp()
    });

    console.error(`[PointsEngine] Awarded ${pointsAmount} pts to ${uid} for: ${reason}. New total: ${newPoints}`);
  } catch (error) {
    console.error(`Failed to award points to user ${uid}:`, error);
  }
}

/**
 * Creates a notification in Firestore for a user
 */
export async function createNotification(userId: string, message: string, issueId: string) {
  try {
    const notifRef = collection(db, 'notifications');
    await addDoc(notifRef, {
      userId,
      message,
      issueId,
      read: false,
      createdAt: serverTimestamp()
    });
    console.error(`[PointsEngine] Created notification for user ${userId}: "${message}"`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
