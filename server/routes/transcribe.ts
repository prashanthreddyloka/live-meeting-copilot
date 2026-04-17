import { Router } from 'express';
import multer from 'multer';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const upload = multer({ storage: multer.memoryStorage() });

const requireGroqApiKey = (value: string | undefined): string => {
  if (!value?.trim()) {
    throw new Error('Missing Groq API key');
  }

  return value.trim();
};

export const transcribeRouter = Router();

transcribeRouter.post('/', upload.single('audio'), async (request, response, next) => {
  try {
    const apiKey = requireGroqApiKey(request.header('x-groq-api-key'));
    const audioFile = request.file;

    if (!audioFile) {
      response.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const formData = new FormData();
    formData.append(
      'file',
      new File([new Uint8Array(audioFile.buffer)], audioFile.originalname || 'recording.webm', {
        type: audioFile.mimetype || 'audio/webm',
      }),
    );
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('temperature', '0');
    formData.append('language', 'en');

    const groqResponse = await fetch(GROQ_TRANSCRIBE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      response.status(groqResponse.status).json({ error: errorText || 'Groq transcription request failed' });
      return;
    }

    const data = (await groqResponse.json()) as { text?: string };
    response.json({ text: data.text ?? '' });
  } catch (error) {
    next(error);
  }
});
