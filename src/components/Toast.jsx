import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

/**
 * Toast notification component
 * @param {Object} props
 * @param {string} props.message - Toast message text
 * @param {'success'|'error'|'info'} props.type - Toast type
 * @param {boolean} props.visible - Whether toast is visible
 * @param {Function} props.onClose - Callback when toast closes
 * @param {number} [props.duration=3000] - Auto-hide duration in ms
 */
export default function Toast({ message, type = 'info', visible, onClose, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setShouldRender(true);
      setIsExiting(false);
    }
  }

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      setShouldRender(false);
      onClose?.();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, handleClose]);

  if (!shouldRender) return null;

  const icons = {
    success: (
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
  };

  return (
    <div className="toast-container">
      <div
        className={`toast toast--${type}${isExiting ? ' toast-exit' : ''}`}
        role="alert"
        aria-live="polite"
      >
        <span className="toast__icon">{icons[type]}</span>
        <span className="toast__message">{message}</span>
        <button
          className="toast__close"
          onClick={handleClose}
          aria-label="Close notification"
          type="button"
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
