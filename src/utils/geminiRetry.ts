import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';

// API Keys
const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;
const nvidiaKey = process.env.NVIDIA_NIM_API_KEY;

// Instantiate Gemini AI client safely
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// Parse the fallback models list
function getFallbackModels(): { provider: string; model: string }[] {
  const envModels = process.env.FALLBACK_MODELS;
  if (envModels) {
    return envModels.split(',').map(m => {
      const [provider, ...modelParts] = m.trim().split(':');
      return {
        provider: provider.toLowerCase(),
        model: modelParts.join(':') // handle possible colons in model names
      };
    });
  }
  
  // Default fallback sequence if not specified
  return [
    { provider: 'gemini', model: 'gemini-3.5-flash' },
    { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
    { provider: 'gemini', model: 'gemini-flash-latest' }
  ];
}

export interface GenerateTextParams<T> {
  prompt: string | unknown[];
  fallbackValue: T;
  jsonMode?: boolean;
  retriesPerModel?: number;
  delayMs?: number;
}

export async function generateText<T>(params: GenerateTextParams<T>): Promise<T> {
  const { prompt, fallbackValue, jsonMode = false, retriesPerModel = 1, delayMs = 1000 } = params;
  const fallbackModels = getFallbackModels();

  for (const item of fallbackModels) {
    const { provider, model } = item;
    
    // Check if key is available for the provider
    if (provider === 'gemini' && !geminiKey) {
      console.warn(`[AI-Fallback] Skipping ${provider}:${model} - GEMINI_API_KEY is missing.`);
      continue;
    }
    if (provider === 'groq' && !groqKey) {
      console.warn(`[AI-Fallback] Skipping ${provider}:${model} - GROQ_API_KEY is missing.`);
      continue;
    }
    if (provider === 'openrouter' && !openrouterKey) {
      console.warn(`[AI-Fallback] Skipping ${provider}:${model} - OPENROUTER_API_KEY is missing.`);
      continue;
    }
    if (provider === 'nvidia-nim' && !nvidiaKey) {
      console.warn(`[AI-Fallback] Skipping ${provider}:${model} - NVIDIA_NIM_API_KEY is missing.`);
      continue;
    }

    let attempt = 0;
    while (attempt < retriesPerModel) {
      try {
        logger.warn(`[AI-Fallback] Attempting generation with ${provider}:${model} (attempt ${attempt + 1}/${retriesPerModel})`);
        
        let rawResponseText = '';

        if (provider === 'gemini') {
          if (!ai) throw new Error("Gemini AI client not initialized");
          
          // Format prompt for Gemini generateContent
          // If prompt is already an array (for Vision), use it as contents. Otherwise, wrap string.
          const contents = Array.isArray(prompt) ? prompt : prompt;
          const config: Record<string, unknown> = {};
          if (jsonMode) {
            config.responseMimeType = 'application/json';
          }
          
          const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config
          });

          rawResponseText = response.text ? response.text.trim() : '';
        } else {
          // Standard OpenAI-compatible API payload construction
          let endpoint = '';
          let authHeader = '';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (provider === 'groq') {
            endpoint = 'https://api.groq.com/openai/v1/chat/completions';
            authHeader = `Bearer ${groqKey}`;
          } else if (provider === 'openrouter') {
            endpoint = 'https://openrouter.ai/api/v1/chat/completions';
            authHeader = `Bearer ${openrouterKey}`;
            headers['HTTP-Referer'] = 'https://civicpulse.org';
            headers['X-Title'] = 'CivicPulse';
          } else if (provider === 'nvidia-nim') {
            endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
            authHeader = `Bearer ${nvidiaKey}`;
          } else {
            throw new Error(`Unsupported provider: ${provider}`);
          }

          headers['Authorization'] = authHeader;

          // Convert prompt format
          let messagesContent: unknown;
          if (typeof prompt === 'string') {
            messagesContent = prompt;
          } else if (Array.isArray(prompt)) {
            // Map Gemini parts to OpenAI messages content array
            messagesContent = prompt.map((part: any) => {
              if (typeof part === 'string') {
                return { type: 'text', text: part };
              }
              if (part.text) {
                return { type: 'text', text: part.text };
              }
              if (part.inlineData) {
                const { data, mimeType } = part.inlineData;
                return {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${data}`
                  }
                };
              }
              return part;
            });
          }

          const body: Record<string, unknown> = {
            model: model,
            messages: [
              {
                role: 'user',
                content: messagesContent
              }
            ]
          };

          if (jsonMode) {
            body.response_format = { type: 'json_object' };
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorDetails}`);
          }

          const resultJson = await response.json();
          rawResponseText = resultJson.choices?.[0]?.message?.content?.trim() || '';
        }

        if (jsonMode) {
          try {
            const parsed = JSON.parse(rawResponseText);
            return parsed as T;
          } catch (jsonErr) {
            logger.warn(`[AI-Fallback] Failed to parse JSON response from ${provider}:${model}. Response: ${rawResponseText}`);
            throw jsonErr;
          }
        }

        return rawResponseText as unknown as T;

      } catch (error: unknown) {
        attempt++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`[AI-Fallback] Error during ${provider}:${model} call: ${errorMessage}`);
        if (attempt < retriesPerModel) {
          const backoff = delayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
  }

  logger.error(`[AI-Fallback] All models failed. Returning fallback value.`);
  return fallbackValue;
}

// Keep runWithRetry interface compatible for backward compatibility/legacy callers
export async function runWithRetry<T>(
  apiCall: (modelName: string) => Promise<T>,
  retries = 3,
  delayMs = 1500,
  fallbackValue: T,
  models: string[] = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
): Promise<T> {
  // Try using the new generateText if the apiCall isn't strictly tied to a local variable
  // but to preserve absolute safety, let's keep the original logic for direct callers of runWithRetry
  let attempt = 0;
  while (attempt < retries) {
    const currentModel = models[attempt % models.length];
    try {
      return await apiCall(currentModel);
    } catch (error: unknown) {
      attempt++;
      const errAny = error as any;
      const errorMessage = errAny?.message || String(error);
      const statusCode = errAny?.status || errAny?.code || 0;

      const isTransient = 
        statusCode === 503 || 
        statusCode === 429 ||
        errorMessage.includes('503') ||
        errorMessage.includes('429') ||
        errorMessage.includes('demand') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('Resource has been exhausted') ||
        errorMessage.includes('Service Unavailable');

      if (isTransient && attempt < retries) {
        const nextModel = models[attempt % models.length];
        const backoff = delayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        logger.warn(
          `[GeminiRetry] Transient error with model '${currentModel}' (attempt ${attempt}/${retries}). Retrying with model '${nextModel}' in ${Math.round(backoff)}ms... Error: ${errorMessage}`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        logger.error(
          `[GeminiRetry] Permanent error or max retries reached with model '${currentModel}' (attempt ${attempt}/${retries}). Error:`,
          error
        );
        break;
      }
    }
  }
  return fallbackValue;
}
