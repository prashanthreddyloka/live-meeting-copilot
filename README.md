# TwinMind Live Copilot

A full-stack AI meeting copilot that transcribes your mic in real time, surfaces contextual suggestion cards every 20 seconds, and lets you open any card into a streaming transcript-grounded chat — all during a live conversation.

# Live APP - https://live-meeting-copilot-client.vercel.app/

## Features

- **Live transcription** — Web Speech API shows words as you speak; Groq Whisper-large-v3 confirms each chunk with high accuracy every 20 seconds
- **Live suggestion cards** — 3 typed cards (`ASK`, `ANSWER`, `FACT_CHECK`, `TALKING_POINT`, `CLARIFY`) generated every 20 seconds from both confirmed transcript and live interim speech
- **Suggest now** — bypass the 20-second cycle; generates suggestions instantly from current context without waiting for Whisper
- **Streaming chat** — click any card or type freely; first token arrives in < 1 second via SSE streaming
- **Full session export** — JSON download with transcript (wall-clock + elapsed timestamps), all suggestion batches, full chat history

## Setup

### Prerequisites

- Node.js 22+
- npm 10+
- A Groq API key (get one free at [console.groq.com](https://console.groq.com))

### Install & run

```bash
npm install
npm run dev
```

This starts:
- Vite frontend on `http://localhost:3000`
- Express backend on `http://localhost:4000`

The Vite dev server proxies `/api/*` to the backend automatically.

### Separate frontend/backend deployment

```bash
VITE_API_BASE_URL=https://your-api-domain.vercel.app
```

### Production build

```bash
npm run build
```

## Project Structure

```
/
├── client/
│   └── src/
│       ├── components/         # TranscriptPanel, SuggestionsPanel, ChatPanel, ...
│       ├── hooks/
│       │   ├── useSession.ts   # All session state, timers, and API orchestration
│       │   └── useMicRecorder.ts  # MediaRecorder + SpeechRecognition
│       ├── services/           # API clients for suggestions, transcription, chat
│       ├── prompts.ts          # All model prompts and defaults (editable in Settings)
│       └── types.ts
└── server/
    ├── routes/
    │   ├── suggestions.ts      # JSON suggestion generation
    │   ├── chat.ts             # SSE streaming chat
    │   └── transcription.ts   # Whisper proxy
    ├── provider.ts             # Model config per API key provider
    └── index.ts
```

## Architecture & Key Decisions

### Dual-layer transcription

The app uses two transcription sources in parallel:

| Layer | Source | Latency | Purpose |
|---|---|---|---|
| **Interim** | Web Speech API | ~100ms | Live display, included in suggestion context immediately |
| **Confirmed** | Groq Whisper-large-v3 | 2-4s | Accurate transcript record, long-term suggestion context |

When a Whisper chunk returns, `clearInterim()` restarts the `SpeechRecognition` instance entirely (not just clears the state), so the new recognition session starts fresh without re-emitting already-transcribed speech.

### Suggestion latency: three-path system

1. **Auto-cycle (every 20s)**: A `setInterval` fires independently of Whisper and generates suggestions using `confirmed transcript + live interimText`. No Whisper wait.
2. **Manual "Suggest now"**: Calls `generateSuggestionsForTranscript` immediately from current context, then calls `requestChunk()` in the background to refresh Whisper state. The user sees suggestions in ~1-2 seconds, not 5-8.
3. **Post-Whisper refresh**: After each Whisper chunk lands, suggestions are regenerated with the newly confirmed text merged with any concurrent live speech.

### Model selection

- **Suggestions**: `openai/gpt-oss-120b` — required per spec so evaluators compare prompt quality across submissions on the same model
- **Chat / detailed answers**: `openai/gpt-oss-120b` — same model, streamed via SSE so first token appears quickly regardless of total length
- **Transcription**: `whisper-large-v3` — 30-second chunks, the recommended segment size per Groq docs

Latency is improved not by model-swapping but through three architectural choices: `max_tokens: 600` on suggestion calls, the instant `manualRefresh` fast path, and the independent 20-second suggestion timer (see below).

### Context window design

| Use case | Window | Rationale |
|---|---|---|
| Suggestions | 600 words (~4 min) | Recency matters more than full history; recent speech is most actionable |
| Detailed answer | 2000 words (~13 min) | Enough context for a thorough answer without token cost of the full session |
| Chat | 1500 words (~10 min) | Balance between grounding and cost; user can ask follow-ups if needed |

All windows are configurable in Settings and persist in `localStorage`.

## Prompt Engineering

### Suggestion prompt

Core decisions:

- **Type-driven framing**: The model is told exactly when to use each type (`ANSWER` if a question was just asked, `FACT_CHECK` if a claim/number was stated, etc.). This prevents all 3 cards from defaulting to `ASK`.
- **Preview = standalone value**: The prompt explicitly requires `preview` to be a mini-answer, not a teaser. Cards are useful without clicking.
- **Previous-batch deduplication**: The last batch is passed back so the model doesn't repeat itself across cycles.
- **Sparse transcript handling**: If the transcript is thin (meeting just started), the model is instructed to still generate useful bootstrapping suggestions rather than refusing.

### Chat / detailed answer prompt

- **Conciseness enforced**: 150-250 words for detailed answers, 100-200 for freeform chat. The user is mid-meeting; they need a scannable answer, not an essay.
- **Transcript-grounded by default**: The system prompt always injects the relevant transcript window so answers reference what was actually said.
- **No preamble**: Prompts explicitly ban filler phrases ("Certainly!", "Great question") to reduce time-to-signal.
- **Payoff-first ordering**: "Lead with the single most useful insight" is baked into both prompts so skimmable information appears at the top.

### Live context injection (`[Live]` prefix)

When suggestions are generated, any unconfirmed Web Speech text is appended as `\n[Live] <text>`. The model sees both the confirmed transcript and what's being said right now. This is the key fix that makes suggestions reflect current speech rather than lagging behind by a full Whisper cycle.

## Error Handling

- **Silent segments**: Whisper returns empty text → entry is silently skipped. No "No speech detected" clutter in the transcript.
- **Transcription errors**: Swallowed silently (console warn only). Silence or tiny blobs causing API errors no longer spam the transcript panel.
- **Suggestion failures**: Surface a retry button in the panel. The last context is stored in a ref so retry is instant.
- **Chat failures**: Replace the streaming message with a user-facing error inline. The session continues.
- **Mic permission denied**: Specific error message surfaced in the transcript panel header, not a generic alert.

## Export Format

```json
{
  "exported_at": "2025-08-15T14:22:00.000Z",
  "transcript": [
    { "elapsed": "0:20", "timestamp": "2025-08-15T14:20:00.000Z", "text": "..." }
  ],
  "suggestion_batches": [
    {
      "elapsed": "0:20",
      "timestamp": "2025-08-15T14:20:00.000Z",
      "suggestions": [
        { "type": "ASK", "headline": "...", "preview": "...", "full_prompt": "..." }
      ]
    }
  ],
  "chat_history": [
    { "role": "user", "content": "...", "timestamp": "2025-08-15T14:21:00.000Z", "label": "Question to ask" }
  ]
}
```

Each entry carries both elapsed session time and wall-clock ISO timestamp so evaluators can reconstruct exactly what happened when.

## Settings

All settings persist in `localStorage`. The API key is never hardcoded — it's forwarded only in the `x-groq-api-key` request header at runtime.

| Setting | Default | Purpose |
|---|---|---|
| Groq API Key | — | Required to enable recording and AI features |
| Suggestion prompt | See `prompts.ts` | Full prompt template, editable live |
| Detailed answer prompt | See `prompts.ts` | Prompt for card-click answers |
| Chat prompt | See `prompts.ts` | Prompt for freeform chat |
| Suggestion context window | 600 words | How much transcript the suggestion model sees |
| Detailed context window | 2000 words | How much transcript the detailed answer model sees |
| Chat context window | 1500 words | How much transcript the chat model sees |
| Transcript chunk interval | 30 seconds | How often Whisper is called |

## Deployment

Vercel works well for both halves:

- Deploy `client/` as a static Vite project
- Deploy `server/` as a Node.js/Express project (a Vercel entrypoint is included at `server/api/index.ts`)
- Set `VITE_API_BASE_URL` in the client project to point to the server URL
