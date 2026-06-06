/**
 * OrderFlow — Web Speech API Hook (Hindi)
 *
 * Wraps the browser's webkitSpeechRecognition API for Hindi voice
 * input with interim results, error mapping, and auto-stop.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const AUTO_STOP_MS = 30_000; // 30 seconds max

/**
 * @returns {{
 *   isListening: boolean,
 *   transcript: string,
 *   interimTranscript: string,
 *   startListening: () => void,
 *   stopListening: () => void,
 *   error: string | null,
 *   isSupported: boolean,
 * }}
 */
export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) setTranscript(finalText);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      const errorMap = {
        'not-allowed': 'Microphone permission denied — कृपया माइक्रोफ़ोन अनुमति दें',
        'network': 'Network error — नेटवर्क त्रुटि',
        'no-speech': 'No speech detected — कोई आवाज़ नहीं सुनाई दी',
        'audio-capture': 'No microphone found — माइक्रोफ़ोन नहीं मिला',
        'aborted': null, // intentional abort, not an error
      };

      const message = errorMap[event.error] ?? `Speech error: ${event.error}`;
      if (message) setError(message);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError(`Could not start recognition: ${err.message}`);
      setIsListening(false);
      return;
    }

    // Auto-stop after 30s
    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, AUTO_STOP_MS);
  }, [isSupported, SpeechRecognition, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
    isSupported,
  };
}
