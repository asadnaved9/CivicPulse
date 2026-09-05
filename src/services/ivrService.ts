import { db } from "../config/firebaseAdmin";

export interface CreateIVRReportPayload {
  issue_type: string;
  description: string;
  address: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  severity?: "low" | "medium" | "high" | "critical" | string;
  caller_phone: string;
  call_id?: string;
  language?: string;
  recording_url?: string;
  transcript_url?: string;
  bypass_duplicate_check?: boolean;
}

export interface UpdateIVRReportPayload {
  report_id: string;
  additional_information: string;
  caller_phone?: string;
  landmark?: string;
}

export interface EscalateIVRReportPayload {
  report_id?: string;
  issue_type?: string;
  description?: string;
  address?: string;
  caller_phone: string;
  urgency_reason?: string;
}

/**
 * Normalizes input severity into standard scale (1 to 5)
 */
export function normalizeSeverity(severity?: string): { numeric: number; label: "low" | "medium" | "high" | "critical" } {
  if (!severity) return { numeric: 3, label: "medium" };
  const s = severity.toLowerCase().trim();
  if (s === "critical" || s === "5" || s === "emergency") return { numeric: 5, label: "critical" };
  if (s === "high" || s === "4") return { numeric: 4, label: "high" };
  if (s === "low" || s === "1") return { numeric: 1, label: "low" };
  return { numeric: 3, label: "medium" };
}

/**
 * Standard category mapping for CivicPulse
 */
export function mapCategory(issueType: string): { category: string; department: string } {
  const type = (issueType || "").toLowerCase();
  if (type.includes("pothole") || type.includes("road") || type.includes("street")) {
    return { category: "pothole", department: "BBMP Roads & Infrastructure" };
  }
  if (type.includes("light") || type.includes("lamp") || type.includes("dark")) {
    return { category: "streetlight", department: "BESCOM Electrical Division" };
  }
  if (type.includes("water") || type.includes("leak") || type.includes("pipe") || type.includes("sewage")) {
    return { category: "water", department: "BWSSB Water & Sanitation" };
  }
  if (type.includes("garbage") || type.includes("trash") || type.includes("waste") || type.includes("dump")) {
    return { category: "waste", department: "BBMP Solid Waste Management" };
  }
  return { category: "other", department: "Municipal Public Works" };
}

/**
 * Generates a clean human-readable report ID
 */
export function generateReportId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CP-${year}-${randomNum}`;
}

/**
 * Detects potential duplicate reports from the same caller or location in the last 24 hours
 */
export async function detectDuplicateReport(callerPhone: string, category: string, address: string) {
  try {
    const snap = await db.collection("suggestions").get();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const duplicates = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((item: any) => {
        let itemTime = 0;
        if (item.createdAt) {
          if (typeof item.createdAt.toDate === "function") {
            itemTime = item.createdAt.toDate().getTime();
          } else {
            itemTime = new Date(item.createdAt).getTime();
          }
        }
        const isRecent = !isNaN(itemTime) && (now - itemTime) < twentyFourHours;
        const isSamePhone = item.caller_phone && item.caller_phone === callerPhone;
        const cleanItemAddr = (item.street_address || item.address || "").toLowerCase();
        const cleanInputAddr = (address || "").toLowerCase();
        const isSameAddress = cleanItemAddr.length > 0 && cleanInputAddr.length > 0 && (cleanItemAddr.includes(cleanInputAddr) || cleanInputAddr.includes(cleanItemAddr));
        const isSameCategory = item.category?.toLowerCase() === category.toLowerCase();
        
        return isRecent && (isSamePhone || (isSameCategory && isSameAddress));
      });

    if (duplicates.length > 0) {
      return {
        isDuplicate: true,
        existingReport: duplicates[0]
      };
    }
  } catch (err) {
    console.error("Error checking duplicate reports:", err);
  }
  return { isDuplicate: false, existingReport: null };
}

/**
 * Creates a new civic report from an IVR call
 */
export async function createCivicReport(payload: CreateIVRReportPayload) {
  const {
    issue_type,
    description,
    address,
    landmark,
    city = "Bengaluru",
    state = "Karnataka",
    pincode,
    severity,
    caller_phone,
    call_id,
    language = "English",
    recording_url,
    transcript_url,
    bypass_duplicate_check = false
  } = payload;

  // Validation
  if (!issue_type || typeof issue_type !== "string" || issue_type.trim().length === 0) {
    throw new Error("Missing or invalid issue_type parameter.");
  }
  if (!description || typeof description !== "string" || description.trim().length === 0) {
    throw new Error("Missing or invalid description parameter.");
  }
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    throw new Error("Missing or invalid address parameter.");
  }
  if (!caller_phone || typeof caller_phone !== "string" || caller_phone.trim().length === 0) {
    throw new Error("Missing or invalid caller_phone parameter.");
  }

  const { category, department } = mapCategory(issue_type);
  const severityMeta = normalizeSeverity(severity);

  // Check duplicate unless explicitly bypassed
  if (!bypass_duplicate_check) {
    const duplicateInfo = await detectDuplicateReport(caller_phone, category, address);
    if (duplicateInfo.isDuplicate && duplicateInfo.existingReport) {
      return {
        success: true,
        isDuplicateNotice: true,
        reportId: duplicateInfo.existingReport.customReportId || duplicateInfo.existingReport.id,
        existingReport: duplicateInfo.existingReport,
        message: `A similar report (ID: ${duplicateInfo.existingReport.customReportId || duplicateInfo.existingReport.id}) was recently submitted.`
      };
    }
  }

  const customReportId = generateReportId();
  const fullAddress = [address, landmark, city, state, pincode].filter(Boolean).join(", ");
  const now = new Date();

  const newReport = {
    customReportId,
    title: `${issue_type.charAt(0).toUpperCase() + issue_type.slice(1)} Report (${city})`,
    description_original: description,
    description_english: description,
    category,
    department,
    priority: severityMeta.numeric,
    severity: severityMeta.label,
    address: fullAddress,
    street_address: address,
    landmark: landmark || "",
    city,
    state,
    pincode: pincode || "",
    ward: city.includes("Bengaluru") ? "General Constituency (Bangalore Central)" : city,
    lat: 12.9716,
    lng: 77.5946,
    caller_phone,
    source: "IVR",
    status: severityMeta.label === "critical" ? "escalated" : "submitted",
    ivr_call_id: call_id || `vapi_${Date.now()}`,
    ivr_language: language,
    call_recording_reference: recording_url || null,
    transcript_reference: transcript_url || null,
    upvotes: [],
    createdAt: now,
    updatedAt: now
  };

  const docRef = await db.collection("suggestions").add(newReport);

  // Create notifications
  const notifications = [
    {
      recipient: "Citizen",
      title: "IVR Report Registered",
      message: `Your call report regarding "${issue_type}" at ${address} has been registered. ID: ${customReportId}.`,
      timestamp: now
    },
    {
      recipient: "Ward Officer",
      title: "New IVR Voice Submission",
      message: `IVR Submission received: ${customReportId} (${category}). Severity: ${severityMeta.label.toUpperCase()}. Location: ${fullAddress}.`,
      timestamp: now
    },
    {
      recipient: "MP Office",
      title: "IVR Citizen Intake",
      message: `Voice intake logged via Vapi IVR. Auto-assigned to ${department}. Call ID: ${newReport.ivr_call_id}.`,
      timestamp: now
    }
  ];

  const batch = db.batch();
  for (const notif of notifications) {
    const nRef = db.collection("notifications").doc();
    batch.set(nRef, notif);
  }
  await batch.commit();

  return {
    success: true,
    docId: docRef.id,
    reportId: customReportId,
    report: { id: docRef.id, ...newReport }
  };
}

/**
 * Retrieves report status safely for citizen voice lookup
 */
export async function getCivicReportStatus(reportId?: string, callerPhone?: string) {
  if (!reportId && !callerPhone) {
    throw new Error("Please provide either a report ID or a caller phone number.");
  }

  const snap = await db.collection("suggestions").get();
  const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let match: any = null;

  if (reportId) {
    const cleanId = reportId.trim().toUpperCase();
    match = allDocs.find((doc: any) => 
      (doc.customReportId && doc.customReportId.toUpperCase() === cleanId) ||
      (doc.id && doc.id.toUpperCase() === cleanId)
    );
  }

  if (!match && callerPhone) {
    const cleanPhone = callerPhone.trim();
    const phoneMatches = allDocs.filter((doc: any) => doc.caller_phone === cleanPhone);
    if (phoneMatches.length > 0) {
      // Sort by newest
      phoneMatches.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      match = phoneMatches[0];
    }
  }

  if (!match) {
    return {
      found: false,
      message: `No report found matching ${reportId ? `ID ${reportId}` : `phone number ${callerPhone}`}.`
    };
  }

  // Format safe citizen-facing status message
  const statusMap: Record<string, string> = {
    suggested: "is logged and waiting for municipal assignment",
    submitted: "has been registered and queued for verification",
    verified: "is verified by municipal inspectors and scheduled for execution",
    "in-progress": "is currently under active repair by technical crews",
    resolved: "has been successfully repaired and marked resolved",
    escalated: "has been escalated to high-priority administrative review"
  };

  const statusDescription = statusMap[match.status] || "is currently processing";

  return {
    found: true,
    reportId: match.customReportId || match.id,
    title: match.title,
    category: match.category,
    status: match.status,
    department: match.department,
    createdAt: match.createdAt,
    safeResponse: `Your complaint ${match.customReportId || match.id} regarding ${match.title || match.category} ${statusDescription}.`
  };
}

/**
 * Updates an existing civic report with caller additions
 */
export async function updateCivicReport(payload: UpdateIVRReportPayload) {
  const { report_id, additional_information, landmark } = payload;
  if (!report_id) {
    throw new Error("Missing report_id parameter.");
  }
  if (!additional_information || additional_information.trim().length === 0) {
    throw new Error("Missing additional_information parameter.");
  }

  const snap = await db.collection("suggestions").get();
  const docMatch = snap.docs.find(d => 
    (d.data().customReportId && d.data().customReportId.toUpperCase() === report_id.trim().toUpperCase()) ||
    d.id === report_id
  );

  if (!docMatch) {
    throw new Error(`Report ${report_id} not found.`);
  }

  const existingData = docMatch.data();
  const updatedDesc = `${existingData.description_original || ''}\n[IVR Update ${new Date().toLocaleDateString()}]: ${additional_information}`.trim();
  
  const updates: any = {
    description_original: updatedDesc,
    description_english: updatedDesc,
    updatedAt: new Date()
  };

  if (landmark) {
    updates.landmark = landmark;
  }

  await db.collection("suggestions").doc(docMatch.id).update(updates);

  return {
    success: true,
    reportId: existingData.customReportId || docMatch.id,
    message: `Report ${existingData.customReportId || docMatch.id} has been updated with your additional details.`
  };
}

/**
 * Escalates a critical hazard to priority admin workflows
 */
export async function escalateCivicReport(payload: EscalateIVRReportPayload) {
  const { report_id, issue_type = "Critical Civic Hazard", description = "High severity distress call", address = "Unspecified location", caller_phone, urgency_reason } = payload;

  let finalReportId = report_id;

  if (!finalReportId) {
    // Create new critical report
    const created = await createCivicReport({
      issue_type,
      description: `${description}. Reason: ${urgency_reason || 'Urgent citizen escalation'}`,
      address,
      severity: "critical",
      caller_phone,
      bypass_duplicate_check: true
    });
    finalReportId = created.reportId;
  } else {
    // Escalate existing report
    const snap = await db.collection("suggestions").get();
    const docMatch = snap.docs.find(d => 
      (d.data().customReportId && d.data().customReportId.toUpperCase() === report_id.trim().toUpperCase()) ||
      d.id === report_id
    );

    if (docMatch) {
      await db.collection("suggestions").doc(docMatch.id).update({
        priority: 5,
        severity: "critical",
        status: "escalated",
        updatedAt: new Date()
      });
      finalReportId = docMatch.data().customReportId || docMatch.id;
    }
  }

  // Create Urgent Alert Notification
  const notifRef = db.collection("notifications").doc();
  await notifRef.set({
    recipient: "MP Office",
    title: "CRITICAL IVR ESCALATION",
    message: `Urgent IVR distress call escalated! Report ID: ${finalReportId}. Location: ${address}. Caller: ${caller_phone}.`,
    timestamp: new Date()
  });

  return {
    success: true,
    reportId: finalReportId,
    status: "escalated",
    message: `Your report ${finalReportId} has been marked critical and escalated directly to the Ward Administrator.`
  };
}
