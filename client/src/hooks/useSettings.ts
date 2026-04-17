import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CHAT_CONTEXT_WINDOW,
  DEFAULT_CHAT_PROMPT,
  DEFAULT_SUGGESTION_CONTEXT_WINDOW,
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_TRANSCRIPT_CHUNK_INTERVAL,
} from '../prompts';
import type { SettingsState } from '../types';

const STORAGE_KEY = 'twinmind-live-settings';

const DEFAULT_SETTINGS: SettingsState = {
  groqApiKey: '',
  suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
  chatPrompt: DEFAULT_CHAT_PROMPT,
  suggestionContextWindow: DEFAULT_SUGGESTION_CONTEXT_WINDOW,
  chatContextWindow: DEFAULT_CHAT_CONTEXT_WINDOW,
  transcriptChunkInterval: DEFAULT_TRANSCRIPT_CHUNK_INTERVAL,
};

const parseStoredSettings = (): SettingsState => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState>;

    return {
      groqApiKey: parsed.groqApiKey ?? DEFAULT_SETTINGS.groqApiKey,
      suggestionPrompt: parsed.suggestionPrompt ?? DEFAULT_SETTINGS.suggestionPrompt,
      chatPrompt: parsed.chatPrompt ?? DEFAULT_SETTINGS.chatPrompt,
      suggestionContextWindow: parsed.suggestionContextWindow ?? DEFAULT_SETTINGS.suggestionContextWindow,
      chatContextWindow: parsed.chatContextWindow ?? DEFAULT_SETTINGS.chatContextWindow,
      transcriptChunkInterval: parsed.transcriptChunkInterval ?? DEFAULT_SETTINGS.transcriptChunkInterval,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>(() => parseStoredSettings());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return useMemo(
    () => ({
      settings,
      updateSetting,
      resetSettings,
      hasApiKey: settings.groqApiKey.trim().length > 0,
    }),
    [resetSettings, settings, updateSetting],
  );
};
