# 05 - Role Hierarchy & Persona Experience Matrix

> **NOTE: This document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

To optimize cognitive load, the application is divided into tailored view layouts based on user roles. This minimizes unnecessary administrative widgets for citizens and hides raw submission tools from the MP.

---

## 1. Persona Profile Matrices

### 1.1 Persona: Member of Parliament (MP) & Staff
*   **Primary Objective:** High-level executive decision support, strategic allocation, and inter-departmental communication.
*   **Assigned Views:** Overview, Development, Map (Hotspot Layer), Recommendations.
*   **Hidden UI Elements:** Raw citizen input forms, multilingual draft voice buttons.
*   **Key Decision Tools:** Executive briefings, knapsack budget packages, AMRUT scheme matches.

### 1.2 Persona: Ward Officer
*   **Primary Objective:** Ground-level operations, validating reported hazard evidence, tracking contractors.
*   **Assigned Views:** Overview (recent activity focus), Map (Issues Layer), Reports (verification tools), Issue Detail Page (status transition forms).
*   **Hidden UI Elements:** Knapsack budget sliders, MP Copilot strategic advisor.
*   **Key Decision Tools:** Status updating boards (suggested -> resolved), before/after picture reviews.

### 1.3 Persona: Citizen (Public)
*   **Primary Objective:** Submitting local hazards (voice/images) and upvoting existing neighborhood needs.
*   **Assigned Views:** Map (Issue tracking only), Reports (hazard submission intake), Issue Detail Page (citizen upvote button).
*   **Hidden UI Elements:** All strategic Recommendations panels, LDP budgets, executive summaries, and administrative control panels.
*   **Key Decision Tools:** Upvote button, WhatsApp/SMS response notifications tracker.

### 1.4 Persona: Platform Administrator
*   **Primary Objective:** System telemetry, mock data seeder triggers, model configurations.
*   **Assigned Views:** Settings, Reports (testing channel submission pipelines).
*   **Hidden UI Elements:** Exposes all developer-level details in `/settings`.

---

## 2. Dynamic Access Control Layout (Role Selector)

A centralized role switcher is located in `/settings` (reconstructed from `/profile`). Toggling this selection updates a global `AuthContext` state, which propagates down to components.

```typescript
// Conceptual state logic that enforces this separation:
const { userRole } = useAuth();

return (
  <nav className="navbar-links">
    {/* Common accessible paths */}
    <Link to="/map">Map</Link>
    
    {/* Citizen-only Access */}
    {userRole === 'Citizen' && <Link to="/report">Report Hazard</Link>}
    
    {/* MP & Ward Officer Strategic Access */}
    {['MP', 'Ward Officer'].includes(userRole) && (
      <>
        <Link to="/">Overview</Link>
        <Link to="/development">Analytics</Link>
      </>
    )}
    
    {/* MP Executive-only Access */}
    {userRole === 'MP' && <Link to="/recommendations">AI Planning Suite</Link>}
    
    <Link to="/settings">Settings</Link>
  </nav>
);
```
