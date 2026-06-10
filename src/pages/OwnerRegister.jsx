import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import './OwnerRegister.css';

/* ---------- Icons ---------- */
function StorefrontIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1.38h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

const STEPS = {
  DETAILS: 'details',
  SET_PIN: 'set_pin',
  CONFIRM_PIN: 'confirm_pin',
};

export default function OwnerRegister() {
  const navigate = useNavigate();
  const { registerOwner } = useAuth();

  const [step, setStep] = useState(STEPS.DETAILS);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState(false);

  /* ---------- Step 1: validate details ---------- */
  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!/^\d{10}$/.test(phone)) { setError('Phone number must be 10 digits'); return; }

    setStep(STEPS.SET_PIN);
  };

  /* ---------- Step 2: first PIN entered ---------- */
  const handleFirstPin = useCallback((pin) => {
    setFirstPin(pin);
    setStep(STEPS.CONFIRM_PIN);
  }, []);

  /* ---------- Step 3: confirm PIN + register ---------- */
  const handleConfirmPin = useCallback(async (confirmPin) => {
    if (confirmPin !== firstPin) {
      setPinError(true);
      setError('PINs do not match — please try again');
      setTimeout(() => {
        setPinError(false);
        setError('');
        setFirstPin('');
        setStep(STEPS.SET_PIN);
      }, 1200);
      return;
    }

    setLoading(true);
    setError('');
    const res = await registerOwner(phone, name, businessName, confirmPin);
    setLoading(false);

    if (res.success) {
      navigate('/owner', { replace: true });
    } else {
      setError(res.error || 'Registration failed. Please try again.');
      setFirstPin('');
      setStep(STEPS.SET_PIN);
    }
  }, [firstPin, phone, name, businessName, registerOwner, navigate]);

  /* ---------- Render ---------- */
  return (
    <div className="owner-reg-page">
      {/* Glow blobs */}
      <div className="owner-reg-blob blob-1" />
      <div className="owner-reg-blob blob-2" />

      <div className="owner-reg-card">
        {/* Brand Header */}
        <div className="owner-reg-brand">
          <div className="owner-reg-logo">
            <StorefrontIcon />
          </div>
          <h1 className="owner-reg-app-name">OrderFlow</h1>
          <p className="owner-reg-tagline hindi">मालिक खाता बनाएं</p>
          <p className="owner-reg-tagline-en">Create your owner account</p>
        </div>

        {/* Step indicator */}
        <div className="owner-reg-steps">
          <div className={`owner-reg-step ${step === STEPS.DETAILS ? 'active' : step !== STEPS.DETAILS ? 'done' : ''}`}>
            <span>1</span>
            <p>Details</p>
          </div>
          <div className="owner-reg-step-line" />
          <div className={`owner-reg-step ${step === STEPS.SET_PIN ? 'active' : step === STEPS.CONFIRM_PIN ? 'done' : ''}`}>
            <span>2</span>
            <p>Set PIN</p>
          </div>
          <div className="owner-reg-step-line" />
          <div className={`owner-reg-step ${step === STEPS.CONFIRM_PIN ? 'active' : ''}`}>
            <span>3</span>
            <p>Confirm</p>
          </div>
        </div>

        {/* ---- STEP 1: Details form ---- */}
        {step === STEPS.DETAILS && (
          <form className="owner-reg-form" onSubmit={handleDetailsSubmit}>
            <div className="owner-reg-field">
              <label htmlFor="owner-name">Owner Name / मालिक का नाम</label>
              <input
                id="owner-name"
                type="text"
                placeholder="e.g. Raj Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="owner-reg-field">
              <label htmlFor="biz-name">Business Name (Optional) / दुकान का नाम</label>
              <input
                id="biz-name"
                type="text"
                placeholder="e.g. Raj Plastics"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="owner-reg-field">
              <label htmlFor="owner-phone">
                <PhoneIcon />
                Mobile Number / मोबाइल नंबर
              </label>
              <input
                id="owner-phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                required
              />
            </div>

            {error && <p className="owner-reg-error">{error}</p>}

            <button type="submit" className="owner-reg-btn">
              Continue →
            </button>
          </form>
        )}

        {/* ---- STEP 2: Set PIN ---- */}
        {step === STEPS.SET_PIN && (
          <div className="owner-reg-pin-section">
            <h2 className="owner-reg-pin-title">Set your 4-digit PIN</h2>
            <p className="owner-reg-pin-hint hindi">अपना 4 अंकों का PIN सेट करें</p>
            <PinInput
              key="set-pin"
              length={4}
              onComplete={handleFirstPin}
              error={false}
            />
            <button className="owner-reg-back-link" onClick={() => setStep(STEPS.DETAILS)} type="button">
              ← Back to details
            </button>
          </div>
        )}

        {/* ---- STEP 3: Confirm PIN ---- */}
        {step === STEPS.CONFIRM_PIN && (
          <div className="owner-reg-pin-section">
            <h2 className="owner-reg-pin-title">Confirm your PIN</h2>
            <p className="owner-reg-pin-hint hindi">PIN दोबारा डालें</p>
            {loading ? (
              <div className="owner-reg-loading">
                <div className="owner-reg-spinner" />
                <p>Setting up your account…</p>
              </div>
            ) : (
              <PinInput
                key="confirm-pin"
                length={4}
                onComplete={handleConfirmPin}
                error={pinError}
                errorMessage={error}
              />
            )}
            {!loading && (
              <button className="owner-reg-back-link" onClick={() => { setFirstPin(''); setStep(STEPS.SET_PIN); }} type="button">
                ← Change PIN
              </button>
            )}
          </div>
        )}

        {error && step !== STEPS.DETAILS && (
          <p className="owner-reg-error">{error}</p>
        )}

        <p className="owner-reg-footer-note">
          By registering, all your data will be securely stored in your Google Sheet.
        </p>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
          <button 
            type="button" 
            style={{
              background: 'none', border: 'none', color: 'var(--primary-color)',
              fontSize: '1rem', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline'
            }}
            onClick={() => navigate('/login/owner')}
          >
            पहले से रजिस्टर हैं? यहाँ लॉगिन करें
            <br/>
            (Already registered? Login here)
          </button>
        </div>
      </div>
    </div>
  );
}
