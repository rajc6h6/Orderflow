import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import SuccessOverlay from '../../components/SuccessOverlay';
import { generateOrderId } from '../../utils/formatters';
import './ConfirmOrder.css';

export default function ConfirmOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addOrder, addCustomer } = useApp();

  const extractedOrder = location.state?.orderData || location.state?.extractedOrder;
  const [saving, setSaving] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customerAdded, setCustomerAdded] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  // Redirect if no data
  if (!extractedOrder) {
    return (
      <div className="confirm-order">
        <div className="confirm-order__header">
          <button className="confirm-order__back" onClick={() => navigate('/owner/voice-order')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="confirm-order__title">Order Summary</h1>
        </div>
        <div className="confirm-order__empty">
          <p>कोई ऑर्डर डेटा नहीं / No order data found</p>
          <button className="confirm-order__btn confirm-order__btn--primary" onClick={() => navigate('/owner/voice-order')}>
            वापस जाएं / Go Back
          </button>
        </div>
      </div>
    );
  }

  const { customer_name, is_new_customer, items, raw_note } = extractedOrder;

  const handleAddCustomer = async () => {
    setAddingCustomer(true);
    try {
      await addCustomer(customer_name);
      setCustomerAdded(true);
    } catch (err) {
      console.error('Failed to add customer:', err);
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const orderData = {
        order_id: generateOrderId(),
        customer_name: customer_name,
        items: items || [],
        items_readable: (items || []).map(i => `${i.quantity || '?'} ${i.product}`).join(', '),
        note: raw_note || '',
        status: 'Pending',
        placed_at: new Date().toISOString(),
        dispatched_at: '',
        placed_by: 'Owner',
        dispatched_by: '',
      };

      const result = await addOrder(orderData);

      if (result.success || result.offline) {
        setSuccessVisible(true);
        setTimeout(() => navigate('/owner'), 2000);
      }
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    navigate('/owner/manual-order', { state: { prefill: extractedOrder } });
  };

  if (successVisible) {
    return <SuccessOverlay messageHi="ऑर्डर सेव हो गया!" messageEn="Order placed. Staff has been notified." />;
  }

  return (
    <div className="confirm-order">
      {/* Header */}
      <div className="confirm-order__header">
        <button className="confirm-order__back" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="confirm-order__title">
          <span className="confirm-order__title-hindi">ऑर्डर पुष्टि</span>
          <span className="confirm-order__title-english">Order Summary</span>
        </h1>
      </div>

      <div className="confirm-order__body">
        {/* New Customer Warning */}
        {is_new_customer && !customerAdded && (
          <div className="confirm-order__new-customer-banner">
            <div className="confirm-order__banner-icon">⚠</div>
            <div className="confirm-order__banner-content">
              <p className="confirm-order__banner-text">
                "{customer_name}" आपकी ग्राहक सूची में नहीं है
              </p>
              <p className="confirm-order__banner-sub">Not in your customer list</p>
              <div className="confirm-order__banner-actions">
                <button
                  className="confirm-order__banner-btn"
                  onClick={handleAddCustomer}
                  disabled={addingCustomer}
                >
                  {addingCustomer ? 'जोड़ रहे हैं...' : 'नया ग्राहक जोड़ें / Add Customer'}
                </button>
                <button
                  className="confirm-order__banner-link"
                  onClick={handleEdit}
                >
                  नाम बदलें / Edit Name
                </button>
              </div>
            </div>
          </div>
        )}

        {customerAdded && (
          <div className="confirm-order__customer-added">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{customer_name} ग्राहक सूची में जोड़ा गया / Added to customers</span>
          </div>
        )}

        {/* Order Summary Card */}
        <div className="confirm-order__card">
          <div className="confirm-order__customer">
            <span className="confirm-order__label">Customer / ग्राहक</span>
            <span className="confirm-order__customer-name">{customer_name}</span>
          </div>

          <div className="confirm-order__divider"/>

          {/* Items Table */}
          <div className="confirm-order__items">
            <span className="confirm-order__label">Items / सामान</span>
            <div className="confirm-order__items-list">
              {(items || []).map((item, idx) => (
                <div key={idx} className="confirm-order__item-row">
                  <span className="confirm-order__item-name">{item.product}</span>
                  <span className="confirm-order__item-qty">
                    {item.quantity !== null && item.quantity !== undefined
                      ? `${item.quantity} units`
                      : '— units'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {raw_note && (
            <>
              <div className="confirm-order__divider"/>
              <div className="confirm-order__note">
                <span className="confirm-order__label">Note / नोट</span>
                <p className="confirm-order__note-text">{raw_note}</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="confirm-order__actions">
          <button
            className="confirm-order__btn confirm-order__btn--secondary"
            onClick={handleEdit}
            disabled={saving}
          >
            <span className="confirm-order__btn-hindi">बदलें</span>
            <span className="confirm-order__btn-english">Edit</span>
          </button>
          <button
            className="confirm-order__btn confirm-order__btn--primary"
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <span className="confirm-order__btn-hindi">ऑर्डर पक्का करें</span>
                <span className="confirm-order__btn-english">Confirm Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
