import StatusBadge from './StatusBadge';
import './OrderCard.css';

function getRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'अभी / Just now';
    if (diffMins < 60) return `${diffMins} मिनट पहले / ${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours} घंटे पहले / ${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays} दिन पहले / ${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function OrderCard({ order, onClick, actionButton }) {
  const {
    order_id,
    customer_name,
    items_readable,
    status = 'Pending',
    placed_at,
    note,
  } = order || {};

  const isPending = status === 'Pending';

  return (
    <article
      className={`order-card ${onClick ? 'order-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div
        className="order-card__accent"
        style={{ backgroundColor: isPending ? '#ffbf00' : '#1b4332' }}
      />
      <div className="order-card__content">
        <div className="order-card__header">
          <h3 className="order-card__customer">{customer_name || 'Unknown'}</h3>
          <StatusBadge status={status} />
        </div>

        {items_readable && (
          <p className="order-card__items">{items_readable}</p>
        )}

        {note && (
          <p className="order-card__note">
            <svg className="order-card__note-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {note}
          </p>
        )}

        <div className="order-card__footer">
          <span className="order-card__time">{getRelativeTime(placed_at)}</span>
          {order_id && (
            <span className="order-card__id">#{order_id}</span>
          )}
        </div>

        {actionButton && (
          <div className="order-card__actions">
            {actionButton}
          </div>
        )}
      </div>
    </article>
  );
}
