import { Ollama } from 'ollama';
import { screenCivicPrompt } from '../utils/civicGuardrail';

export interface EdgeClassification {
  type: 'CIVIC_ISSUE' | 'DEVELOPMENT_NEED';
  category: string;
  urgency: number; // 0 to 100
  cleanedDescription: string;
  language: string;
  piiRedacted: boolean;
  tier: 'edge' | 'cloud' | 'deterministic_fallback';
  modelUsed: string;
}

const ollamaClient = new Ollama({ host: 'http://localhost:11434' });

/**
 * Check if the local edge inference daemon (Ollama) is available
 */
export async function checkEdgeHealth(): Promise<{ available: boolean; model?: string }> {
  try {
    const modelsResponse = await Promise.race([
      ollamaClient.list(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Ollama timeout')), 1500))
    ]);

    const hasGemma = modelsResponse.models.some((m: any) => 
      m.name.includes('gemma') || m.name.includes('gemma3n') || m.name.includes('llama')
    );

    return {
      available: true,
      model: hasGemma ? (modelsResponse.models[0]?.name || 'gemma3n') : 'ollama_active'
    };
  } catch (err) {
    return { available: false };
  }
}

/**
 * Deterministic keyword-based classification fallback when Ollama is unavailable
 */
export function classifyDeterministic(rawText: string): EdgeClassification {
  // ── Guardrail check ───────────────────────────────────────────────────────
  const guard = screenCivicPrompt(rawText);
  if (!guard.allowed) {
    // Return a structured refusal masquerading as a classification so callers
    // don't need a special code-path; the refusalMessage is surfaced in the
    // cleanedDescription field for API consumers.
    return {
      type: 'CIVIC_ISSUE',
      category: 'Guardrail Refusal',
      urgency: 0,
      cleanedDescription: guard.refusalMessage ?? 'Request blocked by civic guardrail.',
      language: 'en',
      piiRedacted: false,
      tier: 'deterministic_fallback',
      modelUsed: `guardrail:${guard.refusalCode ?? 'OUT_OF_DOMAIN'}`,
    };
  }
  // ─────────────────────────────────────────────────────────────────────────
  const lower = rawText.toLowerCase();

  // PII Redaction: mask phone numbers and email addresses
  const piiRedactedText = rawText
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REDACTED]');

  let type: 'CIVIC_ISSUE' | 'DEVELOPMENT_NEED' = 'CIVIC_ISSUE';
  if (
    lower.includes('build') ||
    lower.includes('need a new') ||
    lower.includes('construct') ||
    lower.includes('request for') ||
    lower.includes('clinic') ||
    lower.includes('school') ||
    lower.includes('sub-health') ||
    lower.includes('kiosk') ||
    lower.includes('development')
  ) {
    type = 'DEVELOPMENT_NEED';
  }

  let category = 'General Infrastructure';
  if (lower.includes('pothole') || lower.includes('road') || lower.includes('footpath') || lower.includes('traffic') || lower.includes('bus')) {
    category = 'Roads & Transit';
  } else if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('drain') || lower.includes('sewage')) {
    category = 'Water & Sewage';
  } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('clean')) {
    category = 'Sanitation & Waste';
  } else if (lower.includes('clinic') || lower.includes('hospital') || lower.includes('doctor') || lower.includes('medicine') || lower.includes('health')) {
    category = 'Healthcare & Clinics';
  } else if (lower.includes('light') || lower.includes('lamp') || lower.includes('dark') || lower.includes('electricity') || lower.includes('wire')) {
    category = 'Electricity & Lighting';
  } else if (lower.includes('school') || lower.includes('college') || lower.includes('education') || lower.includes('student')) {
    category = 'Education & Schools';
  }

  let urgency = 60;
  if (lower.includes('urgent') || lower.includes('danger') || lower.includes('hazard') || lower.includes('accident') || lower.includes('emergency')) {
    urgency = 92;
  } else if (lower.includes('flood') || lower.includes('broken') || lower.includes('rupture')) {
    urgency = 85;
  }

  return {
    type,
    category,
    urgency,
    cleanedDescription: piiRedactedText.trim(),
    language: 'en',
    piiRedacted: piiRedactedText !== rawText,
    tier: 'deterministic_fallback',
    modelUsed: 'deterministic_keyword_engine'
  };
}

/**
 * Executes on-device sovereign classification via Ollama (Gemma 3n)
 * Falls back to deterministic classification if Ollama is not responding
 */
export async function classifyOnDevice(rawText: string): Promise<EdgeClassification> {
  // ── Guardrail check (before any AI call) ─────────────────────────────────
  const guard = screenCivicPrompt(rawText);
  if (!guard.allowed) {
    console.warn(`[EdgeInference] Guardrail blocked request (${guard.refusalCode}): "${rawText.slice(0, 80)}…"`);
    return {
      type: 'CIVIC_ISSUE',
      category: 'Guardrail Refusal',
      urgency: 0,
      cleanedDescription: guard.refusalMessage ?? 'Request blocked by civic guardrail.',
      language: 'en',
      piiRedacted: false,
      tier: 'edge',
      modelUsed: `guardrail:${guard.refusalCode ?? 'OUT_OF_DOMAIN'}`,
    };
  }
  // ─────────────────────────────────────────────────────────────────────────

  const health = await checkEdgeHealth();

  if (!health.available) {
    return classifyDeterministic(rawText);
  }

  try {
    const prompt = `You are an on-device civic intelligence classifier running locally at the edge.
Classify this citizen submission into a JSON object:
{
  "type": "CIVIC_ISSUE" or "DEVELOPMENT_NEED",
  "category": "Roads & Transit" | "Water & Sewage" | "Sanitation & Waste" | "Healthcare & Clinics" | "Electricity & Lighting" | "Education & Schools" | "General Infrastructure",
  "urgency": integer between 1 and 100,
  "cleanedDescription": "Description with any personal phone numbers or emails removed",
  "language": "en"
}
Citizen submission: "${rawText.replace(/"/g, "'")}"
Return ONLY the raw JSON object.`;

    const response = await Promise.race([
      ollamaClient.generate({
        model: health.model || 'gemma3n',
        prompt,
        format: 'json',
        stream: false
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Edge inference timeout')), 12000))
    ]);

    const parsed = JSON.parse(response.response.trim());
    return {
      type: parsed.type === 'DEVELOPMENT_NEED' ? 'DEVELOPMENT_NEED' : 'CIVIC_ISSUE',
      category: parsed.category || 'General Infrastructure',
      urgency: typeof parsed.urgency === 'number' ? parsed.urgency : 70,
      cleanedDescription: parsed.cleanedDescription || rawText,
      language: parsed.language || 'en',
      piiRedacted: true,
      tier: 'edge',
      modelUsed: health.model || 'gemma3n'
    };
  } catch (e) {
    console.warn("[EdgeInference] Local inference failed or timed out, using deterministic fallback:", e);
    return classifyDeterministic(rawText);
  }
}
