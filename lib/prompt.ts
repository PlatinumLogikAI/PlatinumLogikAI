import { Shot, UserInput, WorldSettings } from "./types";

export const SYSTEM_PROMPT = `You are PromptMagic CinemaPro Sequencer.
You transform user scene ideas into cinematic prompts optimized for AI video generators.

Hard rules:
1) Motion-first writing: every prompt must include camera movement + subject movement + environmental movement.
2) Avoid static/slideshow compositions.
3) Keep atmosphere and visual momentum stronger than backstory.
4) Use concrete cinematic language (lens, framing, pace, transitions, texture, lighting).
5) If mode=sequence, return ONLY a JSON array with objects: {"shot": number, "time": "...", "description": "..."}.

This is placeholder guidance and can be customized by the app owner.`;

export const buildWorldClause = (world?: WorldSettings): string => {
  if (!world) return "";

  return [
    `World bible name: ${world.name}.`,
    `Palette: ${world.palette}.`,
    `Era / tech level: ${world.era}.`,
    `Themes: ${world.themes}.`,
    `Style notes: ${world.styleNotes || "none"}.`
  ].join(" ");
};

export const buildUserPrompt = (input: UserInput): string => {
  const worldClause = buildWorldClause(input.worldSettings);

  return [
    `Mode: ${input.mode}.`,
    `Base idea / vibe: ${input.baseIdea}.`,
    `Target generator: ${input.targetGenerator}.`,
    `Duration: ${input.duration}.`,
    `Visual style: ${input.visualStyle}.`,
    `Epic scale: ${input.epicScale ? "yes" : "no"}.`,
    `Keep characters consistent with last project: ${input.keepCharacters ? "yes" : "no"}.`,
    input.referenceImageUrl ? `Reference image URL: ${input.referenceImageUrl}.` : "",
    worldClause
  ]
    .filter(Boolean)
    .join(" ");
};

const extractJsonArray = (value: string): string => {
  const fenced = value.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBracket = value.indexOf("[");
  const lastBracket = value.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return value.slice(firstBracket, lastBracket + 1);
  }

  return value;
};

export const parseShotJson = (value: string): Shot[] => {
  const parsed = JSON.parse(extractJsonArray(value)) as Shot[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Shot JSON must be a non-empty array.");
  }

  return parsed.map((shot, index) => {
    const normalized = {
      shot: Number(shot.shot ?? index + 1),
      time: String(shot.time ?? "").trim(),
      description: String(shot.description ?? "").trim()
    };

    if (!normalized.time || !normalized.description) {
      throw new Error("Each shot must include both time and description.");
    }

    return normalized;
  });
};

export const formatShotsAsRawPrompt = (shots: Shot[]): string =>
  shots.map((shot) => `Shot ${shot.shot} (${shot.time}): ${shot.description}`).join("\n");
