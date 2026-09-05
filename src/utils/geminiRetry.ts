/**
 * Gemini API Retry Utility
 * Handles transient errors (like 503 high demand or 429 rate limit) using exponential backoff with jitter.
 */

export async function runWithRetry<T>(
  apiCall: (modelName: string) => Promise<T>,
  retries = 3,
  delayMs = 1500,
  fallbackValue: T,
  models: string[] = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    const currentModel = models[attempt % models.length];
    try {
      return await apiCall(currentModel);
    } catch (error: any) {
      attempt++;
      
      const errorMessage = error?.message || String(error);
      const statusCode = error?.status || error?.code || 0;

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
        console.warn(
          `[GeminiRetry] Transient error with model '${currentModel}' (attempt ${attempt}/${retries}). Retrying with model '${nextModel}' in ${Math.round(backoff)}ms... Error: ${errorMessage}`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        console.error(
          `[GeminiRetry] Permanent error or max retries reached with model '${currentModel}' (attempt ${attempt}/${retries}). Error:`,
          error
        );
        break;
      }
    }
  }
  return fallbackValue;
}
