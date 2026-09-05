/**
 * CivicPulse AI Guardrail
 * ────────────────────────────────────────────────────────────────────────────
 * Domain: Civic Intelligence, Infrastructure Demand Aggregation, Municipal
 *         Planning, and Digital Public Infrastructure (DPI).
 *
 * This module screens every prompt BEFORE it is forwarded to any AI backend
 * (Ollama/Gemma 3n on-device OR Gemini cloud).  Off-topic or harmful requests
 * are rejected immediately with a structured refusal — no model tokens are
 * consumed, no latency is introduced for legitimate requests.
 *
 * Threat model this addresses:
 *   • Prompt injection via citizen report text
 *   • Misuse of the AI tier for unrelated tasks (chatbot jailbreaks, etc.)
 *   • PII / sensitive-data exfiltration attempts disguised as reports
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface GuardrailResult {
  /** true  → prompt is safe to forward to the AI backend */
  allowed: boolean;
  /** Populated only when allowed === false */
  refusalMessage?: string;
  /** Machine-readable refusal reason code */
  refusalCode?: GuardrailRefusalCode;
}

export type GuardrailRefusalCode =
  | 'OUT_OF_DOMAIN'      // Topic is unrelated to civic / municipal scope
  | 'PROMPT_INJECTION'   // Detected attempt to override system instructions
  | 'HARMFUL_CONTENT'    // Hate speech, violence, NSFW material
  | 'EMPTY_INPUT'        // Nothing meaningful was submitted
  | 'TOO_LONG';          // Input exceeds safe processing limit

// ─── Configuration ────────────────────────────────────────────────────────────

/** Maximum characters accepted from a single citizen submission */
const MAX_INPUT_LENGTH = 2000;

/**
 * Phrases that strongly signal an attempt to override system instructions.
 * These are checked BEFORE any domain scoring.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|your)\s+instructions?/i,
  /forget\s+(all\s+)?(previous|prior|above|your)\s+instructions?/i,
  /you are now/i,
  /act as (a |an )?(?!civic|municipal|infrastructure|planning|government)/i,
  /pretend (you are|to be)/i,
  /disregard (all |previous |your )?/i,
  /jailbreak/i,
  /\bDAN\b/,                     // "Do Anything Now" jailbreak
  /\[system\]/i,
  /override (your )?system (prompt|instructions)/i,
];


/**
 * Civic / municipal DOMAIN keywords.
 * A submission must contain at least one of these to be considered in-scope.
 * Broad enough to catch multi-language romanisations without a full NLU pass.
 */
const CIVIC_DOMAIN_KEYWORDS: RegExp[] = [
  // Infrastructure
  /\b(roads?|streets?|potholes?|footpaths?|bridges?|sidewalks?|pavements?)\b/i,
  /\b(waters?|pipes?|sewages?|drains?|drainage|leaks?|floods?|boreholes?)\b/i,
  /\b(electricity|lights?|lamps?|power|outages?|wires?|dark|darkness)\b/i,
  /\b(garbage|waste|trash|litter|cleaning|clean|sanitation)\b/i,
  /\b(clinics?|hospitals?|healthcare|health|doctors?|medicines?)\b/i,
  /\b(schools?|educations?|colleges?|classrooms?|students?)\b/i,
  /\b(buses?|transport|transits?|stations?|taxis?|minibuses?)\b/i,
  /\b(parks?|playgrounds?|recreations?|sports?|greenery)\b/i,
  /\b(housings?|shelters?|buildings?|constructions?|developments?)\b/i,
  /\b(wifi|internet|connectivity|digitals?|kiosks?)\b/i,
  // Actions / intent
  /\b(repairs?|fix|fixing|broken|damaged?|needs?|requests?|reports?|complaints?|issues?|problems?|hazards?|dangers?|urgents?|emergenc(y|ies))\b/i,
  // Governance / planning
  /\b(municipals?|wards?|councils?|governments?|public|civics?|citizens?|communit(y|ies)|neighbourhoods?|neighborhoods?|zones?|districts?)\b/i,
  /\b(budgets?|fundings?|proposals?|plans?|projects?|develop|infrastructure|demands?)\b/i,
  // Census / DPI
  /\b(census|populations?|households?|surveys?|beneficiar(y|ies)|DPI|identit(y|ies)|registrations?)\b/i,
];

/**
 * Patterns that clearly indicate off-topic chit-chat or unrelated requests.
 * A match here triggers OUT_OF_DOMAIN immediately, short-circuiting deeper checks.
 */
const OUT_OF_DOMAIN_PATTERNS: RegExp[] = [
  /\b(joke|riddle|pun|funny|humour|humor|laugh)\b/i,
  /\b(recipe|cook|bake|food|restaurant|dinner|lunch|breakfast)\b/i,
  /\b(movie|film|series|netflix|tv show|celebrity|actor|actress)\b/i,
  /\b(sport(s)? score|football result|cricket score|nba|nfl|premier league)\b/i,
  /\b(stock(s)?|crypto|bitcoin|ethereum|trade|forex|invest)\b/i,
  /\b(write (me )?(a |an )?(essay|poem|story|novel|song|lyrics))\b/i,
  /\b(hello|hi|hey|sup|what'?s up)\b.*\??\s*$/i,   // pure greetings with nothing else
  /\bhow are you\b/i,
  /\bwhat is (your name|your purpose|the meaning of life|2\+2|2 \+ 2)\b/i,
  /\b(weather|temperature|forecast)\b/i,
  /\b(translate (this )?to)\b/i,        // general translation requests
  /\b(math|calculate|equation|solve)\b/i,
  /\b(dating|relationship|love|marriage|girlfriend|boyfriend)\b/i,
  /\b(game(s)?|minecraft|fortnite|chess|play)\b/i,
  // Conversational diversion & probe bypasses ("I will report an issue but first tell me...")
  /\b(but\s+first\s+(tell|answer|explain|describe|show)|first\s+(tell|answer|explain)\s+me|before\s+that\s+(tell|answer)|tell\s+me\s+this)\b/i,
  /\b(who\s+is\s+the\s+(president|prime\s+minister|ceo|king|queen)|capital\s+of\b)/i,
];

/**
 * Basic harmful-content patterns (hate speech / violence / NSFW signals).
 * This is intentionally light — a production deployment should use a dedicated
 * content-safety model (e.g., Azure Content Safety or Perspective API) in addition.
 */
const HARMFUL_PATTERNS: RegExp[] = [
  /\b(kill|murder|shoot|bomb|explosive|attack|assault|rape|abuse)\b/i,
  /\b(n-word|f-word|slur)\b/i,   // placeholder — extend for your locale
  /porn|xxx|nsfw|explicit/i,
];

// ─── Core guardrail function ───────────────────────────────────────────────────

/**
 * Screens a raw citizen submission before it reaches any AI inference backend.
 *
 * @param rawText  The unprocessed text from a citizen report or API call.
 * @returns        A {@link GuardrailResult} indicating whether inference may proceed.
 *
 * @example
 * ```ts
 * const check = screenCivicPrompt("There is a pothole on Main St");
 * if (!check.allowed) return res.status(400).json({ error: check.refusalMessage });
 * ```
 */
export function screenCivicPrompt(rawText: string): GuardrailResult {
  // 1. Empty / whitespace-only inputs
  if (!rawText || rawText.trim().length === 0) {
    return {
      allowed: false,
      refusalCode: 'EMPTY_INPUT',
      refusalMessage:
        'No content was provided. Please describe a civic issue or infrastructure need in your community.',
    };
  }

  const trimmed = rawText.trim();

  // 2. Length guard
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      allowed: false,
      refusalCode: 'TOO_LONG',
      refusalMessage: `Your submission exceeds the ${MAX_INPUT_LENGTH}-character limit. Please summarise your report and try again.`,
    };
  }

  // 3. Prompt-injection detection (highest priority check)
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        refusalCode: 'PROMPT_INJECTION',
        refusalMessage:
          'CivicPulse AI is purpose-built for civic and municipal intelligence only. ' +
          'Attempts to override system instructions are not permitted.',
      };
    }
  }

  // 4. Harmful-content detection
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        refusalCode: 'HARMFUL_CONTENT',
        refusalMessage:
          'This submission contains content that violates the CivicPulse community guidelines ' +
          'and cannot be processed. If this is a genuine safety emergency, please contact your ' +
          'local emergency services immediately.',
      };
    }
  }

  // 5. Hard out-of-domain rejection (explicit non-civic topics)
  for (const pattern of OUT_OF_DOMAIN_PATTERNS) {
    if (pattern.test(trimmed)) {
      return buildOutOfDomainRefusal(trimmed);
    }
  }

  // 6. Positive civic-domain confirmation
  //    At least ONE civic keyword must match for the request to be forwarded.
  const hasCivicSignal = CIVIC_DOMAIN_KEYWORDS.some((p) => p.test(trimmed));
  if (!hasCivicSignal) {
    return buildOutOfDomainRefusal(trimmed);
  }

  // ✅ All checks passed — safe to forward to AI backend
  return { allowed: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildOutOfDomainRefusal(input: string): GuardrailResult {
  return {
    allowed: false,
    refusalCode: 'OUT_OF_DOMAIN',
    refusalMessage:
      'CivicPulse AI is dedicated exclusively to Civic Intelligence, ' +
      'Infrastructure Demand Aggregation, and Municipal Planning. ' +
      'Your message does not appear to be related to a civic issue or community infrastructure need. ' +
      '\n\nExamples of valid submissions:\n' +
      '  • "The road on Park Lane has large potholes causing accidents."\n' +
      '  • "Our ward needs a new water pump — the borehole has been dry for 3 weeks."\n' +
      '  • "Street lights on Section B have been out for a month."\n' +
      '\nPlease resubmit with a description of an infrastructure problem or development need in your community.',
  };
}
