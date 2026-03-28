import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearHistory, getHistory } from '../utils/storage';

const severityClasses = {
  healthy: 'severity-badge severity-healthy',
  mild: 'severity-badge severity-mild',
  moderate: 'severity-badge severity-moderate',
  critical: 'severity-badge severity-critical'
};

function History() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(getHistory());
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    const confirmed = window.confirm('Delete all plant diagnoses? This cannot be undone.');
    if (!confirmed) return;
    clearHistory();
    setItems([]);
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="page-card loading-card">
          <div className="history-skeleton" />
          <div className="history-skeleton short" />
          <div className="history-skeleton" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="history-page">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" className="empty-state-icon" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
            />
          </svg>
          <h2>No diagnoses yet</h2>
          <p>Upload a plant photo to get started</p>
          <button type="button" className="button button-primary" onClick={() => navigate('/')}>
            Diagnose a Plant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Saved Cases</p>
          <h1 className="section-title">Diagnosis History</h1>
        </div>
      </div>

      <div className="history-list">
        {items.map((item) => (
          <button
            key={`${item.savedAt}-${item.plantName}`}
            type="button"
            className="history-card"
            onClick={() =>
              navigate('/revival-plan', {
                state: { result: item, imageDataUrl: item.imageDataUrl }
              })
            }
          >
            <div className="history-thumb">
              {item.imageDataUrl ? (
                <img src={item.imageDataUrl} alt={item.plantName} className="history-thumb-image" />
              ) : (
                <div className="history-thumb-fallback">{item.plantName?.charAt(0)?.toUpperCase() || 'P'}</div>
              )}
            </div>
            <div className="history-content">
              <h2>{item.plantName}</h2>
              <p>{item.diagnosisType}</p>
            </div>
            <div className="history-meta">
              <span className={severityClasses[item.severity] || severityClasses.mild}>{item.severity}</span>
              <span>{new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>{item.survivalChance}% survive</span>
            </div>
          </button>
        ))}
      </div>

      <button type="button" className="button button-outline-danger" onClick={handleClear}>
        Clear All History
      </button>
    </div>
  );
}

export default History;
