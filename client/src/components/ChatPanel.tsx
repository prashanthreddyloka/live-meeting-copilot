import { useEffect, useRef, useState } from 'react';
import { SendHorizontal, MessageCircle } from 'lucide-react';
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [isWaitingForFirstToken, messages]);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled || isStreaming) return;
    setDraft('');
    await onSendMessage(trimmed);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await submit();
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800/60 bg-slate-950/80 backdrop-blur">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Assistant</p>
            <h2 className="text-base font-semibold text-slate-100">Deep Dive Chat</h2>
          </div>
        </div>
        {messages.length > 0 && (
          <p className="mt-1 text-[11px] text-slate-600">
            {Math.ceil(messages.length / 2)} {Math.ceil(messages.length / 2) === 1 ? 'exchange' : 'exchanges'}
          </p>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
              <MessageCircle className="h-5 w-5 text-slate-600" />
            </div>
            <p className="max-w-[200px] text-sm leading-relaxed text-slate-500">
              Tap a suggestion or type below for a detailed answer.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isWaitingForFirstToken ? (
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-400/30 mt-0.5">
                <span className="text-[10px] font-bold text-cyan-300">AI</span>
              </div>
              <div className="rounded-xl rounded-tl-sm border border-slate-800 bg-slate-900/80 px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-800/60 p-4">
        <div className="flex items-end gap-2.5">
          <div className="relative flex-1">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask about the meeting… (Enter to send)"
              disabled={disabled || isStreaming}
              className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {draft.length > 0 && (
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-600">
                {draft.length}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={disabled || isStreaming || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-700">Shift+Enter for new line</p>
      </form>
    </section>
  );
};
