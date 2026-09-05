# 🏛️ CivicPulse — Citizen Demand & Infrastructure Intelligence Platform

> **AI-Powered Municipal Governance, Demand Aggregation, and Strategic Capital Project Planning**

---

## 📖 Solution Overview

**CivicPulse** is a dual-subsystem civic intelligence platform bridging the structural gap between hyper-local citizen distress signals and municipal capital investment planning. 

Traditional civic grievance apps end when an individual pothole or broken streetlight is logged. CivicPulse operates across two continuous, interconnected operational loops:

1. **Civic Operations Subsystem**: Real-time hazard intake, automated vision-based verification, multi-lingual speech transcription, gamified community wardens, and automated BBMP escalation.
2. **Development Intelligence Pipeline**: Semantic clustering of citizen submissions into coherent neighborhood initiatives, 6-factor priority scoring, alignment checking against official Local Development Plans (LDP), knapsack treasury budget optimization, verified government scheme matching via Alchemyst AI, and formal forward-only proposal lifecycle management.

---

## 🏗️ Architectural Overview

```
                          CITIZEN TOUCHPOINTS
    ┌──────────────────────────────┬──────────────────────────────┐
    │     Report Civic Hazard      │   Propose Development Need   │
    │  (Photos, SLA, Potholes)     │ (Walkways, Clinics, Schools) │
    └──────────────┬───────────────┴──────────────┬───────────────┘
                   │                              │
                   ▼                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │               CIVICPULSE CORE RUNTIME API                   │
    │  - Multilingual Speech-to-Text & Type Classifier            │
    │  - Dual-Image Gemini Vision Resolution Verifier             │
    │  - OpenStreetMap Ward & Panchayat Geospatial Enricher       │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
    ┌──────────────────────────────┐ ┌──────────────────────────────┐
    │  CIVIC OPERATIONS SUBSYSTEM  │ │ DEVELOPMENT INTELLIGENCE     │
    │  - Predictive Zone Scanner   │ │  1. Semantic & Geo Cluster   │
    │  - Autonomous Escalations    │ │  2. 6-Factor Priority Engine │
    │  - Ward Committee Briefings  │ │  3. Demand vs LDP Alignment  │
    │  - Warden Gamification       │ │  4. Knapsack Treasury Budget │
    └──────────────────────────────┘ │  5. Alchemyst Scheme Match   │
                                     │  6. Lifecycle State Machine  │
                                     └──────────────┬───────────────┘
                                                    │
                                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                 MP DECISION COCKPIT (UI)                    │
    │  - Conversational AI Copilot (Grounded in Ward Consensus)   │
    │  - Interactive Capital Budget Knapsack Optimizer            │
    │  - Phased Proposal Lifecycle Tracker & Audit Dossier        │
    └─────────────────────────────────────────────────────────────┘
```

---

## ⚡ The Development Intelligence Pipeline

The strategic intelligence subsystem transforms uncoordinated citizen suggestions into actionable, fundable municipal projects through 6 verifiable stages:

1. **Demand Aggregation & Geographic Clustering**: Consolidates raw citizen proposals within a ~2km spatial radius and matching civic domain using semantic embeddings or high-density fallback clustering.
2. **6-Factor Priority Scoring Engine**: Evaluates every initiative according to a transparent, governance-challenge formula:
   $$\text{Priority Score} = 0.25(\text{Demand}) + 0.25(\text{InfraGap}) + 0.20(\text{PopImpact}) + 0.10(\text{AccessGap}) + 0.10(\text{Urgency}) + 0.10(\text{InvestDeficit})$$
   - **Demand Volume & Engagement (25%)**: Submission count augmented by local citizen upvote consensus.
   - **Infrastructure Proximity Gap (25%)**: Physical distance to the nearest public facility (e.g. 4.8 km to nearest PHC).
   - **Population Density Impact (20%)**: Projected ward residents served based on official municipal census benchmarks.
   - **Accessibility Barrier (10%)**: Transit and pedestrian access impediment.
   - **Public Urgency (10%)**: Hazard risk severity score.
   - **Municipal Investment Deficit (10%)**: Absence of sanctioned projects in the current Local Development Plan.
3. **Demand vs Plan Alignment Comparison**: Cross-references citizen priority clusters against official Local Development Plan (LDP) records to detect unaddressed gaps (`GAP DETECTED`, `PRIORITIZE PROPOSAL`) or prevent duplicate capital spending (`PROCEED AS PLANNED`).
4. **Knapsack Treasury Budget Optimization**: A greedy density-optimization algorithm that packages the highest impact projects for a target constituency allocation (e.g. ₹5.00 Crores).
5. **Verified Scheme Matching (Alchemyst AI Context)**: Grounds project recommendations against official guidelines of central/state schemes (AMRUT 2.0, PM-GSY, Swachh Bharat Mission Urban, National Health Mission, Samagra Shiksha Abhiyan) to determine center-state funding ratios.
6. **Government Decision Lifecycle Tracker**: A strict, forward-only finite state machine tracking projects from genesis to commissioning:
   $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{Approved} \longrightarrow \text{Funded} \longrightarrow \text{In Execution} \longrightarrow \text{Verified} \longrightarrow \text{Completed}$$
   *(Rejection is supported at any pre-completion stage; backwards rollbacks are strictly prevented for audit integrity).*

---

## 🚀 Key Features

*   **MP Decision Cockpit**: A comprehensive planning suite for elected representatives and city commissioners featuring an AI Decision Copilot, Budget Planner, Scheme Matcher, and Project Dossier Compiler.
*   **Geographic Ward Ledger**: Real-time vector-tile mapping covering Bangalore's primary zones (Koramangala, Indiranagar, Whitefield, HSR Layout).
*   **AI Vision Hazard Classifier**: Evaluates infrastructure severity, filters invalid images, and predicts SLA timeframes.
*   **Dual-Image Verification**: Compares before/after maintenance photos to confirm civic contractor resolution before closing tickets.
*   **Multilingual Voice Intake**: Real-time speech transcription supporting regional languages (Kannada, Hindi, English, Spanish) with auto-classification into `CIVIC_ISSUE` or `DEVELOPMENT_NEED`.
*   **Warden Gamification & Reputation**: Community leveling and badges for verified civic filings.
*   **Automated BBMP Escalations**: Automated drafting of formal notices to Bruhat Bengaluru Mahanagara Palike commissioners for overdue SLAs.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Vite, Vanilla CSS Design System, Lucide Icons, MapLibre GL, Recharts
*   **Backend Runtime**: Node.js, Express.js (Port `3000`), `tsx`
*   **Database & Auth**: Firebase Firestore & Firebase Authentication
*   **AI & Knowledge Services**:
    *   `@google/genai` (Gemini 2.5 Flash / Flash Lite models)
    *   `@alchemystai/sdk` (Verified Government Scheme Context Retrieval)
*   **Production Bundler**: `esbuild` & `vite`

---

## 🧪 Deterministic End-to-End Demo Script

CivicPulse includes a scripted test scenario demonstrating the entire Citizen → Cluster → Plan Alignment → Scheme Match → Lifecycle Proposal flow (specifically demonstrating the **HSR Layout Sector 2 Healthcare Infrastructure Gap**):

```bash
# Run the complete deterministic demo walkthrough
npx tsx scripts/runDemoScenario.ts
```

This scenario runs deterministically and executes:
1. Citizen development suggestions seeding into Firestore.
2. 6-Factor priority clustering (identifying the Sector 2 healthcare cluster with a priority score of 89/100).
3. Demand vs Municipal Plan comparison (identifying zero healthcare allocations in the active LDP).
4. ₹5.00 Crore Knapsack budget packaging.
5. Scheme matching against PM-ABHIM and National Urban Health Mission guidelines.
6. Creation of an official capital proposal and transition to `SUBMITTED` status.

---

## 🏁 Getting Started

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
# Google Gemini API Key
GEMINI_API_KEY="your-gemini-key"

# Alchemyst AI API Key (Optional; fallback scheme models used if absent)
ALCHEMYST_AI_API_KEY="your-alchemyst-key"

# Firebase Client Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="civicpulse-e48de.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="civicpulse-e48de"
VITE_FIREBASE_STORAGE_BUCKET="civicpulse-e48de.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="924621569984"
VITE_FIREBASE_APP_ID="1:924621569984:web:c13ca32d7f145205761225"

# Optional: Disable background autonomous orchestrator during tests
DISABLE_ORCHESTRATOR="true"
```

### 2. Install & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run full TypeScript validation pass
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📋 Route Architecture

| Route | Subsystem | Description |
|---|---|---|
| `/` | Operations | Operational health score, recent resolutions, and civic metrics |
| `/development` | Intelligence | Area development hotspots, LDP structurator, and ward briefings |
| `/map` | Operations | Interactive geospatial map of all open civic issues & clusters |
| `/recommendations` | Intelligence | **MP Decision Cockpit**: Copilot, Budget Planner, Scheme Matcher |
| `/report` | Intake | Multilingual intake for `CIVIC_ISSUE` and `DEVELOPMENT_NEED` |
| `/settings` | Core | Language selector (`en`, `es`, `hi`, `kn`), user profile, and role switch (`citizen` / `mp`) |
| `/issue/:id` | Operations | Issue lifecycle detail with dual-photo verification |
| `/proposal/:id` | Intelligence | Capital proposal dossier and forward-only status advancement |

---

## ⚖️ Known Limitations & Role Behavior

*   **Role Switcher**: Toggling between `citizen` and `mp` in `/settings` customizes navigation labels (e.g. promoting the MP Decision Cockpit badge in the top navigation) and displays representative state-transition controls on proposals. In single-tenant demo configurations, routes remain publicly inspectable to facilitate evaluation without strict login barriers.
