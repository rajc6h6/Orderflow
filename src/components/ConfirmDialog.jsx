import { useState, useEffect } from 'react';
import './ConfirmDialog.css';

/**
 * Confirmation dialog modal
 * @param {Object} props
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {Function} props.onConfirm - Callback on confirm
 * @param {Function} props.onCancel - Callback on cancel
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {boolean} [props.danger=false] - Whether confirm button is danger style
 */
export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isOpen,
  danger = false,
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }

  const handleClose = (callback) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      callback?.();
    }, 200);
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose(onCancel);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!shouldRender) return null;

  return (
    <div
      className={`confirm-overlay${isClosing ? ' confirm-overlay--closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose(onCancel);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="confirm-card">
        <div className="confirm-card__icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z" />
          </svg>
        </div>
        <h2 className="confirm-card__title" id="confirm-title">{title}</h2>
        <p className="confirm-card__message">{message}</p>
        <div className="confirm-card__actions">
          <button
            className="confirm-card__btn confirm-card__btn--cancel"
            onClick={() => handleClose(onCancel)}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`confirm-card__btn ${danger ? 'confirm-card__btn--danger' : 'confirm-card__btn--confirm'}`}
            onClick={() => handleClose(onConfirm)}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
