import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SYSTEM_PROMPT, buildUserPrompt, parseShotJson } from "@/lib/prompt";
import { PromptResponse } from "@/lib/types";

const inputSchema = z.object({
  mode: z.enum(["single", "sequence", "world"]),
  baseIdea: z.string().min(1),
  targetGenerator: z.enum(["Sora", "Grok", "Other"]),
  duration: z.enum(["6s", "10s", "15s"]),
  visualStyle: z.string().min(1),
  epicScale: z.boolean(),
  keepCharacters: z.boolean(),
  worldId: z.string().optional(),
  worldSettings: z
    .object({
      name: z.string(),
      palette: z.string(),
      era: z.string(),
      themes: z.string(),
      styleNotes: z.string().optional()
    })
    .optional(),
  referenceImageUrl: z.string().url().optional()
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const input = inputSchema.parse(body);

  let worldSettings = input.worldSettings;
  if (!worldSettings && input.worldId) {
    const world = await prisma.worldBible.findUnique({
      where: { id: input.worldId }
    });
    if (world) {
      worldSettings = {
        name: world.name,
        palette: world.palette,
        era: world.era,
        themes: world.themes,
        styleNotes: world.styleNotes ?? undefined
      };
    }
  }

  const userPrompt = buildUserPrompt({ ...input, worldSettings });

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
    const errorText = await response.text();
    return NextResponse.json(
      { error: "OpenAI request failed.", detail: errorText },
      { status: 500 }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  let shots = undefined;
  let rawPrompt = content;

  if (input.mode === "sequence") {
    try {
      shots = parseShotJson(content);
      rawPrompt = shots.map((shot) => `${shot.time} ${shot.description}`).join("\n");
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to parse sequence JSON.", detail: String(error) },
        { status: 422 }
      );
    }
  }

  const session = await prisma.promptSession.create({
    data: {
      mode: input.mode,
      input: JSON.stringify({ ...input, worldSettings }),
      rawPrompt,
      shotsJson: shots ? JSON.stringify(shots) : null,
      worldId: input.worldId ?? null
    }
  });

  const payload: PromptResponse = {
    rawPrompt,
    shots,
    sessionId: session.id
  };

  return NextResponse.json(payload);
}
