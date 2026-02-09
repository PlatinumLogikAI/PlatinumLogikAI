import { Shot, UserInput, WorldSettings } from "./types";

export const SYSTEM_PROMPT = `You are PromptMagic CinemaPro Sequencer.
Generate cinematic AI video prompts with strong motion and atmosphere.
Requirements:
- Always include camera movement, character movement, and environmental motion.
- Avoid static slideshow descriptions.
- Prioritize motion and atmosphere over backstory.
- Keep prompts vivid, concise, and production-ready.
- For sequence mode, return ONLY valid JSON array of shots with keys: shot, time, description.`;

export const buildWorldClause = (world?: WorldSettings): string => {
  if (!world) return "";
  return `World bible: palette=${world.palette}; era/tech=${world.era}; themes=${world.themes}; style notes=${world.styleNotes ?? "none"}.`;
};

export const buildUserPrompt = (input: UserInput): string => {
  const worldClause = buildWorldClause(input.worldSettings);
  const reference = input.referenceImageUrl
    ? `Reference image URL: ${input.referenceImageUrl}.`
    : "";
  return [
    `Mode: ${input.mode}.`,
    `Base idea: ${input.baseIdea}.`,
    `Target generator: ${input.targetGenerator}.`,
    `Duration: ${input.duration}.`,
    `Visual style: ${input.visualStyle}.`,
    `Epic scale: ${input.epicScale ? "yes" : "no"}.`,
    `Keep characters consistent: ${input.keepCharacters ? "yes" : "no"}.`,
    worldClause,
    reference
  ]
    .filter(Boolean)
    .join(" ");
};

export const parseShotJson = (value: string): Shot[] => {
  const parsed = JSON.parse(value) as Shot[];
  if (!Array.isArray(parsed)) {
    throw new Error("Shot JSON must be an array.");
  }
  return parsed.map((shot, index) => ({
    shot: Number(shot.shot ?? index + 1),
    time: String(shot.time ?? ""),
    description: String(shot.description ?? "")
  }));
};
