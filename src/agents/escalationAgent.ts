import { db, FieldValue } from '../config/firebaseAdmin';
import { createNotification } from '../utils/pointsEngineAdmin';
import { GoogleGenAI } from '@google/genai';
import { runWithRetry } from '../utils/geminiRetry';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Scans open, highly-upvoted issues left unresolved for more than 72 hours
 * and escalates them autonomously.
 */
export async function detectEscalations() {
  try {
    console.error("[EscalationAgent] Scanning for open issues to escalate...");
    
    const issuesRef = db.collection('issues');
    const querySnapshot = await issuesRef.get();
    
    const now = Date.now();
    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    let escalatedCount = 0;

    for (const docSnap of querySnapshot.docs) {
      const issue = docSnap.data() || {};
      const createdAtMs = issue.createdAt?.seconds 
        ? issue.createdAt.seconds * 1000 
        : (issue.createdAt?.toDate ? issue.createdAt.toDate().getTime() : now);

      // Condition: not resolved AND age > 72 hours AND upvotes >= 5 AND not escalated
      if (
        issue.status !== 'resolved' &&
        (now - createdAtMs) > seventyTwoHoursMs &&
        (issue.upvotes || []).length >= 5 &&
        !issue.escalated
      ) {
        console.error(`[EscalationAgent] Escalating issue: ${issue.title} (ID: ${docSnap.id})`);
        
        // Update issue in Firestore
        const issueDocRef = db.collection('issues').doc(docSnap.id);
        await issueDocRef.update({
          escalated: true,
          escalatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        // Notify reporter
        if (issue.reportedBy) {
          await createNotification(
            issue.reportedBy,
            `ALERT: Your reported issue "${issue.title}" has been escalated to municipal authorities after community urgency!`,
            docSnap.id
          );
        }
        
        escalatedCount++;
      }
    }

    console.error(`[EscalationAgent] Scan complete. Escalated ${escalatedCount} issues.`);
  } catch (error) {
    console.error("[EscalationAgent] Error detecting escalations:", error);
  }
}

/**
 * Generates a formal complaint letter to the Municipal Corporation
 */
export async function generateComplaintLetter(issue: any): Promise<string> {
  const defaultLetter = `To,\nThe Municipal Commissioner,\nBengaluru Mahanagara Palike,\nBengaluru, Karnataka\n\nSubject: Official escalation of unresolved civic issue - ${issue.title || "Hazard"}\n\nDear Sir/Madam,\n\nI am writing to formally escalate an ongoing community issue at ${issue.address || "our locality"}. This problem is classified under "${issue.category || "General"}" and is currently rated with a high severity level of ${issue.severity || 3}/5.\n\nDescription:\n${issue.description || "No further details provided."}\n\nThis matter has been validated by active neighborhood residents and remains unresolved despite local concern. We request your immediate inspection and action to resolve this matter to prevent further community hazard.\n\nSincerely,\nCommunity Residents of Bengaluru`;

  if (!ai) return defaultLetter;

  const prompt = `You are a professional civic advocacy writer. Write a formal municipal complaint letter regarding this unresolved, escalated civic problem:
  - Title: ${issue.title}
  - Category: ${issue.category}
  - Description: ${issue.description}
  - Address: ${issue.address}
  - Severity: ${issue.severity}/5
  - Escalation Status: Formally Escalated via CivicPulse Platform
  
  Structure the letter with appropriate corporate headings, professional terminology, specific safety/hazard warnings, and a firm yet polite demand for immediate municipal action. Return only the plain letter text without formatting codes or explanation.
  
  CRITICAL NO-MARKDOWN RULE: Do not use any markdown formatting such as bold asterisks (**), italics (*), or headers (###, #, etc.) anywhere in your output. Use standard plain text line breaks and plain capital letters for sections instead.`;

  return await runWithRetry(
    async (modelName) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      return response.text || defaultLetter;
    },
    3,
    1500,
    defaultLetter
  );
}

