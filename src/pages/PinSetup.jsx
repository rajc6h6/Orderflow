import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import './PinSetup.css';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

const STEPS = [
  {
    key: 'owner',
    titleHindi: 'मालिक का PIN सेट करें',
    titleEn: 'Set Owner PIN',
    iconClass: 'owner-icon',
    Icon: ShieldIcon,
  }
];

export default function PinSetup() {
  const navigate = useNavigate();
  const { setupPins } = useAuth();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePinComplete = useCallback((pin) => {
    const res = setupPins(pin);
    if (res.success) {
      navigate('/owner', { replace: true });
    } else {
      setError(true);
      setErrorMessage(res.error);
    }
  }, [setupPins, navigate]);

  const step = STEPS[0];
  const StepIcon = step.Icon;

  return (
    <div className="pin-setup-page">
      {/* Header */}
      <div className="pin-setup-header">
        <div className={`pin-setup-icon ${step.iconClass}`}>
          <StepIcon />
        </div>
        <h1 className="pin-setup-title hindi">{step.titleHindi}</h1>
        <p className="pin-setup-subtitle">{step.titleEn}</p>
        <p className="pin-setup-step-label">Step 1 of 1</p>
      </div>

      {/* PIN Input */}
      <div className="pin-setup-content">
        <PinInput
          length={4}
          onComplete={handlePinComplete}
          error={error}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
