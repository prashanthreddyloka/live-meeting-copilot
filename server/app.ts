import cors from 'cors';
import express from 'express';
import { chatRouter } from './routes/chat.js';
import { suggestionsRouter } from './routes/suggestions.js';
import { transcribeRouter } from './routes/transcribe.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.use('/api/transcribe', transcribeRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/chat', chatRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  response.status(500).json({ error: message });
});

export default app;
