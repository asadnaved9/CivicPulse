# 02 - Information Architecture & Unified Site Map

> **NOTE: This document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

This document details the refactored, single-responsibility Information Architecture (IA) designed to replace the current hybrid marketing/sandbox structure. This navigation aligns directly with the daily operational rhythm of an MP's planning office.

---

## 1. Core Navigation Structure

The application will expose exactly six high-level tabs, accessible via a global responsive sidebar/navbar. Every screen is assigned a strict, non-overlapping responsibility.

```
                          [Global Application Shell]
                                       │
      ┌───────────────┬────────────────┼──────────────┬──────────────┐
      ▼               ▼                ▼              ▼              ▼
┌───────────┐   ┌───────────┐    ┌───────────┐  ┌───────────┐  ┌───────────┐
│  Overview │   │Development│    │    Map    │  │  Recom-   │  │ Reports & │
│           │   │           │    │           │  │ mendations│  │ Settings  │
└─────┬─────┘   └─────┬─────┘    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │               │                │              │              │
      ├─Executive     ├─Ward Stats     ├─Hotspots     ├─Copilot      ├─Intake
      ├─KPI Cards     ├─LDP Projects   ├─LDP Layers   ├─Budget-      ├─Voice
      └─Recent Feed   └─Active List    └─Filters      │ Planner      └─Role Sw.
                                                      └─Proposals
```

---

## 2. Page-by-Page Architectural Definition

### Page 1: Overview (Primary Entry Point)
*   **Path:** `/`
*   **Responsibility:** Immediate executive awareness. No marketing slogans or feature lists.
*   **Layout & Key Components:**
    *   *Good Morning Banner*: Greets the authorized user with local datetime indicators.
    *   *Constituency KPI Grid*: 4 high-contrast micro-cards displaying: (1) Total Active Demand Hotspots, (2) Resolved Infrastructure Gaps, (3) Budget Allocated, (4) Unassigned Citizen Signals.
    *   *Today's Executive Summary*: Renders the output of `/api/executive-brief` as a clean, highly readable brief.
    *   *Recent Citizen Activity stream*: Minimal feed of incoming WhatsApp/SMS submissions.

### Page 2: Development (Constituency Metrics)
*   **Path:** `/development` (Consolidated from `/dashboard` and parts of `/insights`)
*   **Responsibility:** Quantitative analytics of constituency infrastructure gaps.
*   **Layout & Key Components:**
    *   *Category Breakdown Charts*: High-fidelity Recharts visualizing Roads vs. Streetlights vs. Water distribution.
    *   *Ward-level Standings*: Heat matrix showing which wards have the highest pending infrastructure demands.
    *   *LDP Projects Directory*: Interactive table of official Local Development Plan projects, budgets, and schedules.

### Page 3: Map (Spatial Centerpiece)
*   **Path:** `/map`
*   **Responsibility:** Geopolitical and geographical decision support. Answers *Where?*
*   **Layout & Key Components:**
    *   *Full-Screen Interactive Map*: Centers on Bangalore Central.
    *   *Durable Layer Controller*: Toggles (1) Hotspots, (2) Specific Citizen Issues, (3) LDP Project Sites, and (4) Priority Zones.
    *   *Side Drawer*: Instantly expands upon clicking a marker, rendering issue details, citizen descriptions, and before/after photo comparisons.

### Page 4: Recommendations (AI Strategic Decision Suite)
*   **Path:** `/recommendations` (Formed from `MPDecisionCockpit` and `/insights` routing)
*   **Responsibility:** Strategic planning and budget matching. Answers *What should be built?*
*   **Layout & Key Components:**
    *   *Knapsack Budget Optimizer*: User inputs maximum budget (in Crores) and views an AI-packaged project plan maximizing beneficiary count.
    *   *Interactive AI Copilot*: Structured grounding chat interface to consult live data with cited evidence.
    *   *Document Proposal Drawer*: Instantly views and copy-pastes complete strategic proposal drafts (executive summary, beneficiaries, demographic justifications) matching state/national schemes (AMRUT, PM-GSY).

### Page 5: Reports (Citizen & Ward Intake)
*   **Path:** `/report`
*   **Responsibility:** Pipeline intake. Submits new unstructured signals into the AI engine.
*   **Layout & Key Components:**
    *   *Unified Ingestion Form*: Drag-and-drop media, location pinpoint, and text/voice description.
    *   *Voice Pipeline Simulator*: One-click ingestion of multilingual audio/text transcripts (Kannada/Hindi presets) to showcase instant AI English translation, categorization, and department assignment.

### Page 6: Settings (Role Clearance Center)
*   **Path:** `/settings` (Evolved from `/profile`)
*   **Responsibility:** Administration and personalization.
*   **Layout & Key Components:**
    *   *Persona Toggle Board*: Simple radio buttons to switch view between (1) Citizen, (2) Ward Officer, and (3) MP, dynamically hiding irrelevant UI elements to keep screens focused.
    *   *System Preferences*: Theme settings, API diagnostic indicators.
