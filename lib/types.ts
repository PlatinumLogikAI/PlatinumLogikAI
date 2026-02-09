export type Mode = "single" | "sequence" | "world";

export interface UserInput {
  mode: Mode;
  baseIdea: string;
  targetGenerator: "Sora" | "Grok" | "Other";
  duration: "6s" | "10s" | "15s";
  visualStyle: string;
  epicScale: boolean;
  keepCharacters: boolean;
  worldId?: string;
  worldSettings?: WorldSettings;
  referenceImageUrl?: string;
}

export interface WorldSettings {
  name: string;
  palette: string;
  era: string;
  themes: string;
  styleNotes?: string;
}

export interface Shot {
  shot: number;
  time: string;
  description: string;
}

export interface PromptResponse {
  rawPrompt: string;
  shots?: Shot[];
  sessionId?: string;
}
