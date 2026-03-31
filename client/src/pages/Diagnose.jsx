import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { chatWithPlantAssistant, diagnosePlant, explorePlant } from '../utils/api';
import { saveToHistory } from '../utils/storage';
import { uid } from '../utils/uid';

const rotatingMessages = [
  'Examining the leaves...',
  'Checking for disease patterns...',
  'Analyzing root symptoms...',
  'Preparing your revival plan...'
];

const chatSuggestions = [
  'Why are my leaves turning yellow?',
  'How often should I repot a monstera?',
  'What light does a snake plant prefer?'
];

const uploadIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-zone-icon">
    <path
      fill="#3e7c2f"
      d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
    />
  </svg>
);

const cameraIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon">
    <path
      fill="currentColor"
      d="M8 6 9.3 4.4A2 2 0 0 1 10.87 4h2.26a2 2 0 0 1 1.57.76L16 6h1.5A2.5 2.5 0 0 1 20 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-7A2.5 2.5 0 0 1 6.5 6H8Zm4 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
    />
  </svg>
);

const galleryIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon">
    <path
      fill="currentColor"
      d="M5 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5A2.5 2.5 0 0 0 18.5 7H14l-1.2-1.6A2 2 0 0 0 11.2 4H5Zm1 11 3.2-3.2a1 1 0 0 1 1.41 0L13 14.17l1.8-1.8a1 1 0 0 1 1.4 0L18 14.17V18H6v-3Zm4-6.25A1.25 1.25 0 1 0 10 11.25 1.25 1.25 0 0 0 10 8.75Z"
    />
  </svg>
);

const chatIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="chat-panel-icon">
    <path
      fill="currentColor"
      d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H10l-3.6 3.2c-.65.58-1.4.12-1.4-.74V14.2A2.5 2.5 0 0 1 5 11.5v-6Zm3 2.5h8v2H8V8Zm0 3h5v2H8v-2Z"
    />
  </svg>
);

function Diagnose() {
  const navigate = useNavigate();
  const diagnoseFileInputRef = useRef(null);
  const diagnoseCameraInputRef = useRef(null);
  const exploreFileInputRef = useRef(null);
  const exploreCameraInputRef = useRef(null);
  const intervalRef = useRef(null);
  const previewObjectUrlRef = useRef('');
  const explorePreviewObjectUrlRef = useRef('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState('');

  const [explorePrompt, setExplorePrompt] = useState('');
  const [exploreFile, setExploreFile] = useState(null);
  const [explorePreviewUrl, setExplorePreviewUrl] = useState('');
  const [exploreResult, setExploreResult] = useState(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState('');

  const [chatHistory, setChatHistory] = useState([
    {
      id: uid(),
      role: 'assistant',
      content: 'Ask me anything about plant care, diagnosis clues, lighting, pests, or watering.'
    }
  ]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

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
      if (explorePreviewObjectUrlRef.current) {
        URL.revokeObjectURL(explorePreviewObjectUrlRef.current);
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

  const triggerInput = (ref) => {
    if (ref.current) {
      ref.current.click();
    }
  };

  const applyPreview = (file, previewRef, setFile, setPreview) => {
    if (!file) {
      return;
    }

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewRef.current = nextPreviewUrl;
    setFile(file);
    setPreview(nextPreviewUrl);
  };

  const handleDiagnoseFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setError('');
    applyPreview(file, previewObjectUrlRef, setSelectedFile, setPreviewUrl);
  };

  const handleExploreFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setExploreError('');
    setExploreResult(null);
    applyPreview(file, explorePreviewObjectUrlRef, setExploreFile, setExplorePreviewUrl);
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
    if (diagnoseFileInputRef.current) diagnoseFileInputRef.current.value = '';
    if (diagnoseCameraInputRef.current) diagnoseCameraInputRef.current.value = '';
  };

  const resetExploreState = () => {
    if (explorePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(explorePreviewObjectUrlRef.current);
      explorePreviewObjectUrlRef.current = '';
    }
    setExploreError('');
    setExploreFile(null);
    setExplorePreviewUrl('');
    setExplorePrompt('');
    setExploreResult(null);
    if (exploreFileInputRef.current) exploreFileInputRef.current.value = '';
    if (exploreCameraInputRef.current) exploreCameraInputRef.current.value = '';
  };

  const fileToPayload = async (file) => {
    const fullDataUrl = await readFileAsDataUrl(file);
    return {
      fullDataUrl,
      rawBase64: String(fullDataUrl).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ''),
      mimeType: file.type
    };
  };

  const handleDiagnose = async () => {
    if (!selectedFile) {
      setError('Take a photo or attach one before diagnosing.');
      return;
    }

    const activeFile = selectedFile;
    const currentNickname = nickname.trim();
    setError('');
    setLoading(true);

    try {
      const { fullDataUrl, rawBase64, mimeType } = await fileToPayload(activeFile);
      const result = await diagnosePlant(rawBase64, mimeType);
      const diagnosisResult = {
        ...result,
        plantName: currentNickname || result.plantName,
        entryId: uid()
      };

      saveToHistory(diagnosisResult, fullDataUrl);
      navigate('/revival-plan', {
        state: { result: diagnosisResult, imageDataUrl: fullDataUrl }
      });
    } catch (diagnosisError) {
      setError('We could not diagnose this plant right now. Please try again with a clearer photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = async () => {
    if (!explorePrompt.trim() && !exploreFile) {
      setExploreError('Type a plant name, attach a photo, or use your camera first.');
      return;
    }

    setExploreError('');
    setExploreLoading(true);

    try {
      let imagePayload = null;
      if (exploreFile) {
        imagePayload = await fileToPayload(exploreFile);
      }

      const result = await explorePlant({
        prompt: explorePrompt.trim(),
        imageBase64: imagePayload?.rawBase64,
        mimeType: imagePayload?.mimeType
      });
      setExploreResult(result);
    } catch (plantError) {
      setExploreError('We could not identify or explain this plant right now. Try a clearer photo or add a name.');
    } finally {
      setExploreLoading(false);
    }
  };

  const handleChatSubmit = async (seedPrompt) => {
    const nextPrompt = (seedPrompt || chatPrompt).trim();
    if (!nextPrompt) {
      setChatError('Ask a plant care question to start the chat.');
      return;
    }

    const nextHistory = [...chatHistory, { id: uid(), role: 'user', content: nextPrompt }];
    setChatError('');
    setChatLoading(true);
    setChatHistory(nextHistory);
    setChatPrompt('');

    try {
      const result = await chatWithPlantAssistant(
        nextPrompt,
        nextHistory.map((message) => ({ role: message.role, content: message.content }))
      );

      const assistantMessage = {
        id: uid(),
        role: 'assistant',
        content: result.reply,
        suggestions: result.suggestedFollowUps || []
      };

      setChatHistory((current) => [...current, assistantMessage]);
    } catch (chatRequestError) {
      setChatError('The plant assistant could not reply just now. Please try again.');
      setChatHistory((current) => current.slice(0, -1));
      setChatPrompt(nextPrompt);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="diagnose-page">
      <section className="hero-panel">
        <p className="eyebrow">Mobile Plant Rescue</p>
        <h1 className="hero-title">Scan a struggling plant, identify unknown plants, and chat with an AI grow guide.</h1>
        <p className="hero-subtitle">
          PlantAutopsy now works with camera shots, gallery uploads, and plant names so users can move from
          “what is this?” to “how do I care for it?” in one place.
        </p>
      </section>

      <section className="page-card diagnose-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Photo Diagnosis</p>
            <h2 className="section-title">Diagnose from camera or gallery</h2>
          </div>
        </div>

        {!previewUrl ? (
          <div className="upload-zone">
            {uploadIcon}
            <span className="upload-zone-title">Take a photo or attach your plant image</span>
            <span className="upload-zone-subtext">Use your camera live or pick JPG, PNG, or WEBP from gallery</span>
            <div className="action-row">
              <button type="button" className="small-action-button" onClick={() => triggerInput(diagnoseCameraInputRef)}>
                {cameraIcon}
                <span>Use Camera</span>
              </button>
              <button type="button" className="small-action-button" onClick={() => triggerInput(diagnoseFileInputRef)}>
                {galleryIcon}
                <span>Attach Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="image-preview-block">
            <img src={previewUrl} alt="Plant preview" className="diagnose-preview-image" />
            <div className="preview-action-row">
              <button type="button" className="change-photo-link" onClick={() => triggerInput(diagnoseCameraInputRef)}>
                Use camera again
              </button>
              <button type="button" className="change-photo-link" onClick={() => triggerInput(diagnoseFileInputRef)}>
                Choose another photo
              </button>
            </div>
          </div>
        )}

        <input
          ref={diagnoseFileInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleDiagnoseFileChange}
        />
        <input
          ref={diagnoseCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-file-input"
          onChange={handleDiagnoseFileChange}
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
              Reset Diagnosis
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
            <h2 className="section-title">Search by name, camera, or attached image</h2>
          </div>
        </div>

        <p className="section-copy">
          Not sure what the plant is? Snap it, upload it, or type the name you know. The explorer will try to
          identify it first and then explain its history and care in a friendlier way.
        </p>

        {!explorePreviewUrl ? (
          <div className="soft-upload-panel">
            <div className="action-row">
              <button type="button" className="small-action-button" onClick={() => triggerInput(exploreCameraInputRef)}>
                {cameraIcon}
                <span>Use Camera</span>
              </button>
              <button type="button" className="small-action-button" onClick={() => triggerInput(exploreFileInputRef)}>
                {galleryIcon}
                <span>Attach Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="image-preview-block explorer-preview-block">
            <img src={explorePreviewUrl} alt="Plant search preview" className="diagnose-preview-image" />
            <div className="preview-action-row">
              <button type="button" className="change-photo-link" onClick={() => triggerInput(exploreCameraInputRef)}>
                Retake photo
              </button>
              <button type="button" className="change-photo-link" onClick={() => triggerInput(exploreFileInputRef)}>
                Replace image
              </button>
            </div>
          </div>
        )}

        <input
          ref={exploreFileInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleExploreFileChange}
        />
        <input
          ref={exploreCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-file-input"
          onChange={handleExploreFileChange}
        />

        <div className="explorer-form">
          <input
            type="text"
            className="text-input"
            placeholder="Try rose, snake plant, or ask what this plant is"
            value={explorePrompt}
            onChange={(event) => setExplorePrompt(event.target.value)}
          />
          <button type="button" className="button button-secondary" onClick={handleExplore} disabled={exploreLoading}>
            {exploreLoading ? 'Searching...' : 'Explore This Plant'}
          </button>
          {(exploreFile || explorePrompt) && !exploreLoading ? (
            <button type="button" className="button button-outline" onClick={resetExploreState}>
              Clear Search
            </button>
          ) : null}
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

      <section className="page-card chat-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">AI Plant Chat</p>
            <h2 className="section-title">Talk to the grow assistant</h2>
          </div>
          {chatIcon}
        </div>

        <p className="section-copy">
          Ask follow-up questions when you are unsure what went wrong, what a plant needs next, or how to
          treat a symptom you noticed.
        </p>

        <div className="chat-suggestion-row">
          {chatSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chat-suggestion-pill"
              onClick={() => handleChatSubmit(suggestion)}
              disabled={chatLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="chat-thread">
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${message.role === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'}`}
            >
              <p>{message.content}</p>
              {message.role === 'assistant' && message.suggestions?.length ? (
                <div className="chat-inline-suggestions">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="chat-inline-pill"
                      onClick={() => handleChatSubmit(suggestion)}
                      disabled={chatLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {chatLoading ? <Spinner message="Thinking through your plant question..." /> : null}
        </div>

        {chatError ? (
          <div className="error-card">
            <p>{chatError}</p>
          </div>
        ) : null}

        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            placeholder="Ask about pests, yellow leaves, watering, sunlight, or plant identification..."
            value={chatPrompt}
            onChange={(event) => setChatPrompt(event.target.value)}
            rows={3}
          />
          <button type="button" className="button button-primary" onClick={() => handleChatSubmit()} disabled={chatLoading}>
            Send to AI Chat
          </button>
        </div>
      </section>
    </div>
  );
}

export default Diagnose;
