import { SUGGESTION_TYPES, type Suggestion } from '../types';
import { getApiUrl } from './api';

interface SuggestionsRequest {
  transcript: string;
  previousSuggestions: string[];
  contextWindow: number;
  prompt: string;
  apiKey: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
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

const validateSuggestions = (suggestions: Suggestion[]): Suggestion[] => {
  if (!Array.isArray(suggestions) || suggestions.length !== 3) {
    throw new Error('Suggestions response was invalid');
  }

  return suggestions.map((suggestion) => {
    if (
      !SUGGESTION_TYPES.includes(suggestion.type) ||
      typeof suggestion.headline !== 'string' ||
      typeof suggestion.preview !== 'string' ||
      typeof suggestion.full_prompt !== 'string'
    ) {
      throw new Error('Suggestions response was invalid');
    }

    return suggestion;
  });
};

export const fetchSuggestions = async ({
  transcript,
  previousSuggestions,
  contextWindow,
  prompt,
  apiKey,
}: SuggestionsRequest): Promise<Suggestion[]> => {
  const response = await fetch(getApiUrl('/api/suggestions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-groq-api-key': apiKey,
    },
    body: JSON.stringify({
      transcript,
      previousSuggestions,
      contextWindow,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const data = (await response.json()) as SuggestionsResponse;
  return validateSuggestions(data.suggestions);
};
