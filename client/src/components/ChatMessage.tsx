import type { ChatMessage as ChatMessageType } from '../types';

const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const headerMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const className =
        level === 1
          ? 'mt-3 mb-1 text-sm font-bold text-slate-100'
          : level === 2
            ? 'mt-2 mb-0.5 text-sm font-semibold text-slate-100'
            : 'mt-2 mb-0.5 text-xs font-semibold text-slate-200';
      blocks.push(<p key={i} className={className}>{renderInline(content)}</p>);
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={i} className="my-2 border-slate-700/60" />);
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={i} className="ml-3.5 list-disc space-y-1 marker:text-slate-600">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={i} className="ml-3.5 list-decimal space-y-1 marker:text-slate-500">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>,
      );
      continue;
    }

    blocks.push(<p key={i}>{renderInline(line)}</p>);
    i++;
  }

  return blocks;
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={[
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1',
          isUser
            ? 'bg-cyan-400/20 text-cyan-200 ring-cyan-400/30'
            : 'bg-slate-700/60 text-slate-300 ring-slate-600/40',
        ].join(' ')}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={[
          'max-w-[82%] rounded-xl px-3.5 py-2.5 text-[0.83rem] leading-6',
          isUser
            ? 'rounded-tr-sm bg-cyan-400 text-slate-950'
            : 'rounded-tl-sm border border-slate-800/80 bg-slate-900/80 text-slate-200',
        ].join(' ')}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap font-medium">{message.content}</p>
        ) : (
          <div className="space-y-1.5">{renderMarkdown(message.content)}</div>
        )}
      </div>
    </div>
  );
};
