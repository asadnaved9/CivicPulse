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

## 🌐 Tiered Sovereign Intelligence Architecture

CivicPulse incorporates a **Tiered Sovereign Intelligence** runtime designed for national resilience and edge-first data sovereignty:

```
                      CITIZEN MULTI-CHANNEL INTAKE
    ┌──────────────────────┬──────────────────────┬──────────────────────┐
    │   Web / Mobile PWA   │  VoicERA / BHASHINI  │  *384# Feature Phone │
    │ (Rich Photos, GPS)   │  (Regional Dialects) │  (USSD / 2G Network) │
    └──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
               │                      │                      │
               ▼                      ▼                      ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │            TIER 1: ON-DEVICE EDGE SOVEREIGN INFERENCE              │
    │  - Gemma 3n on-device via Ollama daemon (localhost:11434)          │
    │  - Zero per-request cloud API dependency, 100% Google AI stack     │
    │  - On-Device PII Masking: Redacts citizen phone numbers & emails   │
    │  - Deterministic Keyword Taxonomy Engine (Instant fallback)        │
    └─────────────────────────────────┬──────────────────────────────────┘
                                      │ (Escalates complex briefs)
                                      ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                 TIER 2: GOOGLE GEMINI CLOUD LLM                    │
    │  - Gemini 2.5 Flash / Flash Lite via `@google/genai`               │
    │  - Strategic Demand vs LDP alignment reasoning & Brief synthesis   │
    │  - Exponential backoff retry wrapper (`runWithRetry`)              │
    └─────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │             DETERMINISTIC CIVIC INTELLIGENCE ENGINES               │
    │  - DBSCAN Geospatial Clustering (`density-clustering` km Haversine)│
    │  - Census 2011 & SECC Demographic Ward Grounding                   │
    │  - Digital Public Infrastructure (DPI) 4-Component Impact Engine   │
    │  - Country Adapter Engine (India INR/BBMP & South Africa ZAR/Metro)│
    │  - Alchemyst AI Verified Scheme Matching Engine                    │
    └────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The Development Intelligence Pipeline

The strategic intelligence subsystem transforms uncoordinated citizen suggestions into actionable, fundable municipal projects through 7 verifiable stages:

1. **Demand Aggregation & Geographic Clustering**: Consolidates raw citizen proposals within spatial clusters using **DBSCAN Density Clustering** (`epsilon=2.5km`, `minPoints=2`) with Haversine distance projection or semantic embeddings.
2. **6-Factor Priority Scoring Engine Grounded in Census 2011 Data**: Evaluates every initiative according to an audited governance formula:
   $$\text{Priority Score} = 0.25(\text{Demand}) + 0.25(\text{InfraGap}) + 0.20(\text{PopImpact}) + 0.10(\text{AccessGap}) + 0.10(\text{Urgency}) + 0.10(\text{InvestDeficit})$$
   - **Population Density Impact (20%) & Accessibility Gap (10%)**: Grounded in official **Census of India 2011** ward tables and **Socio-Economic and Caste Census (SECC)** benchmarks.
   - **Infrastructure Proximity Gap (25%)**: Physical distance to the nearest public facility (e.g. 4.8 km to nearest PHC).
   - **Demand Volume (25%)**: Real citizen submissions augmented by verified upvotes.
3. **DPI Impact Scoring Engine**: Quantifies real-world civic adoption across 4 pillars (Coverage Gap 30%, Citizen Sentiment 30%, Adoption Velocity 20%, Service Quality 20%) across Aadhaar, UPI, DigiLocker, CoWIN, and South Africa Smart ID.
4. **Demand vs Plan Alignment Comparison**: Cross-references citizen priority clusters against official Local Development Plan (LDP) records to detect unaddressed gaps (`GAP DETECTED`, `PRIORITIZE PROPOSAL`) or prevent duplicate capital spending (`PROCEED AS PLANNED`).
5. **Knapsack Treasury Budget Optimization**: A greedy density-optimization algorithm that packages the highest impact projects for a target constituency allocation (e.g. ₹5.00 Crores).
6. **Verified Scheme Matching (Alchemyst AI Context)**: Grounds project recommendations against official guidelines of central/state schemes (AMRUT 2.0, PM-GSY, Swachh Bharat Mission Urban, National Health Mission, Samagra Shiksha Abhiyan) to determine center-state funding ratios.
7. **Government Decision Lifecycle Tracker & Evidence Dossier**: A strict, forward-only finite state machine tracking projects from genesis to commissioning:
   $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{Approved} \longrightarrow \text{Funded} \longrightarrow \text{In Execution} \longrightarrow \text{Verified} \longrightarrow \text{Completed}$$
   - Includes one-click **Executive Decision Brief PDF Dossier Export** compiling citizen evidence, 6-factor mathematical proofs, Census citations, and scheme funding allocations for legislative committees.

---

## 🚀 Key Features

*   **Tiered Sovereign Intelligence**: Seamless multi-tier inference routing. Runs Gemma 3n on-device via Ollama for offline classification with instant deterministic fallback and Gemini Cloud escalation.
*   **Feature Phone Inclusion (*384# USSD / IVR Simulator)**: Dedicated interactive 2G handset UI (`/ussd-demo`) enabling zero-internet citizens to report issues, check statuses, and auto-persist tickets directly to Firestore.
*   **Global Country Adapter Architecture**: Swappable configuration layer supporting multi-nation deployments (India: INR, BBMP, Bhashini Voice, Central Schemes; South Africa: ZAR, Metro/Ward, Edge Voice, MIG/WSIG Grants).
*   **Census 2011 & SECC Demographics Grounding**: Replaces synthetic AI guesses with official census ward records for population density, literacy, and BPL percentages.
*   **DPI Impact Index**: Live analytics tab evaluating national Digital Public Infrastructure rollouts against ward friction reports.
*   **MP Decision Cockpit**: A comprehensive planning suite for elected representatives and city commissioners featuring an AI Decision Copilot, Budget Planner, Scheme Matcher, and Evidence Dossier Compiler.
*   **Geographic Ward Ledger**: Real-time vector-tile mapping covering primary municipal zones with DBSCAN cluster polygons.
*   **Dual-Image Verification**: Compares before/after maintenance photos to confirm civic contractor resolution before closing tickets.
*   **VoicERA / BHASHINI National Voice Gateway**: Integration with national speech pipelines for vernacular audio reporting.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Vite, Vanilla CSS Design System, Lucide Icons, MapLibre GL, Recharts
*   **Backend Runtime**: Node.js, Express.js (Port `3000`), `tsx`
*   **Database & Auth**: Firebase Firestore & Firebase Authentication
*   **AI & Knowledge Services**:
    *   `ollama` (Gemma 3n On-Device Edge Inference)
    *   `@google/genai` (Gemini 2.5 Flash / Flash Lite cloud models)
    *   `@alchemystai/sdk` (Verified Government Scheme Context Retrieval)
    *   `density-clustering` (Algorithmic DBSCAN geospatial clustering)
*   **Digital Public Goods Standard**: Full adherence across all 9 DPGA indicators (see [DPG_COMPLIANCE.md](DPG_COMPLIANCE.md))
*   **Ethics & Misuse Safeguards**: Transparent mitigation for bot flooding, political bias, hallucination, and privacy (see [ETHICS.md](ETHICS.md))

---

## 🧪 Deterministic End-to-End Demo Script

CivicPulse includes a scripted test scenario demonstrating the entire Citizen → Cluster → Plan Alignment → Scheme Match → Lifecycle Proposal flow (specifically demonstrating the **HSR Layout Sector 2 Healthcare Infrastructure Gap**):

```bash
# Run the complete deterministic demo walkthrough
npx tsx scripts/runDemoScenario.ts
```

This scenario runs deterministically and executes:
1. Citizen development suggestions seeding into Firestore.
2. DBSCAN density clustering with Census 2011 demographic grounding.
3. Demand vs Municipal Plan comparison (identifying zero healthcare allocations in the active LDP).
4. ₹5.00 Crore Knapsack budget packaging.
5. Scheme matching against AMRUT and PMGSY guidelines.
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

### 2. (Optional) Run Gemma 3n On-Device via Ollama
```bash
# Start Ollama service (runs on localhost:11434)
ollama run gemma3n
```
*Note: If Ollama is not installed or running, CivicPulse automatically utilizes its deterministic regex taxonomy engine with zero disruption.*

### 3. Install & Run
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
| `/development` | Intelligence | Area development hotspots, LDP structurator, ward briefings, and **DPI Impact Index** |
| `/map` | Operations | Interactive geospatial map of all open civic issues & DBSCAN clusters |
| `/recommendations` | Intelligence | **MP Decision Cockpit**: Copilot, Budget Planner, Scheme Matcher |
| `/report` | Intake | Multilingual intake for `CIVIC_ISSUE` and `DEVELOPMENT_NEED` with edge status |
| `/ussd-demo` | Inclusion | **Feature Phone Inclusion**: Interactive 2G GSM USSD/IVR simulator with Firestore persistence |
| `/settings` | Core | Country Selector (India / South Africa), Language Selector, and Role Switch (`citizen` / `mp`) |
| `/issue/:id` | Operations | Issue lifecycle detail with dual-photo verification |
| `/proposal/:id` | Intelligence | Capital proposal dossier, Evidence Chain, Decision Brief PDF export, and status advancement |

---

## ⚖️ Known Limitations & Role Behavior

*   **Role Switcher**: Toggling between `citizen` and `mp` in `/settings` customizes navigation labels (e.g. promoting the MP Decision Cockpit badge in the top navigation) and displays representative state-transition controls on proposals. In single-tenant demo configurations, routes remain publicly inspectable to facilitate evaluation without strict login barriers.
