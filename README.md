# TwinMind Live Suggestions

TwinMind Live Suggestions is a full-stack AI meeting copilot that captures microphone audio in chunks, transcribes it with Groq Whisper, generates contextual live suggestion cards, and lets you open any suggestion into a transcript-grounded streaming chat thread.

## Setup

### Prerequisites

- Node.js 22+ recommended
- npm 10+ recommended
- A Groq API key

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

This starts:

- Vite frontend on `http://localhost:3000`
- Express backend on `http://localhost:4000`

For local development, the Vite dev server proxies `/api/*` to the backend automatically.

### Optional frontend env

If you deploy the frontend and backend separately, set this in the frontend project:

```bash
VITE_API_BASE_URL=https://your-api-domain.vercel.app
```

### Build for production

```bash
npm run build
```

## Project Structure

```text
/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── prompts.ts
│   │   ├── types.ts
│   │   └── App.tsx
├── server/
│   ├── routes/
│   ├── index.ts
│   └── tsconfig.json
├── package.json
└── README.md
```

## Stack Choices

### Frontend

- React + Vite + TypeScript
- Tailwind CSS for fast dark-theme UI composition
- Local state hooks instead of a heavier global store because this is a single-session, browser-first workflow

Why:

- Vite keeps startup and iteration fast.
- TypeScript strict mode helps protect multi-panel state coordination.
- Tailwind makes it easy to maintain a dense, responsive dashboard layout.

### Backend

- Node.js + Express as a thin runtime proxy
- `multer` for multipart audio upload parsing
- Native `fetch`, `FormData`, and stream handling in Node 22

Why:

- The backend only needs to protect the runtime key and forward requests.
- Express keeps the API surface simple for Vercel or a small Node deployment.
- Native fetch/stream support keeps the proxy lean.

### AI / Speech Models

- Transcription: `whisper-large-v3`
- Suggestions + chat: `openai/gpt-oss-120b`

Why:

- `whisper-large-v3` is still available in Groq Docs and is a strong fit for 30-second meeting chunks.
- The originally requested `meta-llama/llama-4-maverick-17b-128e-instruct` was deprecated by Groq on March 9, 2026. Groq’s deprecation page recommends `openai/gpt-oss-120b`, so the app uses that current replacement.

## Prompt Engineering Strategy

### Suggestion prompt

The suggestion system is optimized for immediacy, not exhaustive summarization.

Core strategy:

- Bias strongly toward the last 2-3 minutes by clipping transcript context to the configured word window.
- Ask the model for exactly 3 cards every refresh so the UI stays scannable under live meeting pressure.
- Force a typed action frame: `ASK`, `ANSWER`, `FACT_CHECK`, `TALKING_POINT`, or `CLARIFY`.
- Require each preview to be valuable on its own, so the middle column remains useful even if the user never opens chat.
- Feed the previous batch back into the prompt so the next batch avoids obvious repetition.

How the suggestion type mix is chosen:

- `ASK` when the conversation opens a decision gap or a useful follow-up would unblock progress.
- `ANSWER` when someone has effectively asked a question, directly or indirectly, and a concise answer would help immediately.
- `FACT_CHECK` when the transcript contains a claim, metric, timeline, dependency, or assumption that sounds verifiable.
- `TALKING_POINT` when the user would benefit from bringing in adjacent context, framing, or a sharper argument.
- `CLARIFY` when something important is vague, underspecified, or ambiguous enough to create downstream risk.

### Chat prompt

The chat system is designed to feel like one continuous copilot thread for the session.

Core strategy:

- Inject the transcript window into the system prompt so the answer is transcript-aware by default.
- Keep the full session chat history as request messages for continuity.
- Encourage direct, structured, actionable answers because this app is used mid-conversation, not for leisurely exploration.

## Tradeoffs

### Latency vs quality

- The app keeps 30-second audio chunks by default because Groq’s Whisper docs specifically note 30-second audio as an optimized segment size.
- That chunk size improves transcription stability, but suggestions are naturally batched rather than truly word-by-word live.
- `openai/gpt-oss-120b` was chosen for answer quality and current Groq availability, even though a smaller model could reduce latency further.

### Context size vs responsiveness

- Suggestion context defaults to 600 words to emphasize recency and keep card generation focused.
- Chat context defaults to 3000 words so answers stay grounded without paying the cost of sending the entire raw session every time.
- These are editable in Settings because the right balance depends on meeting length and topic density.

### Simplicity vs perfect audio continuity

- The app uses `MediaRecorder` chunking and `requestData()` for manual refresh because it is portable and browser-native.
- This is simpler than a lower-level streaming audio pipeline, but it means “live” is implemented as frequent chunked transcription rather than sub-second phoneme streaming.

### Reliability vs strictness

- The backend validates suggestion JSON shape and allowed types before returning cards to the client.
- If one transcription or suggestion request fails, the session keeps going and the UI surfaces a toast or retry affordance instead of crashing the app.

## Settings

All settings persist in `localStorage`:

- Groq API Key
- Suggestion prompt
- Chat prompt
- Suggestion context window
- Chat context window
- Transcript chunk interval

The API key is never hardcoded and is only forwarded in the `x-groq-api-key` request header at runtime.

## Export Format

The floating export action downloads:

```json
{
  "exported_at": "ISO timestamp",
  "transcript": [
    { "timestamp": "0:30", "text": "..." }
  ],
  "suggestion_batches": [
    {
      "timestamp": "0:30",
      "suggestions": [
        {
          "type": "ASK",
          "headline": "...",
          "preview": "...",
          "full_prompt": "..."
        }
      ]
    }
  ],
  "chat_history": [
    { "role": "user", "content": "...", "timestamp": "ISO timestamp" }
  ]
}
```

## Verification

Verified locally:

- `npm install`
- `npm run build --workspace server`
- `npm run build --workspace client`

The client build needed elevated execution on Windows because Vite/esbuild had to spawn a helper process outside the sandboxed build environment.

## Deployment Recommendation

Vercel is the best fit for this app.

Recommended setup:

- Deploy `client` as one Vercel project
- Deploy `server` as a second Vercel project
- Set `VITE_API_BASE_URL` in the client project to the server project URL

Why this shape:

- The frontend is a standard static Vite app and deploys cleanly on Vercel.
- The backend is a thin API proxy, so keeping it separate makes secrets and scaling simpler.
- The server now includes a Vercel entrypoint at `server/api/index.ts` plus `server/vercel.json`, so the API project can run as Vercel functions without changing the local Express dev flow.
- It avoids forcing the Vite app and Express proxy into one awkward deployment target.
