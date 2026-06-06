import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders, isLoading, fetchOrders } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const pendingOrders = (orders || []).filter((o) => o.status === 'Pending');
  const dispatchedToday = (orders || []).filter((o) => {
    if (o.status !== 'Dispatched') return false;
    try {
      return new Date(o.dispatched_at || o.placed_at) >= todayStart;
    } catch {
      return false;
    }
  });

  const recentOrders = (orders || [])
    .slice()
    .sort((a, b) => new Date(b.placed_at || 0) - new Date(a.placed_at || 0))
    .slice(0, 20);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !fetchOrders) return;
    setIsRefreshing(true);
    try {
      await fetchOrders();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchOrders]);

  // Pull-to-refresh: refetch on scroll to top
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const scrollTop = document.querySelector('.layout__content')?.scrollTop || 0;
      if (scrollTop <= 0 && touchEndY - touchStartY > 80) {
        handleRefresh();
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleRefresh]);

  return (
    <Layout role="owner">
      <div className="dashboard">
        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="dashboard__refresh-bar">
            <div className="dashboard__refresh-progress"></div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="dashboard__stats">
          <div className="dashboard__stat-card dashboard__stat-card--pending">
            <div className="dashboard__stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-number">{pendingOrders.length}</span>
              <span className="dashboard__stat-label">बाकी / Pending</span>
            </div>
          </div>

          <div className="dashboard__stat-card dashboard__stat-card--dispatched">
            <div className="dashboard__stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-number">{dispatchedToday.length}</span>
              <span className="dashboard__stat-label">आज भेजा / Today</span>
            </div>
          </div>
        </section>

        {/* New Order CTA */}
        <section className="dashboard__cta-section">
          <button
            className="dashboard__cta-btn"
            onClick={() => navigate('/owner/voice-order')}
          >
            <div className="dashboard__cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div className="dashboard__cta-text">
              <span className="dashboard__cta-hindi">नया ऑर्डर</span>
              <span className="dashboard__cta-english">New Order</span>
            </div>
            <svg className="dashboard__cta-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </section>

        {/* Recent Orders */}
        <section className="dashboard__orders">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">
              <span className="dashboard__section-hindi">हाल के ऑर्डर</span>
              <span className="dashboard__section-english">Recent Orders</span>
            </h2>
            {orders && orders.length > 0 && (
              <span className="dashboard__order-count">{orders.length}</span>
            )}
          </div>

          {isLoading && !isRefreshing ? (
            <LoadingSpinner text="ऑर्डर लोड हो रहे हैं... / Loading orders..." />
          ) : recentOrders.length === 0 ? (
            <div className="dashboard__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <p className="dashboard__empty-title">कोई ऑर्डर नहीं</p>
              <p className="dashboard__empty-subtitle">No orders yet — tap "New Order" to start</p>
            </div>
          ) : (
            <div className="dashboard__order-list">
              {recentOrders.map((order) => (
                <OrderCard
                  key={order.order_id || order.id}
                  order={order}
                  onClick={() => navigate(`/owner/orders/${order.order_id || order.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
