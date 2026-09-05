import fetch from 'node-fetch';
import { 
  seedSuggestionsIfEmpty, 
  rebuildClusters, 
  compareDemandAndPlan 
} from '../src/utils/aiPlanningService';
import { db } from '../src/config/firebaseAdmin';

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

export async function runHealthcareDemoScenario(geminiActive: boolean) {
  console.log(`\n========================================================================`);
  console.log(`DEMO SCENARIO: HEALTHCARE INFRASTRUCTURE GAP (Gemini ${geminiActive ? 'ENABLED' : 'DISABLED/FALLBACK'})`);
  console.log(`========================================================================`);

  // Step 1: Ensure seed data is populated
  console.log(`\n[Stage 1] Seeding citizen development suggestions into Firestore...`);
  await seedSuggestionsIfEmpty();
  console.log(`✓ Suggestions seeded.`);

  // Step 2: Rebuild Clusters (6-factor Priority Scoring)
  console.log(`\n[Stage 2] Executing AI Semantic & Geographic Clustering...`);
  const clusterResult = await rebuildClusters();
  console.log(`✓ Generated ${clusterResult.count} logical development clusters.`);

  // Verify healthcare cluster presence
  const healthcareCluster = clusterResult.clusters?.find((c: any) => 
    (c.category || '').toLowerCase() === 'healthcare' ||
    (c.theme || '').toLowerCase().includes('health') ||
    (c.theme || '').toLowerCase().includes('clinic')
  );

  if (healthcareCluster) {
    console.log(`  -> Detected Healthcare Theme: "${healthcareCluster.theme}"`);
    console.log(`  -> Priority Score: ${healthcareCluster.priorityScore}/100`);
    console.log(`  -> Reason: ${healthcareCluster.scoreDetails?.reasoning || 'N/A'}`);
  } else {
    console.warn(`  ! Healthcare cluster not found as a distinct category, checking top clusters...`);
  }

  // Step 3: Run Alignment Comparison (Demand vs Local Development Plan)
  console.log(`\n[Stage 3] Comparing Citizen Demand Hotspots vs Municipal Plan...`);
  const alignmentResult = await compareDemandAndPlan();
  console.log(`✓ Alignment generated ${alignmentResult.count} strategic project recommendations.`);

  // Find the top healthcare gap recommendation
  const recommendations = alignmentResult.recommendations || [];
  const topHealthcareRec = recommendations.find((r: any) => 
    (r.category || '').toLowerCase() === 'healthcare' ||
    (r.recommendedProject || '').toLowerCase().includes('health') ||
    (r.recommendedProject || '').toLowerCase().includes('clinic')
  ) || recommendations[0];

  console.log(`  -> Selected Top Alignment Recommendation: "${topHealthcareRec?.recommendedProject}"`);
  console.log(`  -> Status: ${topHealthcareRec?.actionRecommendation}`);
  console.log(`  -> Estimated Cost: ${topHealthcareRec?.estimatedCost}`);

  // Step 4: Run Budget Planner Knapsack Optimization (₹5.0 Crore)
  console.log(`\n[Stage 4] Running Knapsack Treasury Budget Optimization (Limit: ₹5.00 Cr)...`);
  try {
    const budgetRes = await fetch(`${BASE_URL}/api/mp/budget-planner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetCrores: 5.0 })
    });
    if (budgetRes.ok) {
      const budgetData = await budgetRes.json() as any;
      const count = budgetData.selectedProjects?.length || 0;
      const cost = budgetData.totalCost || 0;
      const avgPri = Math.round(budgetData.priorityRetained || 0);
      console.log(`✓ Budget Plan Selected ${count} projects (Total: ₹${cost.toFixed(2)} Cr).`);
      console.log(`  -> Average Priority Score: ${avgPri}/100`);
    } else {
      console.warn(`! Budget route returned ${budgetRes.status}`);
    }
  } catch (err: any) {
    console.warn(`! Budget planner network call skipped: ${err.message}`);
  }

  // Step 5: Run Government Scheme Matcher (Alchemyst Context Grounded)
  console.log(`\n[Stage 5] Matching Central & State Government Funding Schemes...`);
  try {
    const schemeRes = await fetch(`${BASE_URL}/api/mp/scheme-matcher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation: topHealthcareRec })
    });
    if (schemeRes.ok) {
      const schemeData = await schemeRes.json() as any;
      console.log(`✓ Matched Schemes:`);
      (schemeData.schemes || []).forEach((sch: any, idx: number) => {
        console.log(`    [${idx + 1}] ${sch.schemeName} (${sch.suitability || 'Eligible'})`);
        console.log(`        Funding: ${sch.fundingRatio || 'Standard Central-State share'}`);
      });
    } else {
      console.warn(`! Scheme matcher returned ${schemeRes.status}`);
    }
  } catch (err: any) {
    console.warn(`! Scheme matcher network call skipped: ${err.message}`);
  }

  // Step 6: Create and advance Lifecycle Proposal
  console.log(`\n[Stage 6] Persisting Formal Capital Proposal to Lifecycle State Machine...`);
  try {
    const proposalRes = await fetch(`${BASE_URL}/api/lifecycle/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendationId: topHealthcareRec?.id,
        recommendation: topHealthcareRec
      })
    });

    if (proposalRes.ok) {
      const proposalData = await proposalRes.json() as any;
      const proposal = proposalData.proposal;
      console.log(`✓ Proposal Created: "${proposal.title}" (ID: ${proposal.id})`);
      console.log(`  -> Initial Status: ${proposal.status.toUpperCase()}`);

      // Advance to submitted
      const advanceRes = await fetch(`${BASE_URL}/api/lifecycle/proposals/${proposal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
          note: 'Officially submitted to the District Planning Board during demo walk'
        })
      });

      if (advanceRes.ok) {
        const advanceData = await advanceRes.json() as any;
        console.log(`✓ Advanced Lifecycle Status: ${advanceData.newStatus.toUpperCase()}`);
      }

      // Confirm record exists in Firestore
      const checkDoc = await db.collection("proposals").doc(proposal.id).get();
      if (checkDoc.exists) {
        console.log(`✓ Verified Proposal persisted in Firestore collection "proposals".`);
      }
    }
  } catch (err: any) {
    console.warn(`! Proposal lifecycle step note: ${err.message}`);
  }

  console.log(`\n========================================================================`);
  console.log(`DEMO SCENARIO COMPLETE: Citizen → Cluster → Alignment → Scheme → Lifecycle`);
  console.log(`========================================================================\n`);
  return { success: true };
}

// Direct execution entrypoint
runHealthcareDemoScenario(Boolean(process.env.GEMINI_API_KEY))
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Demo scenario failed:", err);
    process.exit(1);
  });

