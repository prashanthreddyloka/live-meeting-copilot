export type ApiProvider = 'groq' | 'xai';

interface ProviderConfig {
  provider: ApiProvider;
  chatUrl: string;
  transcriptionUrl: string;
  chatModel: string;
  transcriptionModel?: string;
}

const PROVIDER_CONFIG: Record<ApiProvider, ProviderConfig> = {
  groq: {
    provider: 'groq',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions',
    transcriptionUrl: 'https://api.groq.com/openai/v1/audio/transcriptions',
    chatModel: 'openai/gpt-oss-120b',
    transcriptionModel: 'whisper-large-v3',
  },
  xai: {
    provider: 'xai',
    chatUrl: 'https://api.x.ai/v1/chat/completions',
    transcriptionUrl: 'https://api.x.ai/v1/stt',
    chatModel: 'grok-4.20-beta-latest-non-reasoning',
  },
};

export const requireApiKey = (value: string | undefined): string => {
  if (!value?.trim()) {
    throw new Error('Missing API key');
  }

  return value.trim();
};

export const getProviderConfig = (apiKey: string): ProviderConfig => {
  const normalized = apiKey.trim().toLowerCase();

  if (normalized.startsWith('xai')) {
    return PROVIDER_CONFIG.xai;
  }

  return PROVIDER_CONFIG.groq;
};
