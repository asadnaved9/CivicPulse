# 03 - Feature Matrix: Civic Operations vs Strategic Planning

> **NOTE: This document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

This document maps all features of CivicPulse AI to the core six-stage pipeline of the **Constituency Intelligence Workflow**. This ensures that every widget, API route, and user view directly supports an official's decision-making loop.

---

## 1. Core Constituency Workflow

```
[Citizen Input] ────────► [AI Understanding] ──────► [Evidence Aggregation]
(WhatsApp/SMS/Web)       (Translate/Categorize)       (Hotspot Clustering)
                                                               │
                                                               ▼
[MP Decision Support] ◄── [Priority Recs] ◄──────── [Development Intel]
(Cockpit/Briefs)          (Budget Knapsack/Schemes)   (Infrastructure Gaps)
```

---

## 2. Step-by-Step Functional Mapping

| Stage | Inputs / Actions | Backend Handler / Service | Frontend Components | Value Proposition |
| :--- | :--- | :--- | :--- | :--- |
| **1. Citizen Input** | Unstructured Voice messages, SMS, WhatsApp texts, geo-located images. | `/api/whatsapp-sms-submit` | `src/pages/ReportPage.tsx` | Captures raw public friction at the source without requiring complex portals. |
| **2. AI Understanding** | Translation, grammatical cleaning, category triage, department routing. | `GoogleGenAI` model (Gemini 3.5 Flash) via `mpRouter` | `src/pages/IssueDetailPage.tsx` | Converts messy multi-language noise into structured civic data records. |
| **3. Evidence Aggregation** | Spatial clustering, recurring issue frequency, priority scoring. | Firestore Collection Queries on `suggestions` and `clusters` | `src/pages/MapPage.tsx` (Charcoal Hotspots) | Filters isolated complaints into high-confidence municipal "hotspots." |
| **4. Development Intelligence** | Contrast citizen demand against existing Local Development Projects (LDP). | `/src/utils/aiPlanningService.ts` | `src/pages/DashboardPage.tsx` (Ward Standings & LDP list) | Identifies under-served neighborhoods and infrastructure coverage gaps. |
| **5. Priority Recommendations** | Budget-constrained project matching, welfare scheme alignment. | `/api/budget-planner`, `/api/scheme-matcher` | `src/components/MPDecisionCockpit.tsx` (Strategic Alignment Panel) | Recommends optimal projects and identifies state/central funding avenues. |
| **6. MP Decision Support** | One-click executive briefs, formal project proposals, copilot consultation. | `/api/executive-brief`, `/api/generate-proposal`, `/api/copilot` | `src/components/MPDecisionCockpit.tsx` (AI Brief & Copilot Panel) | Equips the MP with instant, defensible, data-backed plans for immediate action. |

---

## 3. Product Features Excluded (Pruned for High Utility)

The following features have been completely pruned as they did not support this core decision-making workflow:
*   *Onboarding Banners*: Add unnecessary visual noise; replaced with intuitive layouts.
*   *Sandbox Insights Fields*: Consolidating analytical sandbox queries directly into the grounded Copilot panel removes duplicate UI.
*   *Marketing Slogans*: Replaced with simple, minimalist administrative headlines.
