# CivicPulse — Zero-to-Complete Build Plan (Agent Execution Spec)

**Audience:** an autonomous coding agent (e.g. Claude Code) with shell + file access to a clone of `github.com/AribAsim/CivicPulse-BuildWithAI` (branch `main`).
**Contract:** execute tasks **in order**, T0 → T12. Do not skip a task or reorder it — later tasks assume earlier ones are done. Each task is self-contained: Objective, Preconditions, Exact Steps, Acceptance Criteria. Do not mark a task done until its Acceptance Criteria pass. Commit after each task with the suggested message so the work is bisectable and reviewable.

Every claim about "current" code in this document was verified by pulling the actual repository (via `codeload.github.com/AribAsim/CivicPulse-BuildWithAI/tar.gz/refs/heads/main`) and reading the files directly — not inferred from the README. If your checkout differs from what's quoted here, **stop and re-read the actual file before editing it** — don't apply a diff blind.

---

## T0 — Setup & Global Conventions

### Objective
Get a working baseline before touching anything, and internalize the rules that apply to every later task.

### Steps
1. `npm install`
2. Copy `.env.example` → `.env`. At minimum set `GEMINI_API_KEY` (all AI routes already have hardcoded fallback strings if this is absent, so the app runs without it — but you can't validate real Gemini output without it). Firebase vars are required for any Firestore-backed page to render; if you don't have a Firebase project, `isFirebaseConfigured` in `src/config/firebase.ts` gates most reads/writes to no-ops, so the app still boots.
3. `npm run dev` — confirm it boots on port 3000 with no console errors.
4. `npm run lint` (`tsc --noEmit`) — confirm baseline is clean before you start (if it's not, note pre-existing errors separately so you don't confuse them with your own regressions later).
5. `git checkout -b feature/civic-pulse-intelligence-rebuild` (or whatever branch convention the repo owner prefers) — do not work directly on `main`.

### Global conventions (apply to every task below)
- **Styling:** use only the CSS custom properties already defined in `src/index.css` (`--bg`, `--surface-1/2/3`, `--primary`, `--text-1/2/3`, `--border`, `--danger`, `--success`). Never introduce a raw hex color or an inline gradient. Reuse existing classes: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.badge`, `.badge-high/mid/low`.
- **Gemini calls:** every existing route follows the same pattern — build a hardcoded `default*` fallback string/object first, wrap the real call in `runWithRetry(fn, 3, 1500, fallback)` (from `src/utils/geminiRetry.ts`), and catch-log-return-fallback on any error. **Match this pattern exactly** for any new Gemini call you add. Never let a route throw a 500 because Gemini failed.
- **No markdown in Gemini output.** Every existing system instruction includes a line like `Do not use any markdown characters like double asterisks (**) or headers (###)`. Copy this convention into any new prompt.
- **Determinism boundary:** numbers (priority scores, budget totals, beneficiary counts) come from plain TypeScript functions, never from a Gemini JSON response. Gemini only writes prose (`reasoning`, `rationale`, `explanation`, `whyFits`). Do not violate this in any new engine you write.
- **Firestore collections in play** (confirmed via `firestore.rules`): `users`, `issues`, `suggestions`, `clusters`, `recommendations`, `developmentPlans`, `activities`, `zonePredictions`, `notifications`, `analytics`. You will add `proposals` in T9 — remember to add its rule block.
- **Commit after every task.** Small, reviewable diffs. Suggested message given per task.
- **Never delete a file before its replacement is verified working.** Where a task says "delete X", that step comes only after the acceptance criteria for the replacement have passed.

---

## T1 — Fix the recommendation data-contract bug

### Objective
`src/utils/aiPlanningService.ts`'s `compareDemandAndPlan()` writes recommendation docs with fields `clusterId, theme, recommendation, explanation, supportingEvidence, confidenceScore, priorityScore`. Three consumers in `src/routes/mpRoutes.ts` read *different* field names (`recommendedProject`, `matchingPlanItem`, `estimatedCost`, `recommendationText`) that don't exist on those documents, so they silently fall back to generic defaults. Fix the writer to also emit the fields the readers expect, so the copilot, executive brief, and budget planner start reflecting real per-cluster data.

### Preconditions
None — this is the first code change.

### Exact steps
1. Open `src/utils/aiPlanningService.ts`, locate `compareDemandAndPlan()` (Gemini-path prompt around line 786–795, and the programmatic fallback around line 826–871).
2. In **both** the Gemini JSON schema (the `Array<{...}>` shape described in the prompt string) and the programmatic fallback object literal, add these fields so every recommendation doc carries both the old and new field names:
   - `recommendedProject: string` — the concrete project name (e.g. `"Primary Health Centre — ${cl.theme}"` in the fallback path; ask Gemini for it explicitly in the prompt path).
   - `matchingPlanItem: string` — the LDP project title it was compared against, or the literal string `"No matching LDP project found"` when `isMet` is false.
   - `estimatedCost: string` — a cost string in the same `"₹X Crore"` / `"₹X Lakhs"` format the budget-planner already parses (see `src/routes/mpRoutes.ts` lines ~331–336 for the exact parser: it looks for the literal substrings `"Crore"` and `"Lakh"`). Derive a reasonable default from `category` (e.g. Healthcare → `"₹1.5 Crore"`, Roads → `"₹0.75 Crore"`) if Gemini doesn't supply one — this must never be empty, since the budget planner currently defaults to a flat 1.0 Crore for every project when it's missing, which is exactly the bug you're fixing.
   - `recommendationText: string` — alias/copy of `explanation`.
   - `category: string` and `relatedIds: string[]` — copy these through from the source `cluster` object (`cl.category`, `cl.relatedIds`) so the budget planner's `r.category` and `r.relatedIds?.length` reads (lines ~340, 341, 347) also stop silently defaulting.
3. Do **not** remove the original fields (`theme`, `recommendation`, `explanation`, `supportingEvidence`, `confidenceScore`, `priorityScore`) — other code may read them; this is additive.
4. Update the Gemini prompt's requested JSON schema to include the new fields with the same descriptions as above, so Gemini populates them directly when it's available, rather than only the programmatic fallback path having real values.

### Acceptance criteria
- `npm run lint` passes.
- Manually trigger `POST /api/clusters/rebuild` then `POST /api/compare` (or click the equivalent buttons in the current `DashboardPage.tsx` Intelligence tab, which still works even though the page is unrouted — temporarily add it back to `App.tsx` routes if needed to test, then remove in T3) and inspect a `recommendations` doc in the Firestore console / emulator: it must contain non-empty `recommendedProject`, `matchingPlanItem`, `estimatedCost` (matching `/Crore|Lakh/`), `recommendationText`, `category`, `relatedIds`.
- Call `POST /api/mp/budget-planner` with `{ "budgetCrores": 5 }` and confirm `selectedProjects[].costCrores` values are no longer uniformly `1.0` and `selectedProjects[].title` values are no longer all `"Upgrade Public Space"`.

### Commit message
`fix: align recommendation doc schema with mpRoutes consumers (copilot/brief/budget-planner were silently defaulting)`

---

## T2 — Formalize the unified Civic Request model

### Objective
`issues` (categories: pothole/streetlight/waste/water) and `suggestions` (categories: Education/Healthcare/Electricity/Roads/Public Transport) already implement the Civic Operations vs. Development Intelligence split by convention. Make it explicit with a shared `type` discriminator and a shared TypeScript interface, without breaking either existing collection's current fields.

### Preconditions
T1 done.

### Exact steps
1. Create `src/types/civicRequest.ts`:
   ```ts
   export type CivicRequestType = 'CIVIC_ISSUE' | 'DEVELOPMENT_NEED';

   export interface CivicRequestBase {
     requestId: string;
     type: CivicRequestType;
     category: string;
     description: string;
     title: string;
     language?: string;          // ISO 639-1 code if known, e.g. "kn", "hi", "en"
     lat: number;
     lng: number;
     ward?: string;
     district?: string;
     state?: string;
     urgency?: 'low' | 'medium' | 'high' | 'critical';
     citizenCount?: number;      // demand signal — number of distinct citizens behind this request
     upvotes?: string[];
     createdAt: any;             // Firestore Timestamp
     status: string;             // keep as string — issues and suggestions currently use different status vocabularies, don't force-unify them yet
     source?: string;            // 'web' | 'whatsapp' | 'sms' | 'voice'
   }
   ```
2. In `src/utils/aiPlanningService.ts`, everywhere `SEED_SUGGESTIONS` objects are constructed, add `type: 'DEVELOPMENT_NEED'`.
3. In `src/pages/ReportPage.tsx`, find where the submitted document is built for each of the two `mode`s (`'suggestion'` vs. the hazard/default mode — search for where `category` is set from state around lines 66, 140–192, 225). Add `type: mode === 'suggestion' ? 'DEVELOPMENT_NEED' : 'CIVIC_ISSUE'` to the object written to Firestore in both the `issues` and `suggestions` write paths.
4. Update `firestore.rules`: no schema enforcement needed (Firestore rules here are permission-based, not schema-based, per the existing `match /issues/{issueId}` and `match /suggestions/{suggestionId}` blocks) — just confirm nothing in the existing rules blocks writing a new field. It won't; skip changes here unless you find otherwise.
5. Do **not** migrate existing documents in a live database — this task only changes what *new* writes look like. If a demo database already has seed data without `type`, treat "no type field" as `type: 'DEVELOPMENT_NEED'` for `suggestions` docs and `'CIVIC_ISSUE'` for `issues` docs at every read site that needs to branch on it (there should be very few — most existing code already branches by *collection*, not by `type`, and that's fine to leave as-is).

### Acceptance criteria
- `npm run lint` passes (the new interface compiles; nothing currently imports it strictly enough to break).
- Submit one hazard report and one development suggestion through `ReportPage.tsx`; confirm both resulting Firestore docs have the correct `type` value.

### Commit message
`feat: add explicit CIVIC_ISSUE/DEVELOPMENT_NEED type discriminator to civic request writes`

---

## T3 — Rewire the real AI cockpit into the live app (the highest-leverage task in this plan)

### Objective
`src/components/MPDecisionCockpit.tsx` is fully wired to all seven `/api/mp/*` routes and is real. It's currently unreachable because it's only rendered by `src/pages/DashboardPage.tsx`, which isn't imported in `src/App.tsx`. Meanwhile the live `/planning` route renders `src/pages/PlanningPage.tsx`, which uses four components in `src/components/decision/` that make **zero** network calls and return hardcoded string-matched responses. Replace the fake with the real one.

### Preconditions
T1, T2 done.

### Exact steps
1. **Create `src/pages/RecommendationsPage.tsx`.** Port from `src/pages/DashboardPage.tsx`:
   - State: `clusters`, `recommendations`, `ldpProjects`, `suggestions`, `clusteringLoading`, `compareLoading`, `expandedClusterId`, `ldpText`, `ldpFilename`, `uploadLoading`, `dragActive` (lines 40–52 of the current `DashboardPage.tsx`).
   - Functions, verbatim: `loadIntelligenceData` (lines 54–71), `handleRebuildClusters` (166–184), `handleCompareDemandPlan` (186–202), `handleDrag`/`handleDrop`/`handleFileSelect`/`handleUploadLDP` (204–270-ish — read the full block, it continues past what's quoted here).
   - A `useEffect(() => { loadIntelligenceData(); }, [])` on mount.
   - Render: reuse the LDP upload UI block and the `<MPDecisionCockpit clusters={clusters} recommendations={recommendations} suggestions={suggestions} ldpProjects={ldpProjects} onDataRefresh={loadIntelligenceData} />` block from `DashboardPage.tsx`. **Do not** port the `activeTab` tab-switcher, the `analytics` tab content, or the `intelligence` tab's raw cluster-list UI — this page's only job is the cockpit + the two trigger buttons (`Rebuild Clusters`, `Compare Demand vs Plan`) + the LDP upload widget, since analytics belongs on `/development` per T7.
   - Import `MPDecisionCockpit` from `'../components/MPDecisionCockpit'`.
2. **Update `src/App.tsx`:**
   - Add `const RecommendationsPage = React.lazy(() => import('./pages/RecommendationsPage'));`
   - Add `<Route path="/recommendations" element={<RecommendationsPage />} />`
   - Remove the `PlanningPage` import and its `<Route path="/planning" .../>` line.
3. **Update `src/components/Navbar.tsx`** (both the desktop link block and the mobile drawer block — there are two copies of every nav link in this file, don't miss the second one):
   - Change every `to="/planning"` to `to="/recommendations"`.
   - The label uses `t('aiPlanning')` from `LanguageContext` — leave the translation key as-is unless you also update `LanguageContext.tsx`'s copy (optional, cosmetic).
4. **Verify**, don't yet delete: run the app, go to `/recommendations`, confirm:
   - The page loads clusters/recommendations/suggestions/LDP projects from Firestore.
   - The embedded copilot chat (inside `MPDecisionCockpit`) sends a real request to `/api/mp/copilot` (check network tab) and returns an answer grounded in whatever is in `clusters`/`recommendations`/`suggestions`/`developmentPlans` — not one of the six hardcoded paragraphs from the old `DecisionCopilot.tsx`.
   - Executive brief, proposal generator, scheme matcher, budget planner, impact simulator all fire their respective `/api/mp/*` calls (check network tab for each).
5. **Now delete**, only after step 4 passes:
   - `src/pages/PlanningPage.tsx`
   - `src/components/decision/DecisionCopilot.tsx`
   - `src/components/decision/BudgetOptimizer.tsx`
   - `src/components/decision/ProposalGenerator.tsx`
   - `src/components/decision/DemandVsPlan.tsx`
   - `src/pages/DashboardPage.tsx` (its two responsibilities are now split: cockpit → `RecommendationsPage.tsx` here, analytics → `DevelopmentPage.tsx` in T7 — confirm T7 is done, or do T7 before deleting this file, if you're executing out of strict numeric order for some reason; the safe default is to leave `DashboardPage.tsx` in place until after T7).
   - Remove the now-dead `src/types/decision.ts` interfaces `EvidenceSource`, `PriorityItem`, `SchemeMatch`, `BudgetOption` **only if** nothing else imports them (`grep -rn "from '.*types/decision'" src/` first — `MPDecisionCockpit.tsx` likely still uses `CopilotMessage` and `Proposal` from this same file, so don't delete the whole file, only the unused interfaces).

### Acceptance criteria
- `npm run lint` and `npm run build` both pass.
- `/planning` route no longer exists (returns nothing / falls through — confirm no dangling links to it remain: `grep -rn "/planning" src/`).
- `/recommendations` renders the full cockpit and every one of its actions makes a real network call.
- No file in `src/components/decision/` remains.
- `grep -rn "DashboardPage" src/` returns nothing once T7 is also complete.

### Commit message
`refactor: replace hardcoded /planning decision UI with the real, backend-wired MPDecisionCockpit at /recommendations`

---

## T4 — Rename Profile → Settings

### Objective
Close the last gap between the live routes and the target IA (`Overview / Development / Map / Recommendations / Reports / Settings`) that the repo's own `02_INFORMATION_ARCHITECTURE.md` and `06_IMPLEMENTATION_SEQUENCE.md` already specified but never executed (their Step 3.2).

### Preconditions
T3 done.

### Exact steps
1. `git mv src/pages/ProfilePage.tsx src/pages/SettingsPage.tsx`; rename the default export function accordingly (`export default function SettingsPage()`).
2. In `src/App.tsx`: rename the lazy import and change `<Route path="/profile" .../>` to `<Route path="/settings" .../>`.
3. In `src/components/Navbar.tsx`: change every `to="/profile"` to `to="/settings"` (desktop block, mobile drawer block, and the avatar-link block — three occurrences).
4. `AuthContext.tsx` already exposes `userRole: 'citizen' | 'mp'` with a `setUserRole` toggle persisted to `localStorage('civicpulse_user_role')`. Confirm `SettingsPage.tsx` still renders whatever UI it had for switching this (it should already exist since `ProfilePage.tsx` presumably used `useAuth()` — verify, don't assume; read the file before deciding there's nothing to change here).

### Acceptance criteria
- `npm run build` passes.
- `/settings` renders what `/profile` used to render, `/profile` no longer exists as a route.
- Role switch still works and still persists across reload.

### Commit message
`refactor: rename /profile route and page to /settings per existing IA spec`

---

## T5 — Reweight the Priority Engine to match the governance-challenge formula (optional but cheap; do it for scoring transparency)

### Objective
`computePriorityScore()` in `src/utils/aiPlanningService.ts` already does deterministic weighted scoring (demand 30% / gap 25% / population 20% / engagement 15% / confidence 10%). Make the weights match the standard governance-challenge framing (demand 25% / gap 25% / population impact 20% / accessibility 10% / urgency 10% / investment gap 10%) and make them named/configurable rather than magic numbers, so the reasoning is auditable.

### Preconditions
T1 done. Independent of T2–T4.

### Exact steps
1. In `computePriorityScore()`, replace the `weights` object with named constants at module scope:
   ```ts
   export const PRIORITY_WEIGHTS = {
     demand: 0.25,
     infrastructureGap: 0.25,
     populationImpact: 0.20,
     accessibilityGap: 0.10,
     urgency: 0.10,
     investmentGap: 0.10,
   } as const;
   ```
2. You currently have 5 components (`demand, gap, population, engagement/recurrence, confidence`) but the target formula has 6 (`demand, gap, population, accessibility, urgency, investmentGap`). Don't just relabel — decide the mapping explicitly and document it in a comment above the function:
   - `demand` ← unchanged (submission count volume).
   - `infrastructureGap` ← unchanged (distance-to-facility based).
   - `populationImpact` ← unchanged (density based).
   - `accessibilityGap` (new) ← reuse the same distance metric as `infrastructureGap` but as a *relative* measure (e.g. distance ÷ ward average distance) if you have ward-average data available; if not, it's acceptable for `accessibilityGap` to equal `infrastructureGap` for now — comment this explicitly (`// TODO: differentiate from raw gap once ward-level accessibility baselines exist`) rather than silently duplicating it.
   - `urgency` (new) ← derive from the existing `urgency` field on the civic request (T2's schema) if present, defaulting to a mid-value (e.g. 50) when absent; do **not** repurpose the old `engagementScore`/upvotes metric for this — upvotes measure *demand recurrence*, not urgency, and conflating them defeats the point of having six distinct components.
   - `investmentGap` (new) ← compare `cluster.priorityScore`'s category against `developmentPlans` budget already allocated to that category/ward (0 existing investment → high investment-gap score; substantial existing LDP investment in the same category/ward → low score). This requires the caller to pass in `ldpProjects` for the relevant ward, so update the function signature to `computePriorityScore(cluster, suggestionsInCluster, ldpProjectsForWard: any[] = [])` and update the one call site in `rebuildClusters()` to pass a filtered slice of `developmentPlans` by ward/category.
   - The old `engagementScore` (upvotes) — fold it into `demand` (upvotes are a demand-intensity signal) rather than dropping it: `demandScore` can become `Math.min(100, count * 20 + totalUpvotes * 4)` or similar — pick something reasonable and comment your reasoning; exact constants are your judgment call as long as the shape (submission volume + engagement both push demand up, capped at 100) is preserved.
3. Update the `reasoning` string template to mention all six named components, not the old five.
4. Keep the return shape backward compatible: `{ overall, components: { demand, gap, population, accessibility, urgency, investmentGap }, reasoning, confidence }` — but be aware `MPDecisionCockpit.tsx` or other consumers may read `scoreObj.components.engagement` or `.confidence` by the old key names; `grep -rn "\.components\." src/` before finalizing and update every read site to the new key names in the same commit.

### Acceptance criteria
- `npm run lint` passes with every `.components.<oldKey>` reference updated.
- Rebuild clusters against seed data; confirm `priorityScore` values are still in a sane 0–100 range and don't all collapse to the same number (sanity check against at least 3 different clusters).

### Commit message
`refactor: align priority engine weights and components with the governance-challenge 6-factor formula`

---

## T6 — Alchemyst integration, scoped to Scheme Matching

### Objective
Of the seven `/api/mp/*` engines, six are already either fully deterministic or grounded in real Firestore data before calling Gemini. The one exception is `/api/mp/scheme-matcher`, which is pure Gemini general-knowledge guessing with a 2-scheme hardcoded fallback. This is the one place Alchemyst adds real value in Phase 1: ground scheme suggestions in actual scheme-eligibility text instead of Gemini's training-data recall.

**Verified SDK details** (pulled from the published `@alchemystai/sdk` v0.11.1 package on npm — do not invent different method names):
```ts
import AlchemystAI from '@alchemystai/sdk';
const client = new AlchemystAI({ apiKey: process.env.ALCHEMYST_AI_API_KEY });

// Ingest a document:
await client.v1.context.add({
  context_type: 'resource',        // 'resource' | 'conversation' | 'instruction'
  documents: [{ content: '...text of the scheme document...' }],
  scope: 'internal',                // 'internal' | 'external'
  source: 'civicpulse.schemes.amrut',
  metadata: { fileName: 'amrut_guidelines.txt', fileType: 'text/plain' },
});
// → { context_id: string, success: boolean, processed_documents?: number }

// Retrieve relevant context:
await client.v1.context.search({
  query: 'healthcare facility construction funding scheme',
  similarity_threshold: 0.8,
  minimum_similarity_threshold: 0.5,
  scope: 'internal',
});
// → { contexts?: [{ content?: string, score?: number, createdAt?, updatedAt?, metadata?: unknown }] }
```

### Preconditions
T1 done. Independent of T2–T5.

### Exact steps
1. `npm install @alchemystai/sdk`
2. Add `ALCHEMYST_AI_API_KEY="your-key-here"` to `.env.example` and `.env`.
3. Create `src/data/schemeDocuments.ts` — a hand-curated array of real (not Gemini-invented) government scheme eligibility texts to seed Alchemyst with. At minimum include AMRUT, PM-GSY, Swachh Bharat Mission (Urban), Samagra Shiksha, and National Health Mission — the same schemes already name-dropped in `mpRoutes.ts`'s existing prompts, so you're grounding what the app already claims to know about, not inventing new scope. Each entry:
   ```ts
   export interface SchemeDocument {
     id: string;            // e.g. 'amrut'
     name: string;           // full official name
     content: string;        // 2–4 paragraphs: purpose, eligible project types, funding ratio, eligibility criteria — real text, cite the source you pulled it from in a code comment
   }
   export const SCHEME_DOCUMENTS: SchemeDocument[] = [ /* ... */ ];
   ```
   This is real research work — pull actual guideline text from official scheme pages, don't fabricate funding ratios. If you can't verify a number, write "verify exact funding ratio against current scheme guidelines" in the content rather than guessing.
4. Create `src/services/alchemystContext.ts`:
   ```ts
   import AlchemystAI from '@alchemystai/sdk';
   import { SCHEME_DOCUMENTS } from '../data/schemeDocuments';

   const apiKey = process.env.ALCHEMYST_AI_API_KEY;
   export const alchemyst = apiKey ? new AlchemystAI({ apiKey }) : null;

   /** Idempotent one-time ingestion — call from a setup script, not on every request. */
   export async function ingestSchemeDocuments() {
     if (!alchemyst) {
       console.warn('[Alchemyst] No API key configured — scheme retrieval will fall back to ungrounded Gemini.');
       return { success: false };
     }
     for (const doc of SCHEME_DOCUMENTS) {
       await alchemyst.v1.context.add({
         context_type: 'resource',
         documents: [{ content: doc.content }],
         scope: 'internal',
         source: `civicpulse.schemes.${doc.id}`,
         metadata: { fileName: `${doc.id}.txt`, fileType: 'text/plain' },
       });
     }
     return { success: true, count: SCHEME_DOCUMENTS.length };
   }

   /** Real-time retrieval for a given recommendation. Returns [] on any failure — never throws. */
   export async function retrieveSchemeContext(query: string): Promise<string[]> {
     if (!alchemyst) return [];
     try {
       const res = await alchemyst.v1.context.search({
         query,
         similarity_threshold: 0.75,
         minimum_similarity_threshold: 0.4,
         scope: 'internal',
       });
       return (res.contexts ?? []).map(c => c.content).filter((c): c is string => !!c);
     } catch (err) {
       console.error('[Alchemyst] search failed, falling back to ungrounded scheme matching:', err);
       return [];
     }
   }
   ```
5. Add a one-off seed route in `server.ts` (co-locate near the existing `/api/seed` route): `app.post("/api/seed-schemes", async (req, res) => { const result = await ingestSchemeDocuments(); res.json(result); })`. This mirrors the existing `seedSuggestionsIfEmpty` pattern — a manually-triggered idempotent seed, not something that runs on every boot.
6. **Modify `src/routes/mpRoutes.ts`'s `/scheme-matcher` handler** (currently lines ~250–318): before building the Gemini prompt, call `retrieveSchemeContext(`${recommendation.recommendedProject} ${recommendation.category}`)`. If it returns non-empty results, prepend them to the prompt as a new section:
   ```
   VERIFIED SCHEME DOCUMENTS (use these as your primary source — cite specifics from them):
   ${retrievedContexts.join('\n---\n')}
   ```
   Keep the existing `defaultSchemes` fallback and the existing `if (!ai)` early return exactly as they are — this task only changes what goes *into* the Gemini prompt when Gemini is available, it does not change the failure-handling shape of the route. If `retrieveSchemeContext` returns `[]` (no API key, or no match), the route must behave exactly as it does today — ungrounded Gemini guess with the same fallback. This is required for the AI-failure-handling validation in T11 to keep passing.

### Acceptance criteria
- `npm run lint` and `npm run build` pass.
- `POST /api/seed-schemes` succeeds once `ALCHEMYST_AI_API_KEY` is set, and `processed_documents`/`count` matches `SCHEME_DOCUMENTS.length`.
- Call `/api/mp/scheme-matcher` with a healthcare recommendation; with Alchemyst configured, at least one returned scheme's `whyFits` text should reference specifics that only appear in your seeded `schemeDocuments.ts` content (not just the scheme's name, which Gemini would know anyway) — this proves grounding is actually happening, not just present in the code.
- Unset `ALCHEMYST_AI_API_KEY` and confirm `/scheme-matcher` still returns a valid response (ungrounded fallback path) without throwing.

### Commit message
`feat: ground /api/mp/scheme-matcher in real scheme documents via Alchemyst context retrieval`

---

## T7 — Development Analytics page

### Objective
Per `01_PRODUCT_AUDIT.md`'s own (already-written, not-yet-executed) recommendation: merge `DashboardPage.tsx`'s analytics tab content into `DevelopmentPage.tsx`, so nothing is lost when `DashboardPage.tsx` is deleted at the end of T3.

### Preconditions
T3 done through step 4 (verification), before its final deletion step.

### Exact steps
1. Read the full current `src/pages/DevelopmentPage.tsx` (502 lines) before changing it — do not assume what's already there.
2. Read `DashboardPage.tsx`'s `analytics` tab JSX block and its supporting state (`healthScore`, `stats`, `areaSummary`, `categoryCounts`, `leaderboard`, `resolutions`) and the `loadDashboardData` function (lines ~73–164).
3. Port whichever of these charts/widgets aren't already present in `DevelopmentPage.tsx` into it — check for duplication first; if `DevelopmentPage.tsx` already has category breakdown charts (likely, per `01_PRODUCT_AUDIT.md`'s description of the target page), only port what's genuinely missing (e.g. the leaderboard, the resolved-issues feed, the health score if not already shown).
4. Now it's safe to complete T3's final deletion step (`DashboardPage.tsx`).

### Acceptance criteria
- `/development` shows category breakdown, ward standings, LDP directory (per `02_INFORMATION_ARCHITECTURE.md`'s spec for this page) plus whatever was uniquely valuable from the old analytics tab.
- No `grep -rn "DashboardPage" src/` hits remain anywhere in the codebase.

### Commit message
`refactor: absorb DashboardPage analytics into DevelopmentPage, complete DashboardPage removal`

---

## T8 — Multilingual intake verification & hardening

### Objective
`server.ts` already has `/api/agents/clean-voice`, and `ReportPage.tsx` already has a Kannada/Hindi voice-transcript preset flow per the README's claims. Verify this actually works end-to-end and harden the language-detection step, rather than assuming it's complete.

### Preconditions
None — independent, can run in parallel with T5–T7.

### Exact steps
1. Read `/api/agents/clean-voice`'s full handler in `server.ts` (search for the route, read its Gemini prompt) and `ReportPage.tsx`'s voice-preset UI (search for "Kannada" / "Hindi" / preset-related state).
2. Confirm the pipeline matches your target: `Citizen Voice/Text → Language Detection → Speech-to-Text → Translation/Normalization → Intent Detection → Entity Extraction → Location Extraction → type (CIVIC_ISSUE/DEVELOPMENT_NEED) → Structured Civic Request`. Identify which of these 7 sub-steps are real vs. simulated (the README calls this a "conversational voice-cleanup system" processing "rough, transcribed audio inputs" — that implies speech-to-text itself happens client-side or via a preset transcript, with Gemini only doing cleanup+translation+structuring; confirm this by reading the code, don't assume).
3. If speech-to-text is not actually implemented (only pre-canned transcripts are "cleaned"), that's acceptable for a hackathon demo — document it plainly in `README.md`'s architecture section (T12) rather than overclaiming, per your own principle that Gemini should never be credited with capabilities it doesn't have in the running system.
4. Ensure the cleaned/translated output includes the `type` field from T2 — if `/api/agents/clean-voice` returns a structured object without inferring `CIVIC_ISSUE` vs `DEVELOPMENT_NEED`, add that inference to its Gemini prompt (ask it to classify using the same two categories, with the category examples from your master spec: "pothole" style complaints → `CIVIC_ISSUE`; "no hospital within 30km" style requests → `DEVELOPMENT_NEED`).

### Acceptance criteria
- Submit at least one preset voice transcript in a non-English language through `ReportPage.tsx` and confirm the resulting Firestore doc has a correctly-inferred `type`, a cleaned English `description`, and the original `language` code preserved.
- `README.md` accurately describes what is and isn't implemented here (finalized in T12, but note discrepancies now).

### Commit message
`feat: classify CIVIC_ISSUE vs DEVELOPMENT_NEED during voice/text intake cleanup`

---

## T9 — Government decision lifecycle (Proposal → Approval → Funding → Execution → Verification → Completion)

### Objective
Nothing in the current codebase models a project's lifecycle after a proposal is generated — `generate-proposal` produces text but nothing persists a trackable state machine. Build the minimum real version of this.

### Preconditions
T1–T3 done (this depends on the recommendation schema from T1 and the live `/recommendations` page from T3 to attach a "Create Proposal" action to).

### Exact steps
1. **Data model** — new Firestore collection `proposals`:
   ```ts
   export type ProposalStatus =
     | 'draft' | 'submitted' | 'approved' | 'funded'
     | 'in_execution' | 'verified' | 'completed' | 'rejected';

   export interface Proposal {
     id: string;
     recommendationId: string;      // FK → recommendations/{id}
     title: string;
     status: ProposalStatus;
     statusHistory: { status: ProposalStatus; changedAt: any; changedBy?: string; note?: string }[];
     proposalText: string;          // output of /api/mp/generate-proposal
     estimatedCost: string;
     matchedScheme?: string;        // from scheme-matcher, once run
     createdAt: any;
     updatedAt: any;
   }
   ```
   Put this interface in `src/types/proposal.ts`.
2. **`firestore.rules`**: add a `match /proposals/{proposalId} { ... }` block modeled on the existing `recommendations` block (read: public/authenticated per whatever pattern `recommendations` uses today — check it first; write: `requireAuth`-gated, matching the pattern the Express layer already uses for AI routes, i.e. writes happen server-side via the Admin SDK, not directly from the client, so this rule block should likely deny direct client writes entirely and rely on `firebaseAdmin` server-side writes, consistent with how `clusters`/`recommendations` are already written only from `aiPlanningService.ts`, not from client code — verify this pattern before writing the rule).
3. **Backend** — new `src/routes/lifecycleRoutes.ts`, mounted in `server.ts` the same way `mpRouter` is (lazy-imported under a path prefix, e.g. `/api/lifecycle`, matching the existing `app.use("/api/mp", ...)` pattern at the bottom of `server.ts`):
   - `POST /api/lifecycle/proposals` — body `{ recommendationId }`. Loads the recommendation doc, calls the existing `generate-proposal` logic (reuse, don't duplicate — extract the prompt-building logic from `mpRoutes.ts`'s `/generate-proposal` handler into a shared function in `aiPlanningService.ts` if it isn't already factored out, and call that same function here) to produce `proposalText`, creates a `proposals` doc with `status: 'draft'`.
   - `PATCH /api/lifecycle/proposals/:id/status` — body `{ status, note? }`. Validates the transition is forward-only through the enum order above (reject e.g. `completed → draft`; allow `rejected` from any pre-`completed` state). Appends to `statusHistory`. This is the deterministic state machine — no Gemini involved at all.
   - `GET /api/lifecycle/proposals` — list, optionally filtered by `?status=`.
4. **Frontend** — extend `RecommendationsPage.tsx` (from T3) with a "Create Proposal" button next to each recommendation shown inside `MPDecisionCockpit` (check whether `MPDecisionCockpit.tsx` already has a proposal-drawer UI from `/generate-proposal` — likely yes, since that route already exists and is wired; if so, add a "Track this Proposal" button there that calls `POST /api/lifecycle/proposals` and then links to a new detail view rather than building a whole new proposal-list page from scratch).
5. **Frontend** — new `src/pages/ProposalDetailPage.tsx`, modeled on the existing `IssueDetailPage.tsx` pattern (read that file first for the conventions it uses — params via `useParams`, Firestore doc subscription, status badge styling via the `.badge-high/mid/low` classes from `index.css`). Shows the proposal text, current status, status history timeline, and (for `mp` role only, via `useAuth().userRole`) buttons to advance status.
6. Add route `/proposal/:id` in `App.tsx`.

### Acceptance criteria
- `npm run lint` and `npm run build` pass.
- Creating a proposal from a recommendation produces a real Firestore doc with real `proposalText` (not a placeholder).
- Status transitions are rejected when out of order (test: try to PATCH a `draft` proposal directly to `completed` and confirm the API returns an error, not a silent success).
- `/proposal/:id` renders and reflects live status.

### Commit message
`feat: add project/proposal lifecycle (draft→submitted→approved→funded→in_execution→verified→completed) with deterministic status transitions`

---

## T10 — Deterministic demo mode

### Objective
Guarantee one specific, repeatable end-to-end walkthrough — the healthcare-gap scenario referenced throughout the master spec — works every single time regardless of Gemini availability, using the existing `SEED_SUGGESTIONS` as the foundation.

### Preconditions
T1, T3, T5 (if done), T6, T9 all done — this task exercises the whole pipeline.

### Exact steps
1. Audit `SEED_SUGGESTIONS` in `aiPlanningService.ts`: confirm there is a clear healthcare-demand cluster (there already appears to be — multiple Koramangala/HSR healthcare-category entries per the data read during repo inspection). If the seed data is thin for this scenario, add 2–4 more healthcare-category seed entries in a ward with **no** matching `developmentPlans` entry, so `compareDemandAndPlan()`'s programmatic fallback deterministically produces a `GAP DETECTED` or `IMMEDIATE ESCALATION` recommendation for it without depending on Gemini's clustering being available.
2. Write a script `scripts/runDemoScenario.ts` (or a temporary `/api/demo/healthcare-scenario` POST route if you prefer not to add a script runner) that, in order, calls: `seedSuggestionsIfEmpty` → `rebuildClusters` → `compareDemandAndPlan` → `/api/mp/budget-planner` (₹5 Crore) → `/api/mp/scheme-matcher` on the resulting top recommendation → `POST /api/lifecycle/proposals` for it. Log each stage's output.
3. Run this script **twice**: once with `GEMINI_API_KEY` unset (forces every programmatic/fallback path) and once with it set. Both runs must complete without throwing and must both surface the healthcare gap as a top-priority item — the specific prose will differ, the presence and ranking of the finding must not.
4. Document the script's existence and how to run it in `README.md` (finalized in T12).

### Acceptance criteria
- Both runs (Gemini on/off) complete end-to-end without an unhandled exception.
- In both runs, the healthcare cluster you seeded appears in the top 3 by `priorityScore` and produces a non-"PROCEED AS PLANNED" recommendation.
- A `proposals` doc exists at the end of each run with `status: 'draft'` and non-empty `proposalText`.

### Commit message
`feat: add scripted, Gemini-independent end-to-end healthcare demo scenario`

---

## T11 — Full validation pass

### Objective
Run every check across the whole diff before polish, so T12 doesn't get blamed for regressions introduced earlier.

### Preconditions
T1–T10 done.

### Steps (all must pass)
1. `npm run lint`
2. `npm run build`
3. `npm run start` against the production build — confirm it boots and serves.
4. Route check: visit `/`, `/development`, `/map`, `/recommendations`, `/report`, `/settings`, `/issue/:id` (with a real id), `/proposal/:id` (with a real id from T9). Confirm no route 404s and no console errors on any of them.
5. `grep -rn "/planning\|DashboardPage\|ProfilePage" src/` — must return nothing (all renamed/removed in T3/T4/T7).
6. AI-failure-handling check: unset `GEMINI_API_KEY`, restart, and hit every one of the seven `/api/mp/*` routes plus `/scheme-matcher`'s Alchemyst path — confirm every single one returns its documented fallback instead of a 500.
7. RBAC/persona check: toggle `userRole` between `citizen` and `mp` in Settings, confirm the nav/visible actions differ appropriately (per `05_PAGE_HIERARCHY.md`'s intent) — if this isn't actually implemented anywhere in the current UI beyond the toggle itself existing in `AuthContext.tsx`, that's a real gap; note it rather than assuming it's covered, and either implement basic route/section gating by `userRole` here or explicitly log it as a known limitation for T12's documentation.
8. Data flow check: submit one `CIVIC_ISSUE` and one `DEVELOPMENT_NEED` via `/report`, confirm both carry the `type` field (T2) and that `DEVELOPMENT_NEED` entries feed into a cluster on the next `rebuildClusters()` call.
9. Re-run T10's demo script one more time against the final state of the branch.

### Acceptance criteria
All 9 checks pass. If any fails, fix it and re-run the full list before proceeding — do not proceed to T12 with a known-broken check.

---

## T12 — Documentation & positioning polish

### Objective
Bring `README.md` and the repo's own `01–06` audit docs in line with what's actually built, per your master spec's Section 6/48/50.

### Preconditions
T11 fully passed.

### Steps
1. Rewrite `README.md`:
   - New title/framing: **CivicPulse — Citizen Demand & Infrastructure Intelligence Platform**, not "Bangalore Municipal Ward Infrastructure Ledger."
   - Keep the Bangalore-specific hazard-reporting feature set (potholes, streetlights, BBMP escalation, gamification) as a documented **Civic Operations** subsystem, not the headline.
   - Add a new top-level section describing the **Development Intelligence** pipeline: Demand Aggregation → Hotspot Detection → Priority Engine (name the 6-factor formula from T5 explicitly) → Recommendation Engine → Budget Optimizer → Scheme Matcher (note the Alchemyst grounding from T6) → Proposal Generator → Lifecycle Tracking (T9).
   - Correct the stated tech stack: React 19 (not 18), and add `@alchemystai/sdk`.
   - Add the demo-script instructions from T10.
   - Note any real limitations found in T11 step 7 rather than glossing over them.
2. Update `01_PRODUCT_AUDIT.md` → `06_IMPLEMENTATION_SEQUENCE.md`: these predate this plan and are now partially stale (they don't know about `PlanningPage.tsx`'s existence, the orphaned-`DashboardPage` situation, or Alchemyst). Either mark them explicitly as superseded by this document with a one-line pointer at the top of each, or update them to reflect final state — superseding is faster and lower-risk than rewriting five docs to stay in sync going forward.
3. Add an architecture diagram (ASCII is fine, matching the style already used in this plan and in the master spec) to `README.md` showing the final Firestore / Deterministic Engines / Alchemyst / Gemini / React layering, annotated with what's real (not aspirational) as of this commit.

### Acceptance criteria
- A reader of `README.md` alone, with no other context, can correctly describe what CivicPulse does, its two subsystems, and how to run the demo script — without needing to read the code first.
- No remaining reference anywhere in `README.md` to features that T11 discovered aren't actually implemented.

### Commit message
`docs: reposition README around Citizen Demand & Infrastructure Intelligence, document final architecture`

---

## Definition of Done

The project is complete when, from a clean clone:
1. `npm install && npm run dev` boots with no errors.
2. All six nav routes (`Overview / Development / Map / Recommendations / Reports / Settings`) work and none of them render fake/hardcoded AI output — every AI-labeled UI element traces to a real `/api/*` call.
3. The recommendation data-contract bug (T1) is fixed and verified.
4. Citizen requests carry an explicit `CIVIC_ISSUE` / `DEVELOPMENT_NEED` type (T2).
5. The Priority Engine's weights and components are named, documented, and match the governance-challenge formula (T5).
6. Scheme Matching is grounded in real documents via Alchemyst, with a verified graceful fallback when Alchemyst/Gemini are unavailable (T6).
7. A proposal can be created from a recommendation and moved through a real, order-enforced status lifecycle (T9).
8. The healthcare demo scenario (T10) runs deterministically end-to-end with or without `GEMINI_API_KEY` set.
9. All checks in T11 pass on the final commit.
10. `README.md` accurately describes the system as built (T12).

If any item above is false, the project is not done — return to the corresponding task.

---

## 🚀 Phase 2 Differentiation Sprint (N1–N12) — COMPLETE

All 12 differentiation sprint deliverables have been implemented and verified:
* **N1 — Tiered Sovereign Intelligence**: Gemma 3n on-device via Ollama with deterministic regex keyword fallback and cloud Gemini escalation.
* **N2 — VoicERA / BHASHINI Gateway**: Sovereign voice routing for regional vernacular inputs.
* **N3 — DBSCAN Geospatial Clustering**: Epsilon=2.5km / minPoints=2 density clustering with Haversine distance projection.
* **N4 — Country Adapter Pattern**: Configurable support for India (`IN`) and South Africa (`ZA`).
* **N5 — Census 2011 & SECC Demographic Grounding**: Ward-level population density and BPL grounding for 6-factor priority engine.
* **N6 — DPI Impact Scoring Engine**: 4-pillar index covering Aadhaar, UPI, DigiLocker, CoWIN, and Smart ID.
* **N7 — Feature Phone Inclusion (*384# USSD / IVR)**: Retro 2G handset simulation page with direct Firestore ticket persistence.
* **N8 — Government-Grade Explainability & PDF Brief**: Automated evidence chain assembly and printable executive dossier.
* **N9 — DPG Standard Compliance Table**: Full mapping against all 9 DPGA indicators in `DPG_COMPLIANCE.md`.
* **N10 — Ethics & Misuse Safeguards**: Comprehensive defenses in `ETHICS.md`.
* **N11 — Full Validation Pass**: `npm run lint`, `npm run build`, and `scripts/runDemoScenario.ts` passing.
* **N12 — Documentation Polish**: Updated `README.md` and architecture specifications.
