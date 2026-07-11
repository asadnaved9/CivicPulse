# 🚀 CivicPulse — Git Commit & Push Schedule

> **Agent Instruction**: This document defines the exact, ordered, feature-wise commit plan for the CivicPulse repository.
> When executing this plan, the agent must **stage only the files listed under each commit**, write the exact commit message provided, and push after every commit. Do **not** batch or reorder commits. Do **not** push anything not listed here.

---

## ⚙️ Pre-Flight Checklist (Run Once Before Starting)

Before executing any commit, the agent must verify the following:

- [ ] `.env` is listed in `.gitignore` and will **not** be committed.
- [ ] `node_modules/` is listed in `.gitignore` and will **not** be committed.
- [ ] A remote named `origin` is configured pointing to `https://github.com/asadnaved9/CivicPulse`.
- [ ] The branch being pushed to is `main`.

---

## 📦 Commit Categories & File Map

The codebase is organized into **16 logical feature commits**, ordered from foundational scaffold → core features → AI agents → docs.

---

### ✅ Commit 1 — `chore: project scaffold and configuration`

**Files to Stage**:
```
.gitignore
.env.example
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
metadata.json
public/favicon.svg
```

**Commit Message**:
```
chore: project scaffold and configuration

- Initialize Vite + React + TypeScript project
- Add package.json with all dependencies (React 19, Firebase, Gemini AI, MapLibre, Recharts, Motion)
- Configure tsconfig.json with strict mode and path aliases
- Add vite.config.ts with React and Tailwind plugins
- Add .env.example documenting all required environment variables
- Add .gitignore to exclude node_modules, dist, and .env
```

---

### ✅ Commit 2 — `feat: firebase client and admin configuration`

**Files to Stage**:
```
src/config/firebase.ts
src/config/firebaseAdmin.ts
firebase-applet-config.json
firestore.rules
```

**Commit Message**:
```
feat: firebase client and admin configuration

- Initialize Firebase client SDK (Auth + Firestore) in firebase.ts
- Initialize Firebase Admin SDK for backend token verification in firebaseAdmin.ts
- Add firebase-applet-config.json with project metadata (non-secret)
- Add Firestore security rules defining read/write access per collection
```

---

### ✅ Commit 3 — `feat: authentication context and protected routing`

**Files to Stage**:
```
src/contexts/AuthContext.tsx
src/main.tsx
src/App.tsx
src/components/shared/RequireRole.tsx
src/components/shared/AccessDenied.tsx
```

**Commit Message**:
```
feat: authentication context and protected routing

- Add AuthContext.tsx providing user session state via Firebase onAuthStateChanged
- Support anonymous guest sign-in, email/password, and Google OAuth flows
- Add main.tsx as React entry point wrapping app in AuthProvider and Router
- Add App.tsx with React Router v7 route definitions and lazy-loaded pages
- Protect citizen and inspector routes; redirect unauthenticated users to /home
- Add RequireRole.tsx and AccessDenied.tsx components for enforcing role-based access control (RBAC)
```

---

### ✅ Commit 4 — `feat: global UI shell — navbar, error boundary, skeleton, styles`

**Files to Stage**:
```
src/index.css
src/components/Navbar.tsx
src/components/ErrorBoundary.tsx
src/components/Skeleton.tsx
```

**Commit Message**:
```
feat: global UI shell — navbar, error boundary, skeleton, styles

- Add index.css with full Tailwind CSS v4 design system, custom animations, and glass-morphism utilities
- Add Navbar.tsx with role-aware navigation (citizen vs inspector views), mobile drawer, and live notification bell
- Add ErrorBoundary.tsx as a React class component to catch and display render errors gracefully
- Add Skeleton.tsx with reusable shimmer loading placeholders for async data states
```

---

### ✅ Commit 5 — `feat: home page and onboarding modal`

> **Collaborative Note**: Stage the baseline version of `src/pages/HomePage.tsx` here. The teammate's agent will commit the enhanced landing page layout changes later in Commit 10.

**Files to Stage**:
```
src/pages/HomePage.tsx
src/components/OnboardingModal.tsx
```

**Commit Message**:
```
feat: home page and onboarding modal

- Add HomePage.tsx as the public-facing landing page with hero section, feature highlights, and CTA
- Add OnboardingModal.tsx for first-time users — collects display name and preferred role (citizen/inspector)
- Persist onboarding completion flag to localStorage to avoid repeat prompts
- Animate modal entry/exit with Framer Motion spring transitions
```

---

### ✅ Commit 6 — `feat: interactive map ledger with location picker`

**Files to Stage**:
```
src/pages/MapPage.tsx
```

**Commit Message**:
```
feat: interactive map ledger with location picker

- Add MapPage.tsx powered by MapLibre GL with OpenStreetMap tile layer
- Render color-coded issue pins: red (open), amber (in-progress), green (resolved)
- Implement click-to-place-pin location picker for new report filing
- Integrate OpenStreetMap Nominatim reverse-geocoding to auto-fill human-readable address on pin drop
- Add Landmark Checkpoint fallback system for sandboxed environments without GPS access
- Add issue popup cards showing title, category, priority badge, and progress on pin click
- Implement status filter controls (All / Open / In Progress / Resolved)
```

---

### ✅ Commit 7 — `feat: issue reporting page with AI triage and voice input`

**Files to Stage**:
```
src/pages/ReportPage.tsx
```

**Commit Message**:
```
feat: issue reporting page with AI triage and voice input

- Add ReportPage.tsx as a multi-step, animated report submission form
- Implement image upload with base64 encoding sent to /api/agents/vision for AI triage
- AI vision agent auto-fills category, priority (1–5), SLA window, and description from uploaded photo
- Add voice reporter using Web Speech API; raw transcript sent to /api/agents/clean-voice for AI cleaning
- AI voice agent returns polished title and professional description, auto-populating form fields
- Integrate coordinate selection from MapPage via React Router location state
- Automatically capture real-time GPS coordinates for exact location reporting (with IP and hardcoded fallbacks)
- Show real-time agent processing status with animated loading indicators
```

---

### ✅ Commit 8 — `feat: issue detail page with dual-image AI resolution validator`

**Files to Stage**:
```
src/pages/IssueDetailPage.tsx
```

**Commit Message**:
```
feat: issue detail page with dual-image AI resolution validator

- Add IssueDetailPage.tsx rendering full issue metadata, timeline, and status history
- Add inspector Upload After Image workflow triggering /api/agents/verify-resolution
- AI verification agent compares before/after images and returns pass/fail with a rejection reason
- Award +50 points to citizen reporter and +120 points to verifying inspector on successful verification
- Display side-by-side before/after image comparison panel
- Render AI-generated escalation letter if issue is past SLA deadline (fetched from /api/agents/escalate-letter)
- Show comments thread and sub-reports duplicate log with real-time Firestore listener
```

---

### ✅ Commit 9 — `feat: inspector dashboard with local weather and geohash alerts`

> **Collaborative Note**: Stage the baseline version of `src/pages/DashboardPage.tsx` here. The teammate's agent will commit the enhanced citizen dashboard features later in Commit 10.

**Files to Stage**:
```
src/pages/DashboardPage.tsx
src/pages/InsightsPage.tsx
```

**Commit Message**:
```
feat: inspector dashboard with local weather and geohash alerts

- Add DashboardPage.tsx with live issue queue filtered by status, priority, and ward
- Integrate Open-Meteo API to display real-time weather forecasts and precipitation
- Render geohash-specific flood alert banner from Firestore when local risk is elevated
- Add InsightsPage.tsx with Recharts analytics: category breakdown pie chart, resolution trends bar chart, and ward heatmap
```

---

### 👥 Commit 10 (Teammate) — `feat: live location module`

> **Collaborative Note**: Stage your enhanced versions of `src/pages/HomePage.tsx` (landing page), `src/pages/DashboardPage.tsx` (citizen interface dashboard), and `src/pages/ReportPage.tsx` (improved live location integration), along with the new geolocation files. This commit applies your live location button, landing page optimizations, and citizen dashboard modifications on top of the baseline pages created in Commit 5 and Commit 9.

**Files to Stage**:
```
src/components/GpsButton.tsx
src/components/LocalitySelect.tsx
src/utils/geohash.ts
src/utils/localities.ts
src/pages/HomePage.tsx
src/pages/DashboardPage.tsx
src/pages/ReportPage.tsx
```

**Commit Message**:
```
feat: live location module and landing/dashboard updates

- Add GpsButton component for real-time geolocation lock
- Add LocalitySelect.tsx and geohash.ts to manage user locality mapping and precision-5 geohashing
- Integrate live location and GPS fallbacks into ReportPage.tsx
- Implement updates to landing page (HomePage.tsx) and citizen dashboard page (DashboardPage.tsx)
```

---

### ✅ Commit 11 — `feat: admin and super-admin portals with role-based governance`

**Files to Stage**:
```
src/App.tsx
src/config/firebase.ts
src/pages/AdminLoginPage.tsx
src/pages/SuperAdminLoginPage.tsx
src/pages/admin/AdminLayout.tsx
src/pages/admin/AdminDashboardPage.tsx
src/pages/admin/AdminComplaintsPage.tsx
src/pages/admin/AdminAssignmentsPage.tsx
src/pages/admin/AdminAnalyticsPage.tsx
src/pages/admin/AdminMapPage.tsx
src/pages/admin/AdminNotificationsPage.tsx
src/pages/admin/AdminSettingsPage.tsx
src/pages/super-admin/SuperAdminLayout.tsx
src/pages/super-admin/SuperAdminDashboardPage.tsx
src/pages/super-admin/MunicipalitiesPage.tsx
src/pages/super-admin/DepartmentsPage.tsx
src/pages/super-admin/NationalMapPage.tsx
src/pages/super-admin/AdminsPage.tsx
src/pages/super-admin/AllUsersPage.tsx
src/pages/super-admin/RolesPage.tsx
src/pages/super-admin/AnalyticsPage.tsx
src/pages/super-admin/AIMonitoringPage.tsx
src/pages/super-admin/SystemLogsPage.tsx
src/pages/super-admin/AuditReportsPage.tsx
src/pages/super-admin/ConfigurationPage.tsx
src/pages/super-admin/SettingsPage.tsx
src/pages/super-admin/ApiKeysPage.tsx
src/pages/super-admin/IntegrationsPage.tsx
```

**Commit Message**:
```
feat: admin and super-admin portals with role-based governance

- Add AdminLayout.tsx and AdminDashboardPage.tsx for municipal department admins
- Add AdminComplaintsPage.tsx, AdminAssignmentsPage.tsx, and AdminMapPage.tsx to manage, route, and assign complaints
- Add AdminAnalyticsPage.tsx, AdminNotificationsPage.tsx, and AdminSettingsPage.tsx
- Add SuperAdminLayout.tsx and SuperAdminDashboardPage.tsx for global platform governance
- Add all sub-level super-admin management pages: MunicipalitiesPage, DepartmentsPage, NationalMapPage, AdminsPage, AllUsersPage, RolesPage, AnalyticsPage, AIMonitoringPage, SystemLogsPage, AuditReportsPage, ConfigurationPage, SettingsPage, ApiKeysPage, and IntegrationsPage
- Add AdminLoginPage.tsx and SuperAdminLoginPage.tsx for secure portal access
- Update App.tsx with all admin and super-admin routes
- Support mock token fallbacks in firebase.ts fetchWithAuth utility for presentation mode
```

---

### ✅ Commit 12 — `feat: community discussion board`

**Files to Stage**:
```
src/pages/CommunityPage.tsx
```

**Commit Message**:
```
feat: community discussion board

- Add CommunityPage.tsx as a public discussion forum for neighborhood wards
- Support filtering posts by ward, category, and creation date
- Integrate real-time Firestore listeners for comments and updates
```

---

### ✅ Commit 13 — `feat: citizen profile page, points engine, and leaderboard`

**Files to Stage**:
```
src/pages/ProfilePage.tsx
src/utils/pointsEngine.ts
src/utils/pointsEngineAdmin.ts
```

**Commit Message**:
```
feat: citizen profile page, points engine, and leaderboard

- Add ProfilePage.tsx showing citizen stats: total reports, resolved count, points, and earned badges
- Display warden tier badges: Civic Champion (100+ pts), Community Guardian (500+ pts), Truth Teller
- Add pointsEngine.ts — client-side utility for reading user point totals from Firestore
- Add pointsEngineAdmin.ts — server-side utility for atomically incrementing points in Firestore via Admin SDK
- Render live leaderboard sorted by points with real-time Firestore snapshot updates
```

---

### ✅ Commit 14 — `feat: AI agent orchestration layer`

**Files to Stage**:
```
src/agents/AgentOrchestrator.ts
src/agents/escalationAgent.ts
src/agents/predictiveAgent.ts
src/agents/summaryAgent.ts
src/agents/verificationAgent.ts
src/agents/duplicateAgent.ts
src/agents/weatherAgent.ts
src/agents/index.ts
src/utils/geminiRetry.ts
src/utils/errorHandlers.ts
```

**Commit Message**:
```
feat: AI agent orchestration layer

- Add AgentOrchestrator.ts routing incoming API calls to the appropriate specialist agent
- Add escalationAgent.ts generating formal municipal commissioner escalation letters via Gemini
- Add predictiveAgent.ts scoring priority (1–5) and SLA window from civic image analysis
- Add summaryAgent.ts cleaning raw voice transcripts into polished titles and descriptions
- Add verificationAgent.ts performing dual-image before/after visual comparison for resolution validation
- Add duplicateAgent.ts to detect nearby issues and merge duplicates using Gemini Vision
- Add weatherAgent.ts to fetch weather data, assess local flood hazards, and post geohash alerts
- Add agents/index.ts exporting all agents as a unified module
- Add geminiRetry.ts with exponential backoff retry logic for Gemini API 429/503 errors
- Add errorHandlers.ts with typed Express error middleware
```

---

### ✅ Commit 15 — `feat: express backend server with all API routes`

**Files to Stage**:
```
server.ts
```

**Commit Message**:
```
feat: express backend server with all API routes

- Add server.ts as full Express.js backend with Firebase Admin authentication middleware
- Mount /api/agents/vision — receives image, runs AI triage, creates Firestore issue document
- Mount /api/agents/clean-voice — receives raw transcript, returns cleaned title + description
- Mount /api/agents/verify-resolution — receives before+after images, returns verification verdict
- Mount /api/agents/escalate-letter — generates and stores formal escalation letter in Firestore
- Mount /api/issues, /api/users, /api/leaderboard CRUD routes
- Serve Vite production build as static files; configure port binding for Cloud Run (PORT env)
- Add Firebase ID token verification on all mutating routes
```

---

### ✅ Commit 16 — `feat: Firestore seed data utility`

**Files to Stage**:
```
src/utils/seedData.ts
```

**Commit Message**:
```
feat: Firestore seed data utility

- Add seedData.ts with 30+ pre-built realistic civic issue records across all categories
- Issues span all priorities (1–5), all statuses (open/in-progress/resolved), and multiple ward locations
- Used for demo environments and local development to avoid empty state on first load
```

---

### ✅ Commit 17 — `docs: readme, project description, and security spec`

**Files to Stage**:
```
README.md
security_spec.md
assets/project_description.md
```

**Commit Message**:
```
docs: readme, project description, and security spec

- Add README.md with full project overview, setup guide, environment variables, and deployment instructions
- Add security_spec.md documenting Firestore security rules, Firebase Auth strategy, and API route protection
- Add assets/project_description.md as the official Vibe2Ship submission document
```

---

### ✅ Commit 18 — `feat: multilingual context and localized translations`

**Files to Stage**:
```
src/contexts/LanguageContext.tsx
src/i18n/bn.ts
src/i18n/en.ts
src/i18n/hi.ts
src/i18n/index.ts
```

**Commit Message**:
```
feat: multilingual context and localized translations

- Add LanguageContext.tsx providing locale state and translation (t) helper
- Add translation dictionaries for English (en.ts), Hindi (hi.ts), and Bengali (bn.ts)
- Add i18n index aggregator defining translation keys and types
- Enable localized UI text fallback across components
```

---

## 📅 Execution Order Summary

| # | Commit (short) | Key Files | Developer |
|---|----------------|-----------|-----------|
| 1 | `chore: project scaffold and configuration` | `package.json`, `vite.config.ts`, `tsconfig.json`, `public/favicon.svg` | **You** |
| 2 | `feat: firebase client and admin configuration` | `firebase.ts`, `firebaseAdmin.ts`, `firestore.rules` | **You** |
| 3 | `feat: authentication context and protected routing` | `AuthContext.tsx`, `App.tsx`, `RequireRole.tsx`, `AccessDenied.tsx` | **You** |
| 4 | `feat: global UI shell` | `index.css`, `Navbar.tsx`, `ErrorBoundary.tsx`, `Skeleton.tsx` | **You** |
| 5 | `feat: home page and onboarding modal` | `HomePage.tsx`, `OnboardingModal.tsx` | **You** |
| 6 | `feat: interactive map ledger with location picker` | `MapPage.tsx` | **You** |
| 7 | `feat: issue reporting page with AI triage and voice input` | `ReportPage.tsx` | **You** |
| 8 | `feat: issue detail page with dual-image AI resolution validator` | `IssueDetailPage.tsx` | **You** |
| 9 | `feat: inspector dashboard with local weather and geohash alerts` | `DashboardPage.tsx`, `InsightsPage.tsx` | **You** |
| 10 | `feat: live location module` | `GpsButton.tsx`, `LocalitySelect.tsx`, `geohash.ts`, `localities.ts`, `HomePage.tsx`, `DashboardPage.tsx`, `ReportPage.tsx` | **Teammate** |
| 11 | `feat: admin and super-admin portals with role-based governance` | `AdminDashboardPage.tsx`, `SuperAdminDashboardPage.tsx`, super-admin pages, `App.tsx`, `firebase.ts` | **You** |
| 12 | `feat: community discussion board` | `CommunityPage.tsx` | **You** |
| 13 | `feat: citizen profile page, points engine, and leaderboard` | `ProfilePage.tsx`, `pointsEngine.ts`, `pointsEngineAdmin.ts` | **You** |
| 14 | `feat: AI agent orchestration layer` | All agents + `geminiRetry.ts`, `errorHandlers.ts` | **You** |
| 15 | `feat: express backend server with all API routes` | `server.ts` | **You** |
| 16 | `feat: Firestore seed data utility` | `seedData.ts` | **You** |
| 17 | `docs: readme, project description, and security spec` | `README.md`, `security_spec.md`, `project_description.md` | **You** |
| 18 | `feat: multilingual context and localized translations` | `LanguageContext.tsx`, `src/i18n/*` | **You** |

---

## 🤖 Agent Execution Instructions

When an agent reads this file and begins execution, run the following for each commit in order (1 → 18, skipping Commit 10 which is pushed by your teammate):

```bash
git add <files listed in "Files to Stage">
git commit -m "<exact multi-line commit message from that block>"
git push origin main
# Verify exit code 0 before proceeding to the next commit
# If push fails, stop and report the error — do NOT skip or reorder commits
```

### ⛔ Never commit these files:
- `.env` — contains secret API keys
- `node_modules/` — auto-generated, ~280 MB
- `dist/` — build output
- `assets/screenshots/` — large binary assets
- `assets/.aistudio/` — internal AI Studio metadata

---

*Generated: 2026-07-07 | Project: CivicPulse | Repo: github.com/asadnaved9/CivicPulse*
