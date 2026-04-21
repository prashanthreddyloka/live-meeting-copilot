import { useEffect, useRef } from 'react';
import { Mic, MicOff, FileText } from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  interimText: string;
  isRecording: boolean;
  isBusy: boolean;
  currentRecordingSeconds: number;
  chunkIntervalSeconds: number;
  micError: string | null;
  disabled: boolean;
  onToggleRecording: () => void | Promise<void>;
}

const AudioWave = () => (
  <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
    {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.65, 0.85].map((h, i) => (
      <div
        key={i}
        className="w-[2px] rounded-full bg-rose-400 animate-wave"
        style={{ height: `${h * 100}%`, animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);

const formatElapsed = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export const TranscriptPanel = ({
  entries,
  interimText,
  isRecording,
  isBusy,
  currentRecordingSeconds,
  chunkIntervalSeconds,
  micError,
  disabled,
  onToggleRecording,
}: TranscriptPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [entries, interimText]);

  const remainder = currentRecordingSeconds % chunkIntervalSeconds;
  const chunkProgress = isRecording
    ? ((remainder === 0 ? chunkIntervalSeconds : remainder) / chunkIntervalSeconds) * 100
    : 0;
  const secondsUntilChunk = remainder === 0 ? chunkIntervalSeconds : chunkIntervalSeconds - remainder;

  const wordCount = entries
    .filter((e) => e.status === 'success')
    .reduce((acc, e) => acc + e.text.split(/\s+/).filter(Boolean).length, 0);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800/60 bg-slate-950/80 backdrop-blur">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Transcript</p>
              <h2 className="text-base font-semibold text-slate-100">Mic & Captions</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wordCount > 0 && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                {wordCount.toLocaleString()} words
              </span>
            )}
            {isRecording && (
              <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="font-mono text-[10px] font-bold tracking-wider text-rose-300">
                  {formatElapsed(currentRecordingSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mic control row */}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onToggleRecording()}
            disabled={disabled}
            className={[
              'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
              isRecording
                ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-rose-400'
                : 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:bg-cyan-300',
              'disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none',
            ].join(' ')}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <div className="min-w-0 flex-1">
            {isRecording ? (
              <>
                <div className="flex items-center gap-3">
                  <AudioWave />
                  <span className="text-sm text-slate-300">Listening…</span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  Whisper chunk in {secondsUntilChunk}s
                </p>
              </>
            ) : (
              <p className="truncate text-sm text-slate-400">
                {disabled ? 'Enter API key to begin.' : 'Click to start recording.'}
              </p>
            )}
          </div>
        </div>

        {/* Chunk progress bar */}
        {isRecording && (
          <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-sky-400/50 transition-all duration-1000 ease-linear"
              style={{ width: `${chunkProgress}%` }}
            />
          </div>
        )}

        {isBusy && (
          <p className="mt-2 animate-pulse text-[11px] text-cyan-400/80">Transcribing audio…</p>
        )}
        {micError && (
          <p className="mt-2 text-[11px] text-rose-300">{micError}</p>
        )}
      </div>

      {/* Transcript entries */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
              <Mic className="h-5 w-5 text-slate-600" />
            </div>
            <p className="max-w-[200px] text-sm leading-relaxed text-slate-500">
              Live transcript appears here as you speak.
            </p>
          </div>
        ) : null}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="group flex gap-3 border-t border-slate-800/50 px-5 py-3.5 transition-colors hover:bg-slate-900/40"
          >
            <time className="mt-0.5 shrink-0 font-mono text-[11px] text-slate-600">{entry.timestamp}</time>
            <p
              className={`text-[0.9rem] leading-relaxed ${
                entry.status === 'error' ? 'text-rose-300/80' : 'text-slate-300'
              }`}
            >
              {entry.text}
            </p>
          </article>
        ))}

        {isRecording && interimText ? (
          <article className="flex gap-3 border-t border-slate-800/40 bg-slate-900/30 px-5 py-3.5">
            <div className="mt-2 shrink-0">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[0.9rem] italic leading-relaxed text-slate-500">
              {interimText}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-cyan-400 animate-cursor-blink" />
            </p>
          </article>
        ) : null}
      </div>
    </section>
  );
};
