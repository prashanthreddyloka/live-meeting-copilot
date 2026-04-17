import clsx from 'clsx';
import type { Suggestion } from '../types';

const badgeClassName: Record<Suggestion['type'], string> = {
  ASK: 'bg-blue-400/15 text-blue-200 ring-blue-400/40',
  FACT_CHECK: 'bg-rose-400/15 text-rose-200 ring-rose-400/40',
  TALKING_POINT: 'bg-amber-400/15 text-amber-200 ring-amber-400/40',
  ANSWER: 'bg-lime-400/15 text-lime-200 ring-lime-400/40',
  CLARIFY: 'bg-cyan-400/15 text-cyan-200 ring-cyan-400/40',
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onClick: (suggestion: Suggestion) => void;
}

export const SuggestionCard = ({ suggestion, onClick }: SuggestionCardProps) => (
  <button
    type="button"
    onClick={() => onClick(suggestion)}
    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-950"
  >
    <div className="mb-3 flex items-center justify-between gap-3">
      <span
        className={clsx(
          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ring-inset',
          badgeClassName[suggestion.type],
        )}
      >
        {suggestion.type.replace('_', ' ')}
      </span>
    </div>
    <h3 className="text-base font-semibold text-slate-100">{suggestion.headline}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-300">{suggestion.preview}</p>
  </button>
);
