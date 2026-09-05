# 04 - Component Audit & Consolidation Matrix

> **NOTE: This document is superseded by [BUILD_PLAN.md](file:///d:/Al%20websites/HackQuest/BUILD_PLAN.md) and represents the pre-migration architectural state.**

This document establishes the official visual design token and component library specifications for CivicPulse AI. It replaces inconsistent inline styling and raw hex colors with a unified, high-contrast design system.

---

## 1. Global CSS Variable Foundation (`/src/index.css`)

All components must strictly utilize these semantic CSS custom properties to ensure consistency between light and high-contrast modes:

```css
:root {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Semantic Core Colors */
  --bg: #F9FAFB;           /* Clean Off-White */
  --surface-1: #FFFFFF;    /* Pure White Cards */
  --surface-2: #F3F4F6;    /* Soft Gray Shimmers */
  --surface-3: #E5E7EB;    /* Divided Dividers */
  --primary: #111111;      /* Charcoal Primary */
  --primary-hover: #1F2937;
  
  /* Text Scales */
  --text-1: #111111;       /* Display / Bold */
  --text-2: #4B5563;       /* Body / Regular */
  --text-3: #9CA3AF;       /* Muted / Captions */
  
  /* Borders */
  --border: #E5E7EB;
}
```

---

## 2. Reusable Component Standardizations

### 2.1 Cards (`.card`)
*   **Audit Decision:** **KEEP & STANDARDIZE**
*   **Specification:** Flat background, thin border, sharp corners, no shadows.
*   **CSS Class:**
    ```css
    .card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 24px;
    }
    ```

### 2.2 Buttons (`.btn`)
*   **Audit Decision:** **KEEP & STANDARDIZE**
*   **Specification:** High-contrast solid fills for primary actions, thin borders for secondary actions. Avoid heavy multi-color gradients.
*   **CSS Classes:**
    ```css
    .btn-primary {
      background: var(--primary);
      color: var(--bg);
      border: 1px solid var(--primary);
      border-radius: 4px;
      font-weight: 600;
      padding: 10px 20px;
    }
    .btn-secondary {
      background: transparent;
      color: var(--text-1);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-weight: 500;
      padding: 10px 20px;
    }
    ```

### 2.3 Badges (`.badge`)
*   **Audit Decision:** **KEEP & MERGE**
*   **Specification:** Replaces specific colored badges (e.g., `badge-purple`, `badge-pink`) with a unified set of status badges mapped to priority.
*   **CSS Classes:**
    ```css
    .badge {
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-high {
      background: rgba(220, 38, 38, 0.1);
      color: #DC2626;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .badge-mid {
      background: rgba(245, 158, 11, 0.1);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-low {
      background: var(--surface-2);
      color: var(--text-2);
      border: 1px solid var(--border);
    }
    ```

### 2.4 Tables (`.table`)
*   **Audit Decision:** **STANDARDIZE**
*   **Specification:** No gridlines. Left-aligned data, right-aligned numbers. Header columns styled with `font-mono text-xs uppercase`.

### 2.5 Navigation Bar (`.app-nav`)
*   **Audit Decision:** **MODIFY**
*   **Specification:** Top horizontal layout styled in high-contrast charcoal and white. Active tab marked with a solid underline, avoiding purple backgrounds or neon highlights.

### 2.6 Forms (`.form-group`)
*   **Audit Decision:** **STANDARDIZE**
*   **Specification:** Input boxes must have 1px solid borders, focusing to solid black outline, with generous text labels set in standard Inter regular.
