"use client";

import { useEffect, useState } from "react";
import { PromptResponse, Shot, WorldSettings } from "@/lib/types";

type ModeOption = "single" | "sequence" | "world";

interface WorldRecord extends WorldSettings {
  id: string;
}

const modeLabels: Record<ModeOption, string> = {
  single: "Single Shot",
  sequence: "Sequence",
  world: "World Bible"
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
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [worldSettings, setWorldSettings] = useState<WorldSettings>({
    name: "",
    palette: "",
    era: "",
    themes: "",
    styleNotes: ""
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"raw" | "shots">("raw");
  const [rawPrompt, setRawPrompt] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadWorlds();
  }, []);

  const loadWorlds = async () => {
    const response = await fetch("/api/worlds");
    if (response.ok) {
      const data = await response.json();
      setWorlds(data);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStatus("");
    setRawPrompt("");
    setShots([]);
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
          worldSettings: selectedWorldId ? undefined : worldSettings,
          referenceImageUrl: referenceImageUrl || undefined
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        setStatus(errorData.error ?? "Generation failed.");
        return;
      }
      const data = (await response.json()) as PromptResponse;
      setRawPrompt(data.rawPrompt);
      setShots(data.shots ?? []);
      setActiveTab(data.shots ? "shots" : "raw");
    } catch (error) {
      setStatus(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorld = async () => {
    setStatus("");
    if (!worldSettings.name.trim()) {
      setStatus("Please name your world bible.");
      return;
    }
    const response = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worldSettings)
    });
    if (!response.ok) {
      const errorData = await response.json();
      setStatus(errorData.error ?? "Failed to save world.");
      return;
    }
    await loadWorlds();
    setStatus("World bible saved.");
  };

  const handleCopy = async () => {
    if (!rawPrompt) return;
    await navigator.clipboard.writeText(rawPrompt);
    setStatus("Copied prompt to clipboard.");
  };

  const selectedWorld = worlds.find((world) => world.id === selectedWorldId);

  return (
    <main>
      <div className="app-shell">
        <header>
          <h1>PromptMagic CinemaPro Sequencer</h1>
          <p className="small">
            Craft motion-rich AI video prompts with shot-by-shot breakdowns and world
            continuity.
          </p>
        </header>

        <section className="panel grid">
          <div>
            <div className="input-group">
              <label htmlFor="baseIdea">Describe your scene</label>
              <textarea
                id="baseIdea"
                placeholder="Neon-lit market chase through rain-soaked alleys..."
                value={baseIdea}
                onChange={(event) => setBaseIdea(event.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="referenceUrl">Reference image URL (optional)</label>
              <input
                id="referenceUrl"
                value={referenceImageUrl}
                onChange={(event) => setReferenceImageUrl(event.target.value)}
                placeholder="https://example.com/reference.jpg"
              />
            </div>
            <div className="actions">
              <button onClick={handleGenerate} disabled={loading || !baseIdea}>
                {loading ? "Generating..." : "Generate sequence"}
              </button>
              {mode === "world" && (
                <button className="secondary" onClick={handleSaveWorld}>
                  Save world bible
                </button>
              )}
              <button className="secondary" onClick={handleCopy} disabled={!rawPrompt}>
                Copy all
              </button>
            </div>
            {status && <p className="small">{status}</p>}
          </div>

          <div>
            <div className="input-group">
              <label htmlFor="mode">Mode</label>
              <select
                id="mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as ModeOption)}
              >
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="generator">Target generator</label>
              <select
                id="generator"
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
              <select
                id="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
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
              <input
                id="epicScale"
                type="checkbox"
                checked={epicScale}
                onChange={(event) => setEpicScale(event.target.checked)}
              />
              <label htmlFor="epicScale">Epic scale</label>
            </div>
            <div className="input-group toggle-row">
              <input
                id="keepCharacters"
                type="checkbox"
                checked={keepCharacters}
                onChange={(event) => setKeepCharacters(event.target.checked)}
              />
              <label htmlFor="keepCharacters">
                Keep characters consistent with last project
              </label>
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
                  Using {selectedWorld.name}: {selectedWorld.palette}, {selectedWorld.era},
                  {selectedWorld.themes}
                </p>
              )}
            </div>
            {mode === "world" && (
              <div className="panel world-grid">
                <div className="input-group">
                  <label htmlFor="worldName">World name</label>
                  <input
                    id="worldName"
                    value={worldSettings.name}
                    onChange={(event) =>
                      setWorldSettings({ ...worldSettings, name: event.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="worldPalette">Color palette</label>
                  <input
                    id="worldPalette"
                    value={worldSettings.palette}
                    onChange={(event) =>
                      setWorldSettings({ ...worldSettings, palette: event.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="worldEra">Era / tech level</label>
                  <input
                    id="worldEra"
                    value={worldSettings.era}
                    onChange={(event) =>
                      setWorldSettings({ ...worldSettings, era: event.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="worldThemes">Themes</label>
                  <input
                    id="worldThemes"
                    value={worldSettings.themes}
                    onChange={(event) =>
                      setWorldSettings({ ...worldSettings, themes: event.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="worldNotes">Style notes</label>
                  <input
                    id="worldNotes"
                    value={worldSettings.styleNotes}
                    onChange={(event) =>
                      setWorldSettings({
                        ...worldSettings,
                        styleNotes: event.target.value
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "raw" ? "active" : ""}`}
              onClick={() => setActiveTab("raw")}
            >
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
              <textarea value={rawPrompt} readOnly placeholder="Your prompt appears here." />
            </div>
          )}

          {activeTab === "shots" && (
            <div className="shots">
              {shots.map((shot) => (
                <div className="shot-card" key={`${shot.shot}-${shot.time}`}>
                  <div className="pill">
                    Shot {shot.shot} • {shot.time}
                  </div>
                  <div>{shot.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
