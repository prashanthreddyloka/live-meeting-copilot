import { Router } from 'express';
import multer from 'multer';
import { getProviderConfig, requireApiKey } from '../provider.js';

const upload = multer({ storage: multer.memoryStorage() });

export const transcribeRouter = Router();

transcribeRouter.post('/', upload.single('audio'), async (request, response, next) => {
  try {
    const apiKey = requireApiKey(request.header('x-groq-api-key'));
    const provider = getProviderConfig(apiKey);
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
    if (provider.transcriptionModel) {
      formData.append('model', provider.transcriptionModel);
      formData.append('response_format', 'json');
      formData.append('temperature', '0');
    } else {
      formData.append('format', 'true');
    }
    formData.append('language', 'en');

    const apiResponse = await fetch(provider.transcriptionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      response.status(apiResponse.status).json({ error: errorText || 'Transcription request failed' });
      return;
    }

    const data = (await apiResponse.json()) as { text?: string };
    response.json({ text: data.text ?? '' });
  } catch (error) {
    next(error);
  }
});
