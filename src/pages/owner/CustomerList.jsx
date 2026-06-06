import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import './CustomerList.css';

export default function CustomerList() {
  const navigate = useNavigate();
  const { customers, orders, addCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Get customer names
  const customerNames = (customers || []).map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

  // Compute stats per customer
  const customerStats = useMemo(() => {
    const stats = {};
    customerNames.forEach(name => {
      const customerOrders = (orders || []).filter(o => o.customer_name === name);
      stats[name] = {
        totalOrders: customerOrders.length,
        lastOrder: customerOrders.length > 0
          ? customerOrders.sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at))[0]?.placed_at
          : null,
        orders: customerOrders.sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at)),
      };
    });
    return stats;
  }, [customerNames, orders]);

  // Filter
  const filtered = customerNames.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addCustomer(newName.trim());
      setNewName('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add customer:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleExpand = (name) => {
    setExpandedCustomer(prev => prev === name ? null : name);
  };

  return (
    <Layout role="owner">
      <div className="customer-list">
        {/* Header */}
        <div className="customer-list__header">
          <div className="customer-list__header-text">
            <h1 className="customer-list__title">
              <span className="customer-list__title-hindi">ग्राहक</span>
              <span className="customer-list__title-english">Customers</span>
            </h1>
            <span className="customer-list__count">{customerNames.length}</span>
          </div>
          <button className="customer-list__add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>नया</span>
          </button>
        </div>

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="customer-list__add-form">
            <input
              type="text"
              className="customer-list__add-input"
              placeholder="ग्राहक का नाम / Customer name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="customer-list__add-actions">
              <button className="customer-list__form-btn customer-list__form-btn--primary" onClick={handleAdd} disabled={adding}>
                {adding ? '...' : 'जोड़ें / Add'}
              </button>
              <button className="customer-list__form-btn" onClick={() => setShowAddForm(false)}>
                रद्द / Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="customer-list__search-wrap">
          <svg className="customer-list__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#717973" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="customer-list__search"
            placeholder="खोजें / Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="customer-list__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#717973" strokeWidth="1" opacity="0.4">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>कोई ग्राहक नहीं मिला</p>
            <p className="customer-list__empty-sub">No customers found</p>
          </div>
        ) : (
          <div className="customer-list__items">
            {filtered.map((name) => {
              const stats = customerStats[name] || { totalOrders: 0, lastOrder: null, orders: [] };
              const isExpanded = expandedCustomer === name;
              return (
                <div key={name} className="customer-list__item-wrap">
                  <div className="customer-list__item" onClick={() => handleToggleExpand(name)}>
                    <div className="customer-list__item-avatar">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-list__item-info">
                      <span className="customer-list__item-name">{name}</span>
                      <span className="customer-list__item-meta">
                        {stats.totalOrders} orders
                        {stats.lastOrder && ` · Last: ${formatRelativeTime(stats.lastOrder)}`}
                      </span>
                    </div>
                    <svg className={`customer-list__chevron ${isExpanded ? 'customer-list__chevron--open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#717973" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {isExpanded && stats.orders.length > 0 && (
                    <div className="customer-list__order-history">
                      <span className="customer-list__history-label">Order History</span>
                      {stats.orders.slice(0, 10).map((o, idx) => (
                        <div
                          key={idx}
                          className="customer-list__history-item"
                          onClick={() => navigate(`/owner/orders/${o.order_id || o.id}`)}
                        >
                          <span className="customer-list__history-items">{o.items_readable || '—'}</span>
                          <div className="customer-list__history-bottom">
                            <span className={`customer-list__history-status customer-list__history-status--${o.status?.toLowerCase()}`}>
                              {o.status}
                            </span>
                            <span className="customer-list__history-date">{formatDate(o.placed_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && stats.orders.length === 0 && (
                    <div className="customer-list__order-history">
                      <p className="customer-list__no-orders">अभी कोई ऑर्डर नहीं / No orders yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
