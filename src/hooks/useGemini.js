/**
 * OrderFlow — Gemini Extraction Hook
 *
 * Wraps geminiService.extractOrderFromTranscript with
 * loading / error state management.
 */

import { useState, useCallback } from 'react';
import { extractOrderFromTranscript } from '../services/geminiService';

/**
 * @returns {{
 *   extractOrder: (transcript: string, customers: string[], products: string[]) => Promise<object|null>,
 *   isExtracting: boolean,
 *   result: object | null,
 *   error: string | null,
 * }}
 */
export function useGemini() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const extractOrder = useCallback(async (transcript, customers = [], products = []) => {
    setIsExtracting(true);
    setError(null);
    setResult(null);

    try {
      const res = await extractOrderFromTranscript(transcript, customers, products);

      if (res.success && res.data) {
        setResult(res.data);
        return res.data;
      }

      const errMsg = res.error || 'Failed to extract order from transcript';
      setError(errMsg);
      return null;
    } catch (err) {
      const errMsg = err.message || 'Unexpected error during extraction';
      setError(errMsg);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractOrder,
    isExtracting,
    result,
    error,
  };
}
