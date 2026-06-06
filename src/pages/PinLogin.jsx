import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import './PinLogin.css';

const MAX_ATTEMPTS = 3;

const ROLE_CONFIG = {
  owner: {
    titleHindi: 'मालिक लॉगिन',
    titleEn: 'Owner Login',
    badgeClass: 'owner-badge',
    lockClass: 'owner-lock',
    dashboard: '/owner',
  },
  staff: {
    titleHindi: 'स्टाफ लॉगिन',
    titleEn: 'Staff Login',
    badgeClass: 'staff-badge',
    lockClass: 'staff-lock',
    dashboard: '/staff',
  },
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
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

export default function PinLogin() {
  const role = 'owner';
  const navigate = useNavigate();
  const { login, resetPins } = useAuth();

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.owner;

  const handlePinComplete = useCallback((pin) => {
    const result = login(role, pin);
    if (result.success) {
      navigate(config.dashboard, { replace: true });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);

      if (newAttempts >= MAX_ATTEMPTS) {
        setErrorMessage('बहुत गलत प्रयास — Too many wrong attempts');
        setDisabled(true);
      } else {
        setErrorMessage(`गलत PIN — Wrong PIN (${MAX_ATTEMPTS - newAttempts} शेष)`);
      }

      // Reset error state after animation
      setTimeout(() => {
        setError(false);
        if (newAttempts < MAX_ATTEMPTS) {
          setErrorMessage('');
        }
      }, 800);
    }
  }, [login, role, attempts, config.dashboard, navigate]);

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  const handleForgot = () => {
    if (window.confirm('यह सभी PINs को मिटा देगा और आपको फिर से सेट करना होगा।\n\nThis will erase all PINs and you will need to set them up again.')) {
      resetPins();
      navigate('/', { replace: true });
    }
  };

  const RoleBadgeIcon = role === 'owner' ? ShieldIcon : ClipboardIcon;

  return (
    <div className="pin-login-page">
      {/* Back button */}
      <button
        className="pin-login-back"
        onClick={handleBack}
        type="button"
        aria-label="Back to role selection"
      >
        <BackIcon />
      </button>

      {/* Header */}
      <div className="pin-login-header">
        <div className={`pin-login-lock ${config.lockClass}${error ? ' shake-lock' : ''}`}>
          <LockIcon />
        </div>

        <div className={`pin-login-role-badge ${config.badgeClass}`}>
          <RoleBadgeIcon />
          {role === 'owner' ? 'Owner' : 'Staff'}
        </div>

        <h1 className="pin-login-title hindi">{config.titleHindi}</h1>
        <p className="pin-login-subtitle">{config.titleEn}</p>
      </div>

      {/* MVP hint — owner only */}
      {role === 'owner' && (
        <div className="pin-login-mvp-hint">
          <span className="pin-login-mvp-tag">MVP</span>
          Since it&rsquo;s MVP, use fixed PIN&nbsp;&nbsp;<strong>0&nbsp;0&nbsp;0&nbsp;0</strong>
        </div>
      )}

      {/* PIN Input */}
      <div className="pin-login-content">
        <PinInput
          length={4}
          onComplete={handlePinComplete}
          error={error}
          errorMessage={errorMessage}
          disabled={disabled}
        />
      </div>

      {/* Footer */}
      <div className="pin-login-footer">
        {attempts > 0 && attempts < MAX_ATTEMPTS && (
          <p className={`pin-login-attempts${attempts >= 2 ? ' warning' : ''}`}>
            {attempts}/{MAX_ATTEMPTS} प्रयास — attempts
          </p>
        )}

        <button
          className="pin-login-forgot"
          onClick={handleForgot}
          type="button"
        >
          PIN भूल गए? / Forgot PIN?
        </button>
      </div>
    </div>
  );
}
