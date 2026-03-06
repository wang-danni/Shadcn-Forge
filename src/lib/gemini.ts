const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Please add it to your .env file.');
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export async function fetchGemini(
  prompt: string,
  systemInstruction: string,
  responseMimeType: string = "text/plain"
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType }
  };

  let delay = 1000;
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data: GeminiResponse = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      
      return text;
    } catch (err) {
      console.error(`Gemini API attempt ${attempt + 1}/${maxRetries} failed:`, err);
      
      if (attempt === maxRetries - 1) {
        throw new Error(`Gemini API failed after ${maxRetries} attempts: ${err}`);
      }
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  return "";
}