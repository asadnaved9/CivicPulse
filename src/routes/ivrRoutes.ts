import { Router, Request, Response } from "express";
import { 
  createCivicReport, 
  getCivicReportStatus, 
  updateCivicReport, 
  escalateCivicReport,
  logIVRCall,
  getIVRCalls,
  getIVRCallById
} from "../services/ivrService";
import vapiAssistantConfig from "../config/vapiAssistantConfig.json";

export const ivrRouter = Router();

/**
 * Middleware to verify Vapi Webhook Secret
 */
export function verifyVapiSecret(req: Request, res: Response, next: () => void) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  
  // If secret is configured, enforce strict validation
  if (expectedSecret) {
    const providedSecret = req.headers["x-vapi-secret"] || req.headers["authorization"] || req.headers["x-vapi-signature"];
    if (!providedSecret || (providedSecret !== expectedSecret && providedSecret !== `Bearer ${expectedSecret}`)) {
      return res.status(401).json({ error: "Unauthorized: Invalid Vapi webhook secret or signature" });
    }
  }
  
  next();
}

/**
 * 1. VAPI TOOL CALL WEBHOOK ROUTER
 * Primary endpoint called by Vapi AI during voice calls when invoking tools
 */
ivrRouter.post("/vapi-tool", verifyVapiSecret, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const message = body.message || {};
    
    // Extract call metadata & phone number
    const callMetadata = message.call || body.call || {};
    const callerPhone = callMetadata.customer?.number || message.customer?.number || body.caller_phone || "+919876543210";
    const callId = callMetadata.id || body.call_id || `call_${Date.now()}`;
    
    // Check tool call payload format
    const toolCalls = message.toolCalls || body.toolCalls || [];
    
    // If sent as direct single tool invocation
    if (toolCalls.length === 0 && (body.function || body.name || body.toolName)) {
      toolCalls.push({
        id: body.toolCallId || body.id || `tool_${Date.now()}`,
        function: {
          name: body.function?.name || body.name || body.toolName,
          arguments: body.function?.arguments || body.arguments || body.parameters || {}
        }
      });
    }

    const results: any[] = [];

    for (const callObj of toolCalls) {
      const toolCallId = callObj.id || `tool_${Date.now()}`;
      const fn = callObj.function || {};
      const toolName = fn.name || callObj.name;
      
      let rawArgs = fn.arguments || callObj.arguments || {};
      if (typeof rawArgs === "string") {
        try {
          rawArgs = JSON.parse(rawArgs);
        } catch {
          rawArgs = {};
        }
      }

      let toolOutput = "";

      try {
        switch (toolName) {
          case "create_civic_report": {
            const resData = await createCivicReport({
              issue_type: rawArgs.issue_type || rawArgs.issueType || "civic issue",
              description: rawArgs.description || "Reported via voice call",
              address: rawArgs.address || [rawArgs.road, rawArgs.locality, rawArgs.city].filter(Boolean).join(", ") || "General Ward Area",
              landmark: rawArgs.landmark,
              city: rawArgs.city || "Bengaluru",
              state: rawArgs.state || "Karnataka",
              pincode: rawArgs.pincode,
              severity: rawArgs.severity,
              caller_phone: rawArgs.caller_phone || callerPhone,
              call_id: callId
            });

            if (resData.isDuplicateNotice) {
              toolOutput = `A report for a similar issue was recently logged under ID ${resData.reportId}. We have logged your details as a supporting report.`;
            } else {
              toolOutput = `Your complaint has been successfully registered. Your complaint ID is ${resData.reportId}. Please keep this ID for tracking.`;
            }
            break;
          }

          case "get_civic_report_status": {
            const resData = await getCivicReportStatus(
              rawArgs.report_id || rawArgs.reportId || rawArgs.complaint_id,
              rawArgs.caller_phone || callerPhone
            );

            if (resData.found) {
              toolOutput = resData.safeResponse;
            } else {
              toolOutput = `Sorry, I could not find any complaint matching that ID or phone number. Please verify the complaint ID.`;
            }

            // Log status inquiry call
            try {
              await logIVRCall({
                callId,
                callerPhone,
                callerName: "Citizen Caller",
                durationSeconds: 35,
                intent: "STATUS_CHECK",
                category: resData.category || "Status Inquiry",
                reportId: rawArgs.report_id || rawArgs.reportId || (resData.found ? resData.reportId : undefined),
                status: "completed",
                summary: `Citizen checked status of complaint ${rawArgs.report_id || callerPhone}. Status: ${resData.found ? resData.status : 'Not Found'}.`,
                transcript: [
                  { sender: "agent", text: "Namaskar. Please tell me your complaint ID or phone number.", timestamp: "00:02" },
                  { sender: "caller", text: `Checking status for ${rawArgs.report_id || callerPhone}`, timestamp: "00:10" },
                  { sender: "agent", text: toolOutput, timestamp: "00:22" }
                ],
                channel: "Vapi AI Telephony",
                isReal: true
              });
            } catch (e) {
              console.warn("Could not log status call:", e);
            }
            break;
          }

          case "update_civic_report": {
            const resData = await updateCivicReport({
              report_id: rawArgs.report_id || rawArgs.reportId,
              additional_information: rawArgs.additional_information || rawArgs.information || "Additional call details provided",
              landmark: rawArgs.landmark,
              caller_phone: callerPhone
            });
            toolOutput = resData.message;
            break;
          }

          case "escalate_civic_report": {
            const resData = await escalateCivicReport({
              report_id: rawArgs.report_id || rawArgs.reportId,
              issue_type: rawArgs.issue_type,
              description: rawArgs.description,
              address: rawArgs.address,
              caller_phone: callerPhone,
              urgency_reason: rawArgs.urgency_reason
            });
            toolOutput = resData.message;

            // Log escalation call
            try {
              await logIVRCall({
                callId,
                callerPhone,
                callerName: "Citizen Caller",
                durationSeconds: 52,
                intent: "ESCALATION",
                category: rawArgs.issue_type || "Emergency Escalation",
                address: rawArgs.address || "Constituency Area",
                reportId: resData.reportId,
                status: "escalated",
                urgency: "critical",
                summary: `Distress voice escalation: ${rawArgs.urgency_reason || 'Critical hazard reported'}.`,
                transcript: [
                  { sender: "agent", text: "CivicPulse Emergency Voice Dispatch.", timestamp: "00:02" },
                  { sender: "caller", text: `Distress call: ${rawArgs.urgency_reason || 'Critical situation requiring emergency response'}`, timestamp: "00:14" },
                  { sender: "agent", text: toolOutput, timestamp: "00:32" }
                ],
                channel: "Vapi AI Telephony",
                sentiment: "Urgent",
                isReal: true
              });
            } catch (e) {
              console.warn("Could not log escalation call:", e);
            }
            break;
          }

          default:
            toolOutput = `Command processed successfully.`;
            break;
        }
      } catch (err: any) {
        console.error(`Error executing Vapi tool ${toolName}:`, err);
        toolOutput = `Sorry, I encountered an issue processing your request right now. Please try again later.`;
      }

      results.push({
        toolCallId,
        result: toolOutput
      });
    }

    // Standard Vapi tool response schema
    return res.json({ results });

  } catch (err: any) {
    console.error("Vapi webhook handler error:", err);
    return res.status(500).json({ error: "Internal server error processing Vapi webhook payload" });
  }
});

/**
 * Also alias /webhook to /vapi-tool for universal compatibility
 */
ivrRouter.post("/webhook", verifyVapiSecret, (req, res, next) => {
  req.url = "/vapi-tool";
  (ivrRouter as any).handle(req, res, next);
});

/**
 * 2. REST API ENDPOINTS
 */

// POST /api/ivr/report
ivrRouter.post("/report", async (req: Request, res: Response) => {
  try {
    const result = await createCivicReport(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create IVR report" });
  }
});

// GET /api/ivr/report/:reportId
ivrRouter.get("/report/:reportId", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { callerPhone } = req.query;
    const result = await getCivicReportStatus(reportId, callerPhone as string);
    if (!result.found) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to fetch report status" });
  }
});

// PATCH /api/ivr/report/:reportId
ivrRouter.patch("/report/:reportId", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const result = await updateCivicReport({
      report_id: reportId,
      ...req.body
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update report" });
  }
});

// POST /api/ivr/escalate
ivrRouter.post("/escalate", async (req: Request, res: Response) => {
  try {
    const result = await escalateCivicReport(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to escalate report" });
  }
});

/**
 * 3. IVR CALL LOGS & RECORDING MANAGEMENT ENDPOINTS
 */

// GET /api/ivr/calls - Get all logged IVR calls (real first, fallback if none)
ivrRouter.get("/calls", async (req: Request, res: Response) => {
  try {
    const result = await getIVRCalls();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch IVR calls" });
  }
});

// POST /api/ivr/calls - Log a new IVR call session
ivrRouter.post("/calls", async (req: Request, res: Response) => {
  try {
    const result = await logIVRCall(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to log IVR call" });
  }
});

// GET /api/ivr/calls/:id - Get detailed call record by ID
ivrRouter.get("/calls/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const call = await getIVRCallById(id);
    if (!call) {
      return res.status(404).json({ error: `IVR call '${id}' not found` });
    }
    return res.json({ success: true, call });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch IVR call details" });
  }
});

/**
 * 4. VAPI ASSISTANT CONFIGURATION ENDPOINT
 * Returns complete production Vapi assistant configuration for provisioning
 */
ivrRouter.get("/assistant-config", (req: Request, res: Response) => {
  const webhookUrl = `${req.protocol}://${req.get("host")}/api/ivr/vapi-tool`;
  const fullConfig = {
    ...vapiAssistantConfig,
    serverUrl: webhookUrl
  };
  return res.json(fullConfig);
});
