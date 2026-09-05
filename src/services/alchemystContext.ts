import AlchemystAI from '@alchemystai/sdk';
import { SCHEME_DOCUMENTS } from '../data/schemeDocuments';

const apiKey = process.env.ALCHEMYST_AI_API_KEY;
export const alchemyst = (apiKey && apiKey !== 'your-key-here') ? new AlchemystAI({ apiKey }) : null;

/** Idempotent one-time ingestion — call from a setup script, not on every request. */
export async function ingestSchemeDocuments() {
  if (!alchemyst) {
    console.warn('[Alchemyst] No API key configured — scheme retrieval will fall back to ungrounded Gemini.');
    return { success: false, message: "No valid ALCHEMYST_AI_API_KEY configured." };
  }

  try {
    for (const doc of SCHEME_DOCUMENTS) {
      await alchemyst.v1.context.add({
        context_type: 'resource',
        documents: [{ content: doc.content }],
        scope: 'internal',
        source: `civicpulse.schemes.${doc.id}`,
        metadata: { fileName: `${doc.id}.txt`, fileType: 'text/plain' },
      });
    }
    return { success: true, count: SCHEME_DOCUMENTS.length };
  } catch (err: any) {
    console.error('[Alchemyst] Document ingestion failed:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/** Real-time retrieval for a given recommendation. Returns [] on any failure — never throws. */
export async function retrieveSchemeContext(query: string): Promise<string[]> {
  if (!alchemyst) return [];
  try {
    const res = await alchemyst.v1.context.search({
      query,
      similarity_threshold: 0.75,
      minimum_similarity_threshold: 0.4,
      scope: 'internal',
    });
    return (res.contexts ?? []).map(c => c.content).filter((c): c is string => !!c);
  } catch (err) {
    console.error('[Alchemyst] search failed, falling back to ungrounded scheme matching:', err);
    return [];
  }
}
