import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import './MonthlyExport.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_NAMES_HI = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

export default function MonthlyExport() {
  const { orders } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // Filter orders by selected month/year
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      try {
        const d = new Date(o.placed_at);
        return d.getMonth() === month && d.getFullYear() === year;
      } catch {
        return false;
      }
    });
  }, [orders, month, year]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const dispatched = filteredOrders.filter(o => o.status === 'Dispatched').length;
    const pending = filteredOrders.filter(o => o.status === 'Pending').length;
    return { total, dispatched, pending };
  }, [filteredOrders]);

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  };
  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  };

  const handleDownload = () => {
    if (filteredOrders.length === 0) return;

    const headers = ['Order ID', 'Customer', 'Items', 'Note', 'Status', 'Placed At', 'Dispatched At'];
    const rows = filteredOrders.map(o => [
      o.order_id || o.id || '',
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${(o.items_readable || '').replace(/"/g, '""')}"`,
      `"${(o.note || '').replace(/"/g, '""')}"`,
      o.status || '',
      o.placed_at || '',
      o.dispatched_at || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OrderFlow_${MONTH_NAMES[month]}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout role="owner">
      <div className="monthly-export">
        {/* Header */}
        <div className="monthly-export__header">
          <h1 className="monthly-export__title">
            <span className="monthly-export__title-hindi">मासिक रिपोर्ट</span>
            <span className="monthly-export__title-english">Monthly Export</span>
          </h1>
        </div>

        {/* Month Selector */}
        <div className="monthly-export__month-selector">
          <button className="monthly-export__month-btn" onClick={handlePrevMonth}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="monthly-export__month-display">
            <span className="monthly-export__month-hindi">{MONTH_NAMES_HI[month]} {year}</span>
            <span className="monthly-export__month-english">{MONTH_NAMES[month]} {year}</span>
          </div>
          <button className="monthly-export__month-btn" onClick={handleNextMonth}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Stats Card */}
        <div className="monthly-export__stats-card">
          <div className="monthly-export__stat">
            <span className="monthly-export__stat-number">{stats.total}</span>
            <span className="monthly-export__stat-label">कुल ऑर्डर / Total Orders</span>
          </div>
          <div className="monthly-export__stat-divider"/>
          <div className="monthly-export__stat monthly-export__stat--dispatched">
            <span className="monthly-export__stat-number">{stats.dispatched}</span>
            <span className="monthly-export__stat-label">भेजे गए / Dispatched</span>
          </div>
          <div className="monthly-export__stat-divider"/>
          <div className="monthly-export__stat monthly-export__stat--pending">
            <span className="monthly-export__stat-number">{stats.pending}</span>
            <span className="monthly-export__stat-label">बाकी / Pending</span>
          </div>
        </div>

        {/* Download Button */}
        <button
          className="monthly-export__download-btn"
          onClick={handleDownload}
          disabled={filteredOrders.length === 0}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div className="monthly-export__download-text">
            <span className="monthly-export__download-hindi">डाउनलोड करें</span>
            <span className="monthly-export__download-english">Download CSV</span>
          </div>
        </button>

        {filteredOrders.length === 0 && (
          <p className="monthly-export__empty">
            इस महीने कोई ऑर्डर नहीं / No orders this month
          </p>
        )}

        {/* Info */}
        <div className="monthly-export__info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#717973" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>CSV फ़ाइल को अपने अकाउंटेंट को भेजें GST रिकॉर्ड के लिए / Send this CSV to your accountant for GST records.</p>
        </div>
      </div>
    </Layout>
  );
}
