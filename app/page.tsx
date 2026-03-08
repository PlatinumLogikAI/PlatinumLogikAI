"use client";

import { useEffect, useMemo, useState } from "react";
import { PromptResponse, PromptSession, Shot, WorldRecord, WorldSettings } from "@/lib/types";

type ModeOption = "single" | "sequence" | "world";

const modeLabels: Record<ModeOption, string> = {
  single: "Single Shot",
  sequence: "Sequence",
  world: "World Bible"
};

const emptyWorld: WorldSettings = {
  name: "",
  palette: "",
  era: "",
  themes: "",
  styleNotes: ""
};

export default function HomePage() {
  const [mode, setMode] = useState<ModeOption>("sequence");
  const [baseIdea, setBaseIdea] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [targetGenerator, setTargetGenerator] = useState("Sora");
  const [duration, setDuration] = useState("10s");
  const [visualStyle, setVisualStyle] = useState("Hyper-cinematic realism");
  const [epicScale, setEpicScale] = useState(true);
  const [keepCharacters, setKeepCharacters] = useState(false);
  const [worlds, setWorlds] = useState<WorldRecord[]>([]);
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [worldSettings, setWorldSettings] = useState<WorldSettings>(emptyWorld);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"raw" | "shots">("raw");
  const [rawPrompt, setRawPrompt] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [status, setStatus] = useState("");

  const selectedWorld = useMemo(
    () => worlds.find((world) => world.id === selectedWorldId),
    [worlds, selectedWorldId]
  );

  useEffect(() => {
    void loadWorlds();
    void loadSessions();
  }, []);

  const loadWorlds = async () => {
    const response = await fetch("/api/worlds");
    if (!response.ok) return;
    setWorlds(await response.json());
  };

  const loadSessions = async () => {
    const response = await fetch("/api/sessions");
    if (!response.ok) return;
    setSessions(await response.json());
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          baseIdea,
          targetGenerator,
          duration,
          visualStyle,
          epicScale,
          keepCharacters,
          worldId: selectedWorldId || undefined,
          worldSettings: mode === "world" && !selectedWorldId ? worldSettings : undefined,
          referenceImageUrl: referenceImageUrl || undefined
        })
      });

      const data = (await response.json()) as PromptResponse & { error?: string };

      if (!response.ok) {
        setStatus(data.error ?? "Generation failed.");
        return;
      }

      setRawPrompt(data.rawPrompt);
      setShots(data.shots ?? []);
      setActiveTab(data.shots && data.shots.length > 0 ? "shots" : "raw");
      setStatus("Generated successfully.");
      await loadSessions();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorld = async () => {
    setStatus("");
    const response = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worldSettings)
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save world bible.");
      return;
    }

    setStatus("World bible saved.");
    setWorldSettings(emptyWorld);
    await loadWorlds();
    setSelectedWorldId(data.id);
  };

  const handleCopyAll = async () => {
    if (!rawPrompt) return;
    await navigator.clipboard.writeText(rawPrompt);
    setStatus("Prompt copied.");
  };

  return (
    <main>
      <div className="app-shell">
        <header>
          <h1>PromptMagic CinemaPro Sequencer</h1>
          <p className="small">Generate motion-forward cinematic prompts for AI video tools.</p>
        </header>

        <section className="panel grid">
          <div>
            <div className="input-group">
              <label htmlFor="baseIdea">Describe your scene</label>
              <textarea
                id="baseIdea"
                placeholder="A neon rooftop chase during a thunderstorm..."
                value={baseIdea}
                onChange={(event) => setBaseIdea(event.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="referenceImageUrl">Reference image URL (optional)</label>
              <input
                id="referenceImageUrl"
                value={referenceImageUrl}
                onChange={(event) => setReferenceImageUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="actions">
              <button disabled={loading || !baseIdea.trim()} onClick={handleGenerate}>
                {loading ? "Generating..." : `Generate ${modeLabels[mode]}`}
              </button>
              {mode === "world" && (
                <button className="secondary" onClick={handleSaveWorld}>
                  Save world bible
                </button>
              )}
              <button className="secondary" onClick={handleCopyAll} disabled={!rawPrompt}>
                Copy all
              </button>
            </div>
            {status && <p className="small">{status}</p>}
          </div>

          <div>
            <div className="input-group">
              <label htmlFor="mode">Mode</label>
              <select id="mode" value={mode} onChange={(event) => setMode(event.target.value as ModeOption)}>
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="targetGenerator">Target generator</label>
              <select
                id="targetGenerator"
                value={targetGenerator}
                onChange={(event) => setTargetGenerator(event.target.value)}
              >
                <option value="Sora">Sora</option>
                <option value="Grok">Grok</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="duration">Duration</label>
              <select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)}>
                <option value="6s">6s</option>
                <option value="10s">10s</option>
                <option value="15s">15s</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="visualStyle">Visual style</label>
              <input
                id="visualStyle"
                value={visualStyle}
                onChange={(event) => setVisualStyle(event.target.value)}
              />
            </div>

            <div className="input-group toggle-row">
              <input type="checkbox" checked={epicScale} onChange={(event) => setEpicScale(event.target.checked)} />
              <label>Epic scale</label>
            </div>

            <div className="input-group toggle-row">
              <input
                type="checkbox"
                checked={keepCharacters}
                onChange={(event) => setKeepCharacters(event.target.checked)}
              />
              <label>Keep characters consistent with last project</label>
            </div>

            <div className="input-group">
              <label htmlFor="worldSelect">Apply world bible</label>
              <select
                id="worldSelect"
                value={selectedWorldId}
                onChange={(event) => setSelectedWorldId(event.target.value)}
              >
                <option value="">None</option>
                {worlds.map((world) => (
                  <option key={world.id} value={world.id}>
                    {world.name}
                  </option>
                ))}
              </select>
              {selectedWorld && (
                <p className="small">
                  Using {selectedWorld.name}: {selectedWorld.palette} • {selectedWorld.era} • {selectedWorld.themes}
                </p>
              )}
            </div>

            {mode === "world" && (
              <div className="panel world-grid">
                {[
                  ["World name", "name"],
                  ["Color palette", "palette"],
                  ["Era / tech level", "era"],
                  ["Themes", "themes"],
                  ["Style notes", "styleNotes"]
                ].map(([label, key]) => (
                  <div className="input-group" key={key}>
                    <label>{label}</label>
                    <input
                      value={worldSettings[key as keyof WorldSettings] ?? ""}
                      onChange={(event) =>
                        setWorldSettings((prev) => ({ ...prev, [key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="tabs">
            <button className={`tab ${activeTab === "raw" ? "active" : ""}`} onClick={() => setActiveTab("raw")}>
              Raw Prompt
            </button>
            <button
              className={`tab ${activeTab === "shots" ? "active" : ""}`}
              onClick={() => setActiveTab("shots")}
              disabled={shots.length === 0}
            >
              Shot List
            </button>
          </div>

          {activeTab === "raw" && (
            <div className="input-group">
              <label>Copy-paste prompt</label>
              <textarea readOnly value={rawPrompt} placeholder="Generated prompt output appears here." />
            </div>
          )}

          {activeTab === "shots" && (
            <div className="shots">
              {shots.map((shot) => (
                <div key={`${shot.shot}-${shot.time}`} className="shot-card">
                  <div className="pill">
                    Shot {shot.shot} • {shot.time}
                  </div>
                  <div>{shot.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Recent Prompt Sessions</h3>
          <div className="shots">
            {sessions.length === 0 && <p className="small">No sessions yet.</p>}
            {sessions.map((session) => (
              <div className="shot-card" key={session.id}>
                <div className="pill">{modeLabels[session.mode as ModeOption]}</div>
                <div className="small">{new Date(session.createdAt).toLocaleString()}</div>
                <div>{session.rawPrompt.slice(0, 180)}{session.rawPrompt.length > 180 ? "…" : ""}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
