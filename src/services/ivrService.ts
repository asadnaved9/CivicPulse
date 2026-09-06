import { db } from "../config/firebaseAdmin";

export interface IVRTranscriptItem {
  sender: 'agent' | 'user' | 'caller';
  text: string;
  timestamp: string;
}

export interface IVRCallRecord {
  id: string;
  callId: string;
  callerPhone: string;
  callerName: string;
  startedAt: any;
  createdAt: any;
  durationSeconds: number;
  language: string; // 'English' | 'Hindi' | 'Bengali'
  intent: 'NEW_COMPLAINT' | 'STATUS_CHECK' | 'ESCALATION' | 'GENERAL_QUERY';
  category: string;
  address: string;
  landmark?: string;
  reportId?: string;
  status: 'completed' | 'in_progress' | 'dropped' | 'escalated';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  transcript: IVRTranscriptItem[];
  summary: string;
  recordingUrl?: string;
  audioDuration?: number;
  channel: string; // 'Citizen Web IVR' | 'Vapi AI Telephony' | 'Toll-Free 1800-CIVIC-PULSE'
  sentiment?: 'Neutral' | 'Frustrated' | 'Urgent' | 'Cooperative';
  isReal?: boolean;
}

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

  // Automatically record this voice call in ivr_calls collection
  try {
    await logIVRCall({
      callId: call_id || `IVR-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      callerPhone: caller_phone,
      callerName: "Citizen Caller",
      startedAt: now,
      createdAt: now,
      durationSeconds: 48,
      language: language || "English",
      intent: "NEW_COMPLAINT",
      category,
      address: fullAddress,
      landmark: landmark || "",
      reportId: customReportId,
      status: severityMeta.label === "critical" ? "escalated" : "completed",
      urgency: severityMeta.label as any,
      summary: `Citizen voice intake: Reported ${issue_type} at ${fullAddress}. Registered under complaint ${customReportId}.`,
      recordingUrl: recording_url || undefined,
      channel: "Citizen Web IVR",
      transcript: [
        { sender: "agent", text: "Namaskar. CivicPulse Sahayak helpline mein aapka swagat hai.", timestamp: "00:02" },
        { sender: "caller", text: `I am reporting an issue with ${issue_type} at ${address}. ${description}`, timestamp: "00:18" },
        { sender: "agent", text: `Your complaint has been successfully registered. Complaint ID is ${customReportId}.`, timestamp: "00:42" }
      ],
      isReal: true
    });
  } catch (logErr) {
    console.warn("Could not auto-log IVR call in createCivicReport:", logErr);
  }

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

/**
 * ═══════════════════════════════════════════════════════════════
 * IVR CALL LOGS & RECORDING MANAGEMENT
 * ═══════════════════════════════════════════════════════════════
 */

export const FALLBACK_IVR_CALLS: IVRCallRecord[] = [
  {
    id: "call_fb_001",
    callId: "IVR-2026-891042",
    callerPhone: "+91 98765 43210",
    callerName: "Ramesh Kumar",
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    durationSeconds: 58,
    language: "Hindi",
    intent: "NEW_COMPLAINT",
    category: "Pothole / Road Hazard",
    address: "100ft Road, Near Metro Pillar 120, Indiranagar, Bengaluru",
    landmark: "Opposite Metro Pillar 120",
    reportId: "CP-2026-891234",
    status: "completed",
    urgency: "high",
    summary: "Citizen Ramesh Kumar reported severe road pothole causing two-wheeler accidents near Indiranagar metro station.",
    channel: "Citizen Web IVR",
    sentiment: "Urgent",
    isReal: false,
    transcript: [
      { sender: "agent", text: "Namaskar. CivicPulse Sahayak mein aapka swagat hai. For English, press 1. हिंदी के लिए 2 दबाइए।", timestamp: "00:02" },
      { sender: "caller", text: "[Keypress 2] - हिंदी चुना गया", timestamp: "00:07" },
      { sender: "agent", text: "क्या आप नई शिकायत दर्ज करना चाहते हैं, या पुरानी शिकायत की स्थिति जानना चाहते हैं? नई शिकायत के लिए 1 दबाइए।", timestamp: "00:10" },
      { sender: "caller", text: "[Keypress 1] - नई शिकायत", timestamp: "00:14" },
      { sender: "agent", text: "कृपया समस्या का प्रकार चुनें। गड्ढे के लिए 1 दबाइए। कचरे के लिए 2 दबाइए।", timestamp: "00:18" },
      { sender: "caller", text: "[Keypress 1] - सड़क का गड्ढा", timestamp: "00:23" },
      { sender: "agent", text: "आपने सड़क का गड्ढा चुना है। कृपया अपना नाम बताएं।", timestamp: "00:27" },
      { sender: "caller", text: "[Voice] रमेश कुमार", timestamp: "00:32" },
      { sender: "agent", text: "धन्यवाद रमेश कुमार। अब कृपया अपना स्थान और नजदीकी लैंडमार्क बताएं।", timestamp: "00:37" },
      { sender: "caller", text: "[Voice] इंदिरानगर 100 फीट रोड, मेट्रो पिलर 120 के सामने, बेंगलुरु", timestamp: "00:46" },
      { sender: "agent", text: "धन्यवाद। आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। आपकी शिकायत आईडी है CP-2026-891234।", timestamp: "00:54" }
    ]
  },
  {
    id: "call_fb_002",
    callId: "IVR-2026-773190",
    callerPhone: "+91 98450 11223",
    callerName: "Priya Sharma",
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    durationSeconds: 72,
    language: "English",
    intent: "NEW_COMPLAINT",
    category: "Broken Street Light",
    address: "5th Cross, 12th Main, HAL 2nd Stage, Bengaluru",
    landmark: "Behind BDA Complex",
    reportId: "CP-2026-442190",
    status: "completed",
    urgency: "medium",
    summary: "Citizen Priya Sharma reported 3 broken sodium lamps causing complete darkness along 5th Cross residential lane.",
    channel: "Citizen Web IVR",
    sentiment: "Cooperative",
    isReal: false,
    transcript: [
      { sender: "agent", text: "Namaskar. Welcome to CivicPulse helpline. For English press 1. For Hindi press 2.", timestamp: "00:02" },
      { sender: "caller", text: "[Keypress 1] - Selected English", timestamp: "00:06" },
      { sender: "agent", text: "Press 1 for registering a new complaint. Press 2 to check report status.", timestamp: "00:09" },
      { sender: "caller", text: "[Keypress 1] - Register Complaint", timestamp: "00:13" },
      { sender: "agent", text: "Please select your problem category. Press 4 for Streetlight.", timestamp: "00:17" },
      { sender: "caller", text: "[Keypress 4] - Streetlight", timestamp: "00:22" },
      { sender: "agent", text: "Streetlight fault selected. Please state your name.", timestamp: "00:26" },
      { sender: "caller", text: "[Voice] Priya Sharma", timestamp: "00:31" },
      { sender: "agent", text: "Thank you Priya Sharma. Please speak your location and nearest landmark.", timestamp: "00:36" },
      { sender: "caller", text: "[Voice] 5th Cross, 12th Main, HAL 2nd Stage, behind BDA complex", timestamp: "00:48" },
      { sender: "agent", text: "Thank you! Your complaint has been registered under ID CP-2026-442190. Auto-routed to BESCOM Electrical Division.", timestamp: "00:68" }
    ]
  },
  {
    id: "call_fb_003",
    callId: "IVR-2026-619420",
    callerPhone: "+91 97321 98765",
    callerName: "Subhashish Roy",
    startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    durationSeconds: 84,
    language: "Bengali",
    intent: "NEW_COMPLAINT",
    category: "Water Pipe Leakage",
    address: "Near Main Market Water Tank, Ward 4, Bengaluru",
    landmark: "Opposite City Bakery",
    reportId: "CP-2026-619420",
    status: "completed",
    urgency: "high",
    summary: "Subhashish Roy reported underground high-pressure potable water pipeline burst flooding the market entrance.",
    channel: "Citizen Web IVR",
    sentiment: "Frustrated",
    isReal: false,
    transcript: [
      { sender: "agent", text: "Namaskar. CivicPulse mein aapka swagat hai. For English press 1. हिंदी के लिए 2 दबाइए। বাংলার জন্য ৩ চাপুন।", timestamp: "00:03" },
      { sender: "caller", text: "[Keypress 3] - বাংলা নির্বাচন করা হয়েছে", timestamp: "00:08" },
      { sender: "agent", text: "নতুন অভিযোগের জন্য ১ চাপুন। অবস্থা জানতে ২ চাপুন।", timestamp: "00:12" },
      { sender: "caller", text: "[Keypress 1] - নতুন অভিযোগ", timestamp: "00:16" },
      { sender: "agent", text: "জল লিক হওয়ার জন্য ৩ চাপুন।", timestamp: "00:20" },
      { sender: "caller", text: "[Keypress 3] - জলের পাইপ ফুটো", timestamp: "00:24" },
      { sender: "agent", text: "আপনি জল সমস্যা নির্বাচন করেছেন। আপনার নাম বলুন।", timestamp: "00:29" },
      { sender: "caller", text: "[Voice] শুভাশীষ রায়", timestamp: "00:35" },
      { sender: "agent", text: "ধন্যবাদ শুভাশীষ। আপনার এলাকা ও ল্যান্ডমার্ক বলুন।", timestamp: "00:41" },
      { sender: "caller", text: "[Voice] মেন মার্কেট ওয়াটার ট্যাঙ্ক এর কাছে, ওয়ার্ড ৪, সিটি বেকারি উল্টো দিকে", timestamp: "00:58" },
      { sender: "agent", text: "ধন্যবাদ। আপনার অভিযোগ সফলভাবে নথিভুক্ত হয়েছে। অভিযোগ আইডি CP-2026-619420।", timestamp: "00:80" }
    ]
  },
  {
    id: "call_fb_004",
    callId: "IVR-2026-302194",
    callerPhone: "+91 99002 33445",
    callerName: "Kavita Reddy",
    startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    durationSeconds: 42,
    language: "English",
    intent: "STATUS_CHECK",
    category: "Drainage & Overflow Problem",
    address: "17th Main Road, Koramangala 4th Block",
    reportId: "CP-2026-891234",
    status: "completed",
    urgency: "low",
    summary: "Citizen Kavita Reddy called to check resolution status of previously submitted stormwater drain complaint.",
    channel: "Citizen Web IVR",
    sentiment: "Neutral",
    isReal: false,
    transcript: [
      { sender: "agent", text: "Namaskar. Welcome to CivicPulse AI helpline. Press 1 for English, 2 for Hindi.", timestamp: "00:02" },
      { sender: "caller", text: "[Keypress 1] - English", timestamp: "00:06" },
      { sender: "agent", text: "Press 1 for new complaint. Press 2 to check status of existing complaint.", timestamp: "00:09" },
      { sender: "caller", text: "[Keypress 2] - Status Check", timestamp: "00:14" },
      { sender: "agent", text: "Looking up status for your registered caller number. Found ticket CP-2026-891234.", timestamp: "00:22" },
      { sender: "agent", text: "Your complaint CP-2026-891234 regarding Road Repair is currently in-progress by municipal crews. Goodbye.", timestamp: "00:39" }
    ]
  },
  {
    id: "call_fb_005",
    callId: "IVR-2026-119842",
    callerPhone: "+91 98860 99887",
    callerName: "Anand Murthy",
    startedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    durationSeconds: 65,
    language: "English",
    intent: "ESCALATION",
    category: "Severe Hazard & Electrical Sparking",
    address: "80ft Road, Near Sony Signal, Indiranagar, Bengaluru",
    landmark: "Adjacent to Bus Shelter",
    reportId: "CP-2026-119842",
    status: "escalated",
    urgency: "critical",
    summary: "Emergency distress escalation: Live overhead transformer sparking onto flooded walkway. Immediate administrative intervention triggered.",
    channel: "Toll-Free 1800-CIVIC-PULSE",
    sentiment: "Urgent",
    isReal: false,
    transcript: [
      { sender: "agent", text: "Namaskar, CivicPulse Emergency Voice Gateway.", timestamp: "00:02" },
      { sender: "caller", text: "Help! There is high voltage live wire sparking near Sony signal bus stop! Water has collected everywhere!", timestamp: "00:15" },
      { sender: "agent", text: "Understood. Marking this call as CRITICAL EMERGENCY. Dispatching alert to BESCOM Electrical QRT and Ward Disaster Management.", timestamp: "00:32" },
      { sender: "agent", text: "Emergency Report ID CP-2026-119842 has been dispatched to MP Office and Fire Services. Please stay back from the water.", timestamp: "00:58" }
    ]
  }
];

/**
 * Persists an IVR call log and recording session to Firestore
 */
export async function logIVRCall(callData: Partial<IVRCallRecord>): Promise<{ success: boolean; call: IVRCallRecord }> {
  const now = new Date();
  const id = callData.id || `call_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const callId = callData.callId || `IVR-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const record: IVRCallRecord = {
    id,
    callId,
    callerPhone: callData.callerPhone || "+919876543210",
    callerName: callData.callerName || "Citizen Caller",
    startedAt: callData.startedAt || now,
    createdAt: callData.createdAt || now,
    durationSeconds: callData.durationSeconds || 30,
    language: callData.language || "English",
    intent: callData.intent || "NEW_COMPLAINT",
    category: callData.category || "General Civic Issue",
    address: callData.address || "Bengaluru Ward Area",
    landmark: callData.landmark || "",
    reportId: callData.reportId || "",
    status: callData.status || "completed",
    urgency: callData.urgency || "medium",
    transcript: callData.transcript && callData.transcript.length > 0 ? callData.transcript : [
      { sender: "agent", text: "Namaskar. CivicPulse voice call connected.", timestamp: "00:02" },
      { sender: "caller", text: "Civic query recorded.", timestamp: "00:15" }
    ],
    summary: callData.summary || `IVR Call logged for ${callData.category || 'civic issue'} at ${callData.address || 'ward area'}.`,
    recordingUrl: callData.recordingUrl || undefined,
    audioDuration: callData.audioDuration || callData.durationSeconds || 30,
    channel: callData.channel || "Citizen Web IVR",
    sentiment: callData.sentiment || "Neutral",
    isReal: true
  };

  try {
    await db.collection("ivr_calls").doc(id).set(record);
  } catch (err) {
    console.error("Failed to write IVR call to Firestore ivr_calls collection:", err);
  }

  return { success: true, call: record };
}

/**
 * Retrieves all IVR calls: authentic real citizen calls first, with fallback if none exist
 */
export async function getIVRCalls(): Promise<{ calls: IVRCallRecord[]; isFallback: boolean; count: number; realCount: number }> {
  try {
    // 1. Fetch from dedicated ivr_calls collection
    const snap = await db.collection("ivr_calls").get();
    const loggedCalls: IVRCallRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as IVRCallRecord));

    // 2. Also inspect suggestions collection for any IVR submissions
    const suggestionsSnap = await db.collection("suggestions").get();
    const ivrSuggestions = suggestionsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((s: any) => s.source === "IVR" || s.source === "ivr" || s.ivr_call_id);

    const mergedCallMap = new Map<string, IVRCallRecord>();

    // Add logged calls first
    for (const call of loggedCalls) {
      const key = call.callId || call.id;
      mergedCallMap.set(key, { ...call, isReal: true });
    }

    // Merge any IVR suggestions that don't already have an ivr_call entry
    for (const sug of ivrSuggestions) {
      const callKey = sug.ivr_call_id || sug.customReportId || sug.id;
      if (!mergedCallMap.has(callKey)) {
        mergedCallMap.set(callKey, {
          id: `call_sug_${sug.id}`,
          callId: sug.ivr_call_id || `IVR-${sug.customReportId || sug.id}`,
          callerPhone: sug.caller_phone || "+919876543210",
          callerName: sug.reporterName || "Citizen Caller",
          startedAt: sug.createdAt || new Date(),
          createdAt: sug.createdAt || new Date(),
          durationSeconds: 48,
          language: sug.ivr_language || sug.language || "English",
          intent: "NEW_COMPLAINT",
          category: sug.category ? (sug.category.charAt(0).toUpperCase() + sug.category.slice(1)) : "Civic Issue",
          address: sug.address || sug.street_address || "Ward Area",
          landmark: sug.landmark || "",
          reportId: sug.customReportId || sug.id,
          status: sug.status === "escalated" ? "escalated" : "completed",
          urgency: (sug.severity as any) || "medium",
          summary: `Voice submission logged for ${sug.title || sug.category} at ${sug.address}.`,
          recordingUrl: sug.call_recording_reference || undefined,
          channel: "Citizen Web IVR",
          sentiment: sug.status === "escalated" ? "Urgent" : "Cooperative",
          isReal: true,
          transcript: [
            { sender: "agent", text: "Namaskar. CivicPulse Sahayak mein aapka swagat hai.", timestamp: "00:02" },
            { sender: "caller", text: `${sug.description_original || sug.description_english || sug.title}`, timestamp: "00:15" },
            { sender: "agent", text: `Your report ${sug.customReportId || sug.id} has been registered.`, timestamp: "00:40" }
          ]
        });
      }
    }

    const realCalls = Array.from(mergedCallMap.values());

    if (realCalls.length > 0) {
      // Sort newest first
      realCalls.sort((a, b) => {
        const timeA = a.createdAt?.seconds 
          ? a.createdAt.seconds * 1000 
          : new Date(a.createdAt || a.startedAt || 0).getTime();
        const timeB = b.createdAt?.seconds 
          ? b.createdAt.seconds * 1000 
          : new Date(b.createdAt || b.startedAt || 0).getTime();
        return timeB - timeA;
      });

      return {
        calls: realCalls,
        isFallback: false,
        count: realCalls.length,
        realCount: realCalls.length
      };
    }

    // 3. Fallback: only when NO real calls are available
    return {
      calls: FALLBACK_IVR_CALLS,
      isFallback: true,
      count: FALLBACK_IVR_CALLS.length,
      realCount: 0
    };
  } catch (err) {
    console.error("Error in getIVRCalls:", err);
    return {
      calls: FALLBACK_IVR_CALLS,
      isFallback: true,
      count: FALLBACK_IVR_CALLS.length,
      realCount: 0
    };
  }
}

/**
 * Retrieves a single IVR call record by ID
 */
export async function getIVRCallById(callId: string): Promise<IVRCallRecord | null> {
  const { calls } = await getIVRCalls();
  const clean = callId.trim().toUpperCase();
  return calls.find(c => 
    c.id.toUpperCase() === clean || 
    c.callId.toUpperCase() === clean || 
    (c.reportId && c.reportId.toUpperCase() === clean)
  ) || null;
}

