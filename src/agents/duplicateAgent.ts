import { db, FieldValue } from '../config/firebaseAdmin';
import { createNotification } from '../utils/pointsEngineAdmin';
import { generateText } from '../utils/geminiRetry';

// Helper to calculate geospatial distance in meters using Haversine formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper to fetch an image and convert it to Gemini inlineData format
async function fetchImageAsBase64Part(url: string): Promise<any | null> {
  try {
    if (!url || !url.startsWith('http')) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    let mimeType = 'image/jpeg';
    if (url.includes('.png')) {
      mimeType = 'image/png';
    } else if (url.includes('.webp')) {
      mimeType = 'image/webp';
    }
    
    return {
      inlineData: {
        data: base64,
        mimeType
      }
    };
  } catch (error) {
    console.error(`[DuplicateAgent] Failed to fetch image from ${url}:`, error);
    return null;
  }
}

/**
 * Duplicate Detection Agent
 * Scans all active reports, identifies ones within 100m in the same category,
 * and uses Gemini Vision + text analysis to verify if they are duplicates.
 */
export async function runDuplicateAgent() {
  try {
    console.error("[DuplicateAgent] Running duplicate detection scan...");
    
    const issuesRef = db.collection('issues');
    const querySnapshot = await issuesRef.get();
    
    // Extract active issues
    const activeIssues: any[] = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'resolved' && data.status !== 'duplicate' && data.status !== 'rejected') {
        activeIssues.push({
          id: doc.id,
          ...data
        });
      }
    });

    console.error(`[DuplicateAgent] Found ${activeIssues.length} active issues to compare.`);

    // Set of IDs that were already merged in this run to avoid duplicate operations
    const mergedIdsInRun = new Set<string>();

    const hasKeys = !!(
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.NVIDIA_NIM_API_KEY
    );

    for (let i = 0; i < activeIssues.length; i++) {
      const issueA = activeIssues[i];
      if (mergedIdsInRun.has(issueA.id)) continue;

      for (let j = i + 1; j < activeIssues.length; j++) {
        const issueB = activeIssues[j];
        if (mergedIdsInRun.has(issueB.id)) continue;

        // Must be same category and close physically (within 100m)
        if (issueA.category !== issueB.category) continue;
        if (!issueA.lat || !issueA.lng || !issueB.lat || !issueB.lng) continue;

        const distance = getDistanceInMeters(
          parseFloat(issueA.lat),
          parseFloat(issueA.lng),
          parseFloat(issueB.lat),
          parseFloat(issueB.lng)
        );

        if (distance > 100) continue;

        console.error(`[DuplicateAgent] Candidates found: "${issueA.title}" and "${issueB.title}" (Distance: ${distance.toFixed(1)}m)`);

        // Determine parent vs child: Older report (or verified one) is the parent
        let parent = issueA;
        let child = issueB;

        const timeA = issueA.createdAt?.toDate ? issueA.createdAt.toDate().getTime() : new Date(issueA.createdAt).getTime();
        const timeB = issueB.createdAt?.toDate ? issueB.createdAt.toDate().getTime() : new Date(issueB.createdAt).getTime();

        if (timeB < timeA || (issueB.verified && !issueA.verified)) {
          parent = issueB;
          child = issueA;
        }

        let isDuplicate = false;
        let confidence = 0;
        let reason = "Distance and category threshold met; automatic merge fallback.";

        if (hasKeys) {
          // Prepare multimodal/visual parts if images exist
          const parts: any[] = [];
          
          if (parent.imageUrl) {
            const part = await fetchImageAsBase64Part(parent.imageUrl);
            if (part) parts.push(part);
          }
          if (child.imageUrl) {
            const part = await fetchImageAsBase64Part(child.imageUrl);
            if (part) parts.push(part);
          }

          const prompt = `You are a civic duplicate detection AI. Your task is to analyze if two reported municipal/infrastructure issues are duplicates of the same actual physical problem/event at the same location.

Report A (Older/Parent):
- Title: ${parent.title}
- Description: ${parent.description}
- Category: ${parent.category}
- Address: ${parent.address}

Report B (Newer/Duplicate candidate):
- Title: ${child.title}
- Description: ${child.description}
- Category: ${child.category}
- Address: ${child.address}

Compare their titles, descriptions, and the provided images (if any). Determine if they represent the same physical issue (e.g. the exact same pothole, the same broken streetlight, the same garbage pile).
Note: They might have slightly different titles or descriptions because they were reported by different citizens, but if they describe/show the exact same hazard at the same spot, they are duplicates.

Respond ONLY with the following JSON format:
{
  "isDuplicate": true|false,
  "confidence": 0.0 to 1.0,
  "reason": "A brief explanation of why this was determined to be a duplicate or not."
}`;

          parts.push({ text: prompt });

          try {
            const result = await generateText<{ isDuplicate: boolean; confidence: number; reason: string }>({
              prompt: parts,
              fallbackValue: { isDuplicate: false, confidence: 0, reason: "Timeout or API error" },
              jsonMode: true
            });

            isDuplicate = result.isDuplicate;
            confidence = result.confidence || 0;
            reason = result.reason || reason;
          } catch (err) {
            console.error("[DuplicateAgent] AI comparison failed, falling back to false:", err);
          }
        } else {
          // No AI: simple keyword/semantic similarity fallback
          const titleWordsA = parent.title.toLowerCase().split(/\s+/);
          const titleWordsB = child.title.toLowerCase().split(/\s+/);
          const commonWords = titleWordsA.filter(w => titleWordsB.includes(w) && w.length > 3);
          
          if (commonWords.length >= 1) {
            isDuplicate = true;
            confidence = 0.7;
            reason = "Fallback: High keyword overlap in the same category within 100m.";
          }
        }

        if (isDuplicate && confidence >= 0.7) {
          console.error(`[DuplicateAgent] MERGING: "${child.title}" into parent "${parent.title}" (Reason: ${reason})`);
          
          mergedIdsInRun.add(child.id);

          // 1. Merge upvote arrays uniquely
          const parentUpvotes = parent.upvotes || [];
          const childUpvotes = child.upvotes || [];
          const combinedUpvotes = Array.from(new Set([...parentUpvotes, ...childUpvotes]));

          // 2. Prepare childReport object to add to parent
          const childReportInfo = {
            id: child.id,
            title: child.title,
            description: child.description,
            imageUrl: child.imageUrl || null,
            reportedBy: child.reportedBy || null,
            createdAt: child.createdAt || FieldValue.serverTimestamp()
          };

          // 3. Update Parent Doc
          const parentRef = db.collection('issues').doc(parent.id);
          await parentRef.update({
            upvotes: combinedUpvotes,
            childReports: FieldValue.arrayUnion(childReportInfo),
            updatedAt: FieldValue.serverTimestamp()
          });

          // 4. Update Child Doc
          const childRef = db.collection('issues').doc(child.id);
          await childRef.update({
            status: 'duplicate',
            mergedInto: parent.id,
            updatedAt: FieldValue.serverTimestamp()
          });

          // 5. Notify the reporter of the duplicate issue
          if (child.reportedBy) {
            await createNotification(
              child.reportedBy,
              `Your report "${child.title}" has been merged into an existing active report for this location. Consolidated details will speed up validation.`,
              parent.id
            );
          }

          // Break the inner loop for this issue since it has been merged and is no longer active
          if (child.id === issueA.id) {
            break;
          }
        }
      }
    }
    
    console.error("[DuplicateAgent] Duplicate detection scan complete.");
  } catch (error) {
    console.error("[DuplicateAgent] Error during duplicate detection scan:", error);
  }
}
