import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import Toast from '../components/Toast';
import './StaffLogin.css';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { loginStaff } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: PIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setToast({ visible: true, message: 'फ़ोन नंबर 10 अंकों का होना चाहिए', type: 'error' });
      return;
    }
    setStep(2);
    setError(false);
    setErrorMessage('');
  };

  const handlePinComplete = async (pin) => {
    setLoading(true);
    const res = await loginStaff(phone, pin);
    setLoading(false);

    if (res.success) {
      navigate('/staff', { replace: true });
    } else {
      setError(true);
      setErrorMessage(res.error || 'Incorrect PIN');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError(false);
      setErrorMessage('');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login__header">
        <button className="staff-login__back" onClick={handleBack} type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      <div className="staff-login__content">
        <div className="staff-login__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        
        <h1 className="staff-login__title">स्टाफ लॉगिन / Staff Login</h1>
        
        {step === 1 ? (
          <form className="staff-login__phone-form" onSubmit={handlePhoneSubmit}>
            <p className="staff-login__subtitle">अपना मोबाइल नंबर दर्ज करें</p>
            <input
              type="tel"
              className="staff-login__phone-input"
              placeholder="10-digit Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoFocus
            />
            <button 
              type="submit" 
              className="staff-login__next-btn"
              disabled={phone.length !== 10}
            >
              आगे बढ़ें / Next
            </button>
          </form>
        ) : (
          <div className="staff-login__pin-section">
            <p className="staff-login__subtitle">
              नंबर <b>{phone}</b> के लिए PIN दर्ज करें
            </p>
            {loading ? (
              <div className="staff-login__loading">
                Verifying...
              </div>
            ) : (
              <PinInput
                length={4}
                onComplete={handlePinComplete}
                error={error}
                errorMessage={errorMessage}
              />
            )}
          </div>
        )}
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        onClose={() => setToast(t => ({ ...t, visible: false }))} 
      />
    </div>
  );
}
