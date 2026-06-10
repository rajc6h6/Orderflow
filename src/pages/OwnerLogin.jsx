import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOwner, updateOwnerPin } from '../services/sheetsService';
import { encodePin } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import './OwnerLogin.css';

const MAX_ATTEMPTS = 5;

/* ---------- Icons ---------- */
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ---------- Modes ---------- */
const MODE = { LOGIN: 'login', FORGOT: 'forgot', RESET_PIN: 'reset_pin' };

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { loginOwner, ownerProfile, updateOwnerPin: changePin } = useAuth();

  const [mode, setMode] = useState(MODE.LOGIN);

  /* -- Login state -- */
  const [phone, setPhone] = useState(ownerProfile?.phone || '');
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  /* -- Forgot PIN state -- */
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState('verify'); // 'verify' | 'new_pin' | 'confirm_pin'
  const [newPin, setNewPin] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  /* ---------------------------------------------------------- */
  /* LOGIN FLOW                                                  */
  /* ---------------------------------------------------------- */

  const handlePinComplete = useCallback(async (pin) => {
    if (disabled || loading) return;

    setLoading(true);
    const result = await loginOwner(phone, pin);
    setLoading(false);

    if (result.success) {
      navigate('/owner', { replace: true });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinError(true);

      if (newAttempts >= MAX_ATTEMPTS) {
        setErrorMessage('बहुत गलत प्रयास — Too many wrong attempts. Use Forgot PIN.');
        setDisabled(true);
      } else {
        setErrorMessage(`${result.error} (${MAX_ATTEMPTS - newAttempts} शेष)`);
      }

      setTimeout(() => {
        setPinError(false);
        if (newAttempts < MAX_ATTEMPTS) setErrorMessage('');
      }, 900);
    }
  }, [disabled, loading, loginOwner, phone, attempts, navigate]);

  /* ---------------------------------------------------------- */
  /* FORGOT PIN FLOW                                             */
  /* ---------------------------------------------------------- */

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!/^\d{10}$/.test(forgotPhone)) {
      setForgotError('Please enter a valid 10-digit phone number');
      return;
    }

    setForgotLoading(true);
    const res = await getOwner(forgotPhone);
    setForgotLoading(false);

    if (!res.success || !res.data) {
      setForgotError('This phone number is not registered');
      return;
    }
    setForgotStep('new_pin');
  };

  const handleNewPin = useCallback((pin) => {
    setNewPin(pin);
    setForgotStep('confirm_pin');
  }, []);

  const handleConfirmNewPin = useCallback(async (confirmPin) => {
    if (confirmPin !== newPin) {
      setForgotError('PINs do not match');
      setTimeout(() => { setForgotError(''); setNewPin(''); setForgotStep('new_pin'); }, 1200);
      return;
    }

    setForgotLoading(true);
    const res = await updateOwnerPin(forgotPhone, encodePin(confirmPin));
    setForgotLoading(false);

    if (res.success) {
      setPhone(forgotPhone);
      setMode(MODE.LOGIN);
      setAttempts(0);
      setDisabled(false);
      setErrorMessage('PIN updated! Please log in with your new PIN.');
    } else {
      setForgotError(res.error || 'Failed to update PIN');
    }
  }, [newPin, forgotPhone]);

  /* ---------------------------------------------------------- */
  /* RENDER                                                      */
  /* ---------------------------------------------------------- */

  return (
    <div className="owner-login-page">
      <div className="owner-login-blob blob-a" />
      <div className="owner-login-blob blob-b" />

      {/* Back to RoleSelect */}
      <button className="owner-login-back" onClick={() => navigate('/', { replace: true })} type="button" aria-label="Back">
        <BackIcon />
      </button>

      <div className="owner-login-card">

        {/* ===== LOGIN MODE ===== */}
        {mode === MODE.LOGIN && (
          <>
            <div className="owner-login-header">
              <div className="owner-login-shield">
                <ShieldIcon />
              </div>
              <h1 className="owner-login-title">मालिक लॉगिन</h1>
              <p className="owner-login-subtitle">Owner Login</p>
            </div>

            {/* Phone field */}
            <div className="owner-login-phone-wrap">
              <label htmlFor="login-phone">Mobile Number / मोबाइल</label>
              <input
                id="login-phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="owner-login-phone-input"
                disabled={loading}
              />
            </div>

            {/* PIN pad */}
            <div className="owner-login-pin-wrap">
              <p className="owner-login-pin-label">Enter your 4-digit PIN</p>
              {loading ? (
                <div className="owner-login-spinner-wrap">
                  <div className="owner-login-spinner" />
                </div>
              ) : (
                <PinInput
                  key={attempts}
                  length={4}
                  onComplete={handlePinComplete}
                  error={pinError}
                  errorMessage={errorMessage}
                  disabled={disabled || !phone || phone.length !== 10}
                />
              )}
            </div>

            {!disabled && phone.length !== 10 && (
              <p className="owner-login-hint">Enter your phone number above first</p>
            )}

            {errorMessage && (
              <p className="owner-login-error">{errorMessage}</p>
            )}

            <button
              className="owner-login-forgot-btn"
              onClick={() => { setMode(MODE.FORGOT); setForgotPhone(''); setForgotStep('verify'); setForgotError(''); }}
              type="button"
            >
              PIN भूल गए? / Forgot PIN?
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button" 
                style={{
                  background: 'none', border: 'none', color: 'var(--primary-color)',
                  fontSize: '1rem', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline'
                }}
                onClick={() => navigate('/register/owner')}
              >
                खाता नहीं है? यहाँ रजिस्टर करें
                <br/>
                (Don't have an account? Register here)
              </button>
            </div>
          </>
        )}

        {/* ===== FORGOT PIN MODE ===== */}
        {mode === MODE.FORGOT && (
          <>
            <div className="owner-login-header">
              <div className="owner-login-shield forgot">
                <ShieldIcon />
              </div>
              <h1 className="owner-login-title">Reset PIN</h1>
              <p className="owner-login-subtitle">PIN रीसेट करें</p>
            </div>

            {forgotStep === 'verify' && (
              <form className="owner-forgot-form" onSubmit={handleForgotVerify}>
                <p className="owner-forgot-desc">
                  Enter your registered phone number to verify your identity.
                </p>
                <div className="owner-forgot-field">
                  <label htmlFor="forgot-phone">Registered Mobile Number</label>
                  <input
                    id="forgot-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                  />
                </div>
                {forgotError && <p className="owner-forgot-error">{forgotError}</p>}
                <button type="submit" className="owner-forgot-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Verifying…' : 'Verify →'}
                </button>
              </form>
            )}

            {forgotStep === 'new_pin' && (
              <div className="owner-reg-pin-section">
                <h2 className="owner-forgot-pin-title">Set New PIN</h2>
                <p className="owner-forgot-pin-hint hindi">नया 4 अंकों का PIN सेट करें</p>
                <PinInput key="new-pin" length={4} onComplete={handleNewPin} error={false} />
              </div>
            )}

            {forgotStep === 'confirm_pin' && (
              <div className="owner-reg-pin-section">
                <h2 className="owner-forgot-pin-title">Confirm New PIN</h2>
                <p className="owner-forgot-pin-hint hindi">PIN दोबारा डालें</p>
                {forgotLoading ? (
                  <div className="owner-login-spinner-wrap"><div className="owner-login-spinner" /></div>
                ) : (
                  <PinInput key="confirm-new-pin" length={4} onComplete={handleConfirmNewPin} error={!!forgotError} errorMessage={forgotError} />
                )}
              </div>
            )}

            <button className="owner-login-forgot-btn" onClick={() => setMode(MODE.LOGIN)} type="button">
              ← Back to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}
