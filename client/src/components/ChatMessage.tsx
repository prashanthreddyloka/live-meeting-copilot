import type { ChatMessage as ChatMessageType } from '../types';

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
      <p className="whitespace-pre-wrap">{message.content}</p>
    </div>
  </div>
);
