import { Router } from 'express';
import { getProviderConfig, requireApiKey } from '../provider.js';

const SUGGESTION_TYPES = new Set(['ASK', 'FACT_CHECK', 'TALKING_POINT', 'ANSWER', 'CLARIFY']);

interface SuggestionBody {
  transcript?: string;
  previousSuggestions?: string[];
  contextWindow?: number;
  prompt?: string;
}

interface Suggestion {
  type: string;
  headline: string;
  preview: string;
  full_prompt: string;
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

const parseSuggestions = (parsed: unknown): Suggestion[] => {

  if (!Array.isArray(parsed) || parsed.length !== 3) {
    throw new Error('Suggestions response must be an array of exactly 3 items');
  }

  return parsed.map((item, index) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.type !== 'string' ||
      typeof item.headline !== 'string' ||
      typeof item.preview !== 'string' ||
      typeof item.full_prompt !== 'string'
    ) {
      throw new Error(`Suggestion ${index + 1} is invalid`);
    }

    const normalizedType = item.type.trim().toUpperCase();

    if (!SUGGESTION_TYPES.has(normalizedType)) {
      throw new Error(`Suggestion ${index + 1} has an invalid type`);
    }

    return {
      type: normalizedType,
      headline: item.headline.trim(),
      preview: item.preview.trim(),
      full_prompt: item.full_prompt.trim(),
    };
  });
};

export const suggestionsRouter = Router();

suggestionsRouter.post('/', async (request, response, next) => {
  try {
    const apiKey = requireApiKey(request.header('x-groq-api-key'));
    const provider = getProviderConfig(apiKey);
    const body = request.body as SuggestionBody;
    const transcript = body.transcript?.trim();
    const prompt = body.prompt?.trim();
    const contextWindow = Number(body.contextWindow ?? 600);
    const previousSuggestions = Array.isArray(body.previousSuggestions) ? body.previousSuggestions : [];

    if (!transcript || !prompt) {
      response.status(400).json({ error: 'Transcript and prompt are required' });
      return;
    }

    const finalPrompt = fillTemplate(prompt, {
      SUGGESTION_CONTEXT_WINDOW: contextWindow,
      RECENT_TRANSCRIPT: clipWords(transcript, contextWindow),
      PREVIOUS_SUGGESTIONS: previousSuggestions.length > 0 ? previousSuggestions.join('\n') : 'None',
    });

    const apiResponse = await fetch(provider.chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.chatModel,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: finalPrompt,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      response.status(apiResponse.status).json({ error: errorText || 'Suggestions request failed' });
      return;
    }

    const data = (await apiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    const suggestions = parseSuggestions(JSON.parse(content) as unknown);
    response.json({ suggestions });
  } catch (error) {
    next(error);
  }
});
