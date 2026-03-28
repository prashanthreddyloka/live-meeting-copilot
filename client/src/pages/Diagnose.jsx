import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { diagnosePlant, explorePlant } from '../utils/api';
import { saveToHistory } from '../utils/storage';
import { uid } from '../utils/uid';

const rotatingMessages = [
  'Examining the leaves...',
  'Checking for disease patterns...',
  'Analyzing root symptoms...',
  'Preparing your revival plan...'
];

const uploadIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-zone-icon">
    <path
      fill="#3e7c2f"
      d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
    />
  </svg>
);

function Diagnose() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);
  const previewObjectUrlRef = useRef('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState('');
  const [explorePrompt, setExplorePrompt] = useState('');
  const [exploreResult, setExploreResult] = useState(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setMessageIndex((current) => (current + 1) % rotatingMessages.length);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = nextPreviewUrl;
    setError('');
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const handleChoosePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetDiagnosisState = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = '';
    }
    setError('');
    setLoading(false);
    setMessageIndex(0);
    setSelectedFile(null);
    setPreviewUrl('');
    setNickname('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDiagnose = async () => {
    if (!selectedFile) {
      return;
    }

    resetDiagnosisState();
    setLoading(true);

    try {
      const fullDataUrl = await readFileAsDataUrl(selectedFile);
      const rawBase64 = String(fullDataUrl).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const mimeType = selectedFile.type;
      const result = await diagnosePlant(rawBase64, mimeType);
      const diagnosisResult = {
        ...result,
        plantName: nickname.trim() || result.plantName,
        entryId: uid()
      };

      saveToHistory(diagnosisResult, fullDataUrl);
      navigate('/revival-plan', {
        state: { result: diagnosisResult, imageDataUrl: fullDataUrl }
      });
    } catch (diagnosisError) {
      setError('We could not diagnose this plant right now. Please try again with a clear photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = async () => {
    if (!explorePrompt.trim()) {
      setExploreError('Enter a plant name to explore.');
      return;
    }

    setExploreError('');
    setExploreLoading(true);

    try {
      const result = await explorePlant(explorePrompt.trim());
      setExploreResult(result);
    } catch (plantError) {
      setExploreError('We could not load that plant profile right now. Please try again.');
    } finally {
      setExploreLoading(false);
    }
  };

  return (
    <div className="diagnose-page">
      <section className="hero-panel">
        <p className="eyebrow">Mobile Plant Rescue</p>
        <h1 className="hero-title">Scan a struggling plant and get a revival plan in seconds.</h1>
        <p className="hero-subtitle">
          PlantAutopsy analyzes visible symptoms, estimates severity, and turns the results into clear next
          steps you can actually follow.
        </p>
      </section>

      <section className="page-card diagnose-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Photo Diagnosis</p>
            <h2 className="section-title">Upload your plant</h2>
          </div>
        </div>

        {!previewUrl ? (
          <button type="button" className="upload-zone" onClick={handleChoosePhoto}>
            {uploadIcon}
            <span className="upload-zone-title">Tap to upload a photo of your plant</span>
            <span className="upload-zone-subtext">JPG, PNG or WEBP supported</span>
          </button>
        ) : (
          <div className="image-preview-block">
            <img src={previewUrl} alt="Plant preview" className="diagnose-preview-image" />
            <button type="button" className="change-photo-link" onClick={handleChoosePhoto}>
              Change photo
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleFileChange}
        />

        <input
          type="text"
          className="text-input"
          placeholder="Plant nickname (optional)"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />

        {loading ? <Spinner message={rotatingMessages[messageIndex]} /> : null}

        {error ? (
          <div className="error-card">
            <p>{error}</p>
            <button type="button" className="button button-danger" onClick={resetDiagnosisState}>
              Try Again
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="button button-primary"
          disabled={!selectedFile || loading}
          onClick={handleDiagnose}
        >
          Diagnose My Plant
        </button>
      </section>

      <section className="page-card explorer-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Plant Explorer</p>
            <h2 className="section-title">Ask about any plant</h2>
          </div>
        </div>

        <p className="section-copy">
          Want to learn about a random plant instead of diagnosing one? Search for a species and get an
          interactive profile with history, care basics, and a representative image.
        </p>

        <div className="explorer-form">
          <input
            type="text"
            className="text-input"
            placeholder="Try Monstera deliciosa, rose, or bonsai"
            value={explorePrompt}
            onChange={(event) => setExplorePrompt(event.target.value)}
          />
          <button type="button" className="button button-secondary" onClick={handleExplore} disabled={exploreLoading}>
            {exploreLoading ? 'Searching...' : 'Explore This Plant'}
          </button>
        </div>

        {exploreError ? (
          <div className="error-card">
            <p>{exploreError}</p>
          </div>
        ) : null}

        {exploreResult ? (
          <div className="explorer-result">
            <img src={exploreResult.imageUrl} alt={exploreResult.plantName} className="explorer-image" />
            <div className="explorer-content">
              <p className="section-kicker">Featured Profile</p>
              <h3 className="explorer-title">{exploreResult.plantName}</h3>
              <p className="explorer-headline">{exploreResult.headline}</p>
              <p className="explorer-reply">{exploreResult.userPromptReply}</p>
              <p className="explorer-history">{exploreResult.history}</p>

              <div className="explorer-facts">
                {exploreResult.interestingFacts.map((fact) => (
                  <div key={fact} className="fact-pill">
                    {fact}
                  </div>
                ))}
              </div>

              <div className="care-grid">
                <div className="care-card">
                  <span className="care-card-label">Water</span>
                  <span className="care-card-value">{exploreResult.careBasics.water}</span>
                </div>
                <div className="care-card">
                  <span className="care-card-label">Light</span>
                  <span className="care-card-value">{exploreResult.careBasics.light}</span>
                </div>
                <div className="care-card">
                  <span className="care-card-label">Soil</span>
                  <span className="care-card-value">{exploreResult.careBasics.soil}</span>
                </div>
                <div className="care-card">
                  <span className="care-card-label">Climate</span>
                  <span className="care-card-value">{exploreResult.careBasics.climate}</span>
                </div>
              </div>

              <a
                href={exploreResult.wikipediaUrl}
                target="_blank"
                rel="noreferrer"
                className="explorer-link"
              >
                Read more about this plant
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Diagnose;
