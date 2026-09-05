# CivicPulse IVR System - Testing & Validation Guide

This document explains how to execute unit tests, integration tests, webhook mocking, and End-to-End call simulations for the CivicPulse IVR system.

---

## 1. Running Automated Test Suite

CivicPulse includes a comprehensive automated test suite in `tests/ivr.test.ts` covering 14 critical test scenarios plus 1 End-to-End call simulation script.

### Running the Test Suite

Execute the test suite using `npx tsx`:

```bash
npx tsx tests/ivr.test.ts
```

Output highlights test execution status for each module:

```text
==================================================
  CivicPulse IVR System - Test Suite Execution
==================================================
✔ [SCENARIO 1]  Create report with full required fields
✔ [SCENARIO 2]  Create report with missing optional fields (uses safe defaults)
✔ [SCENARIO 3]  Format custom Report ID correctly (CP-YYYY-XXXXXX)
✔ [SCENARIO 4]  Duplicate detection for same area & category within 24 hours
✔ [SCENARIO 5]  Get report status with valid report ID
✔ [SCENARIO 6]  Get report status with invalid/non-existent report ID
✔ [SCENARIO 7]  Update report with additional caller information
✔ [SCENARIO 8]  Update report with non-existent ID fails gracefully
✔ [SCENARIO 9]  Escalate report to emergency queue & create notification
✔ [SCENARIO 10] Escalate report with missing fields creates default urgent report
✔ [SCENARIO 11] Webhook tool routing for create_civic_report
✔ [SCENARIO 12] Webhook secret authentication header verification (401 vs 200)
✔ [SCENARIO 13] Bilingual language prompt verification in Assistant config
✔ [SCENARIO 14] Edge case handling (empty strings, corrupt payloads, broken JSON)
✔ [E2E FLOW]   Simulated complete citizen voice call flow (Creation -> Query -> Escalation)
==================================================
ALL 15 TEST SCENARIOS PASSED SUCCESSFULLY! (100%)
==================================================
```

---

## 2. Webhook Testing with Curl / Postman

You can manually trigger Vapi tool call webhooks to verify server behavior:

### 1. Test `create_civic_report` Tool Call
```bash
curl -X POST "http://localhost:5000/api/ivr/vapi-tool" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "call": {
        "id": "call_test_123",
        "customer": { "number": "+919876543210" }
      },
      "toolCalls": [
        {
          "id": "tool_01",
          "function": {
            "name": "create_civic_report",
            "arguments": {
              "issue_type": "Water Supply Issue",
              "description": "No drinking water supply in ward 12 since morning",
              "address": "Brigade Road, Ward 12",
              "severity": "high"
            }
          }
        }
      ]
    }
  }'
```

### 2. Test `get_civic_report_status` Tool Call
```bash
curl -X POST "http://localhost:5000/api/ivr/vapi-tool" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "call": {
        "id": "call_test_123",
        "customer": { "number": "+919876543210" }
      },
      "toolCalls": [
        {
          "id": "tool_02",
          "function": {
            "name": "get_civic_report_status",
            "arguments": {
              "report_id": "CP-2026-123456"
            }
          }
        }
      ]
    }
  }'
```

### 3. Test Emergency Escalation Tool Call
```bash
curl -X POST "http://localhost:5000/api/ivr/vapi-tool" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "call": {
        "id": "call_test_123",
        "customer": { "number": "+919876543210" }
      },
      "toolCalls": [
        {
          "id": "tool_03",
          "function": {
            "name": "escalate_civic_report",
            "arguments": {
              "report_id": "CP-2026-123456",
              "urgency_reason": "Burst pipe flooding local sub-station transformer"
            }
          }
        }
      ]
    }
  }'
```

---

## 3. End-to-End Voice Simulation Test

The end-to-end voice simulation in `tests/ivr.test.ts` executes a 3-step citizen call journey:

1. **Step 1: Citizen calls IVR & logs report**
   - Vapi triggers `create_civic_report`.
   - IVR Service generates `CP-2026-XXXXXX` and creates Firestore suggestion document with `source: "IVR"`.
2. **Step 2: Citizen calls back to check status**
   - Vapi triggers `get_civic_report_status`.
   - Backend retrieves document and returns human-friendly voice response.
3. **Step 3: Issue becomes critical; Citizen requests escalation**
   - Vapi triggers `escalate_civic_report`.
   - Backend updates status, sets `priority: "emergency"`, `isEscalated: true`, and emits urgent MP notification.

---

## 4. Verification & Type Check Commands

```bash
# Run TypeScript compilation and typecheck
npm run lint

# Run Vite build to verify production bundling
npm run build
```
