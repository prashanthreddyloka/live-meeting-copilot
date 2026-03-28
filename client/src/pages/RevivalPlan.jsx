import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const severityClasses = {
  healthy: 'severity-badge severity-healthy',
  mild: 'severity-badge severity-mild',
  moderate: 'severity-badge severity-moderate',
  critical: 'severity-badge severity-critical'
};

const ringColor = (value) => {
  if (value > 70) return '#3e7c2f';
  if (value > 40) return '#d56414';
  return '#b53a3a';
};

const CareIcon = ({ type }) => {
  const icons = {
    watering: <path fill="currentColor" d="M12 3.5c2.9 3.3 5 6.2 5 8.7A5 5 0 1 1 7 12.2c0-2.5 2.1-5.4 5-8.7Z" />,
    sunlight: (
      <path
        fill="currentColor"
        d="M12 4a1 1 0 0 1 1 1v1.1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-5a1 1 0 0 1 0 2h-1.1a1 1 0 0 1 0-2H19ZM7.2 12a1 1 0 0 1-1 1H5a1 1 0 1 1 0-2h1.2a1 1 0 0 1 1 1Zm9.39-4.97a1 1 0 0 1 1.41 0l.78.78a1 1 0 1 1-1.41 1.41l-.78-.78a1 1 0 0 1 0-1.41ZM6.41 16.19a1 1 0 0 1 1.41 0l.78.78a1 1 0 0 1-1.41 1.41l-.78-.78a1 1 0 0 1 0-1.41Zm11.37 1.41a1 1 0 0 1-1.41 0l-.78-.78a1 1 0 1 1 1.41-1.41l.78.78a1 1 0 0 1 0 1.41ZM8.6 8.6a1 1 0 0 1-1.41 0l-.78-.78A1 1 0 0 1 7.82 6.4l.78.78a1 1 0 0 1 0 1.41Z"
      />
    ),
    humidity: (
      <path
        fill="currentColor"
        d="M18 15.5a4 4 0 1 1-8 0c0-1.8 1.4-3.7 4-6.6 2.6 2.9 4 4.8 4 6.6Zm-8-2a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1.4 1.1-3.1 4-6.5 2.9 3.4 4 5.1 4 6.5Z"
      />
    ),
    fertilizing: (
      <path
        fill="currentColor"
        d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
      />
    )
  };

  return (
    <svg viewBox="0 0 24 24" className="care-icon" aria-hidden="true">
      {icons[type]}
    </svg>
  );
};

function RevivalPlan() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!location.state) return null;

  const { result, imageDataUrl } = location.state;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (result.survivalChance / 100) * circumference;

  return (
    <div className="revival-page">
      <section className="page-card plant-header-card">
        <div className="plant-avatar-wrap">
          {imageDataUrl ? (
            <img src={imageDataUrl} alt={result.plantName} className="plant-avatar-image" />
          ) : (
            <div className="plant-avatar-fallback">{result.plantName?.charAt(0)?.toUpperCase() || 'P'}</div>
          )}
        </div>
        <h1 className="plant-name-heading">{result.plantName}</h1>
        <p className="plant-common-name">{result.commonName}</p>
        <span className={severityClasses[result.severity] || severityClasses.mild}>{result.severity}</span>
      </section>

      <section className="page-card">
        <p className="info-label">Diagnosis</p>
        <h2 className="diagnosis-type-heading">{result.diagnosisType}</h2>
        <p className="diagnosis-summary">{result.diagnosis}</p>
        <div className="confidence-track">
          <div
            className="confidence-fill"
            style={{ width: `${result.confidence}%`, backgroundColor: ringColor(result.confidence) }}
          />
        </div>
        <p className="confidence-caption">{result.confidence}% confidence</p>
      </section>

      <section className="page-card survival-card">
        <svg viewBox="0 0 120 120" className="survival-ring" aria-hidden="true">
          <circle cx="60" cy="60" r="50" stroke="#f0ebe4" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke={ringColor(result.survivalChance)}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="58" textAnchor="middle" className="ring-value-text">
            {result.survivalChance}%
          </text>
          <text x="60" y="75" textAnchor="middle" className="ring-label-text">
            survive
          </text>
        </svg>
        <p className="survival-label">Survival Chance</p>
        <p className="recovery-caption">Est. recovery: {result.timeToRecover}</p>
      </section>

      <section className="page-section">
        <p className="info-label">Symptoms Detected</p>
        <div className="pill-wrap">
          {result.symptoms.map((symptom) => (
            <span key={symptom} className="symptom-pill">
              {symptom}
            </span>
          ))}
        </div>
      </section>

      <section className="page-card root-cause-card">
        <p className="info-label">Root Cause</p>
        <p className="root-cause-text">{result.rootCause}</p>
      </section>

      {result.severity !== 'healthy' ? (
        <section className="warning-box">
          <svg viewBox="0 0 24 24" className="warning-icon" aria-hidden="true">
            <path fill="currentColor" d="M12 3 2 20h20L12 3Zm1 13h-2v-2h2v2Zm0-4h-2V8h2v4Z" />
          </svg>
          <p>{result.warningIfIgnored}</p>
        </section>
      ) : null}

      <section className="page-card">
        <p className="info-label">Your Revival Plan</p>
        <div className="step-list">
          {result.revivalSteps.map((step, index) => (
            <div
              key={`${step.title}-${step.step}`}
              className={`step-row ${index !== result.revivalSteps.length - 1 ? 'step-row-bordered' : ''}`}
            >
              <div className="step-number">{step.step}</div>
              <div className="step-content">
                <div className="step-title-row">
                  <h3 className="step-title">{step.title}</h3>
                  {step.urgent ? <span className="urgent-badge">URGENT</span> : null}
                </div>
                <p className="step-description">{step.description}</p>
                <span className="timing-badge">{step.timing}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section">
        <p className="info-label">Care Schedule</p>
        <div className="schedule-grid">
          <div className="schedule-card">
            <CareIcon type="watering" />
            <span className="schedule-card-label">Watering</span>
            <span className="schedule-card-value">{result.careSchedule.watering}</span>
          </div>
          <div className="schedule-card">
            <CareIcon type="sunlight" />
            <span className="schedule-card-label">Sunlight</span>
            <span className="schedule-card-value">{result.careSchedule.sunlight}</span>
          </div>
          <div className="schedule-card">
            <CareIcon type="humidity" />
            <span className="schedule-card-label">Humidity</span>
            <span className="schedule-card-value">{result.careSchedule.humidity}</span>
          </div>
          <div className="schedule-card">
            <CareIcon type="fertilizing" />
            <span className="schedule-card-label">Fertilizing</span>
            <span className="schedule-card-value">{result.careSchedule.fertilizing}</span>
          </div>
        </div>
      </section>

      <section className="page-card">
        <p className="info-label">Prevention</p>
        <ul className="prevention-list">
          {result.preventionTips.map((tip) => (
            <li key={tip} className="prevention-item">
              <span className="green-dot" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="action-stack">
        <button type="button" className="button button-primary" onClick={() => navigate('/')}>
          Diagnose Another Plant
        </button>
        <button type="button" className="button button-outline" onClick={() => navigate('/history')}>
          View History
        </button>
      </section>
    </div>
  );
}

export default RevivalPlan;
