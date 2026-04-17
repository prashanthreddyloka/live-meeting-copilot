import { getApiUrl } from './api';

export interface TranscriptionResponse {
  text: string;
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

export const transcribeAudio = async (audio: Blob, apiKey: string): Promise<TranscriptionResponse> => {
  const formData = new FormData();
  formData.append('audio', audio, 'recording.webm');

  const response = await fetch(getApiUrl('/api/transcribe'), {
    method: 'POST',
    headers: {
      'x-groq-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as TranscriptionResponse;
};
