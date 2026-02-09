# PromptMagic CinemaPro Sequencer

Generate cinematic, motion-rich AI video prompts with shot-by-shot breakdowns, world bible continuity, and copy-ready outputs.

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_key_here
DATABASE_URL="file:./dev.db"
```

### 3) Prepare the database

```bash
npm run prisma:generate
npm run prisma:push
```

### 4) Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Running tests

```bash
npm run test
```

## Notes
- The OpenAI API call uses a placeholder system prompt that you can customize in `lib/prompt.ts`.
- World bibles are saved via the World Bible mode and can be applied to new prompts.
