# 01 - Product Audit: CivicPulse AI

> **NOTE: This audit document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

This document provides a comprehensive audit of all pages, routes, components, and interactive widgets in the current CivicPulse codebase. Each entry has been carefully classified into **KEEP**, **MODIFY**, **MERGE**, or **REMOVE** based on its alignment with a production-grade AI Constituency Intelligence Platform suitable for daily use by Members of Parliament (MPs) and government officials.

---

## 1. Page Audit & Routing Matrix

### `src/pages/HomePage.tsx`
*   **Classification:** **MODIFY**
*   **Rationale:** Currently functions like a marketing landing page (with features, large hero slogans, onboarding modals, and secondary statistics). It must be redesigned to act as an operational **Executive Overview Dashboard** for the MP, centering high-priority development needs, recent citizen distress signals, and rapid operational actions.
*   **File Reference:** `/src/pages/HomePage.tsx`

### `src/pages/MapPage.tsx`
*   **Classification:** **KEEP**
*   **Rationale:** The center-piece of the application. Visualizes high-density public demand hotspots, development plans, and citizen reports. It answers the critical spatial questions: *Where should development happen?* and *Why?*
*   **File Reference:** `/src/pages/MapPage.tsx`

### `src/pages/ReportPage.tsx`
*   **Classification:** **MODIFY**
*   **Rationale:** Essential for citizen/officer intake, but the UI mixes multi-step reporting, multilingual audio simulation, and verification. It needs to be simplified into a dedicated intake form that feeds directly into the AI classification pipeline.
*   **File Reference:** `/src/pages/ReportPage.tsx`

### `src/pages/DashboardPage.tsx`
*   **Classification:** **MERGE**
*   **Rationale:** Contains standard statistical widgets, category breakdowns, and overall status charts. These analytical metrics must be merged into the main **Overview Page** or a dedicated **Development Analytics** view to prevent duplicate dashboard metrics.
*   **File Reference:** `/src/pages/DashboardPage.tsx`

### `src/pages/InsightsPage.tsx`
*   **Classification:** **REMOVE**
*   **Rationale:** Contains separate "Insights Analyst" text fields and sandbox queries that add unnecessary complexity. Advanced strategic insights, planning recommendations, and Scheme Matchers are already handled by the MP Decision Cockpit, making this page redundant.
*   **File Reference:** `/src/pages/InsightsPage.tsx`

### `src/pages/IssueDetailPage.tsx`
*   **Classification:** **KEEP**
*   **Rationale:** Critical detail view for single-hazard tracking, evidence verification, and showing before/after status. Grounding of local development actions depends on this page.
*   **File Reference:** `/src/pages/IssueDetailPage.tsx`

### `src/pages/ProfilePage.tsx`
*   **Classification:** **MODIFY**
*   **Rationale:** Currently functions as a simple profile page. It should be refactored into a **Settings & Role Management** center, allowing easy toggling of user roles (MP, Citizen, Ward Officer) to view the application under simulated clearances.
*   **File Reference:** `/src/pages/ProfilePage.tsx`

---

## 2. Component & Widget Audit

### `src/components/MPDecisionCockpit.tsx`
*   **Classification:** **KEEP**
*   **Rationale:** The operational brain of the MP's workflow. Houses the AI Copilot chat system, the Knapsack Budget Planner, the Executive Briefing Compiler, and the Proposal document drafting window. It directly supports active strategic decision-making.
*   **File Reference:** `/src/components/MPDecisionCockpit.tsx`

### `src/components/OnboardingModal.tsx`
*   **Classification:** **REMOVE**
*   **Rationale:** Unnecessary helper pop-up that distracts from the core operational dashboard. Product information is self-evident in a well-structured production layout.
*   **File Reference:** `/src/components/OnboardingModal.tsx`

### `src/components/Navbar.tsx`
*   **Classification:** **MODIFY**
*   **Rationale:** Needs update to map to the new structured navigation tabs: Overview, Development, Map, Recommendations, Reports, Settings.
*   **File Reference:** `/src/components/Navbar.tsx`

### `src/components/Skeleton.tsx`
*   **Classification:** **KEEP**
*   **Rationale:** Critical for providing high-fidelity loading shimmers during server-side API calls (Gemini briefs, database collections).
*   **File Reference:** `/src/components/Skeleton.tsx`

---

## 3. Server-Side Route Audit (`/src/routes/mpRoutes.ts`)

*   `/api/copilot` → **KEEP**: Grounded QA engine for MP decision-making.
*   `/api/executive-brief` → **KEEP**: Renders live briefs to the homepage/overview.
*   `/api/generate-proposal` → **KEEP**: Auto-creates draft PDFs/documents for LDP alignment.
*   `/api/scheme-matcher` → **KEEP**: Ties citizen demand to national welfare schemes.
*   `/api/budget-planner` → **KEEP**: Knapsack optimizer for budget constraints.
*   `/api/impact-simulator` → **MODIFY**: Relies on solid physical parameters. Needs to be presented alongside proposals to support funding decisions.
*   `/api/whatsapp-sms-submit` → **KEEP**: The primary entry-point for real unstructured citizen data.
