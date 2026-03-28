const detectLabels = [
  'Overwatering',
  'Underwatering',
  'Root Rot',
  'Fungal Infection',
  'Bacterial Infection',
  'Pest Infestation',
  'Nutrient Deficiency',
  'Sunburn',
  'Cold Damage',
  'Natural Aging',
  'Healthy'
];

const cards = [
  {
    title: '1. Upload Photo',
    text: 'Take or choose a photo of your plant',
    icon: (
      <path
        fill="currentColor"
        d="M6 6a2 2 0 0 0-2 2v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9.5A2.5 2.5 0 0 0 17.5 7H16l-.8-1.2A2 2 0 0 0 13.53 5h-3.06a2 2 0 0 0-1.67.8L8 7H6Zm6 3.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Z"
      />
    )
  },
  {
    title: '2. AI Analyzes',
    text: 'Gemini identifies diseases, causes, and plant context',
    icon: (
      <path
        fill="currentColor"
        d="M12 2 14.5 7.5 20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2Zm7 13 1 2.2L22 18l-2 .8L19 21l-1-2.2L16 18l2-.8L19 15ZM5 14l1.2 2.6L9 17.8l-2.8 1L5 22l-1.2-3.2L1 17.8l2.8-1.2L5 14Z"
      />
    )
  },
  {
    title: '3. Revival Plan',
    text: 'Get step-by-step instructions to save your plant',
    icon: (
      <path
        fill="currentColor"
        d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
      />
    )
  }
];

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>PlantAutopsy</h1>
        <p>AI-powered plant diagnosis in seconds</p>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">How It Works</p>
            <h2 className="section-title">Three simple steps</h2>
          </div>
        </div>

        <div className="about-steps-grid">
          {cards.map((card) => (
            <div key={card.title} className="about-step-card">
              <svg viewBox="0 0 24 24" className="about-step-icon" aria-hidden="true">
                {card.icon}
              </svg>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-card">
        <p className="info-label">What We Detect</p>
        <div className="pill-wrap">
          {detectLabels.map((label) => (
            <span key={label} className="symptom-pill">
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="privacy-card">
        <svg viewBox="0 0 24 24" className="privacy-icon" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2 4 5v6c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5l-8-3Zm0 4.2 5 1.88V11c0 3.8-2.3 7.5-5 8.7-2.7-1.2-5-4.9-5-8.7V8.08l5-1.88ZM11 10h2v5h-2v-5Zm0-2h2v1.5h-2V8Z"
          />
        </svg>
        <p>Your photos are sent to AI for analysis only. We never store images on our servers.</p>
      </section>

      <p className="about-version">v1.0.0</p>
    </div>
  );
}

export default About;
