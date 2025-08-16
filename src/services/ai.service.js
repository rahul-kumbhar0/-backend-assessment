import { GoogleGenerativeAI } from '@google/generative-ai';

// Optional AI helper: if enabled + key is present, try to polish the scraped text.
// Keep it non-blocking and tolerant to failures.
const AI_ENABLED = (process.env.AI_ENABLED || 'false').toLowerCase() === 'true';
const apiKey = process.env.GEMINI_API_KEY;

let model = null;
if (AI_ENABLED && apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (err) {
    console.warn('Failed to initialize Gemini client:', err.message);
  }
}

export async function enhanceDescription(text) {
  // If AI is off, or no key/model/text, just skip gracefully
  if (!AI_ENABLED || !apiKey || !model || !text) return null;
  const prompt = `Rewrite the following website description to be concise, clear, and engaging (2-3 sentences).\n\nDescription: ${text}`;
  try {
    const result = await model.generateContent(prompt);
    const enhanced = result?.response?.text?.();
    return (enhanced && enhanced.trim()) || null;
  } catch (err) {
    console.warn('AI enhancement failed (Gemini):', err.message);
    return null;
  }
}
