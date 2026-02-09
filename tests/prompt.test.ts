import { describe, expect, it } from "vitest";
import { buildUserPrompt, parseShotJson } from "@/lib/prompt";
import { UserInput } from "@/lib/types";

describe("prompt helpers", () => {
  it("builds a user prompt with world settings", () => {
    const input: UserInput = {
      mode: "sequence",
      baseIdea: "A misty cliffside duel",
      targetGenerator: "Sora",
      duration: "10s",
      visualStyle: "Epic fantasy",
      epicScale: true,
      keepCharacters: false,
      worldSettings: {
        name: "Aetherfall",
        palette: "cool blues",
        era: "mythic",
        themes: "fate, honor"
      }
    };

    const prompt = buildUserPrompt(input);
    expect(prompt).toContain("World bible");
    expect(prompt).toContain("A misty cliffside duel");
  });

  it("parses shot JSON", () => {
    const json = JSON.stringify([
      { shot: 1, time: "0-3s", description: "Fast dolly push" },
      { shot: 2, time: "3-6s", description: "Crane reveal" }
    ]);
    const shots = parseShotJson(json);
    expect(shots).toHaveLength(2);
    expect(shots[0].description).toContain("Fast dolly");
  });
});
