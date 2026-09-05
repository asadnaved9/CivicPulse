# 06 - Architectural Implementation Sequence

> **NOTE: This document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

This document outlines the systematic, phased timeline to execute the product restructure. By decoupling presentation files from backend business logic, we guarantee that the transition to a production-grade interface will not break any existing database collections or Gemini AI integrations.

---

## Phase 1: Context & Routing Foundation (Safe-Setup)

### Step 1.1: Standardize Global Style Tokens
*   **Target File:** `/src/index.css`
*   **Action:** Replace any remaining inline colors and hardcoded purple/pink hex markers. Establish CSS custom properties `--primary`, `--bg`, `--surface-1`, `--border` as specified in the Component Audit.

### Step 1.2: Refactor Navigation Shell
*   **Target File:** `/src/components/Navbar.tsx` & `/src/App.tsx`
*   **Action:** Set up the six target routes `/`, `/development`, `/map`, `/recommendations`, `/report`, `/settings` using React Lazy imports. Keep existing pages alive in intermediate states to prevent component compile breaks.

### Step 1.3: Update Authentication Personas
*   **Target File:** `/src/contexts/AuthContext.tsx`
*   **Action:** Add `userRole` (`MP`, `Ward Officer`, `Citizen`) into state, defaulting to `MP` so existing reviewers continue to land on the comprehensive cockpit.

---

## Phase 2: Core Layout Reconstruct (Visual Restructure)

### Step 2.1: Redesign the Homepage (`/` Overview)
*   **Target File:** `/src/pages/HomePage.tsx`
*   **Action:** Complete rewrite of the homepage. Remove onboarding overlays, feature boxes, and duplicate statistics. Wire the main container to consume the `/api/executive-brief` briefing, render key KPI metrics, and display a minimal feed of incoming citizen suggestions.

### Step 2.2: Build the Recommendations Tab (`/recommendations`)
*   **Target File:** Create `/src/pages/RecommendationsPage.tsx`
*   **Action:** Port the entire `MPDecisionCockpit.tsx` module directly into this view. This cleanly separates high-value planning tools from the home overview, making it a dedicated strategic interface.

### Step 2.3: Build the Development Analytics View (`/development`)
*   **Target File:** Create `/src/pages/DevelopmentPage.tsx`
*   **Action:** Merge the existing analytical charts from `/src/pages/DashboardPage.tsx` and the Local Development Plan table together into a unified statistics panel.

---

## Phase 3: Map Centerpiece Optimization (Visual Polish)

### Step 3.1: Clean Map Theme Overlay
*   **Target File:** `/src/pages/MapPage.tsx`
*   **Action:** Standardize the leaflet and SVG marker styling. Keep hotspots rendered in high-contrast charcoal black (`#111111`) with clean concentric pulse concentric rings.

### Step 3.2: Refactor Profile to Settings (`/settings`)
*   **Target File:** Rename `/src/pages/ProfilePage.tsx` to `/src/pages/SettingsPage.tsx`
*   **Action:** Create the persona board selector allowing testers to switch active roles instantly and view layout updates.

---

## Phase 4: Verification & Consolidation

### Step 4.1: Perform Code and Import Audits
*   **Target File:** All pages and components.
*   **Action:** Clean up dead file assets (such as `InsightsPage.tsx` and `OnboardingModal.tsx`). Remove duplicate packages or imports to optimize build payloads.

### Step 4.2: Final Compilation & Linter Verification
*   **Action:** Run standard `npm run lint` and `npm run build` verification sequences to ensure zero typescript type mismatch or bundle-splitting failures.
