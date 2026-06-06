/**
 * OrderFlow — Gemini Order-Extraction Service
 *
 * Priority chain:
 *  1. Google Apps Script backend (if VITE_APPS_SCRIPT_URL is set)
 *  2. Direct Gemini API call from browser (if VITE_GEMINI_API_KEY is set)
 *  3. Smart local mock parser (for offline / demo mode)
 */

import { GOOGLE_APPS_SCRIPT_URL, GEMINI_API_KEY } from '../config/constants';

const IS_DUMMY_SCRIPT_URL =
  !GOOGLE_APPS_SCRIPT_URL ||
  GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

const HAS_GEMINI_KEY =
  !!GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';

/* ------------------------------------------------------------------ */
/*  1. Apps Script backend                                              */
/* ------------------------------------------------------------------ */

async function extractViaAppsScript(transcript, customers, products) {
  const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'extractOrder', transcript, customers, products }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data ?? json;
}

/* ------------------------------------------------------------------ */
/*  2. Direct Gemini API (gemini-2.0-flash)                            */
/* ------------------------------------------------------------------ */

// gemini-3.5-flash: current stable model that works with the new API key
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

function buildPrompt(transcript, customers, products) {
  return `You are an order-entry assistant for an Indian wholesale business.
Extract a structured order from the following voice transcript (Hindi/Hinglish/English mix).

Known customers: ${customers.length ? customers.join(', ') : 'none listed'}.
Known products: ${products.length ? products.join(', ') : 'none listed'}.

Transcript: "${transcript}"

Return ONLY valid JSON (no markdown, no explanation) matching this exact shape:
{
  "customer_name": "<matched or inferred name, empty string if unknown>",
  "is_new_customer": <true if name not in known list>,
  "items": [
    { "product": "<product name>", "quantity": <number> }
  ],
  "raw_note": "<original transcript>"
}

Rules:
- Match customer names fuzzily (Ramesh = Ramesh Trading etc.).
- If quantity is unclear, default to 1.
- items must be a non-empty array.
- Return only the JSON object, nothing else.
- IMPORTANT: Ensure string values are properly escaped (quotes, newlines) to produce strictly valid JSON.`;
}

async function extractViaGeminiDirect(transcript, customers, products) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(transcript, customers, products) }] }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown code fences if present
  let cleaned = raw.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
  
  // Sometimes models output literal newlines in the string values
  // This is a basic attempt to sanitize if JSON.parse fails later
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[geminiService] JSON parse error in direct prompt. Raw:', raw, 'Cleaned:', cleaned);
    // Attempt fallback sanitization
    cleaned = cleaned.replace(/\n/g, ' '); 
    return JSON.parse(cleaned);
  }
}

/* ------------------------------------------------------------------ */
/*  3. Local mock parser (demo / offline mode)                         */
/* ------------------------------------------------------------------ */

function extractViaMock(transcript, customers, products) {
  const lower = transcript.toLowerCase();

  // Try to fuzzy-match a customer name
  let customer_name = '';
  let is_new_customer = true;
  for (const c of customers) {
    const cLower = (typeof c === 'string' ? c : c.name).toLowerCase();
    const firstName = cLower.split(' ')[0];
    if (lower.includes(firstName) || lower.includes(cLower)) {
      customer_name = typeof c === 'string' ? c : c.name;
      is_new_customer = false;
      break;
    }
  }

  // Try to match products and quantities
  const items = [];
  const numWords = {
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6,
    saat: 7, aath: 8, nau: 9, das: 10, bees: 20, pachas: 50,
    sau: 100, 'ek sau': 100, 'do sau': 200, 'teen sau': 300,
  };

  for (const p of products) {
    const pName = (typeof p === 'string' ? p : p.name);
    const pLower = pName.toLowerCase();
    if (lower.includes(pLower)) {
      // Try to find a nearby number
      const matches = lower.match(/(\d+)\s*(?:ka|ke|ki)?\s*(?:bucket|mug|soap|comb|piece|pcs|packet)/gi);
      let quantity = 1;

      // Simple regex for digits near product name
      const idx = lower.indexOf(pLower);
      const surrounding = lower.substring(Math.max(0, idx - 20), idx + pLower.length + 20);
      const numMatch = surrounding.match(/\d+/);
      if (numMatch) quantity = parseInt(numMatch[0], 10);

      // Check word-numbers
      for (const [word, val] of Object.entries(numWords)) {
        if (surrounding.includes(word)) { quantity = val; break; }
      }

      items.push({ product: pName, quantity });
    }
  }

  // If no products matched, create a generic entry
  if (items.length === 0) {
    items.push({ product: transcript.split(' ').slice(-2).join(' '), quantity: 1 });
  }

  return {
    customer_name,
    is_new_customer,
    items,
    raw_note: transcript,
  };
}

/* ------------------------------------------------------------------ */
/*  4. Direct audio → Gemini (no Chrome Speech API needed)             */
/* ------------------------------------------------------------------ */

/**
 * Send raw audio bytes to Gemini and get back transcription + order JSON.
 * This bypasses Chrome's Web Speech API (which needs Google's speech servers).
 *
 * @param {string} audioBase64 - base64-encoded audio data
 * @param {string} mimeType    - e.g. 'audio/webm' or 'audio/ogg'
 * @param {string[]} customers
 * @param {string[]} products
 */
async function extractViaGeminiAudio(audioBase64, mimeType, customers, products) {
  const prompt = `You are an order-entry assistant for an Indian wholesale business.
The audio contains someone placing an order in Hindi, English, or Hinglish (mix).
Common format: "[Customer name] ko [quantity] [product] aur [quantity] [product] chahiye/bhejne hain"

Known customers: ${customers.length ? customers.join(', ') : 'none listed'}.
Known products: ${products.length ? products.join(', ') : 'none listed'}.

Listen carefully and return ONLY valid JSON (no markdown, no explanation):
{
  "transcript": "<what was said verbatim>",
  "customer_name": "<matched or inferred name, empty string if unknown>",
  "is_new_customer": <true if name not in known customer list>,
  "items": [
    { "product": "<product name>", "quantity": <number> }
  ],
  "raw_note": "<what was said verbatim>"
}

Rules:
- Match customer names fuzzily (Ramesh = Ramesh Trading, Gupta = Gupta Enterprises etc.).
- Numbers in Hindi: ek=1, do=2, teen=3, char=4, paanch=5, das=10, bees=20, pachas=50, sau=100.
- If quantity unclear, default to 1. items must be non-empty.
- Return ONLY the JSON object, nothing else.
- IMPORTANT: Ensure all string values are properly escaped (especially quotes and newlines) so the JSON is strictly valid.`;

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: audioBase64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini audio API error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  let cleaned = raw.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[geminiService] JSON parse error in audio prompt. Raw:', raw, 'Cleaned:', cleaned);
    // Attempt fallback sanitization
    cleaned = cleaned.replace(/\n/g, ' ');
    return JSON.parse(cleaned);
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Extract structured order from a raw audio blob (MediaRecorder output).
 * Uses Gemini's multimodal API — no Chrome Speech API required.
 *
 * @param {string} audioBase64 - base64-encoded audio
 * @param {string} mimeType    - audio MIME type
 * @param {string[]} customers
 * @param {string[]} products
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function extractOrderFromAudio(audioBase64, mimeType, customers = [], products = []) {
  if (!HAS_GEMINI_KEY) {
    return { success: false, data: null, error: 'No Gemini API key — please set VITE_GEMINI_API_KEY in .env' };
  }
  try {
    const data = await extractViaGeminiAudio(audioBase64, mimeType, customers, products);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[geminiService] Audio extraction failed:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Extract structured order JSON from a Hindi/Hinglish transcript.
 *
 * @param {string} transcript
 * @param {string[]} customers
 * @param {string[]} products
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function extractOrderFromTranscript(transcript, customers = [], products = []) {
  // 1. Try Apps Script backend
  if (!IS_DUMMY_SCRIPT_URL) {
    try {
      const data = await extractViaAppsScript(transcript, customers, products);
      return { success: true, data, error: null };
    } catch (err) {
      console.warn('[geminiService] Apps Script failed, falling back:', err.message);
    }
  }

  // 2. Try direct Gemini API
  if (HAS_GEMINI_KEY) {
    try {
      const data = await extractViaGeminiDirect(transcript, customers, products);
      return { success: true, data, error: null };
    } catch (err) {
      console.warn('[geminiService] Direct Gemini API failed, falling back to mock:', err.message);
    }
  }

  // 3. Local mock parser (always works)
  try {
    const data = extractViaMock(transcript, customers, products);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[geminiService] Mock parser failed:', err);
    return { success: false, data: null, error: err.message };
  }
}
