import { useState, useCallback, useEffect, useRef } from 'react';
import './PinInput.css';

const BUTTONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function BackspaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  );
}

export default function PinInput({
  length = 4,
  onComplete,
  error = false,
  errorMessage = '',
  disabled = false,
}) {
  const [digits, setDigits] = useState([]);
  const containerRef = useRef(null);

  // Reset digits when error clears or on mount
  useEffect(() => {
    if (error) {
      // Clear after shake animation
      const timer = setTimeout(() => {
        setDigits([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigitPress = useCallback((digit) => {
    if (disabled) return;
    setDigits((prev) => {
      if (prev.length >= length) return prev;
      const next = [...prev, digit];
      if (next.length === length) {
        // Slight delay so the user sees the last dot fill
        setTimeout(() => {
          onComplete?.(next.join(''));
        }, 150);
      }
      return next;
    });
  }, [length, onComplete, disabled]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setDigits((prev) => prev.slice(0, -1));
  }, [disabled]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e) {
      if (disabled) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleDigitPress, handleBackspace]);

  return (
    <div
      ref={containerRef}
      className={`pin-input-container${error ? ' pin-shake' : ''}`}
      role="group"
      aria-label="PIN entry"
    >
      {/* Dot indicators */}
      <div className="pin-dots" aria-live="polite">
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            className={`pin-dot${i < digits.length ? ' filled' : ''}`}
            aria-label={i < digits.length ? `Digit ${i + 1} entered` : `Digit ${i + 1} empty`}
          />
        ))}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="pin-error-msg" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Number pad */}
      <div className="pin-numpad" role="group" aria-label="Number pad">
        {BUTTONS.map((num) => (
          <button
            key={num}
            type="button"
            className="pin-numpad-btn"
            onClick={() => handleDigitPress(num)}
            disabled={disabled || digits.length >= length}
            aria-label={`${num}`}
          >
            {num}
          </button>
        ))}

        {/* Bottom row: spacer, 0, backspace */}
        <div className="pin-numpad-spacer" />
        <button
          type="button"
          className="pin-numpad-btn btn-zero"
          onClick={() => handleDigitPress(0)}
          disabled={disabled || digits.length >= length}
          aria-label="0"
        >
          0
        </button>
        <button
          type="button"
          className="pin-numpad-btn btn-backspace"
          onClick={handleBackspace}
          disabled={disabled || digits.length === 0}
          aria-label="Backspace"
        >
          <BackspaceIcon />
        </button>
      </div>
    </div>
  );
}
