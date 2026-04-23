import { useCallback, useMemo, useRef, useState } from 'react';
import { fetchSuggestions } from '../services/suggestionsService';
import { transcribeAudio } from '../services/transcriptionService';
import { streamChatCompletion } from '../services/chatService';
import type {
  ChatMessage,
  ExportPayload,
  SettingsState,
  Suggestion,
  SuggestionBatch,
  ToastMessage,
  TranscriptEntry,
} from '../types';
import { useMicRecorder } from './useMicRecorder';

const createId = () => crypto.randomUUID();
const MIN_TRANSCRIPTION_SECONDS = 10;

const formatElapsed = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const flattenTranscript = (entries: TranscriptEntry[]): string =>
  entries
    .filter((entry) => entry.status === 'success')
    .map((entry) => `[${entry.timestamp}] ${entry.text}`)
    .join('\n');

const flattenPreviousSuggestions = (batches: SuggestionBatch[]): string[] =>
  batches[0]?.suggestions.map((suggestion) => `${suggestion.type}: ${suggestion.headline}`) ?? [];

export const useSession = (settings: SettingsState, hasApiKey: boolean) => {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [suggestionBatches, setSuggestionBatches] = useState<SuggestionBatch[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);
  const [isStreamingChat, setIsStreamingChat] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const transcriptRef = useRef(transcriptEntries);
  const suggestionBatchesRef = useRef(suggestionBatches);
  const chatHistoryRef = useRef(chatHistory);
  const lastManualRefreshRef = useRef(0);
  const lastSuggestionContextRef = useRef<{ seconds: number; timestamp: string; transcript: string } | null>(null);
  const clearInterimRef = useRef<() => void>(() => {});

  transcriptRef.current = transcriptEntries;
  suggestionBatchesRef.current = suggestionBatches;
  chatHistoryRef.current = chatHistory;

  const addToast = useCallback((title: string, description: string) => {
    const id = createId();
    setToasts((current) => [...current, { id, title, description }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const appendSuggestionBatch = useCallback((timestamp: string, seconds: number, suggestions: Suggestion[]) => {
    setSuggestionBatches((current) => [
      {
        id: createId(),
        timestamp,
        createdAt: new Date().toISOString(),
        seconds,
        suggestions,
      },
      ...current,
    ]);
  }, []);

  const generateSuggestionsForTranscript = useCallback(
    async (transcript: string, timestamp: string, seconds: number) => {
      if (!hasApiKey || !transcript.trim()) {
        return;
      }

      setIsRefreshingSuggestions(true);
      setSuggestionsError(null);
      lastSuggestionContextRef.current = { transcript, timestamp, seconds };

      try {
        const suggestions = await fetchSuggestions({
          transcript,
          previousSuggestions: flattenPreviousSuggestions(suggestionBatchesRef.current),
          contextWindow: settings.suggestionContextWindow,
          prompt: settings.suggestionPrompt,
          apiKey: settings.groqApiKey,
        });
        appendSuggestionBatch(timestamp, seconds, suggestions);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh suggestions';
        setSuggestionsError(message);
        addToast('Suggestions failed', message);
      } finally {
        setIsRefreshingSuggestions(false);
      }
    },
    [
      addToast,
      appendSuggestionBatch,
      hasApiKey,
      settings.groqApiKey,
      settings.suggestionContextWindow,
      settings.suggestionPrompt,
    ],
  );

  const handleAudioChunk = useCallback(
    async (audio: Blob, elapsedSeconds: number) => {
      if (!hasApiKey) {
        return;
      }

      if (elapsedSeconds < MIN_TRANSCRIPTION_SECONDS) {
        addToast(
          'Recording too short',
          `Keep recording for at least ${MIN_TRANSCRIPTION_SECONDS} seconds before refreshing or stopping for transcription.`,
        );
        return;
      }

      const timestamp = formatElapsed(elapsedSeconds);
      setIsTranscribing(true);

      try {
        const { text } = await transcribeAudio(audio, settings.groqApiKey);
        clearInterimRef.current();
        const normalizedText = text.trim() || 'No speech detected in this segment.';
        const entry: TranscriptEntry = {
          id: createId(),
          timestamp,
          createdAt: new Date().toISOString(),
          seconds: elapsedSeconds,
          text: normalizedText,
          status: 'success',
        };
        const nextEntries = [...transcriptRef.current, entry];
        setTranscriptEntries(nextEntries);
        await generateSuggestionsForTranscript(flattenTranscript(nextEntries), timestamp, elapsedSeconds);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed for this segment';
        const failedEntry: TranscriptEntry = {
          id: createId(),
          timestamp,
          createdAt: new Date().toISOString(),
          seconds: elapsedSeconds,
          text: 'Transcription failed for this segment',
          status: 'error',
        };
        setTranscriptEntries((current) => [...current, failedEntry]);
        addToast('Transcription failed', message);
      } finally {
        setIsTranscribing(false);
      }
    },
    [addToast, generateSuggestionsForTranscript, hasApiKey, settings.groqApiKey],
  );

  const { isRecording, elapsedSeconds, interimText, clearInterim, requestChunk, startRecording, stopRecording } =
    useMicRecorder({
      chunkIntervalSeconds: settings.transcriptChunkInterval,
      onChunk: handleAudioChunk,
      onPermissionError: (message) => {
        setMicError(message);
        addToast('Microphone unavailable', message);
      },
    });

  clearInterimRef.current = clearInterim;

  const toggleRecording = useCallback(async () => {
    setMicError(null);

    if (isRecording) {
      stopRecording();
      return;
    }

    await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const manualRefresh = useCallback(() => {
    if (!isRecording) {
      return;
    }

    if (elapsedSeconds < MIN_TRANSCRIPTION_SECONDS) {
      addToast(
        'Recording too short',
        `Wait until at least ${MIN_TRANSCRIPTION_SECONDS} seconds of audio have been captured before refreshing.`,
      );
      return;
    }

    const now = Date.now();

    if (now - lastManualRefreshRef.current < 1000) {
      return;
    }

    lastManualRefreshRef.current = now;
    requestChunk();
  }, [addToast, elapsedSeconds, isRecording, requestChunk]);

  const retrySuggestions = useCallback(async () => {
    const context = lastSuggestionContextRef.current;

    if (!context) {
      return;
    }

    await generateSuggestionsForTranscript(context.transcript, context.timestamp, context.seconds);
  }, [generateSuggestionsForTranscript]);

  const sendChatMessage = useCallback(
    async (content: string, isDetailedAnswer = false, label?: string) => {
      const trimmed = content.trim();

      if (!trimmed || !hasApiKey || isStreamingChat) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
        label,
      };
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      const requestHistory = [...chatHistoryRef.current, userMessage];
      const nextHistory = [...requestHistory, assistantMessage];
      setChatHistory(nextHistory);
      setIsStreamingChat(true);
      setIsWaitingForFirstToken(true);

      const prompt = isDetailedAnswer ? settings.detailedAnswerPrompt : settings.chatPrompt;
      const contextWindow = isDetailedAnswer ? settings.detailedContextWindow : settings.chatContextWindow;

      try {
        await streamChatCompletion({
          messages: requestHistory.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          transcript: flattenTranscript(transcriptRef.current),
          contextWindow,
          prompt,
          apiKey: settings.groqApiKey,
          onToken: (token) => {
            setIsWaitingForFirstToken(false);
            setChatHistory((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: `${message.content}${token}` }
                  : message,
              ),
            );
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Chat request failed';
        addToast('Chat failed', message);
        setChatHistory((current) =>
          current.map((chatMessage) =>
            chatMessage.id === assistantMessage.id
              ? { ...chatMessage, content: 'Unable to get an answer right now. Please try again.' }
              : chatMessage,
          ),
        );
      } finally {
        setIsStreamingChat(false);
        setIsWaitingForFirstToken(false);
      }
    },
    [
      addToast,
      hasApiKey,
      isStreamingChat,
      settings.chatContextWindow,
      settings.chatPrompt,
      settings.detailedAnswerPrompt,
      settings.detailedContextWindow,
      settings.groqApiKey,
    ],
  );

  const exportSession = useCallback((): ExportPayload => {
    const payload: ExportPayload = {
      exported_at: new Date().toISOString(),
      transcript: transcriptRef.current.map((entry) => ({
        elapsed: entry.timestamp,
        timestamp: entry.createdAt,
        text: entry.text,
      })),
      suggestion_batches: suggestionBatchesRef.current.map((batch) => ({
        elapsed: batch.timestamp,
        timestamp: batch.createdAt,
        suggestions: batch.suggestions,
      })),
      chat_history: chatHistoryRef.current.map((message) => ({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    link.href = url;
    link.download = `twinmind-session-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return payload;
  }, []);

  return useMemo(
    () => ({
      transcriptEntries,
      suggestionBatches,
      chatHistory,
      toasts,
      micError,
      suggestionsError,
      isRecording,
      currentRecordingSeconds: elapsedSeconds,
      interimText,
      isTranscribing,
      isRefreshingSuggestions,
      isStreamingChat,
      isWaitingForFirstToken,
      toggleRecording,
      manualRefresh,
      retrySuggestions,
      sendChatMessage,
      exportSession,
      hasTranscript: transcriptEntries.length > 0,
    }),
    [
      chatHistory,
      exportSession,
      elapsedSeconds,
      interimText,
      isRecording,
      isRefreshingSuggestions,
      isStreamingChat,
      isTranscribing,
      isWaitingForFirstToken,
      manualRefresh,
      micError,
      retrySuggestions,
      sendChatMessage,
      suggestionBatches,
      suggestionsError,
      toasts,
      toggleRecording,
      transcriptEntries,
    ],
  );
};
