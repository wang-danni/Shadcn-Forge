const API_ENDPOINT = import.meta.env.VITE_AI_API_URL || '/api/ai/generate';
const MODEL_NAME = import.meta.env.VITE_AI_MODEL || import.meta.env.VITE_GEMINI_MODEL || '';
const REQUEST_TIMEOUT_MS = 30000;

interface AIResponse {
  error?: {
    message?: string;
  };
  text?: string;
}

interface AIRequestError extends Error {
  status?: number;
  retryAfterMs?: number;
  isQuotaExceeded?: boolean;
}

const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

const extractRetryAfterMs = (message: string): number | null => {
  const match = message.match(/Please retry in\s+([\d.]+)s\.?/i);
  if (!match) return null;

  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds)) return null;

  return Math.ceil(seconds * 1000);
};

const buildQuotaExceededMessage = (retryAfterMs?: number | null): string => {
  if (retryAfterMs && retryAfterMs > 0) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    return `AI 服务额度已用尽，请约 ${seconds} 秒后重试。若频繁出现，请检查配额或账单设置。`;
  }

  return 'AI 服务额度已用尽，请稍后重试或检查配额与账单设置。';
};

const parseAIError = async (res: Response): Promise<string> => {
  const rawText = await res.text();

  try {
    const parsed = JSON.parse(rawText) as AIResponse;
    return parsed.error?.message || rawText;
  } catch {
    return rawText;
  }
};

export async function fetchAI(
  prompt: string,
  systemInstruction: string,
  responseMimeType: string = 'text/plain'
): Promise<string> {
  const payload = {
    prompt,
    systemInstruction,
    responseMimeType,
    ...(MODEL_NAME ? { model: MODEL_NAME } : {})
  };

  let delay = 1000;
  const maxRetries = 5;
  let quotaRetryUsed = false;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await parseAIError(res);
        const requestError: AIRequestError = new Error(`AI 请求失败 (${res.status})：${errorText}`);
        requestError.status = res.status;
        const retryAfterMs = extractRetryAfterMs(errorText);
        if (retryAfterMs !== null) {
          requestError.retryAfterMs = retryAfterMs;
        }
        requestError.isQuotaExceeded = res.status === 429 && /quota exceeded|rate limit/i.test(errorText);
        throw requestError;
      }

      const data: AIResponse = await res.json();
      const text = data.text;

      if (!text) {
        throw new Error('Empty response from AI API');
      }

      return text;
    } catch (err) {
      console.error(`AI API attempt ${attempt + 1}/${maxRetries} failed:`, err);

      if (err instanceof DOMException && err.name === 'AbortError') {
        err = new Error('AI 请求超时，请稍后重试');
      }

      const requestError = err as AIRequestError;

      if (requestError.status === 429) {
        if (!quotaRetryUsed && requestError.retryAfterMs && requestError.retryAfterMs <= 30000) {
          quotaRetryUsed = true;
          await sleep(requestError.retryAfterMs + 500);
          continue;
        }

        throw new Error(buildQuotaExceededMessage(requestError.retryAfterMs));
      }

      if (attempt === maxRetries - 1) {
        throw new Error(`AI API failed after ${maxRetries} attempts: ${err}`);
      }

      await sleep(delay);
      delay *= 2;
    }
  }

  return '';
}
