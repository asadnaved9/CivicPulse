import { db, FieldValue } from '../config/firebaseAdmin';
import { GoogleGenAI } from '@google/genai';
import { runWithRetry } from '../utils/geminiRetry';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Calculates a dynamic area health score and generates an operational summary paragraph.
 */
export async function runSummaryAgent() {
  try {
    console.error("[SummaryAgent] Evaluating community stats and area briefing...");
    
    const issuesRef = db.collection('issues');
    const querySnapshot = await issuesRef.get();
    
    const totalIssues = querySnapshot.docs.length;
    let openCount = 0;
    let resolvedCount = 0;
    let verifiedCount = 0;
    let totalSeverity = 0;

    querySnapshot.docs.forEach((docSnap) => {
      const issue = docSnap.data() || {};
      if (issue.status === 'resolved') {
        resolvedCount++;
      } else {
        openCount++;
      }
      if (issue.verified) {
        verifiedCount++;
      }
      totalSeverity += issue.severity || 3;
    });

    const avgSeverity = totalIssues > 0 ? totalSeverity / totalIssues : 3;

    // Calculate dynamic Community Health Score (0 - 100)
    // Formula: start at 100, subtract points for unresolved issues (more weight if high severity)
    let healthScore = 100;
    if (totalIssues > 0) {
      const openRatio = openCount / totalIssues;
      const penalty = (openRatio * 40) + (avgSeverity * 8);
      healthScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));
    }

    console.error(`[SummaryAgent] Computed Health Score: ${healthScore}/100. Open: ${openCount}, Resolved: ${resolvedCount}`);

    // Save Health Score document
    const healthRef = db.collection('analytics').doc('healthScore');
    await healthRef.set({
      score: healthScore,
      totalIssues,
      openCount,
      resolvedCount,
      verifiedCount,
      avgSeverity: parseFloat(avgSeverity.toFixed(1)),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Generate Context Summary with Gemini
    let summaryText = "Municipal and community activities are currently balanced. Infrastructure concerns (potholes and street lighting outages) are the primary drivers of community reports. Active community verification helps prioritize municipal works.";

    if (ai && totalIssues > 0) {
      const categoriesMap: { [key: string]: number } = {};
      querySnapshot.docs.forEach((docSnap) => {
        const cat = docSnap.data().category || "other";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });

      const prompt = `You are a municipal systems chief. Read these community statistics:
      - Total issues reported: ${totalIssues}
      - Open (unresolved) issues: ${openCount}
      - Resolved issues: ${resolvedCount}
      - Community verified reports: ${verifiedCount}
      - Average report severity: ${avgSeverity.toFixed(1)}/5
      - Categories breakdown: ${JSON.stringify(categoriesMap)}
      
      Write exactly one highly descriptive, professional paragraph (max 4 sentences) summarizing the main operational focus for the municipal corporation based on this data. Focus on real community improvement and infrastructure hotspots. Do not use list tags or bullet points.
      
      CRITICAL NO-MARKDOWN RULE: Do not use any markdown formatting such as bold asterisks (**), italics (*), or headers (###, #, etc.) anywhere in your output.`;

      summaryText = await runWithRetry(
        async (modelName) => {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });
          return response.text ? response.text.trim() : summaryText;
        },
        3,
        1500,
        summaryText
      );
    }

    // Save Summary document
    const summaryRef = db.collection('analytics').doc('summary');
    await summaryRef.set({
      summaryText,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.error(`[SummaryAgent] Saved summary briefing: "${summaryText.substring(0, 80)}..."`);
  } catch (error) {
    console.error("[SummaryAgent] Summary Agent failed:", error);
  }
}
