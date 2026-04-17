export const SUGGESTION_TYPES = ['ASK', 'FACT_CHECK', 'TALKING_POINT', 'ANSWER', 'CLARIFY'] as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  seconds: number;
  text: string;
  status: 'success' | 'error';
}

export interface Suggestion {
  type: SuggestionType;
  headline: string;
  preview: string;
  full_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  seconds: number;
  suggestions: Suggestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
}

export interface SettingsState {
  groqApiKey: string;
  suggestionPrompt: string;
  chatPrompt: string;
  suggestionContextWindow: number;
  chatContextWindow: number;
  transcriptChunkInterval: number;
}

export interface ExportPayload {
  exported_at: string;
  transcript: Array<{ timestamp: string; text: string }>;
  suggestion_batches: Array<{
    timestamp: string;
    suggestions: Suggestion[];
  }>;
  chat_history: Array<{
    role: ChatMessage['role'];
    content: string;
    timestamp: string;
  }>;
}
