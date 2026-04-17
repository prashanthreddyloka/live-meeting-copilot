import { useEffect, useRef } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
  isBusy: boolean;
  micError: string | null;
  disabled: boolean;
  onToggleRecording: () => void | Promise<void>;
}

export const TranscriptPanel = ({
  entries,
  isRecording,
  isBusy,
  micError,
  disabled,
  onToggleRecording,
}: TranscriptPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [entries]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-glow backdrop-blur">
      <div className="border-b border-slate-800/80 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Transcript</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Live capture</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
            <Radio className={`h-4 w-4 ${isRecording ? 'animate-pulse text-rose-400' : 'text-slate-500'}`} />
            {isRecording ? 'Recording' : 'Idle'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onToggleRecording()}
          disabled={disabled}
          className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-lg font-semibold transition ${
            isRecording
              ? 'bg-rose-500 text-white hover:bg-rose-400'
              : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
          } disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500`}
        >
          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {isRecording ? 'Stop microphone' : 'Start microphone'}
        </button>

        {isBusy ? <p className="mt-3 text-sm text-slate-400">Processing the latest audio chunk...</p> : null}
        {micError ? <p className="mt-3 text-sm text-rose-300">{micError}</p> : null}
      {disabled ? (
        <p className="mt-3 text-sm text-amber-300">Enter your Groq API key in Settings to begin.</p>
      ) : null}
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
            Transcript chunks land here every capture interval with timestamps.
          </div>
        ) : null}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className={`rounded-2xl border p-4 ${
              entry.status === 'error'
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                : 'border-slate-800 bg-slate-950/60 text-slate-200'
            }`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              [{entry.timestamp}]
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6">{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
