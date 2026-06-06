import './StatusBadge.css';

const STATUS_CONFIG = {
  Pending: {
    hindi: 'बाकी',
    english: 'Pending',
    className: 'status-badge--pending',
  },
  Dispatched: {
    hindi: 'भेज दिया',
    english: 'Dispatched',
    className: 'status-badge--dispatched',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-badge__hindi">{config.hindi}</span>
      <span className="status-badge__separator"> / </span>
      <span className="status-badge__english">{config.english}</span>
    </span>
  );
}
