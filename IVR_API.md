# CivicPulse IVR System - API Reference Documentation

This document describes all IVR webhook endpoints, REST management endpoints, request/response formats, security parameters, and error handling mechanisms.

---

## Base Path
All IVR endpoints are mounted under `/api/ivr`.

---

## 1. Webhook Endpoints (Vapi AI Integration)

### `POST /api/ivr/vapi-tool` (Alias: `POST /api/ivr/webhook`)

Endpoint invoked dynamically by Vapi AI during active voice calls when tool calls are executed by the assistant.

#### Security & Authentication
- **Header**: `x-vapi-secret` or `Authorization: Bearer <VAPI_WEBHOOK_SECRET>`
- Required if `VAPI_WEBHOOK_SECRET` environment variable is defined. Returns `401 Unauthorized` if invalid.

#### Webhook Request Payload Schema (Vapi Tool Call Format)

```json
{
  "message": {
    "type": "tool-calls",
    "call": {
      "id": "call_987654321",
      "customer": {
        "number": "+919876543210"
      }
    },
    "toolCalls": [
      {
        "id": "call_tool_01",
        "function": {
          "name": "create_civic_report",
          "arguments": {
            "issue_type": "Pothole / Road Damage",
            "description": "Large dangerous pothole near the central circle causing traffic delays",
            "address": "MG Road, Indiranagar",
            "landmark": "Near SBI Bank",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
            "severity": "high"
          }
        }
      }
    ]
  }
}
```

#### Webhook Response Format Schema

```json
{
  "results": [
    {
      "toolCallId": "call_tool_01",
      "result": "Your complaint has been successfully registered. Your complaint ID is CP-2026-891234. Please keep this ID for tracking."
    }
  ]
}
```

---

## Supported Tools

### 1. `create_civic_report`
Registers a new civic issue from voice call input into the `suggestions` Firestore collection.

- **Arguments**:
  - `issue_type` (string, required): Category of civic issue (e.g. `Pothole / Road Damage`, `Garbage Accumulation`, `Streetlight Defect`, `Water Supply Issue`, `Drainage / Overflow`).
  - `description` (string, required): Specific details reported by caller.
  - `address` (string, required): Road/locality name.
  - `landmark` (string, optional): Nearby reference point.
  - `city` (string, optional, default `"Bengaluru"`).
  - `state` (string, optional, default `"Karnataka"`).
  - `pincode` (string, optional).
  - `severity` (string, optional): `low` | `medium` | `high` | `critical`.
  - `caller_phone` (string, optional): E.164 caller phone number (auto-detected from call header if omitted).

### 2. `get_civic_report_status`
Queries complaint status by ID or caller phone.

- **Arguments**:
  - `report_id` (string, required): The complaint ID (e.g. `CP-2026-891234` or Firestore document ID).
  - `caller_phone` (string, optional): Used for lookup fallback if report ID is omitted or misheard.

### 3. `update_civic_report`
Adds additional details, notes, or landmarks to an existing report.

- **Arguments**:
  - `report_id` (string, required): Complaint ID.
  - `additional_information` (string, required): Information to append.
  - `landmark` (string, optional): Updated landmark.

### 4. `escalate_civic_report`
Marks a complaint as critical/urgent, flags human officer review, and emits high-priority notification to the MP Admin dashboard.

- **Arguments**:
  - `report_id` (string, optional): Associated complaint ID (if already logged).
  - `issue_type` (string, optional): Issue category.
  - `description` (string, optional): Reason for escalation.
  - `urgency_reason` (string, required): Detailed urgency explanation.

---

## 2. Direct REST Management Endpoints

### `POST /api/ivr/report`
Direct API to create an IVR report programmatically.

- **Request Body**:
  ```json
  {
    "issue_type": "Pothole",
    "description": "Deep pothole causing accidents",
    "address": "100ft Road, Indiranagar",
    "caller_phone": "+919876543210",
    "severity": "high"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "reportId": "CP-2026-104928",
    "docId": "abc123xyz",
    "status": "Submitted",
    "isDuplicateNotice": false,
    "message": "Report created successfully"
  }
  ```

---

### `GET /api/ivr/report/:reportId?callerPhone=+919876543210`
Fetches status of a specific complaint.

- **Response**: `200 OK`
  ```json
  {
    "found": true,
    "reportId": "CP-2026-104928",
    "status": "In Progress",
    "category": "Pothole / Road Damage",
    "description": "Deep pothole causing accidents",
    "address": "100ft Road, Indiranagar",
    "created_at": "2026-09-06T00:00:00Z",
    "safeResponse": "Your complaint CP-2026-104928 regarding Pothole / Road Damage is currently In Progress."
  }
  ```

---

### `PATCH /api/ivr/report/:reportId`
Appends additional details to a report.

- **Request Body**:
  ```json
  {
    "additional_information": "Water leak is now spreading into nearby shop entrance",
    "landmark": "Opposite HDFC Bank ATM"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "reportId": "CP-2026-104928",
    "message": "Report CP-2026-104928 has been updated with additional information."
  }
  ```

---

### `POST /api/ivr/escalate`
Escalates a complaint to human admin emergency queue.

- **Request Body**:
  ```json
  {
    "report_id": "CP-2026-104928",
    "urgency_reason": "Live electrical wire hanging dangerously near water stream after storm",
    "caller_phone": "+919876543210"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "reportId": "CP-2026-104928",
    "escalated": true,
    "message": "Your emergency issue has been marked high-priority and escalated directly to the MP Ward Officer team."
  }
  ```

---

### `GET /api/ivr/assistant-config`
Returns full production Vapi Assistant configuration JSON with dynamic host serverUrl.

---

## 3. Standard Error Codes

| Status Code | Description | Solution |
| ----------- | ----------- | -------- |
| `400 Bad Request` | Missing required parameters or invalid payload structure | Verify issue_type, address, or report_id |
| `401 Unauthorized` | Invalid or missing `x-vapi-secret` header | Ensure header matches `VAPI_WEBHOOK_SECRET` |
| `404 Not Found` | Report ID does not exist in database | Double check complaint ID string |
| `429 Too Many Requests` | API Rate limit exceeded (100 req / 15 min) | Throttle automated requests |
| `500 Internal Server Error` | Database connection error or unexpected failure | Check server logs for exact stack trace |
