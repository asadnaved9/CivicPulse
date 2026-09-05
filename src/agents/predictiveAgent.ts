import { db, FieldValue } from '../config/firebaseAdmin';
import { GoogleGenAI } from '@google/genai';
import { runWithRetry } from '../utils/geminiRetry';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Groups open issues into a coordinate grid (2 decimals)
 * and assesses risk levels for clusters of 3+ issues.
 */
export async function runPredictiveAgent() {
  try {
    console.error("[PredictiveAgent] Running predictive clustering scan...");
    
    const issuesRef = db.collection('issues');
    const querySnapshot = await issuesRef.get();
    
    // Group issues by grid key: "lat_lng" rounded to 2 decimals
    const gridGroups: { [key: string]: any[] } = {};

    querySnapshot.docs.forEach((docSnap) => {
      const issue = docSnap.data() || {};
      // Only group open (non-resolved) issues
      if (issue.status !== 'resolved' && issue.lat && issue.lng) {
        const gridLat = parseFloat(issue.lat).toFixed(2);
        const gridLng = parseFloat(issue.lng).toFixed(2);
        const gridKey = `${gridLat}_${gridLng}`;

        if (!gridGroups[gridKey]) {
          gridGroups[gridKey] = [];
        }
        gridGroups[gridKey].push({
          id: docSnap.id,
          title: issue.title,
          category: issue.category,
          severity: issue.severity || 3,
          description: issue.description || ""
        });
      }
    });

    for (const [gridKey, issues] of Object.entries(gridGroups)) {
      if (issues.length >= 3) {
        console.error(`[PredictiveAgent] Found cluster of ${issues.length} issues at grid key ${gridKey}. Running risk assessment.`);
        
        let riskLevel = "medium";
        let reason = "Elevated volume of civic issues reported in this sector. Localized infrastructure fatigue suspected.";
        
        if (ai) {
          const prompt = `You are a predictive civic hazard AI. Grouped in grid coordinate ${gridKey.replace('_', ', ')}, there are ${issues.length} open community issues:
          ${JSON.stringify(issues)}
          
          Analyze the hazard density and predict the aggregate hazard risk level.
          Choose exactly one risk level: 'low' | 'medium' | 'high' | 'critical'.
          
          Respond ONLY with the following JSON format:
          {
            "riskLevel": "low"|"medium"|"high"|"critical",
            "reason": "One-sentence explanation of the hazard concentration and its municipal recommendation."
          }`;

          const fallbackResult = { riskLevel, reason };
          const result = await runWithRetry(
            async (modelName) => {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  responseMimeType: 'application/json'
                }
              });
              if (response.text) {
                const parsed = JSON.parse(response.text.trim());
                return {
                  riskLevel: parsed.riskLevel || "medium",
                  reason: parsed.reason || reason
                };
              }
              return fallbackResult;
            },
            3,
            1500,
            fallbackResult
          );

          riskLevel = result.riskLevel;
          reason = result.reason;
        }

        // Parse lat/lng from gridKey
        const [latStr, lngStr] = gridKey.split('_');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        // Store prediction in Firestore
        const predictionRef = db.collection('zonePredictions').doc(gridKey);
        await predictionRef.set({
          gridKey,
          lat,
          lng,
          issueCount: issues.length,
          riskLevel,
          reason,
          issues: issues.map(i => i.id),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        console.error(`[PredictiveAgent] Saved prediction for ${gridKey}: ${riskLevel.toUpperCase()} - ${reason}`);
      }
    }
    
    console.error("[PredictiveAgent] Scan and risk prediction complete.");
  } catch (error) {
    console.error("[PredictiveAgent] Predictive Agent execution failed:", error);
  }
}

