import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const OWNER_TABS = [
  {
    path: '/owner',
    label: 'Dashboard',
    labelHi: 'डैशबोर्ड',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: '/owner/customers',
    label: 'Customers',
    labelHi: 'ग्राहक',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/owner/export',
    label: 'Export',
    labelHi: 'निर्यात',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

const STAFF_TABS = [
  {
    path: '/staff',
    label: 'Orders',
    labelHi: 'ऑर्डर',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    path: '/staff/dispatched',
    label: 'Dispatched',
    labelHi: 'भेज दिया',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
];

export default function Layout({ children, role = 'owner' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs = role === 'owner' ? OWNER_TABS : STAFF_TABS;

  const isActiveTab = (tabPath) => {
    if (tabPath === '/owner' || tabPath === '/staff') {
      return location.pathname === tabPath;
    }
    return location.pathname.startsWith(tabPath);
  };

  const handleLogout = () => {
    if (window.confirm('लॉगआउट करें? / Logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="layout">
      {/* Offline Banner */}
      {isOffline && (
        <div className="layout__offline-banner" role="alert">
          <svg className="layout__offline-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <span className="layout__offline-text">
            <span className="layout__offline-hindi">इंटरनेट नहीं है — ऑनलाइन होने पर ऑर्डर सेव होगा</span>
            <span className="layout__offline-separator"> / </span>
            <span className="layout__offline-english">No internet — orders will save when connection returns</span>
          </span>
        </div>
      )}

      {/* Header */}
      <header className="layout__header">
        <div className="layout__header-left">
          <h1 className="layout__logo">
            <span className="layout__logo-order">Order</span>
            <span className="layout__logo-flow">Flow</span>
          </h1>
        </div>
        {role === 'owner' ? (
          <button
            className="layout__logout-btn"
            onClick={() => navigate('/owner/profile')}
            aria-label="Profile"
            title="प्रोफ़ाइल / Profile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        ) : (
          <button
            className="layout__logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="लॉगआउट / Logout"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="layout__content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="layout__bottom-nav" role="navigation" aria-label="Main navigation">
        {tabs.map((tab) => {
          const active = isActiveTab(tab.path);
          return (
            <button
              key={tab.path}
              className={`layout__nav-item ${active ? 'layout__nav-item--active' : ''}`}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="layout__nav-icon">{tab.icon}</span>
              <span className="layout__nav-label">{tab.labelHi}</span>
              <span className="layout__nav-label-en">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
