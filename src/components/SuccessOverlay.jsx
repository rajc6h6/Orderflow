import './SuccessOverlay.css';

export default function SuccessOverlay({ messageHi = 'सफलतापूर्वक पूरा हुआ!', messageEn = 'Action completed successfully.' }) {
  return (
    <div className="success-overlay">
      <div className="success-overlay__content">
        <div className="success-overlay__circle">
          <svg className="success-overlay__checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="success-overlay__checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="success-overlay__checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <p className="success-overlay__hindi">{messageHi}</p>
        <p className="success-overlay__english">{messageEn}</p>
      </div>
    </div>
  );
}
