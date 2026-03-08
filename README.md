# PromptMagic CinemaPro Sequencer

PromptMagic CinemaPro Sequencer is a full-stack Next.js app that turns natural-language scene ideas into cinematic AI-video prompts, including optional multi-shot timelines and reusable world bible consistency.

## Features

- **Mode 1 – Single Shot**: one polished prompt string.
- **Mode 2 – Sequence**: 3–6 shot-style JSON output parsed into a shot list + raw prompt text.
- **Mode 3 – World Bible**: save style/world constraints and reuse them across generations.
- Dark-themed React UI with prompt controls, results tabs, and copy-all behavior.
- Persistence for **world bibles** and **recent prompt sessions** using SQLite.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env` in project root:

```bash
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=file:./promptmagic.db
```

### 3) Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm run test
```

## Implementation notes

- The system prompt is intentionally a placeholder and can be customized in `lib/prompt.ts`.
- API routes:
  - `POST /api/generate`
  - `GET/POST /api/worlds`
  - `GET /api/sessions`
- SQLite tables are auto-created at runtime by `lib/store.ts`.
