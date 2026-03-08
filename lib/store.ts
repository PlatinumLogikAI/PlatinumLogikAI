import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { PromptSession, WorldRecord, WorldSettings } from "@/lib/types";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./promptmagic.db";
const database = new DatabaseSync(dbPath);

database.exec(`
CREATE TABLE IF NOT EXISTS world_bibles (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  palette TEXT NOT NULL,
  era TEXT NOT NULL,
  themes TEXT NOT NULL,
  style_notes TEXT
);

CREATE TABLE IF NOT EXISTS prompt_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  mode TEXT NOT NULL,
  input TEXT NOT NULL,
  raw_prompt TEXT NOT NULL,
  shots_json TEXT,
  world_id TEXT,
  FOREIGN KEY(world_id) REFERENCES world_bibles(id)
);
`);

const mapWorld = (row: Record<string, unknown>): WorldRecord => ({
  id: String(row.id),
  createdAt: String(row.created_at),
  name: String(row.name),
  palette: String(row.palette),
  era: String(row.era),
  themes: String(row.themes),
  styleNotes: row.style_notes ? String(row.style_notes) : undefined
});

const mapSession = (row: Record<string, unknown>): PromptSession => ({
  id: String(row.id),
  createdAt: String(row.created_at),
  mode: row.mode as PromptSession["mode"],
  input: String(row.input),
  rawPrompt: String(row.raw_prompt),
  shotsJson: row.shots_json ? String(row.shots_json) : undefined,
  worldId: row.world_id ? String(row.world_id) : undefined
});

export const store = {
  listWorlds(): WorldRecord[] {
    const stmt = database.prepare(
      "SELECT * FROM world_bibles ORDER BY datetime(created_at) DESC"
    );
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(mapWorld);
  },

  getWorld(id: string): WorldRecord | undefined {
    const stmt = database.prepare("SELECT * FROM world_bibles WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return row ? mapWorld(row) : undefined;
  },

  upsertWorld(world: WorldSettings): WorldRecord {
    const existingStmt = database.prepare("SELECT id FROM world_bibles WHERE name = ?");
    const existing = existingStmt.get(world.name) as { id: string } | undefined;
    const now = new Date().toISOString();

    if (existing) {
      const updateStmt = database.prepare(
        `UPDATE world_bibles
         SET palette = ?, era = ?, themes = ?, style_notes = ?
         WHERE id = ?`
      );
      updateStmt.run(
        world.palette,
        world.era,
        world.themes,
        world.styleNotes ?? null,
        existing.id
      );
      return this.getWorld(existing.id)!;
    }

    const id = randomUUID();
    const insertStmt = database.prepare(
      `INSERT INTO world_bibles (id, created_at, name, palette, era, themes, style_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    insertStmt.run(
      id,
      now,
      world.name,
      world.palette,
      world.era,
      world.themes,
      world.styleNotes ?? null
    );

    return this.getWorld(id)!;
  },

  createSession(session: Omit<PromptSession, "id" | "createdAt">): PromptSession {
    const id = randomUUID();
    const now = new Date().toISOString();
    const insertStmt = database.prepare(
      `INSERT INTO prompt_sessions (id, created_at, mode, input, raw_prompt, shots_json, world_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    insertStmt.run(
      id,
      now,
      session.mode,
      session.input,
      session.rawPrompt,
      session.shotsJson ?? null,
      session.worldId ?? null
    );

    return {
      id,
      createdAt: now,
      ...session
    };
  },

  listSessions(limit = 10): PromptSession[] {
    const stmt = database.prepare(
      "SELECT * FROM prompt_sessions ORDER BY datetime(created_at) DESC LIMIT ?"
    );
    const rows = stmt.all(limit) as Record<string, unknown>[];
    return rows.map(mapSession);
  }
};
