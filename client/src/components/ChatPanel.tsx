import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: ChatMessageType[];
  disabled: boolean;
  isStreaming: boolean;
  isWaitingForFirstToken: boolean;
  onSendMessage: (content: string) => void | Promise<void>;
}

export const ChatPanel = ({
  messages,
  disabled,
  isStreaming,
  isWaitingForFirstToken,
  onSendMessage,
}: ChatPanelProps) => {
  const [draft, setDraft] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [isWaitingForFirstToken, messages]);

  const submit = async () => {
    const trimmed = draft.trim();

    if (!trimmed || disabled || isStreaming) {
      return;
    }

    setDraft('');
    await onSendMessage(trimmed);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter alone sends; Shift+Enter inserts a newline
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await submit();
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-glow backdrop-blur">
      <div className="border-b border-slate-800/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Chat</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">Deep answer thread</h2>
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
              Tap a suggestion for a detailed answer, or ask your own question here.
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isWaitingForFirstToken ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-auto border-t border-slate-800/80 p-5">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Ask about the meeting… (Enter to send, Shift+Enter for newline)"
            disabled={disabled || isStreaming}
            className="min-h-[88px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={disabled || isStreaming || !draft.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </form>
    </section>
  );
};
