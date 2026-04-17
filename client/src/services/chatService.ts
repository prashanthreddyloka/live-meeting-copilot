import { getApiUrl } from './api';

interface ChatRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamChatOptions {
  messages: ChatRequestMessage[];
  transcript: string;
  contextWindow: number;
  prompt: string;
  apiKey: string;
  onToken: (token: string) => void;
}

const extractErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();

  if (!text) {
    return 'Request failed';
  }

  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error ?? text;
  } catch {
    return text;
  }
};

const processSseChunk = (chunk: string, onToken: (token: string) => void): void => {
  const lines = chunk.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line.startsWith('data:')) {
      continue;
    }

    const payload = line.slice(5).trim();

    if (!payload || payload === '[DONE]') {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const token = parsed.choices?.[0]?.delta?.content;

      if (token) {
        onToken(token);
      }
    } catch {
      continue;
    }
  }
};

export const streamChatCompletion = async ({
  messages,
  transcript,
  contextWindow,
  prompt,
  apiKey,
  onToken,
}: StreamChatOptions): Promise<void> => {
  const response = await fetch(getApiUrl('/api/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-groq-api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      transcript,
      contextWindow,
      prompt,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await extractErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      processSseChunk(chunk, onToken);
    }
  }

  if (buffer) {
    processSseChunk(buffer, onToken);
  }
};
