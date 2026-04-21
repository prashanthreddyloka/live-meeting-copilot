import { useEffect, useRef } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
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

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-glow backdrop-blur">
      <div className="shrink-0 border-b border-slate-800/80">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">Mic & Transcript</p>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-400">
            <Radio className={`h-3.5 w-3.5 ${isRecording ? 'animate-pulse text-rose-400' : 'text-slate-500'}`} />
            {isRecording ? 'Recording' : 'Idle'}
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-800/80 px-5 py-4">
          <button
            type="button"
            onClick={() => void onToggleRecording()}
            disabled={disabled}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-8 transition ${
              isRecording
                ? 'border-rose-500/15 bg-rose-500 text-white hover:bg-rose-400'
                : 'border-cyan-400/15 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            } disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-700 disabled:text-slate-500`}
            aria-label={isRecording ? 'Stop microphone' : 'Start microphone'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <div className="min-w-0">
            <p className="text-lg text-slate-200">
              {isRecording ? 'Listening...' : 'Start the mic to begin capturing transcript.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isRecording
                ? (() => {
                    const remainder = currentRecordingSeconds % chunkIntervalSeconds;
                    const secondsUntilNext = remainder === 0 ? chunkIntervalSeconds : chunkIntervalSeconds - remainder;
                    return `Elapsed ${currentRecordingSeconds}s • Whisper chunk in ${secondsUntilNext}s`;
                  })()
                : 'Transcript confirmed every 30s via Whisper. Live text appears instantly.'}
            </p>
          </div>
        </div>

        {isBusy ? <p className="px-5 pb-3 text-sm text-slate-400">Transcribing audio chunk...</p> : null}
        {micError ? <p className="px-5 pb-3 text-sm text-rose-300">{micError}</p> : null}
        {disabled ? <p className="px-5 pb-3 text-sm text-amber-300">Enter your API key in Settings to begin.</p> : null}
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && !interimText ? (
          <div className="px-5 py-6 text-sm text-slate-400">
            Live transcript appears here as you speak. Whisper confirms each chunk every 30 seconds.
          </div>
        ) : null}

        {entries.map((entry) => (
          <article key={entry.id} className="border-t border-slate-800/70 px-5 py-4">
            <div className="flex gap-3">
              <p className="shrink-0 pt-0.5 text-sm text-slate-500">{entry.timestamp}</p>
              <p
                className={`whitespace-pre-wrap text-[1.03rem] leading-7 ${
                  entry.status === 'error' ? 'text-rose-300' : 'text-slate-100'
                }`}
              >
                {entry.text}
              </p>
            </div>
          </article>
        ))}

        {/* Live interim entry — shown in real-time via Web Speech API */}
        {isRecording && interimText ? (
          <article className="border-t border-slate-800/50 px-5 py-4">
            <div className="flex gap-3">
              <div className="shrink-0 pt-2">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              </div>
              <p className="whitespace-pre-wrap text-[1.03rem] leading-7 italic text-slate-400">
                {interimText}
              </p>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
};
