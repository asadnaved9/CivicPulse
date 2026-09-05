# CivicPulse — Ethics, Safety & Misuse Safeguards

**Document Purpose:** Pre-flight defense and auditable safeguards addressing institutional risk, algorithmic bias, data sovereignty, and adversarial abuse for policymakers and hackathon evaluators.

---

## 1. Adversarial Abuse & Bot Flooding
**Judge Question:** *"What prevents a coordinated bot campaign or local political operative from mass-submitting fake potholes or artificial demand to divert municipal capital?"*

### Our Safeguards:
1. **Multi-Factor Density Clustering (DBSCAN)**:
   - Noise-rejection threshold: Single-device or clustered coordinate spikes from identical IP/device footprints are isolated into anomaly noise buckets (`dbscan_iso_*`).
   - Clusters require spatial dispersion and independent citizen upvote confirmations across distinct timestamps.
2. **Rate Limiting & Triage Boundary**:
   - Express backend enforces tiered IP and token rate-limit windows (40 calls/min maximum on triage routes).
   - USSD channel (*384#) relies on telecom carrier MSISDN throttling, naturally preventing synthetic browser bot swarms.
3. **Multi-Stakeholder Inspection Verification**:
   - Citizen reports do not directly trigger funds. They progress through a strictly forward-only lifecycle: `draft → submitted → approved → funded → in_execution → verified → completed`.
   - Before funds are released, on-site ward engineers and citizen audit panels must verify physical work.

---

## 2. Algorithmic Bias & Inequity
**Judge Question:** *"Won't an app-based civic intake system naturally bias capital toward wealthy tech-savvy neighborhoods like Koramangala while starving underserved rural/slum areas?"*

### Our Safeguards:
1. **Zero-Data Feature Phone Inclusion (USSD *384#)**:
   - Underserved populations lacking smartphones, internet access, or English literacy lodge requests in their local dialect (Kannada, Hindi, isiZulu) via standard 2G GSM cellular networks.
2. **Census & SECC Poverty Weighting (Component 3)**:
   - Raw report volume accounts for only **25%** of the Priority Score.
   - The engine explicitly incorporates **Census 2011 and Socio-Economic Caste Census (SECC)** demographic baselines: areas with higher proportion of Below Poverty Line (BPL) households and low infrastructure coverage receive an equity boost up to **+30 points**.
   - Even if an affluent ward generates 100 app reports, a high-poverty ward with 5 critical water reports can outscore it on governance necessity.

---

## 3. Data Sovereignty & PII Protection
**Judge Question:** *"How does this comply with India's Digital Personal Data Protection (DPDP) Act 2023 or global data localization mandates?"*

### Our Safeguards:
1. **Tiered Sovereign Intelligence**:
   - PII scrubbing and initial triage can be executed entirely on-device (via local Gemma 3n edge models) before packet transmission over the internet.
   - Citizen phone numbers and personal names are cryptographically redacted into pseudonymous hashes.
2. **National DPI Integration**:
   - In India, voice transcription connects to MeitY's sovereign **BHASHINI / VoicERA** infrastructure, avoiding foreign cloud transcription storage.
3. **Constituency Segregation**:
   - Citizen location is stored only to the granularity of municipal wards (e.g. Ward 151), preventing stalkable micro-geolocation tracking.

---

## 4. AI Hallucination & Decision Transparency
**Judge Question:** *"How can an elected representative trust an AI's capital allocation recommendations when LLMs are known to hallucinate budgets?"*

### Our Safeguards:
1. **The Determinism Boundary**:
   - **No LLM computes money or priority math.**
   - All scores (6-Factor Priority Formula), budget optimizations (Greedy Knapsack Selection), and beneficiary estimates are calculated in **deterministic TypeScript code**.
   - AI models (Gemini / Gemma) are used exclusively for semantic summarization, narrative drafting, and language translation.
2. **Grounded Scheme Context**:
   - Project recommendations are cross-referenced with hard-coded official ministry scheme guidelines (AMRUT 2.0, PM-GSY, Swachh Bharat).
3. **Auditable Evidence Chain Dossier**:
   - Every proposal features a 1-click printable government brief tracing the exact citizen ticket IDs, census demographics, formula score weights, and statutory audit history.

---

## 5. Political Weaponization & Transparency
**Judge Question:** *"Can a corrupt official quietly delete citizen complaints or mark unbuilt projects as completed?"*

### Our Safeguards:
1. **Immutable Forward-Only State Machine**:
   - Proposals can only transition forward along the validated sequence: `draft → submitted → approved → funded → in_execution → verified → completed`.
   - Direct jumping (e.g., draft directly to completed) is blocked and rejected with HTTP 400.
2. **Tamper-Evident Status History**:
   - Every transition appends an immutable entry containing timestamp, actor ID, and statutory justification note.
3. **Public Citizen Verification Ledger**:
   - Before a project status can reach `completed`, it must undergo public citizen verification on `/proposal/:id` with photographic inspection evidence.
