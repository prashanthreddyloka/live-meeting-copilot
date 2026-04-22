import { useState } from 'react';
import { Settings2, Download } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { TranscriptPanel } from './components/TranscriptPanel';
import { useSession } from './hooks/useSession';
import { useSettings } from './hooks/useSettings';
import type { Suggestion } from './types';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings, updateSetting, resetSettings, hasApiKey } = useSettings();
  const session = useSession(settings, hasApiKey);
  const canManualRefresh = session.isRecording && session.currentRecordingSeconds >= 10;

  const handleSuggestionSelect = async (suggestion: Suggestion) => {
    await session.sendChatMessage(suggestion.full_prompt, true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent px-3 py-3 text-slate-100 sm:px-4 lg:px-5">
      <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-3">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-400/30">
              <span className="text-[11px] font-bold text-cyan-300">TM</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">TwinMind Copilot</h1>
              <p className="text-[10px] text-slate-500">Live meeting transcription &amp; AI suggestions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasApiKey && (
              <span className="hidden rounded-full border border-amber-400/20 bg-amber-400/8 px-3 py-1 text-[11px] font-medium text-amber-300 sm:inline-block">
                API key required
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
        </header>

        {/* API key banner */}
        {!hasApiKey ? (
          <div className="shrink-0 rounded-xl border border-amber-400/15 bg-amber-400/8 px-4 py-3">
            <p className="text-sm font-medium text-amber-200">
              Enter your Groq API key in Settings to begin.{' '}
              <span className="text-xs font-normal text-amber-300/70">
                Key is stored in localStorage and only forwarded to Groq at request time.
              </span>
            </p>
          </div>
        ) : null}

        {/* Three-column layout */}
        <main className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[1fr,1fr,1fr]">
          <TranscriptPanel
            entries={session.transcriptEntries}
            interimText={session.interimText}
            isRecording={session.isRecording}
            isBusy={session.isTranscribing}
            currentRecordingSeconds={session.currentRecordingSeconds}
            chunkIntervalSeconds={settings.transcriptChunkInterval}
            micError={session.micError}
            disabled={!hasApiKey}
            onToggleRecording={session.toggleRecording}
          />

          <SuggestionsPanel
            batches={session.suggestionBatches}
            isRefreshing={session.isRefreshingSuggestions}
            disabled={!hasApiKey}
            canManualRefresh={canManualRefresh}
            error={session.suggestionsError}
            chunkIntervalSeconds={settings.transcriptChunkInterval}
            currentRecordingSeconds={session.currentRecordingSeconds}
            onManualRefresh={session.manualRefresh}
            onRetry={() => void session.retrySuggestions()}
            onSelectSuggestion={(suggestion) => void handleSuggestionSelect(suggestion)}
          />

          <ChatPanel
            messages={session.chatHistory}
            disabled={!hasApiKey}
            isStreaming={session.isStreamingChat}
            isWaitingForFirstToken={session.isWaitingForFirstToken}
            onSendMessage={(content) => void session.sendChatMessage(content)}
          />
        </main>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onReset={resetSettings}
        onUpdateSetting={updateSetting}
      />

      {/* Floating export button — always visible once session has data */}
      <button
        type="button"
        onClick={session.exportSession}
        disabled={!session.hasTranscript}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        title="Export transcript, suggestions &amp; chat as JSON"
      >
        <Download className="h-4 w-4" />
        Export session
      </button>

      {/* Toast notifications */}
      <div className="fixed bottom-6 left-6 z-30 space-y-2">
        {session.toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex max-w-xs gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 px-4 py-3 text-sm shadow-xl backdrop-blur"
          >
            <div>
              <p className="font-semibold text-slate-100">{toast.title}</p>
              <p className="mt-0.5 text-slate-400">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
