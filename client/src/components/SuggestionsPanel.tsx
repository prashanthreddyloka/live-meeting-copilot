import { useEffect, useRef, useState } from 'react';
import { RefreshCcw, Sparkles, AlertCircle } from 'lucide-react';
import type { Suggestion, SuggestionBatch } from '../types';
import { SuggestionCard } from './SuggestionCard';

interface SuggestionsPanelProps {
  batches: SuggestionBatch[];
  isRefreshing: boolean;
  disabled: boolean;
  canManualRefresh: boolean;
  error: string | null;
  chunkIntervalSeconds?: number;
  currentRecordingSeconds?: number;
  onManualRefresh: () => void;
  onRetry: () => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
}

const SkeletonCard = () => (
  <div className="rounded-xl border-l-2 border border-slate-800/80 bg-slate-900/60 p-4 animate-pulse">
    <div className="mb-3 flex items-center gap-2">
      <div className="h-3 w-3 rounded-full bg-slate-700" />
      <div className="h-2.5 w-16 rounded bg-slate-700" />
    </div>
    <div className="space-y-2">
      <div className="h-3.5 w-full rounded bg-slate-800" />
      <div className="h-3 w-3/4 rounded bg-slate-800" />
    </div>
  </div>
);

export const SuggestionsPanel = ({
  batches,
  isRefreshing,
  disabled,
  canManualRefresh,
  error,
  chunkIntervalSeconds = 30,
  currentRecordingSeconds = 0,
  onManualRefresh,
  onRetry,
  onSelectSuggestion,
}: SuggestionsPanelProps) => {
  const [autoCountdown, setAutoCountdown] = useState(chunkIntervalSeconds);
  const countdownRef = useRef<number | null>(null);
  const batchCount = batches.length;
  const prevBatchCountRef = useRef(batchCount);

  // Reset countdown when a new batch lands or chunk interval changes
  useEffect(() => {
    if (batchCount > prevBatchCountRef.current) {
      setAutoCountdown(chunkIntervalSeconds);
    }
    prevBatchCountRef.current = batchCount;
  }, [batchCount, chunkIntervalSeconds]);

  useEffect(() => {
    if (!canManualRefresh) {
      setAutoCountdown(chunkIntervalSeconds);
      return;
    }
    countdownRef.current = window.setInterval(() => {
      setAutoCountdown((s) => {
        if (s <= 1) {
          return chunkIntervalSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current !== null) window.clearInterval(countdownRef.current);
    };
  }, [canManualRefresh, chunkIntervalSeconds]);

  const countdownPct = ((chunkIntervalSeconds - autoCountdown) / chunkIntervalSeconds) * 100;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800/60 bg-slate-950/80 backdrop-blur">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">AI Copilot</p>
              <h2 className="text-base font-semibold text-slate-100">Live Suggestions</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {batches.length > 0 && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
              </span>
            )}
            <button
              type="button"
              onClick={onManualRefresh}
              disabled={disabled || !canManualRefresh || isRefreshing}
              title="Refresh suggestions now"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              <RefreshCcw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Countdown progress bar */}
        {canManualRefresh && !isRefreshing && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-600">Next auto-refresh</span>
              <span className="text-[10px] font-mono text-slate-500">{autoCountdown}s</span>
            </div>
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-sky-400/60 transition-all duration-1000 ease-linear"
                style={{ width: `${100 - countdownPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {error ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/8 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm text-rose-200">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-xs font-medium text-rose-300 underline underline-offset-2 hover:text-rose-200"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {isRefreshing ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
              <Sparkles className="h-5 w-5 text-slate-500" />
            </div>
            <p className="max-w-[180px] text-sm leading-relaxed text-slate-500">
              Suggestions appear after the first transcript chunk lands.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {batches.map((batch, batchIndex) => (
              <div key={batch.id}>
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {batchIndex === 0 && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {batchIndex === 0 ? 'Latest' : `Earlier`} · {batch.timestamp}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-slate-800/80" />
                </div>
                <div className="space-y-2">
                  {batch.suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={`${batch.id}-${suggestion.headline}`}
                      suggestion={suggestion}
                      isFresh={batchIndex === 0}
                      onClick={onSelectSuggestion}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
