import { Router } from 'express';
import { getProviderConfig, requireApiKey } from '../provider.js';

interface ChatBody {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  transcript?: string;
  contextWindow?: number;
  prompt?: string;
}

const clipWords = (text: string, wordLimit: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(Math.max(0, words.length - wordLimit)).join(' ');
};

const fillTemplate = (prompt: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, String(value)),
    prompt,
  );

export const chatRouter = Router();

chatRouter.post('/', async (request, response, next) => {
  try {
    const apiKey = requireApiKey(request.header('x-groq-api-key'));
    const provider = getProviderConfig(apiKey);
    const body = request.body as ChatBody;
    const prompt = body.prompt?.trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const transcript = body.transcript?.trim() ?? '';
    const contextWindow = Number(body.contextWindow ?? 3000);
    const latestUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')?.content ?? '';

    if (!prompt || messages.length === 0) {
      response.status(400).json({ error: 'Prompt and messages are required' });
      return;
    }

    const systemPrompt = fillTemplate(prompt, {
      FULL_TRANSCRIPT: clipWords(transcript, contextWindow),
      USER_MESSAGE: latestUserMessage,
    });

    const apiResponse = await fetch(provider.chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.chatModel,
        temperature: 0.2,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        ],
      }),
    });

    if (!apiResponse.ok || !apiResponse.body) {
      const errorText = await apiResponse.text();
      response.status(apiResponse.status || 500).json({ error: errorText || 'Chat request failed' });
      return;
    }

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        response.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      response.end();
    }
  } catch (error) {
    next(error);
  }
});
