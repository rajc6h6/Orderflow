import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import './OrderQueue.css';

/**
 * Get relative time string from a date
 */
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'अभी / just now';
  if (diffMins < 60) return `${diffMins} min पहले`;
  if (diffHrs < 24) return `${diffHrs} hr पहले`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function OrderQueue() {
  const { orders, updateOrderStatus, loading, refreshOrders } = useApp();
  const [slidingOutId, setSlidingOutId] = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const listRef = useRef(null);
  const touchStartY = useRef(0);
  const [pulling, setPulling] = useState(false);
  const [pullActive, setPullActive] = useState(false);

  // Filter pending orders, newest first
  const pendingOrders = (orders || [])
    .filter((o) => o.status === 'pending' || o.status === 'Pending')
    .sort((a, b) => new Date(b.placed_at || b.created_at) - new Date(a.placed_at || a.created_at));

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders?.();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    setPullActive(diff > 60);
  }, [pulling]);

  const handleTouchEnd = useCallback(() => {
    if (pullActive) {
      refreshOrders?.();
    }
    setPulling(false);
    setPullActive(false);
  }, [pullActive, refreshOrders]);

  // Handle dispatch confirmation
  const handleDispatch = useCallback(async () => {
    if (!confirmOrder) return;
    const orderId = confirmOrder.order_id || confirmOrder.id;
    setConfirmOrder(null);
    setSlidingOutId(orderId);

    setTimeout(async () => {
      try {
        await updateOrderStatus(orderId, 'Dispatched');
        setSlidingOutId(null);
        setToast({
          visible: true,
          message: 'ऑर्डर भेज दिया गया / Order dispatched',
          type: 'success',
        });
      } catch (err) {
        console.error(err);
        setSlidingOutId(null);
        setToast({
          visible: true,
          message: 'Error: Could not dispatch order',
          type: 'error',
        });
      }
    }, 400);
  }, [confirmOrder, updateOrderStatus]);

  // Loading skeleton
  if (loading) {
    return (
      <Layout role="staff">
        <div className="order-queue">
          <div className="oq-header">
            <div className="oq-header__title-group">
              <h1 className="oq-header__title">Pending Orders</h1>
              <p className="oq-header__subtitle">बाकी ऑर्डर</p>
            </div>
          </div>
          <div className="oq-skeleton">
            {[1, 2, 3].map((i) => (
              <div className="oq-skeleton-card" key={i}>
                <div className="oq-skeleton-line oq-skeleton-line--title" />
                <div className="oq-skeleton-line oq-skeleton-line--item" />
                <div className="oq-skeleton-line oq-skeleton-line--item" style={{ width: '60%' }} />
                <div className="oq-skeleton-line oq-skeleton-line--btn" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (pendingOrders.length === 0 && !slidingOutId) {
    return (
      <Layout role="staff">
        <div className="order-queue"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="oq-header">
            <div className="oq-header__title-group">
              <h1 className="oq-header__title">Pending Orders</h1>
              <p className="oq-header__subtitle">बाकी ऑर्डर</p>
            </div>
            <span className="oq-header__badge">0</span>
          </div>
          <div className="oq-empty">
            <div className="oq-empty__icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <h2 className="oq-empty__title">सभी ऑर्डर भेज दिए गए!</h2>
            <p className="oq-empty__subtitle">All orders dispatched!</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="staff">
      <div
        className="order-queue"
        ref={listRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="oq-header">
          <div className="oq-header__title-group">
            <h1 className="oq-header__title">Pending Orders</h1>
            <p className="oq-header__subtitle">बाकी ऑर्डर</p>
          </div>
          <span className="oq-header__badge">{pendingOrders.length}</span>
        </div>

        {/* Auto-refresh indicator */}
        <div className="oq-refresh-bar">
          <span className="oq-refresh-bar__dot" />
          <span>Auto-refreshing every 30s</span>
        </div>

        {/* Pull to refresh indicator */}
        {pulling && (
          <div className={`oq-pull-indicator${pullActive ? ' oq-pull-indicator--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
            </svg>
          </div>
        )}

        {/* Order cards */}
        <div className="oq-list">
          {pendingOrders.map((order) => (
            <div
              className={`oq-card${slidingOutId === (order.order_id || order.id) ? ' oq-card--sliding-out' : ''}`}
              key={order.order_id || order.id}
            >
              <div className="oq-card__top">
                <h3 className="oq-card__customer">{order.customer_name}</h3>
                <span className="oq-card__time">{timeAgo(order.placed_at || order.created_at)}</span>
              </div>

              <ul className="oq-card__items">
                {(order.items_parsed || (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : order.items) || []).map((item, idx) => (
                  <li className="oq-card__item" key={idx}>
                    <span className="oq-card__item-name">{item.product || item.name}</span>
                    <span className="oq-card__item-qty">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="oq-card__dispatch-btn"
                onClick={() => setConfirmOrder(order)}
                type="button"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                भेज दिया
                <span className="oq-dispatch-en">Mark as Dispatched</span>
              </button>
            </div>
          ))}
        </div>

        {/* Confirm dialog */}
        <ConfirmDialog
          isOpen={!!confirmOrder}
          title="क्या आप sure हैं?"
          message={`${confirmOrder?.customer_name || ''} का ऑर्डर भेज दिया?\nAre you sure you want to dispatch this order?`}
          confirmText="हाँ, भेज दिया"
          cancelText="रद्द करें"
          onConfirm={handleDispatch}
          onCancel={() => setConfirmOrder(null)}
        />

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={() => setToast((t) => ({ ...t, visible: false }))}
        />
      </div>
    </Layout>
  );
}
