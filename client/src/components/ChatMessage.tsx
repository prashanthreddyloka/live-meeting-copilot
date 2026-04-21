import type { ChatMessage as ChatMessageType } from '../types';

// Renders inline markdown: **bold**, *italic*, `code`
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
      return <code key={i} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-xs text-cyan-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

// Renders block-level markdown: headers, lists, paragraphs
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // ATX headers: # ## ###
    const headerMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const className =
        level === 1
          ? 'mt-3 mb-1 text-base font-bold text-slate-100'
          : level === 2
            ? 'mt-2 mb-1 text-sm font-semibold text-slate-100'
            : 'mt-2 mb-0.5 text-sm font-semibold text-slate-200';
      blocks.push(<p key={i} className={className}>{renderInline(content)}</p>);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={i} className="my-2 border-slate-700" />);
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={i} className="ml-4 list-disc space-y-1">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={i} className="ml-4 list-decimal space-y-1">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Regular paragraph
    blocks.push(<p key={i}>{renderInline(line)}</p>);
    i++;
  }

  return blocks;
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
        message.role === 'user'
          ? 'bg-cyan-400 text-slate-950'
          : 'border border-slate-800 bg-slate-950/70 text-slate-200'
      }`}
    >
      {message.role === 'user' ? (
        <p className="whitespace-pre-wrap">{message.content}</p>
      ) : (
        <div className="space-y-2">{renderMarkdown(message.content)}</div>
      )}
    </div>
  </div>
);
