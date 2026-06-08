import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import SuccessOverlay from '../../components/SuccessOverlay';
import { generateOrderId } from '../../utils/formatters';
import './ManualOrder.css';

export default function ManualOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, products, addOrder, addCustomer } = useApp();
  const { ownerProfile } = useAuth();

  const prefill = location.state?.prefill;

  const [customerName, setCustomerName] = useState(prefill?.customer_name || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [items, setItems] = useState(
    prefill?.items?.length
      ? prefill.items.map(i => ({ product: i.product, quantity: i.quantity || '' }))
      : [{ product: '', quantity: '' }]
  );
  const [note, setNote] = useState(prefill?.raw_note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const customerInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get customer names as strings
  const customerNames = (customers || []).map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
  const productNames = (products || []).map(p => typeof p === 'string' ? p : p.name).filter(Boolean);

  // Filter customers by search
  const filteredCustomers = customerNames.filter(name =>
    name.toLowerCase().includes((customerSearch || customerName).toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectCustomer = (name) => {
    setCustomerName(name);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    await addCustomer(newCustomerName.trim());
    setCustomerName(newCustomerName.trim());
    setNewCustomerName('');
    setShowAddCustomer(false);
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { product: '', quantity: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');

    if (!customerName.trim()) {
      setError('ग्राहक का नाम डालें / Please enter customer name');
      return;
    }

    const validItems = items.filter(i => i.product && i.quantity);
    if (validItems.length === 0) {
      setError('कम से कम एक आइटम जोड़ें / Add at least one item with quantity');
      return;
    }

    setSaving(true);
    try {
      const orderData = {
        order_id: generateOrderId(),
        customer_name: customerName.trim(),
        items: validItems.map(i => ({ product: i.product, quantity: Number(i.quantity) })),
        items_readable: validItems.map(i => `${i.quantity} ${i.product}`).join(', '),
        note: note.trim(),
        status: 'Pending',
        placed_at: new Date().toISOString(),
        dispatched_at: '',
        placed_by: ownerProfile?.name || 'Owner',
        dispatched_by: '',
      };

      const result = await addOrder(orderData);
      if (result.success || result.offline) {
        setSuccessVisible(true);
        setTimeout(() => navigate('/owner'), 2000);
      } else {
        setError(result.error || 'ऑर्डर सेव नहीं हुआ / Failed to save order');
      }
    } catch (err) {
      console.error(err);
      setError('ऑर्डर सेव नहीं हुआ / Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  if (successVisible) {
    return <SuccessOverlay messageHi="ऑर्डर सेव हो गया!" messageEn="Order placed. Staff has been notified." />;
  }

  return (
    <div className="manual-order">
      {/* Header */}
      <div className="manual-order__header">
        <button className="manual-order__back" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="manual-order__title">
          <span className="manual-order__title-hindi">ऑर्डर फॉर्म</span>
          <span className="manual-order__title-english">Manual Order</span>
        </h1>
      </div>

      <div className="manual-order__body">
        {/* Customer Selection */}
        <div className="manual-order__field" ref={dropdownRef}>
          <label className="manual-order__label">ग्राहक / Customer</label>
          <div className="manual-order__customer-input-wrap">
            <input
              ref={customerInputRef}
              type="text"
              className="manual-order__input"
              placeholder="ग्राहक का नाम टाइप करें..."
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
            />
            {customerName && (
              <button className="manual-order__clear-btn" onClick={() => { setCustomerName(''); setShowCustomerDropdown(true); }}>
                ✕
              </button>
            )}
          </div>

          {showCustomerDropdown && (
            <div className="manual-order__dropdown">
              {filteredCustomers.map((name, i) => (
                <button key={i} className="manual-order__dropdown-item" onClick={() => handleSelectCustomer(name)}>
                  {name}
                </button>
              ))}
              {filteredCustomers.length === 0 && customerName && (
                <div className="manual-order__dropdown-empty">कोई मिलान नहीं / No match</div>
              )}
              <button className="manual-order__dropdown-add" onClick={() => { setShowAddCustomer(true); setShowCustomerDropdown(false); setNewCustomerName(customerName); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                नया ग्राहक जोड़ें / Add New Customer
              </button>
            </div>
          )}
        </div>

        {/* Add New Customer Inline */}
        {showAddCustomer && (
          <div className="manual-order__add-customer">
            <input
              type="text"
              className="manual-order__input"
              placeholder="नया ग्राहक का नाम..."
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              autoFocus
            />
            <div className="manual-order__add-customer-actions">
              <button className="manual-order__btn-small manual-order__btn-small--primary" onClick={handleAddNewCustomer}>
                जोड़ें / Add
              </button>
              <button className="manual-order__btn-small" onClick={() => setShowAddCustomer(false)}>
                रद्द / Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="manual-order__field">
          <label className="manual-order__label">सामान / Items</label>
          <div className="manual-order__items-list">
            {items.map((item, index) => (
              <div key={index} className="manual-order__item-row">
                <select
                  className="manual-order__select"
                  value={item.product}
                  onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                >
                  <option value="">प्रोडक्ट चुनें...</option>
                  {productNames.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="manual-order__qty-input"
                  placeholder="Qty"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <button className="manual-order__remove-item" onClick={() => handleRemoveItem(index)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="manual-order__add-item-btn" onClick={handleAddItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>और आइटम जोड़ें / Add another item</span>
          </button>
        </div>

        {/* Note */}
        <div className="manual-order__field">
          <label className="manual-order__label">नोट / Note (optional)</label>
          <input
            type="text"
            className="manual-order__input"
            placeholder="कोई विशेष निर्देश..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="manual-order__error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          className="manual-order__submit-btn"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <span className="manual-order__submit-hindi">ऑर्डर भेजें</span>
              <span className="manual-order__submit-english">Submit Order</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
