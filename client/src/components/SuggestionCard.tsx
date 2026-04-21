import { HelpCircle, Lightbulb, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import type { Suggestion } from '../types';

const typeConfig: Record<
  Suggestion['type'],
  { icon: React.ComponentType<{ className?: string }>; label: string; accent: string; glow: string; border: string }
> = {
  ASK: {
    icon: HelpCircle,
    label: 'Ask',
    accent: 'text-sky-300',
    glow: 'shadow-[0_0_16px_rgba(56,189,248,0.15)]',
    border: 'border-l-sky-400/70',
  },
  FACT_CHECK: {
    icon: ShieldCheck,
    label: 'Fact Check',
    accent: 'text-rose-300',
    glow: 'shadow-[0_0_16px_rgba(251,113,133,0.15)]',
    border: 'border-l-rose-400/70',
  },
  TALKING_POINT: {
    icon: Lightbulb,
    label: 'Talking Point',
    accent: 'text-amber-300',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.15)]',
    border: 'border-l-amber-400/70',
  },
  ANSWER: {
    icon: Zap,
    label: 'Answer',
    accent: 'text-emerald-300',
    glow: 'shadow-[0_0_16px_rgba(52,211,153,0.15)]',
    border: 'border-l-emerald-400/70',
  },
  CLARIFY: {
    icon: MessageSquare,
    label: 'Clarify',
    accent: 'text-violet-300',
    glow: 'shadow-[0_0_16px_rgba(167,139,250,0.15)]',
    border: 'border-l-violet-400/70',
  },
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  isFresh?: boolean;
  onClick: (suggestion: Suggestion) => void;
}

export const SuggestionCard = ({ suggestion, isFresh = false, onClick }: SuggestionCardProps) => {
  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      className={[
        'group w-full rounded-xl border-l-2 border border-slate-800/80 bg-slate-900/60 p-4 text-left',
        'transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/80 hover:border-slate-700',
        config.border,
        isFresh ? `${config.glow} border-slate-700/80` : 'opacity-70 hover:opacity-100',
      ].join(' ')}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${config.accent}`} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${config.accent}`}>{config.label}</span>
        {isFresh && (
          <span className="ml-auto flex h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60 animate-pulse" style={{ color: 'inherit' }} />
        )}
      </div>
      <p className="text-sm font-medium leading-snug text-slate-100 group-hover:text-white transition-colors">
        {suggestion.headline}
      </p>
      {suggestion.preview ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2">
          {suggestion.preview}
        </p>
      ) : null}
    </button>
  );
};
