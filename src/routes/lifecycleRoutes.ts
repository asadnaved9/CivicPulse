import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebaseAdmin";
import { runWithRetry } from "../utils/geminiRetry";
import { ProposalStatus, Proposal } from "../types/proposal";
import { buildEvidenceChain, renderPrintableHTML } from "../utils/evidenceChain";
import { lookupDemographics } from "../data/censusData/india";

export const lifecycleRouter = Router();

// Order of states for deterministic forward-only transitions
export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  'draft',
  'submitted',
  'approved',
  'funded',
  'in_execution',
  'verified',
  'completed'
];

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    }
  }
}) : null;

/**
 * Helper to generate comprehensive proposal text using recommendation details
 */
export async function buildProposalDraft(recommendation: any) {
  const defaultProposal = {
    title: recommendation.recommendedProject || "Constituency Infrastructure Project",
    executiveSummary: "This project aims to bridge a critical infrastructure gap identified by active citizen distress signals and localized upvote consensus.",
    problemStatement: `Citizens in Bangalore Central have reported recurring concerns regarding ${recommendation.category || 'general infrastructure'}. The official Local Development Plan is currently unaligned with this specific local demand.`,
    evidence: `The demand is clustered around high-density spots with a priority score of ${recommendation.priorityScore || 75}/100.`,
    beneficiaries: "Approximately 12,500 residents and daily commuters in the immediate municipal ward.",
    demographicData: "BBMP Ward census records indicate high density residential households with mixed income distribution.",
    infrastructureGap: `Official Local Development Plan item "${recommendation.matchingPlanItem || 'None'}" has budget allocations but lacks local sidewalk, drainage, or community alignment.`,
    priorityScore: recommendation.priorityScore || 75,
    estimatedImpact: "Expected to reduce travel safety hazards, improve local sanitation, and increase public satisfaction rating by 25%.",
    implementationTimeline: "Phase 1: Mobilization (Month 1-2), Phase 2: Civil Construction (Month 3-5), Phase 3: Final Inspection & Handover (Month 6)."
  };

  if (!ai) {
    return defaultProposal;
  }

  try {
    const prompt = `You are a municipal project manager preparing a project proposal for approval.
Based on the following alignment recommendation:
Project Name: ${recommendation.recommendedProject}
Matching Plan Item: ${recommendation.matchingPlanItem}
Category: ${recommendation.category}
Priority Score: ${recommendation.priorityScore}
Details: ${recommendation.recommendationText}

Generate a formal project proposal in JSON format matching this exact schema:
{
  "title": "Clear elegant project title",
  "executiveSummary": "2-sentence executive summary",
  "problemStatement": "Specific explanation of the civic or public safety issue",
  "evidence": "Description of citizen submissions, upvote indicators, and density",
  "beneficiaries": "Estimated population benefited and demographic segments",
  "demographicData": "Realistic Bangalore-specific demographic characteristics",
  "infrastructureGap": "Description of why current plans are insufficient without this alignment",
  "priorityScore": number (75),
  "estimatedImpact": "Detail travel reduction, safety, or public satisfaction metrics",
  "implementationTimeline": "6-month phased schedule description"
}
Ensure all descriptions are highly detailed, professional, and contain zero placeholder words. Return raw JSON.`;

    const resultText = await runWithRetry(
      async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        return response.text || "";
      },
      3,
      1500,
      JSON.stringify(defaultProposal)
    );

    return JSON.parse(resultText.trim());
  } catch (err) {
    console.error("[LifecycleRouter] Proposal generator fallback:", err);
    return defaultProposal;
  }
}

/**
 * 1. POST /api/lifecycle/proposals
 * Create a new proposal in 'draft' status from an existing recommendation
 */
lifecycleRouter.post("/proposals", async (req, res) => {
  const { recommendationId, recommendation: recPayload } = req.body;
  if (!recommendationId && !recPayload) {
    return res.status(400).json({ error: "Missing recommendationId or recommendation payload." });
  }

  try {
    let rec = recPayload;
    if (!rec && recommendationId) {
      const recDoc = await db.collection("recommendations").doc(recommendationId).get();
      if (recDoc.exists) {
        rec = { id: recDoc.id, ...recDoc.data() };
      }
    }

    if (!rec) {
      return res.status(404).json({ error: "Recommendation not found." });
    }

    const proposalDetails = await buildProposalDraft(rec);
    const now = new Date();

    const newProposal: Proposal = {
      id: `proposal_${Date.now()}`,
      recommendationId: rec.id || recommendationId || "rec_direct",
      title: proposalDetails.title || rec.recommendedProject || "Constituency Project Proposal",
      status: 'draft',
      statusHistory: [
        {
          status: 'draft',
          changedAt: now,
          changedBy: req.body.changedBy || 'MP Planning Office',
          note: 'Initial proposal drafted from citizen demand and alignment analysis'
        }
      ],
      proposalText: JSON.stringify(proposalDetails, null, 2),
      estimatedCost: rec.estimatedCost || "₹50 Lakhs",
      category: rec.category || "General Infrastructure",
      location: rec.location || "Bangalore Central",
      createdAt: now,
      updatedAt: now
    };

    await db.collection("proposals").doc(newProposal.id).set(newProposal);
    return res.json({ success: true, proposal: newProposal });
  } catch (err: any) {
    console.error("[LifecycleRouter] Failed to create proposal:", err);
    return res.status(500).json({ error: err.message || "Failed to create proposal" });
  }
});

/**
 * 2. GET /api/lifecycle/proposals
 * Retrieve list of proposals, optionally filtered by status
 */
lifecycleRouter.get("/proposals", async (req, res) => {
  try {
    const { status } = req.query;
    let queryRef: any = db.collection("proposals");
    if (status && typeof status === 'string') {
      queryRef = queryRef.where("status", "==", status);
    }
    const snap = await queryRef.get();
    const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, count: list.length, proposals: list });
  } catch (err: any) {
    console.error("[LifecycleRouter] Failed to list proposals:", err);
    return res.status(500).json({ error: err.message || "Failed to list proposals" });
  }
});

/**
 * 3. GET /api/lifecycle/proposals/:id
 * Retrieve a single proposal by ID
 */
lifecycleRouter.get("/proposals/:id", async (req, res) => {
  try {
    const docSnap = await db.collection("proposals").doc(req.params.id).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    return res.json({ success: true, proposal: { id: docSnap.id, ...docSnap.data() } });
  } catch (err: any) {
    console.error("[LifecycleRouter] Failed to get proposal:", err);
    return res.status(500).json({ error: err.message || "Failed to get proposal" });
  }
});

/**
 * 4. PATCH /api/lifecycle/proposals/:id/status
 * Forward-only deterministic state machine transition:
 * draft -> submitted -> approved -> funded -> in_execution -> verified -> completed
 * (rejected is allowed from any pre-completed status)
 */
lifecycleRouter.patch("/proposals/:id/status", async (req, res) => {
  const { status: targetStatus, note, changedBy } = req.body;
  if (!targetStatus) {
    return res.status(400).json({ error: "Missing status field in request body." });
  }

  try {
    const docRef = db.collection("proposals").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const currentProposal = docSnap.data() as Proposal;
    const currentStatus = currentProposal.status;

    // Validate forward-only transition
    if (targetStatus === 'rejected') {
      if (currentStatus === 'completed') {
        return res.status(400).json({
          error: "Invalid transition: A completed project cannot be marked as rejected."
        });
      }
    } else {
      const currentIndex = PROPOSAL_STATUS_ORDER.indexOf(currentStatus);
      const targetIndex = PROPOSAL_STATUS_ORDER.indexOf(targetStatus);

      if (targetIndex === -1) {
        return res.status(400).json({
          error: `Invalid status: "${targetStatus}". Must be one of: ${PROPOSAL_STATUS_ORDER.join(', ')}, rejected.`
        });
      }

      // Must be strictly adjacent next step (currentIndex + 1)
      if (targetIndex !== currentIndex + 1) {
        return res.status(400).json({
          error: `Invalid transition: Cannot advance proposal directly from "${currentStatus}" to "${targetStatus}". Next permissible state is "${PROPOSAL_STATUS_ORDER[currentIndex + 1] || 'none'}".`
        });
      }
    }

    const now = new Date();
    const historyEntry = {
      status: targetStatus,
      changedAt: now,
      changedBy: changedBy || 'Government Representative',
      note: note || `Status updated from ${currentStatus} to ${targetStatus}`
    };

    const updatedHistory = [...(currentProposal.statusHistory || []), historyEntry];

    await docRef.update({
      status: targetStatus,
      statusHistory: updatedHistory,
      updatedAt: now
    });

    return res.json({
      success: true,
      id: req.params.id,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      statusHistory: updatedHistory
    });
  } catch (err: any) {
    console.error("[LifecycleRouter] Failed to update status:", err);
    return res.status(500).json({ error: err.message || "Failed to update status" });
  }
});

// GET /api/lifecycle/proposals/:id/evidence — Structured Evidence Chain JSON
lifecycleRouter.get("/proposals/:id/evidence", async (req, res) => {
  try {
    const docRef = db.collection("proposals").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const proposal = { id: docSnap.id, ...docSnap.data() } as any;

    // Fetch related recommendation, cluster, and suggestions
    let recommendation: any = null;
    let cluster: any = null;
    let suggestions: any[] = [];

    if (proposal.recommendationId) {
      const recSnap = await db.collection("recommendations").doc(proposal.recommendationId).get();
      if (recSnap.exists) recommendation = { id: recSnap.id, ...recSnap.data() };
    }

    const clusterId = recommendation?.clusterId || proposal.clusterId;
    if (clusterId) {
      const clSnap = await db.collection("clusters").doc(clusterId).get();
      if (clSnap.exists) cluster = { id: clSnap.id, ...clSnap.data() };
    }

    const suggestionsSnap = await db.collection("suggestions").limit(10).get();
    suggestions = suggestionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const ward = proposal.ward || cluster?.ward || 'Koramangala 4th Block';
    const demographics = lookupDemographics(ward);

    const chain = buildEvidenceChain(proposal, recommendation, cluster, suggestions, demographics);
    return res.json(chain);
  } catch (err: any) {
    console.error("[LifecycleRouter] Evidence retrieval error:", err);
    return res.status(500).json({ error: "Failed to assemble evidence chain" });
  }
});

// GET /api/lifecycle/proposals/:id/evidence/pdf — Printable Decision Brief HTML
lifecycleRouter.get("/proposals/:id/evidence/pdf", async (req, res) => {
  try {
    const docRef = db.collection("proposals").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).send("Proposal not found");
    }

    const proposal = { id: docSnap.id, ...docSnap.data() } as any;

    let recommendation: any = null;
    let cluster: any = null;
    let suggestions: any[] = [];

    if (proposal.recommendationId) {
      const recSnap = await db.collection("recommendations").doc(proposal.recommendationId).get();
      if (recSnap.exists) recommendation = { id: recSnap.id, ...recSnap.data() };
    }

    const clusterId = recommendation?.clusterId || proposal.clusterId;
    if (clusterId) {
      const clSnap = await db.collection("clusters").doc(clusterId).get();
      if (clSnap.exists) cluster = { id: clSnap.id, ...clSnap.data() };
    }

    const suggestionsSnap = await db.collection("suggestions").limit(10).get();
    suggestions = suggestionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const ward = proposal.ward || cluster?.ward || 'Koramangala 4th Block';
    const demographics = lookupDemographics(ward);

    const chain = buildEvidenceChain(proposal, recommendation, cluster, suggestions, demographics);
    const html = renderPrintableHTML(chain);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err: any) {
    return res.status(500).send("Error rendering decision brief");
  }
});
