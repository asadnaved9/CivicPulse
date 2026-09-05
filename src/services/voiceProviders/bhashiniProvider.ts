export interface BhashiniTranslationResult {
  transcript: string;
  sourceLanguage: string;
  translatedText: string;
  confidence: number;
}

/**
 * BHASHINI / VoicERA National Voice Provider (MeitY India)
 * Connects to the national sovereign ASR (Automated Speech Recognition)
 * and NMT (Neural Machine Translation) pipelines.
 */
export async function transcribeWithBhashini(
  audioBase64: string,
  sourceLanguage: string = 'kn' // Default Kannada for Bangalore Central
): Promise<BhashiniTranslationResult | null> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const endpoint = process.env.BHASHINI_API_ENDPOINT || "https://dhruva-api.bhashini.gov.in/services/inference";

  if (!apiKey) {
    // Graceful fallback to null when credentials are not supplied
    return null;
  }

  try {
    const payload = {
      pipelineTasks: [
        {
          taskType: "asr",
          config: {
            language: { sourceLanguage }
          }
        },
        {
          taskType: "translation",
          config: {
            language: {
              sourceLanguage,
              targetLanguage: "en"
            }
          }
        }
      ],
      inputData: {
        audio: [{ audioContent: audioBase64 }]
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn("[BhashiniProvider] Dhruva API response not OK:", response.status);
      return null;
    }

    const data = await response.json();
    const asrOutput = data.pipelineResponse?.[0]?.output?.[0]?.source || "";
    const translationOutput = data.pipelineResponse?.[1]?.output?.[0]?.target || asrOutput;

    return {
      transcript: asrOutput,
      sourceLanguage,
      translatedText: translationOutput,
      confidence: 0.96
    };
  } catch (err) {
    console.error("[BhashiniProvider] Request failed:", err);
    return null;
  }
}
