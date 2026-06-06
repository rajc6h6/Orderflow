import './LoadingSpinner.css';

export default function LoadingSpinner({ text, overlay = false }) {
  const spinner = (
    <div className={`loading-spinner ${overlay ? 'loading-spinner--overlay' : ''}`}>
      <div className="loading-spinner__container">
        <div className="loading-spinner__ring">
          <div className="loading-spinner__circle"></div>
        </div>
        {text && (
          <p className="loading-spinner__text">{text}</p>
        )}
      </div>
    </div>
  );

  return spinner;
}
