import { X } from 'lucide-react';
import type { SettingsState } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: SettingsState;
  onClose: () => void;
  onReset: () => void;
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

export const SettingsPanel = ({
  isOpen,
  settings,
  onClose,
  onReset,
  onUpdateSetting,
}: SettingsPanelProps) => (
  <>
    <div
      className={`fixed inset-0 z-40 bg-slate-950/60 transition ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={onClose}
    />
    <aside
      className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl transform border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur transition duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Tune the copilot</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Groq API Key</span>
            <input
              type="password"
              value={settings.groqApiKey}
              onChange={(event) => onUpdateSetting('groqApiKey', event.target.value)}
              placeholder="Paste your Groq API key"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
            <p className="text-xs text-slate-500">Stored in localStorage. Never sent anywhere except Groq.</p>
          </label>

          <div className="border-t border-slate-800 pt-1" />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Live suggestion prompt</span>
            <p className="text-xs text-slate-500">
              Used to generate 3 suggestion cards every ~30s. Variables:{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{RECENT_TRANSCRIPT}'}</code>{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{PREVIOUS_SUGGESTIONS}'}</code>{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{SUGGESTION_CONTEXT_WINDOW}'}</code>
            </p>
            <textarea
              value={settings.suggestionPrompt}
              onChange={(event) => onUpdateSetting('suggestionPrompt', event.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Detailed answer prompt</span>
            <p className="text-xs text-slate-500">
              Used when a suggestion card is clicked. Variables:{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{FULL_TRANSCRIPT}'}</code>{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{USER_MESSAGE}'}</code>
            </p>
            <textarea
              value={settings.detailedAnswerPrompt}
              onChange={(event) => onUpdateSetting('detailedAnswerPrompt', event.target.value)}
              rows={12}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Chat prompt</span>
            <p className="text-xs text-slate-500">
              Used for freeform typed questions. Variables:{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{FULL_TRANSCRIPT}'}</code>{' '}
              <code className="rounded bg-slate-800 px-1 text-cyan-400">{'{USER_MESSAGE}'}</code>
            </p>
            <textarea
              value={settings.chatPrompt}
              onChange={(event) => onUpdateSetting('chatPrompt', event.target.value)}
              rows={10}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <div className="border-t border-slate-800 pt-1" />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Suggestion context (words)</span>
              <input
                type="number"
                min={100}
                value={settings.suggestionContextWindow}
                onChange={(event) => onUpdateSetting('suggestionContextWindow', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Detailed answer context (words)</span>
              <input
                type="number"
                min={500}
                value={settings.detailedContextWindow}
                onChange={(event) => onUpdateSetting('detailedContextWindow', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Chat context (words)</span>
              <input
                type="number"
                min={500}
                value={settings.chatContextWindow}
                onChange={(event) => onUpdateSetting('chatContextWindow', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Chunk interval (seconds)</span>
              <input
                type="number"
                min={10}
                value={settings.transcriptChunkInterval}
                onChange={(event) => onUpdateSetting('transcriptChunkInterval', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 p-6">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Done
          </button>
        </div>
      </div>
    </aside>
  </>
);
