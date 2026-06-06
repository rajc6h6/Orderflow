import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatTime } from '../../utils/formatters';
import './OrderDetail.css';

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orders, deleteOrder } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  const order = (orders || []).find(o => (o.order_id || o.id) === id);

  if (!order) {
    return (
      <div className="order-detail">
        <div className="order-detail__header">
          <button className="order-detail__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="order-detail__title-text">Order Detail</h1>
        </div>
        <div className="order-detail__not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#717973" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <p>ऑर्डर नहीं मिला / Order not found</p>
          <button className="order-detail__back-btn" onClick={() => navigate('/owner')}>
            वापस जाएं / Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('क्या आप सच में इस ऑर्डर को हटाना चाहते हैं? / Are you sure you want to delete this order?')) {
      setIsDeleting(true);
      const res = await deleteOrder(order.order_id || order.id);
      setIsDeleting(false);
      if (res.success || res.offline) {
        navigate('/owner');
      } else {
        alert('Failed to delete order: ' + res.error);
      }
    }
  };

  const items = order.items_parsed || (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : order.items) || [];

  return (
    <div className="order-detail">
      {/* Header */}
      <div className="order-detail__header">
        <button className="order-detail__back" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="order-detail__header-info">
          <h1 className="order-detail__title-text">
            <span className="order-detail__title-hindi">ऑर्डर विवरण</span>
            <span className="order-detail__title-eng">Order Detail</span>
          </h1>
        </div>
      </div>

      <div className="order-detail__body">
        {/* Customer + Status */}
        <div className="order-detail__top-section">
          <h2 className="order-detail__customer">{order.customer_name}</h2>
          <StatusBadge status={order.status} />
        </div>

        {/* Order ID */}
        <div className="order-detail__meta">
          <span className="order-detail__meta-label">Order ID</span>
          <span className="order-detail__meta-value">{order.order_id || order.id}</span>
        </div>

        {/* Items Card */}
        <div className="order-detail__card">
          <div className="order-detail__card-header">
            <span className="order-detail__section-label">सामान / Items</span>
          </div>
          <div className="order-detail__items-list">
            {items.map((item, idx) => (
              <div key={idx} className="order-detail__item-row">
                <span className="order-detail__item-name">{item.product}</span>
                <span className="order-detail__item-qty">{item.quantity !== null ? `${item.quantity} units` : '—'}</span>
              </div>
            ))}
            {items.length === 0 && order.items_readable && (
              <div className="order-detail__item-row">
                <span className="order-detail__item-name">{order.items_readable}</span>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div className="order-detail__card">
            <div className="order-detail__card-header">
              <span className="order-detail__section-label">नोट / Note</span>
            </div>
            <p className="order-detail__note">{order.note}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="order-detail__card">
          <div className="order-detail__card-header">
            <span className="order-detail__section-label">समय / Timeline</span>
          </div>
          <div className="order-detail__timeline">
            <div className="order-detail__timeline-item">
              <div className="order-detail__timeline-dot order-detail__timeline-dot--placed"/>
              <div className="order-detail__timeline-info">
                <span className="order-detail__timeline-label">ऑर्डर दिया / Placed</span>
                <span className="order-detail__timeline-time">
                  {formatDate(order.placed_at)} — {formatTime(order.placed_at)}
                </span>
              </div>
            </div>
            {order.status === 'Dispatched' && order.dispatched_at && (
              <div className="order-detail__timeline-item">
                <div className="order-detail__timeline-dot order-detail__timeline-dot--dispatched"/>
                <div className="order-detail__timeline-info">
                  <span className="order-detail__timeline-label">भेज दिया / Dispatched</span>
                  <span className="order-detail__timeline-time">
                    {formatDate(order.dispatched_at)} — {formatTime(order.dispatched_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <div className="order-detail__actions">
          <button 
            className="order-detail__delete-btn" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'हटाया जा रहा है... / Deleting...' : 'ऑर्डर हटाएं / Delete Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
