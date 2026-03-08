export type Mode = "single" | "sequence" | "world";

export type TargetGenerator = "Sora" | "Grok" | "Other";

export type Duration = "6s" | "10s" | "15s";

export interface UserInput {
  mode: Mode;
  baseIdea: string;
  targetGenerator: TargetGenerator;
  duration: Duration;
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

export interface WorldRecord extends WorldSettings {
  id: string;
  createdAt: string;
}

export interface Shot {
  shot: number;
  time: string;
  description: string;
}

export interface PromptResponse {
  rawPrompt: string;
  shots: Shot[];
  sessionId?: string;
}

export interface PromptSession {
  id: string;
  createdAt: string;
  mode: Mode;
  input: string;
  rawPrompt: string;
  shotsJson?: string;
  worldId?: string;
}
