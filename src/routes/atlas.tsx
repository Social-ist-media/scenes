import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/sensory/shell";
import { Button, fieldClass } from "@/components/sensory/ui";
import { uid } from "@/lib/sensory/engine";
import { useSensory } from "@/lib/sensory/store";
import type { DreamElement, Motif } from "@/lib/sensory/types";

export const Route = createFileRoute("/atlas")({ component: AtlasPage });

const TERRITORIES = [
  { name: "Threshold", x: "18%", y: "62%" },
  { name: "Orchard", x: "38%", y: "28%" },
  { name: "Voyage", x: "70%", y: "58%" },
  { name: "Archive", x: "58%", y: "22%" },
  { name: "Storm", x: "78%", y: "30%" },
  { name: "Hearth", x: "30%", y: "74%" },
];

function AtlasPage() {
  const dreams = useSensory((s) => s.dreams);
  const sessions = useSensory((s) => s.sessions);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [territory, setTerritory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dreams.filter((dream) => {
      const blob = `${dream.title} ${dream.excerpt} ${dream.intention} ${dream.author}`.toLowerCase();
      if (q && !blob.includes(q)) return false;
      if (territory && dream.archetype !== territory) return false;
      return true;
    });
  }, [dreams, query, territory]);

  const openDream = (dreamId: string, remix: boolean) => {
    const dream = dreams.find((item) => item.id === dreamId);
    if (!dream) return;
    if (!remix && dream.sessionId && sessions.some((session) => session.id === dream.sessionId)) {
      void navigate({ to: "/studio/$id", params: { id: dream.sessionId } });
      return;
    }
    const source = sessions.find((session) => session.id === dream.sessionId);
    const elements: DreamElement[] = (source?.elements ?? motifsAsElements(dream.motifs, dream.title)).map((element) => ({
      ...element,
      id: uid("el"),
      authorId: "you",
      at: Date.now(),
    }));
    const id = useSensory.getState().createSession({
      title: `${dream.title} remix`,
      intention: dream.intention,
      elements,
    });
    void navigate({ to: "/studio/$id", params: { id } });
  };

  return (
    <Shell>
      <div className="h-full overflow-y-auto">
        <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
          <header>
            <p className="text-sm tracking-widest text-tide uppercase">Atlas</p>
            <h1 className="mt-2 font-display text-5xl">Dreams that left the room.</h1>
            <p className="mt-3 max-w-2xl text-mist">
              Published work, seeded and yours. Open a room you already hold, or remix it into a new one. The map is a territory of patterns, not a place on earth.
            </p>
          </header>

          <div className="relative h-64 overflow-hidden rounded-2xl border border-parchment/10 bg-parchment/5">
            <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path d="M20 140 C 80 40, 160 150, 230 70 S 340 40, 380 120" fill="none" stroke="currentColor" className="text-parchment/20" strokeWidth="1" />
              <path d="M40 40 C 120 100, 200 20, 360 90" fill="none" stroke="currentColor" className="text-tide/30" strokeWidth="1" />
            </svg>
            {TERRITORIES.map((spot) => (
              <button
                key={spot.name}
                type="button"
                onClick={() => setTerritory((current) => (current === spot.name ? null : spot.name))}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-parchment/20 bg-ink/80 px-3 py-2 text-sm"
                style={{ left: spot.x, top: spot.y }}
              >
                <span className={territory === spot.name ? "text-copper" : "text-parchment"}>{spot.name}</span>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, author, sentence"
            className={fieldClass}
            aria-label="Search dreams"
          />

          <ul className="grid gap-3 md:grid-cols-2">
            {filtered.map((dream) => (
              <li key={dream.id} className="flex flex-col rounded-2xl border border-parchment/10 p-4">
                <p className="text-xs text-tide">
                  {dream.archetype} · {dream.author}
                </p>
                <h2 className="mt-1 font-display text-2xl">{dream.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{dream.excerpt}</p>
                <p className="mt-3 text-xs text-mist">
                  Resonance {dream.score} · {dream.resonators} resonators
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => openDream(dream.id, false)}>
                    {dream.sessionId && sessions.some((session) => session.id === dream.sessionId) ? "Open room" : "Remix"}
                  </Button>
                  <Button tone="ghost" onClick={() => openDream(dream.id, true)}>
                    Remix a copy
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length === 0 ? <p className="text-mist">Nothing in that territory yet.</p> : null}
        </main>
      </div>
    </Shell>
  );
}

function motifsAsElements(motifs: Motif[], title: string): DreamElement[] {
  return motifs.map((kind, index) => ({
    id: `seed-${index}`,
    kind,
    label: `${title} · ${kind}`,
    x: Math.cos(index) * 2,
    y: 0,
    z: Math.sin(index) * 2,
    scale: 1,
    emotion: "CALM",
    authorId: "you",
    channel: "visual",
    at: 0,
  }));
}

