import { db } from '../config/firebaseAdmin';
import { runVerificationAgent } from './verificationAgent';
import { detectEscalations } from './escalationAgent';
import { runPredictiveAgent } from './predictiveAgent';
import { runSummaryAgent } from './summaryAgent';
import { runDuplicateAgent } from './duplicateAgent';
import { runWeatherAlertsAgent } from './weatherAgent';

let isOrchestratorRunning = false;

/**
 * Robust exponential backoff wrapper for API operations
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                        (error instanceof Error && error.message.includes('429')) ||
                        (error instanceof Error && error.message.toLowerCase().includes('quota exceeded'));
                        
    if (retries > 0 && isRateLimit) {
      console.warn(`[Orchestrator] Rate limit / quota error detected. Backing off for ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Main Autonomous Orchestrator Pipeline
 * Runs sequential background steps to audit and process the platform's state.
 */
export async function runOrchestratorPipeline() {
  if (isOrchestratorRunning) {
    console.error("[Orchestrator] Pipeline already running. Skipping execution cycle.");
    return;
  }

  isOrchestratorRunning = true;
  console.error("═══════════════════════════════════════════════════════════════");
  console.error("[Orchestrator] STARTING AUTONOMOUS PIPELINE CYCLE");
  console.error("═══════════════════════════════════════════════════════════════");

  try {
    // STEP 1: Scan unanalyzed reports (or correct missing categories)
    // Note: Reports submitted via client UI are classified instantly.
    // In the orchestrator, we ensure any unverified reports with 3+ upvotes trigger validation.
    console.error("[Orchestrator] Step 1 of 5: Scanning reports...");
    
    console.error("[Orchestrator] Running Duplicate Detection Agent...");
    await retryWithBackoff(() => runDuplicateAgent());

    // STEP 2: Find unverified issues with 3+ upvotes and verify them
    console.error("[Orchestrator] Step 2 of 5: Finding 3+ upvote unverified issues...");
    const issuesRef = db.collection('issues');
    const issuesSnap = await issuesRef.get();
    
    for (const docSnap of issuesSnap.docs) {
      const issue = docSnap.data();
      const upvoteCount = (issue.upvotes || []).length;
      
      if (upvoteCount >= 3 && !issue.verified && issue.status !== 'resolved') {
        console.error(`[Orchestrator] Triggering VerificationAgent for issue ${docSnap.id} with ${upvoteCount} upvotes.`);
        await retryWithBackoff(() => runVerificationAgent(docSnap.id));
      }
    }

    // STEP 3: Find 72hr+ unresolved issues with 5+ upvotes and escalate them
    console.error("[Orchestrator] Step 3 of 5: Scanning for 72hr+ escalations...");
    await retryWithBackoff(() => detectEscalations());

    // STEP 4: Cluster issues by coordinates grid and run risk assessments
    console.error("[Orchestrator] Step 4 of 5: Scanning geographic risk zones...");
    await retryWithBackoff(() => runPredictiveAgent());

    // STEP 5: Recompute Community Health Score and generate summary briefing
    console.error("[Orchestrator] Step 5 of 5: Generating Area Summary and Health Score...");
    await retryWithBackoff(() => runSummaryAgent());

    // STEP 6: Run Weather & Flood Alerts scan
    console.error("[Orchestrator] Step 6 of 6: Scanning Weather and Flood Alerts...");
    await retryWithBackoff(() => runWeatherAlertsAgent());

    console.error("═══════════════════════════════════════════════════════════════");
    console.error("[Orchestrator] AUTONOMOUS PIPELINE CYCLE COMPLETED SUCCESSFULY");
    console.error("═══════════════════════════════════════════════════════════════");
  } catch (error) {
    console.error("[Orchestrator] Critical error in pipeline execution:", error);
  } finally {
    isOrchestratorRunning = false;
  }
}

/**
 * Initializes the background scheduling interval on the server-side
 */
export function startOrchestratorScheduler() {
  console.error("[Orchestrator] Initializing Autonomous Background Scheduler (5-minute interval)...");
  
  // App Load Execution (non-blocking)
  setTimeout(() => {
    runOrchestratorPipeline().catch(err => {
      console.error("[Orchestrator] Initial app-load run failed:", err);
    });
  }, 3000); // Wait 3s after startup

  // Set 5-minute interval
  setInterval(() => {
    runOrchestratorPipeline().catch(err => {
      console.error("[Orchestrator] Scheduled run failed:", err);
    });
  }, 5 * 60 * 1000); // 5 minutes
}
