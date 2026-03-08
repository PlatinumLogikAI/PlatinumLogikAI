import { describe, expect, it } from "vitest";
import { buildUserPrompt, formatShotsAsRawPrompt, parseShotJson } from "@/lib/prompt";
import { UserInput } from "@/lib/types";

describe("prompt helpers", () => {
  it("builds a user prompt including world settings and reference image", () => {
    const input: UserInput = {
      mode: "sequence",
      baseIdea: "A misty cliffside duel",
      targetGenerator: "Sora",
      duration: "10s",
      visualStyle: "Epic fantasy",
      epicScale: true,
      keepCharacters: false,
      referenceImageUrl: "https://example.com/ref.png",
      worldSettings: {
        name: "Aetherfall",
        palette: "cool blues",
        era: "mythic",
        themes: "fate, honor"
      }
    };

    const prompt = buildUserPrompt(input);
    expect(prompt).toContain("World bible name: Aetherfall");
    expect(prompt).toContain("Reference image URL");
  });

  it("parses fenced JSON shot output", () => {
    const wrapped = [
      "```json",
      JSON.stringify([
        { shot: 1, time: "0-3s", description: "Fast dolly push" },
        { shot: 2, time: "3-6s", description: "Crane reveal" }
      ]),
      "```"
    ].join("\n");

    const shots = parseShotJson(wrapped);
    expect(shots).toHaveLength(2);
    expect(formatShotsAsRawPrompt(shots)).toContain("Shot 1 (0-3s)");
  });

  it("throws for invalid shot payload", () => {
    expect(() => parseShotJson("{}")).toThrow("non-empty array");
  });
});
