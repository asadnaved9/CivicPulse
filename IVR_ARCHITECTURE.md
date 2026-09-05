# CivicPulse IVR System Architecture (Vapi Integration)

This document provides a technical overview of the production IVR (Interactive Voice Response) system integrated into CivicPulse using Vapi.ai.

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Citizen Phone Call      │
                          └─────────────┬─────────────┘
                                        │ (PSTN / Cellular)
                                        ▼
                          ┌───────────────────────────┐
                          │     Vapi.ai Telephony     │
                          │   Speech-to-Text (STT)    │
                          └─────────────┬─────────────┘
                                        │
                         (AI Prompt & Language Detection)
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Vapi AI Voice Assistant │
                          │  (OpenAI GPT-4o-mini LLM) │
                          └─────────────┬─────────────┘
                                        │
                       (JSON Function Call over HTTPS)
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CivicPulse Express Backend                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/ivr/vapi-tool (Webhook Handler)                             │  │
│  │ - Verifies x-vapi-secret / signature headers                          │  │
│  │ - Extracts caller metadata (Phone Number, Call ID, Language)          │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ IVR Business Service (src/services/ivrService.ts)                    │  │
│  │ - createCivicReport()                                                 │  │
│  │ - getCivicReportStatus()                                              │  │
│  │ - updateCivicReport()                                                 │  │
│  │ - escalateCivicReport()                                               │  │
│  │ - detectDuplicateReport()                                             │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────────┐
                          │   Firestore Database      │
                          │   - suggestions (issues)  │
                          │   - notifications         │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │    Ward Admin Dashboard   │
                          │   (MP Dashboard Cockpit)  │
                          │   Source Badge: [IVR]     │
                          └───────────────────────────┘
```

---

## Key Design Principles

1. **Reusability**: Uses the existing CivicPulse Firestore `suggestions` (issues) and `notifications` data collections.
2. **Security & Boundary Isolation**:
   - Vapi never receives raw database credentials or service-role keys.
   - All tool executions pass through server-validated REST endpoints.
   - User inputs are sanitized to prevent prompt injection or script execution.
   - Webhook authentication uses `VAPI_WEBHOOK_SECRET` verification.
3. **No Invented Information**:
   - The AI Assistant is prohibited from inventing GPS coordinates or issue details.
   - The Assistant collects street, landmark, city, state, and pincode directly from the citizen.
   - Confirmation step: "Let me confirm your report. You are reporting [issue] at [location]. Is that correct?"
4. **Resiliency & Fallbacks**:
   - Automatic duplicate report detection within a 24-hour window per caller/location.
   - Fallback error messages if the backend or database is unreachable.

---

## Database Schema Extensions

IVR reports are stored in the existing `suggestions` collection with extended attributes:

| Field | Type | Description |
| :--- | :--- | :--- |
| `customReportId` | `string` | Human-readable ID (e.g., `CP-2026-849201`) |
| `source` | `string` | Set to `"IVR"` for voice calls |
| `caller_phone` | `string` | E.164 caller phone number from Vapi metadata |
| `ivr_call_id` | `string` | Unique Vapi Call ID reference |
| `ivr_language` | `string` | Detected conversation language (`English`, `Hindi`, etc.) |
| `category` | `string` | Standardized category (`pothole`, `streetlight`, `water`, `waste`, `other`) |
| `department` | `string` | Assigned municipal department |
| `priority` | `number` | Numeric urgency rating (1 to 5) |
| `severity` | `string` | Severity label (`low`, `medium`, `high`, `critical`) |
| `status` | `string` | Lifecycle status (`submitted`, `verified`, `in-progress`, `resolved`, `escalated`) |
