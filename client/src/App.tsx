import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel';
import { ExportButton } from './components/ExportButton';
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
    <div className="min-h-screen bg-transparent px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] flex-col">
        <header className="mb-4 flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 px-5 py-4 shadow-glow backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">TwinMind</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Live Suggestions</h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time meeting transcription, suggestion cards, and transcript-grounded chat.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </button>
        </header>

        {!hasApiKey ? (
          <div className="mb-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
            <p className="text-lg font-semibold">Enter your API key in Settings to begin.</p>
            <p className="mt-2 text-sm text-amber-50/80">
              The key stays in localStorage on this device and is only forwarded at request time through the proxy.
            </p>
          </div>
        ) : null}

        <main className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.05fr,1fr,1fr]">
          <TranscriptPanel
            entries={session.transcriptEntries}
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

      <ExportButton disabled={!session.hasTranscript} onExport={session.exportSession} />

      <div className="fixed bottom-6 left-6 z-30 space-y-3">
        {session.toasts.map((toast) => (
          <div
            key={toast.id}
            className="max-w-sm rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm shadow-glow backdrop-blur"
          >
            <p className="font-semibold text-slate-100">{toast.title}</p>
            <p className="mt-1 text-slate-300">{toast.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
