import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserPrompt, formatShotsAsRawPrompt, parseShotJson, SYSTEM_PROMPT } from "@/lib/prompt";
import { PromptResponse } from "@/lib/types";
import { store } from "@/lib/store";

const inputSchema = z.object({
  mode: z.enum(["single", "sequence", "world"]),
  baseIdea: z.string().min(1, "Base idea is required."),
  targetGenerator: z.enum(["Sora", "Grok", "Other"]),
  duration: z.enum(["6s", "10s", "15s"]),
  visualStyle: z.string().min(1),
  epicScale: z.boolean(),
  keepCharacters: z.boolean(),
  worldId: z.string().optional(),
  worldSettings: z
    .object({
      name: z.string().min(1),
      palette: z.string().min(1),
      era: z.string().min(1),
      themes: z.string().min(1),
      styleNotes: z.string().optional()
    })
    .optional(),
  referenceImageUrl: z.string().url().optional()
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const existingWorld = input.worldId ? store.getWorld(input.worldId) : undefined;
    const resolvedWorld = input.worldSettings ?? existingWorld;

    const userPrompt = buildUserPrompt({
      ...input,
      worldSettings: resolvedWorld
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI request failed.", detail: await response.text() },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = String(data.choices?.[0]?.message?.content ?? "").trim();

    const shots = input.mode === "sequence" ? parseShotJson(content) : [];
    const rawPrompt = input.mode === "sequence" ? formatShotsAsRawPrompt(shots) : content;

    const session = store.createSession({
      mode: input.mode,
      input: JSON.stringify({ ...input, worldSettings: resolvedWorld }),
      rawPrompt,
      shotsJson: shots.length > 0 ? JSON.stringify(shots) : undefined,
      worldId: input.worldId
    });

    const payload: PromptResponse = {
      rawPrompt,
      shots,
      sessionId: session.id
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Generation failed.", detail: message }, { status: 500 });
  }
}
