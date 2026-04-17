import { RefreshCcw } from 'lucide-react';
import type { Suggestion, SuggestionBatch } from '../types';
import { SuggestionCard } from './SuggestionCard';

interface SuggestionsPanelProps {
  batches: SuggestionBatch[];
  isRefreshing: boolean;
  disabled: boolean;
  canManualRefresh: boolean;
  error: string | null;
  onManualRefresh: () => void;
  onRetry: () => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
}

export const SuggestionsPanel = ({
  batches,
  isRefreshing,
  disabled,
  canManualRefresh,
  error,
  onManualRefresh,
  onRetry,
  onSelectSuggestion,
}: SuggestionsPanelProps) => (
  <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-glow backdrop-blur">
    <div className="flex items-center justify-between border-b border-slate-800/80 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live suggestions</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">What to say next</h2>
      </div>
      <button
        type="button"
        onClick={onManualRefresh}
        disabled={disabled || !canManualRefresh || isRefreshing}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
      >
        <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full border border-rose-300/40 px-3 py-1.5 font-medium text-rose-100 transition hover:bg-rose-400/10"
          >
            Retry suggestions
          </button>
        </div>
      ) : null}

      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
          New suggestion batches will stack here every time a transcript chunk lands.
        </div>
      ) : null}

      <div className="space-y-6">
        {batches.map((batch) => (
          <div key={batch.id}>
            <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              <span>Suggestions at {batch.timestamp}</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            <div className="space-y-3">
              {batch.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={`${batch.id}-${suggestion.headline}`}
                  suggestion={suggestion}
                  onClick={onSelectSuggestion}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
