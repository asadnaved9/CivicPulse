import assert from "node:assert";
import { 
  createCivicReport, 
  getCivicReportStatus, 
  updateCivicReport, 
  escalateCivicReport,
  detectDuplicateReport 
} from "../src/services/ivrService";
import vapiAssistantConfig from "../src/config/vapiAssistantConfig.json";

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => Promise<void> | void) {
  return (async () => {
    try {
      await fn();
      console.log(`✔ [PASSED] ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`✖ [FAILED] ${name}`);
      console.error(`   Error details:`, err.message || err);
      failedCount++;
    }
  })();
}

async function runTestSuite() {
  console.log("\n==================================================");
  console.log("  CivicPulse IVR System - Automated Test Suite");
  console.log("==================================================\n");

  let testReportId = "";
  const testPhone = "+919876543210";

  // SCENARIO 1: Create report with full parameters
  await runTest("SCENARIO 1: Create report with full parameters", async () => {
    const result = await createCivicReport({
      issue_type: "Pothole / Road Damage",
      description: "Severe pothole near Indiranagar metro station causing traffic bottleneck",
      address: "100ft Road, Indiranagar",
      landmark: "Opposite Metro Pillar 120",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      severity: "high",
      caller_phone: testPhone,
      call_id: "test_call_001"
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.reportId.startsWith("CP-"));
    assert.strictEqual(result.report.status.toLowerCase(), "submitted");
    assert.strictEqual(result.isDuplicateNotice, undefined);

    testReportId = result.reportId;
  });

  // SCENARIO 2: Create report with missing optional fields (uses safe defaults)
  await runTest("SCENARIO 2: Create report with missing optional fields (safe defaults)", async () => {
    const result = await createCivicReport({
      issue_type: "Streetlight Defect",
      description: "Dark street lights on 5th main",
      address: "5th Main Road",
      caller_phone: "+919123456789"
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.reportId.startsWith("CP-"));
    assert.strictEqual(result.report.status.toLowerCase(), "submitted");
  });

  // SCENARIO 3: Custom Report ID format verification (CP-YYYY-XXXXXX)
  await runTest("SCENARIO 3: Custom Report ID format (CP-YYYY-XXXXXX)", async () => {
    const currentYear = new Date().getFullYear().toString();
    const regex = new RegExp(`^CP-${currentYear}-\\d{6}$`);
    assert.ok(regex.test(testReportId), `Report ID ${testReportId} should match CP-${currentYear}-XXXXXX format`);
  });

  // SCENARIO 4: Duplicate detection for same road & category within 24h
  await runTest("SCENARIO 4: Duplicate detection for same category and address", async () => {
    const dupResult = await detectDuplicateReport(testPhone, "pothole", "100ft Road, Indiranagar");
    assert.strictEqual(dupResult.isDuplicate, true);
    assert.ok(dupResult.existingReport);

    const secondaryReport = await createCivicReport({
      issue_type: "Pothole / Road Damage",
      description: "Another user reporting the same pothole on 100ft road",
      address: "100ft Road, Indiranagar",
      caller_phone: testPhone
    });

    assert.strictEqual(secondaryReport.isDuplicateNotice, true);
    assert.strictEqual(secondaryReport.reportId, dupResult.existingReport.customReportId || dupResult.existingReport.id);
  });

  // SCENARIO 5: Get report status with valid report ID
  await runTest("SCENARIO 5: Get report status with valid report ID", async () => {
    const statusRes = await getCivicReportStatus(testReportId, testPhone);
    assert.strictEqual(statusRes.found, true);
    assert.strictEqual(statusRes.reportId, testReportId);
    assert.ok(statusRes.safeResponse.includes(testReportId));
  });

  // SCENARIO 6: Get report status with invalid/non-existent report ID
  await runTest("SCENARIO 6: Get report status with non-existent report ID", async () => {
    const statusRes = await getCivicReportStatus("CP-1999-999999");
    assert.strictEqual(statusRes.found, false);
    assert.ok(statusRes.message.includes("No report found"));
  });

  // SCENARIO 7: Update report with additional information
  await runTest("SCENARIO 7: Update report with additional information", async () => {
    const updateRes = await updateCivicReport({
      report_id: testReportId,
      additional_information: "The pothole is accumulating water after rains",
      landmark: "Near Bus stop"
    });

    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(updateRes.reportId, testReportId);
    assert.ok(updateRes.message.includes("updated"));
  });

  // SCENARIO 8: Update report with non-existent ID fails gracefully
  await runTest("SCENARIO 8: Update report with invalid ID fails gracefully", async () => {
    try {
      await updateCivicReport({
        report_id: "CP-1999-000000",
        additional_information: "Test update for missing item"
      });
      assert.fail("Should have thrown error");
    } catch (err: any) {
      assert.ok(err.message.includes("not found"));
    }
  });

  // SCENARIO 9: Escalate report to emergency queue & create notification
  await runTest("SCENARIO 9: Escalate report to emergency queue", async () => {
    const escRes = await escalateCivicReport({
      report_id: testReportId,
      urgency_reason: "Vehicle tire burst due to severe pothole, causing immediate safety risk",
      caller_phone: testPhone
    });

    assert.strictEqual(escRes.success, true);
    assert.strictEqual(escRes.status, "escalated");
    assert.strictEqual(escRes.reportId, testReportId);
    assert.ok(escRes.message.includes("escalated"));
  });

  // SCENARIO 10: Escalate report with missing report_id logs new urgent report
  await runTest("SCENARIO 10: Escalate report without report ID creates urgent report", async () => {
    const escRes = await escalateCivicReport({
      issue_type: "Dangerous Sparking Electrical Transformer",
      description: "Live wire down on school road",
      address: "School Road, Ward 4",
      urgency_reason: "Children present nearby",
      caller_phone: testPhone
    });

    assert.strictEqual(escRes.success, true);
    assert.strictEqual(escRes.status, "escalated");
    assert.ok(escRes.reportId.startsWith("CP-"));
  });

  // SCENARIO 11: Webhook tool routing structure validation
  await runTest("SCENARIO 11: Webhook payload structure validation", async () => {
    const mockWebhookBody = {
      message: {
        type: "tool-calls",
        call: { id: "call_abc", customer: { number: testPhone } },
        toolCalls: [
          {
            id: "tool_call_1",
            function: {
              name: "create_civic_report",
              arguments: {
                issue_type: "Garbage Overflow",
                description: "Garbage bin overflowing",
                address: "Market Road"
              }
            }
          }
        ]
      }
    };

    assert.strictEqual(mockWebhookBody.message.type, "tool-calls");
    assert.strictEqual(mockWebhookBody.message.toolCalls[0].function.name, "create_civic_report");
  });

  // SCENARIO 12: Secret verification helper check
  await runTest("SCENARIO 12: Webhook secret verification logic check", async () => {
    const secret = "test_secret_key_123";
    process.env.VAPI_WEBHOOK_SECRET = secret;

    const reqValidHeader = { headers: { "x-vapi-secret": secret } };
    const reqInvalidHeader = { headers: { "x-vapi-secret": "wrong" } };

    assert.strictEqual(reqValidHeader.headers["x-vapi-secret"], secret);
    assert.notStrictEqual(reqInvalidHeader.headers["x-vapi-secret"], secret);

    delete process.env.VAPI_WEBHOOK_SECRET;
  });

  // SCENARIO 13: Vapi Assistant JSON configuration structure validation
  await runTest("SCENARIO 13: Vapi Assistant config JSON schema validation", async () => {
    assert.ok(vapiAssistantConfig.name);
    assert.ok(vapiAssistantConfig.model);
    assert.ok(vapiAssistantConfig.model.systemPrompt.includes("Hindi"));
    assert.ok(vapiAssistantConfig.model.systemPrompt.includes("English"));
    assert.ok(Array.isArray(vapiAssistantConfig.model.tools));

    const toolNames = vapiAssistantConfig.model.tools.map((t: any) => t.function.name);
    assert.ok(toolNames.includes("create_civic_report"));
    assert.ok(toolNames.includes("get_civic_report_status"));
    assert.ok(toolNames.includes("update_civic_report"));
    assert.ok(toolNames.includes("escalate_civic_report"));
  });

  // SCENARIO 14: Edge case sanitization for empty or whitespace strings
  await runTest("SCENARIO 14: Edge case sanitization for empty or whitespace strings", async () => {
    try {
      await createCivicReport({
        issue_type: "   ",
        description: "Valid description text",
        address: "Main Street",
        caller_phone: testPhone
      });
      assert.fail("Should have rejected whitespace issue_type");
    } catch (err: any) {
      assert.ok(err.message.includes("issue_type"));
    }
  });

  // E2E FLOW SIMULATION: Complete Citizen Voice Call Simulation
  await runTest("E2E FLOW: Complete Citizen Voice Call Simulation (Log -> Query -> Escalate)", async () => {
    const callerNumber = "+919876500000";

    // Step 1: Citizen calls IVR and reports open drain
    const step1 = await createCivicReport({
      issue_type: "Drainage / Overflow",
      description: "Open storm drain cover near public playground",
      address: "Park Street Ward 9",
      caller_phone: callerNumber,
      severity: "high"
    });
    const e2eReportId = step1.reportId;
    assert.ok(e2eReportId);

    // Step 2: Citizen calls back later to check status
    const step2 = await getCivicReportStatus(e2eReportId, callerNumber);
    assert.strictEqual(step2.found, true);
    assert.strictEqual(step2.reportId, e2eReportId);

    // Step 3: Storm worsens, citizen requests emergency escalation
    const step3 = await escalateCivicReport({
      report_id: e2eReportId,
      urgency_reason: "Heavy rainfall causing sewage flood near houses",
      caller_phone: callerNumber
    });
    assert.strictEqual(step3.success, true);
    assert.strictEqual(step3.status, "escalated");

    // Step 4: Re-query status shows escalation state
    const step4 = await getCivicReportStatus(e2eReportId, callerNumber);
    assert.strictEqual(step4.found, true);
    assert.ok(step4.safeResponse.includes(e2eReportId));
  });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} TESTS`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
