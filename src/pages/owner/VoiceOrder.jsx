import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { extractOrderFromAudio, extractOrderFromTranscript } from '../../services/geminiService';
import './VoiceOrder.css';

const MAX_RECORD_MS = 30_000; // 30-second safety cap

/**
 * useAudioRecorder — records mic audio via MediaRecorder.
 * Returns a blob on stop; no dependency on Chrome's Speech API.
 */
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);
  const autoStopRef = useRef(null);
  const resolveRef  = useRef(null); // resolves the stopRecording() promise

  const isSupported =
    typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  // Tick the seconds counter while recording
  const startTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
  };
  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const _doStop = useCallback(() => {
    clearTimer();
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop(); // triggers onstop → resolves promise
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordingSeconds(0);
    chunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'माइक की अनुमति दें / Allow microphone access in browser settings.'
        : `माइक एरर / Mic error: ${err.message}`;
      setError(msg);
      return;
    }

    streamRef.current = stream;

    // Pick best supported MIME type
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(
      m => MediaRecorder.isTypeSupported(m)
    ) || '';

    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsRecording(false);
      if (resolveRef.current) {
        resolveRef.current({ blob, mimeType });
        resolveRef.current = null;
      }
    };

    recorder.start(200); // chunk every 200ms
    setIsRecording(true);
    startTimer();

    // Auto-stop safety cap
    autoStopRef.current = setTimeout(_doStop, MAX_RECORD_MS);
  }, [_doStop]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      _doStop();
    });
  }, [_doStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { isRecording, error, isSupported, recordingSeconds, startRecording, stopRecording };
}

/** Convert a Blob to a base64 string (strip the data-URL prefix) */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceOrder() {
  const navigate = useNavigate();
  const { customers, products } = useApp();

  const {
    isRecording, error: micError, isSupported,
    recordingSeconds, startRecording, stopRecording,
  } = useAudioRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [typeMode, setTypeMode] = useState(false);

  const customerNames = customers.map(c => (typeof c === 'string' ? c : c.name));
  const productNames  = products.map(p  => (typeof p === 'string' ? p : p.name));

  /* ── Mic tap: start or stop + process ── */
  const handleMicToggle = useCallback(async () => {
    if (isRecording) {
      setIsProcessing(true);
      setProcessError(null);

      try {
        const { blob, mimeType } = await stopRecording();

        // Too short? (< 0.5s of audio is likely nothing)
        if (blob.size < 1000) {
          setProcessError('बहुत छोटी रिकॉर्डिंग। / Recording too short, try again.');
          setIsProcessing(false);
          return;
        }

        const audioBase64 = await blobToBase64(blob);
        const res = await extractOrderFromAudio(audioBase64, mimeType, customerNames, productNames);

        if (res.success && res.data) {
          navigate('/owner/confirm-order', {
            state: { orderData: res.data, rawTranscript: res.data.transcript || '' },
          });
        } else {
          setProcessError(res.error || 'AI समझ नहीं पाया। नीचे टाइप करें। / Could not understand. Type below.');
          setTypeMode(true);
        }
      } catch (err) {
        console.error('Voice order error:', err);
        setProcessError('कुछ गड़बड़ हुई। नीचे टाइप करें। / Something went wrong. Type below.');
        setTypeMode(true);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setProcessError(null);
      setTranscript('');
      setTypeMode(false);
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording, navigate, customerNames, productNames]);

  /* ── Type-mode: process typed text via Gemini ── */
  const handleProcessTyped = useCallback(async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setProcessError(null);

    try {
      const res = await extractOrderFromTranscript(transcript, customerNames, productNames);
      if (res.success && res.data) {
        navigate('/owner/confirm-order', {
          state: { orderData: res.data, rawTranscript: transcript },
        });
      } else {
        setProcessError(res.error || 'AI समझ नहीं पाया। / Could not extract order.');
      }
    } catch (err) {
      setProcessError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, customerNames, productNames, navigate]);

  const handleBack = () => navigate('/owner');

  /* ── Processing screen ── */
  if (isProcessing) {
    return (
      <div className="voice-order">
        <div className="voice-order__processing">
          <div className="voice-order__processing-animation">
            <div className="voice-order__processing-dot" />
            <div className="voice-order__processing-dot" />
            <div className="voice-order__processing-dot" />
          </div>
          <p className="voice-order__processing-text-hi">AI समझ रहा है...</p>
          <p className="voice-order__processing-text-en">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-order">
      {/* Header */}
      <header className="voice-order__header">
        <button className="voice-order__back-btn" onClick={handleBack} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div className="voice-order__header-title">
          <span className="voice-order__header-hi">नया ऑर्डर</span>
          <span className="voice-order__header-en">New Order</span>
        </div>
        <div className="voice-order__header-spacer" />
      </header>

      {/* Main Content */}
      <div className="voice-order__body">

        {/* Browser not supported */}
        {!isSupported && (
          <div className="voice-order__error-banner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <div>
              <p className="voice-order__error-hi">ब्राउज़र सपोर्ट नहीं है</p>
              <p className="voice-order__error-en">Please use Chrome or Edge to record voice orders.</p>
            </div>
          </div>
        )}

        {/* Mic / process error */}
        {(micError || processError) && (
          <div className="voice-order__error-banner voice-order__error-banner--warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>{micError || processError}</p>
          </div>
        )}

        {/* Instruction */}
        <div className="voice-order__instruction">
          <p className="voice-order__instruction-hi">माइक दबाएं और बोलें</p>
          <p className="voice-order__instruction-en">Tap and hold, speak your order, tap again to send</p>
        </div>

        {/* Microphone Button */}
        <div className="voice-order__mic-area">
          <div className={`voice-order__mic-rings ${isRecording ? 'voice-order__mic-rings--active' : ''}`}>
            <div className="voice-order__ring voice-order__ring--1" />
            <div className="voice-order__ring voice-order__ring--2" />
            <div className="voice-order__ring voice-order__ring--3" />
          </div>
          <button
            id="mic-btn"
            className={`voice-order__mic-btn ${isRecording ? 'voice-order__mic-btn--listening' : ''}`}
            onClick={handleMicToggle}
            disabled={!isSupported}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>

        {/* Status */}
        <p className={`voice-order__status ${isRecording ? 'voice-order__status--listening' : ''}`}>
          {isRecording
            ? `🔴 सुन रहा है... ${recordingSeconds}s / Recording... tap to stop`
            : typeMode
            ? 'नीचे टाइप करें / Type below 👇'
            : ''}
        </p>

        {/* Type-mode fallback */}
        {typeMode && (
          <div className="voice-order__type-fallback">
            <textarea
              id="manual-order-input"
              className="voice-order__type-textarea"
              placeholder='e.g. "Ramesh ko 200 bucket aur 50 mug bhejne hain"'
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              autoFocus
            />
            {transcript.trim() && (
              <button className="voice-order__process-btn" onClick={handleProcessTyped}>
                आगे बढ़ें / Process →
              </button>
            )}
          </div>
        )}

        {/* Example */}
        {!typeMode && (
          <div className="voice-order__example">
            <p className="voice-order__example-label">जैसे बोलें / Example:</p>
            <p className="voice-order__example-text">
              "Ramesh ko 200 bucket aur 50 mug bhejne hain"
            </p>
          </div>
        )}
      </div>

      {/* Footer: Type Instead */}
      <div className="voice-order__footer">
        <button
          id="type-instead-btn"
          className="voice-order__type-btn"
          onClick={() => { setTypeMode(true); setProcessError(null); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          <span className="voice-order__type-hi">टाइप करें</span>
          <span className="voice-order__type-en">Type Instead</span>
        </button>
      </div>
    </div>
  );
}
