import { useApp } from '../../context/AppContext';
import Layout from '../../components/Layout';
import './DispatchedToday.css';

/**
 * Format dispatch time
 */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a date is today
 */
function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function DispatchedToday() {
  const { orders } = useApp();

  // Filter: dispatched + dispatched_at is today
  const dispatchedToday = (orders || [])
    .filter(
      (o) =>
        (o.status === 'Dispatched' || o.status === 'dispatched') &&
        isToday(o.dispatched_at || o.updated_at)
    )
    .sort(
      (a, b) =>
        new Date(b.dispatched_at || b.updated_at) -
        new Date(a.dispatched_at || a.updated_at)
    );

  return (
    <Layout role="staff">
      <div className="dispatched-today">
        {/* Header */}
        <div className="dt-header">
          <div className="dt-header__title-group">
            <h1 className="dt-header__title">Dispatched Today</h1>
            <p className="dt-header__subtitle">आज भेजे गए</p>
          </div>
        </div>

        {/* Count summary */}
        <div className="dt-count">
          <span className="dt-count__badge">{dispatchedToday.length}</span>
          <span className="dt-count__text">
            {dispatchedToday.length === 1
              ? 'order dispatched today'
              : 'orders dispatched today'}
          </span>
        </div>

        {/* Empty state */}
        {dispatchedToday.length === 0 ? (
          <div className="dt-empty">
            <div className="dt-empty__icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
              </svg>
            </div>
            <h2 className="dt-empty__title">आज कोई ऑर्डर नहीं भेजा</h2>
            <p className="dt-empty__subtitle">No orders dispatched today</p>
          </div>
        ) : (
          <div className="dt-list">
            {dispatchedToday.map((order) => (
              <div className="dt-card" key={order.order_id || order.id}>
                <div className="dt-card__top">
                  <h3 className="dt-card__customer">{order.customer_name}</h3>
                  <span className="dt-card__time">
                    <svg viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    {formatTime(order.dispatched_at || order.updated_at)}
                  </span>
                </div>

                <ul className="dt-card__items">
                  {(order.items_parsed || (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : order.items) || []).map((item, idx) => (
                    <li className="dt-card__item" key={idx}>
                      <span className="dt-card__item-name">{item.product || item.name}</span>
                      <span className="dt-card__item-qty">
                        {item.quantity} {item.unit || 'pcs'}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="dt-card__status">
                  <span className="dt-card__status-dot" />
                  Dispatched
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
