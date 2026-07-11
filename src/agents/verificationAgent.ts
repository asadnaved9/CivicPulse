import { db, FieldValue } from '../config/firebaseAdmin';
import { awardPoints, createNotification } from '../utils/pointsEngineAdmin';
import { generateText } from '../utils/geminiRetry';

/**
 * Verification Agent
 * Triggered when an issue receives exactly 3 upvotes.
 * Updates issue, awards points, and sends notifications.
 */
export async function runVerificationAgent(issueId: string) {
  try {
    const issueRef = db.collection('issues').doc(issueId);
    const issueSnap = await issueRef.get();

    if (!issueSnap.exists) {
      console.error(`[VerificationAgent] Issue ${issueId} not found.`);
      return;
    }

    const issue = issueSnap.data() || {};

    if (issue.verified) {
      console.error(`[VerificationAgent] Issue ${issueId} is already verified.`);
      return;
    }

    console.error(`[VerificationAgent] Running verification for issue: ${issue.title}`);

    let verificationReason = "Community verified. Received 3 peer-validations.";

    const prompt = `You are a municipal verification AI. An issue has received 3 community validations:
    Title: ${issue.title}
    Category: ${issue.category}
    Description: ${issue.description}
    Address: ${issue.address}
    
    Write a concise, professional, one-sentence verification statement confirming this issue is community-verified and is scheduled for municipal prioritization. Do not write markdown.
    
    CRITICAL NO-MARKDOWN RULE: Do not use any markdown formatting such as bold asterisks (**), italics (*), or headers (###, #, etc.) anywhere in your output.`;

    verificationReason = await generateText({
      prompt,
      fallbackValue: verificationReason
    });

    // Update issue in Firestore
    await issueRef.update({
      verified: true,
      status: 'verified',
      verificationReason: verificationReason,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award 10 points to each upvoter
    const upvoters = issue.upvotes || [];
    for (const uid of upvoters) {
      await awardPoints(uid, 10, 'Issue validation upvote');
    }

    // Create notification for reporter
    if (issue.reportedBy) {
      await createNotification(
        issue.reportedBy,
        `Your reported issue "${issue.title}" has been community verified! +10 points awarded to all upvoters.`,
        issueId
      );
    }

    console.error(`[VerificationAgent] Issue ${issueId} successfully verified! Reason: ${verificationReason}`);
  } catch (error) {
    console.error(`[VerificationAgent] Failed to verify issue ${issueId}:`, error);
  }
}
