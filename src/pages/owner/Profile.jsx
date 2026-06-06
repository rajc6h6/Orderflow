import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, encodePin } from '../../context/AuthContext';
import * as sheetsService from '../../services/sheetsService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from '../../components/Toast';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const res = await sheetsService.getStaff();
    if (res.success) {
      setStaffList(res.data);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (window.confirm('लॉगआउट करें? / Logout?')) {
      logout();
      navigate('/', { replace: true });
    }
  };

  const handleDeleteStaff = async (staffPhone) => {
    if (window.confirm('क्या आप इस स्टाफ को हटाना चाहते हैं? / Delete this staff member?')) {
      const res = await sheetsService.deleteStaff(staffPhone);
      if (res.success) {
        setStaffList(prev => prev.filter(s => s.phone !== staffPhone));
        setToast({ visible: true, message: 'स्टाफ हटा दिया गया / Staff deleted', type: 'success' });
      } else {
        setToast({ visible: true, message: 'Error: ' + res.error, type: 'error' });
      }
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setToast({ visible: true, message: 'फ़ोन नंबर 10 अंकों का होना चाहिए', type: 'error' });
      return;
    }
    if (pin.length !== 4) {
      setToast({ visible: true, message: 'PIN 4 अंकों का होना चाहिए', type: 'error' });
      return;
    }

    setAdding(true);
    const pinHash = encodePin(String(pin));
    const res = await sheetsService.addStaff(phone, pinHash, name);
    setAdding(false);

    if (res.success) {
      setStaffList([...staffList, res.data]);
      setShowAddForm(false);
      setPhone('');
      setPin('');
      setName('');
      setToast({ visible: true, message: 'स्टाफ जोड़ दिया गया / Staff added', type: 'success' });
    } else {
      setToast({ visible: true, message: res.error || 'Error adding staff', type: 'error' });
    }
  };

  return (
    <div className="profile-page">
      <div className="profile__header">
        <button className="profile__back" onClick={() => navigate('/owner')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="profile__title">प्रोफ़ाइल / Profile</h1>
      </div>

      <div className="profile__content">
        {/* Owner Card */}
        <div className="profile__card">
          <div className="profile__card-top">
            <div className="profile__avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="profile__info">
              <h2>मालिक / Owner</h2>
              <p>Admin Account</p>
            </div>
          </div>
          <button className="profile__logout-btn" onClick={handleLogout}>
            लॉगआउट / Logout
          </button>
        </div>

        {/* Staff Management */}
        <div className="profile__staff-section">
          <div className="profile__staff-header">
            <h2>स्टाफ / Staff Members</h2>
            {!showAddForm && (
              <button className="profile__add-btn" onClick={() => setShowAddForm(true)}>
                + Add
              </button>
            )}
          </div>

          {showAddForm && (
            <form className="profile__add-form" onSubmit={handleAddStaff}>
              <h3>नया स्टाफ जोड़ें</h3>
              <input
                type="text"
                placeholder="Name / नाम (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile__input"
              />
              <input
                type="tel"
                placeholder="Phone / फ़ोन (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="profile__input"
                required
              />
              <input
                type="password"
                placeholder="4-digit PIN / पिन"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="profile__input"
                required
              />
              <div className="profile__form-actions">
                <button type="button" className="profile__cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="profile__submit-btn" disabled={adding}>
                  {adding ? 'Adding...' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="profile__loading"><LoadingSpinner /></div>
          ) : staffList.length === 0 ? (
            <div className="profile__empty">कोई स्टाफ नहीं / No staff members found</div>
          ) : (
            <div className="profile__staff-list">
              {staffList.map((staff, idx) => (
                <div key={idx} className="profile__staff-card">
                  <div className="profile__staff-info">
                    <span className="profile__staff-name">{staff.name || 'Staff'}</span>
                    <span className="profile__staff-phone">{staff.phone}</span>
                  </div>
                  <button className="profile__staff-delete" onClick={() => handleDeleteStaff(staff.phone)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
