import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RoleSelect.css';

function OrderFlowLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3h5v5" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
    </svg>
  );
}

function OwnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a4 4 0 00-8 0v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  );
}

export default function RoleSelect() {
  const navigate = useNavigate();
  const { resetPins } = useAuth();

  const handleRoleClick = (role) => {
    navigate(`/login/${role}`);
  };

  const handleReset = () => {
    if (window.confirm('यह सभी PINs को मिटा देगा। क्या आप सुनिश्चित हैं?\n\nThis will erase all PINs. Are you sure?')) {
      resetPins();
      window.location.reload();
    }
  };

  return (
    <div className="role-select-page">
      {/* Branding */}
      <div className="role-select-brand">
        <div className="role-select-logo">
          <div className="role-select-logo-icon">
            <OrderFlowLogo />
          </div>
          <h1 className="role-select-title">OrderFlow</h1>
        </div>
        <p className="role-select-subtitle hindi">ऑर्डर फ्लो</p>
      </div>

      {/* Role Cards */}
      <div className="role-select-cards">
        <button
          className="role-card role-owner"
          onClick={() => handleRoleClick('owner')}
          type="button"
          aria-label="Login as Owner — मालिक"
        >
          <div className="role-card-icon">
            <OwnerIcon />
          </div>
          <span className="role-card-label hindi">मैं मालिक हूँ</span>
          <span className="role-card-sublabel">I am the Owner</span>
        </button>

        <button
          className="role-card role-staff"
          onClick={() => handleRoleClick('staff')}
          type="button"
          aria-label="Login as Staff — स्टाफ"
        >
          <div className="role-card-icon">
            <StaffIcon />
          </div>
          <span className="role-card-label hindi">मैं स्टाफ हूँ</span>
          <span className="role-card-sublabel">I am Staff</span>
        </button>
      </div>

      {/* Footer */}
      <div className="role-select-footer">
        <button
          className="role-reset-link"
          onClick={handleReset}
          type="button"
        >
          Reset PIN
        </button>
      </div>
    </div>
  );
}
