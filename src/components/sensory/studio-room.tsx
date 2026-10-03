import { useEffect, useMemo, useRef, useState } from "react";
import { SoundBed } from "@/lib/sensory/audio";
import {
  DREAMSCAPES,
  EMOTIONS,
  MOTIFS,
  PHASES,
  archetypeOf,
  downloadText,
  resonance,
  sessionMarkdown,
} from "@/lib/sensory/engine";
import { consultLoom, paintStill } from "@/lib/sensory/loom.functions";
import { useSensory } from "@/lib/sensory/store";
import type { Emotion, Motif, Suggestion } from "@/lib/sensory/types";
import { DreamStage } from "./stage";
import { Button, Field, Meter, cn, fieldClass } from "./ui";

const WEAVE_COST = 6;
const STILL_COST = 40;

export function StudioRoom({ sessionId }: { sessionId: string }) {
  const session = useSensory((s) => s.sessions.find((item) => item.id === sessionId));
  const equipped = useSensory((s) => s.equipped);
  const balance = useSensory((s) => s.wallet.balance);
  const youName = useSensory((s) => s.youName);
  const [tool, setTool] = useState<Motif>("orb");
  const [tab, setTab] = useState<"loom" | "room" | "time" | "people">("loom");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [ask, setAsk] = useState("");
  const [reading, setReading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState<"weave" | "chat" | "still" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [still, setStill] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [draftIntention, setDraftIntention] = useState("");
  const bed = useRef(new SoundBed());
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = chatRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [session?.chat.length, tab]);

  useEffect(() => {
    if (!session || session.status !== "live") return;
    const timer = window.setInterval(() => useSensory.getState().tickCompanion(sessionId), 14000);
    return () => window.clearInterval(timer);
  }, [session?.status, sessionId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < MOTIFS.length) {
        setTool(MOTIFS[index]!.id);
        return;
      }
      if ((event.key === "Backspace" || event.key === "Delete") && selectedId) {
        event.preventDefault();
        useSensory.getState().removeElement(sessionId, selectedId);
        setSelectedId(null);
      }
      if (event.key.toLowerCase() === "s") {
        useSensory.getState().snapshot(sessionId);
        useSensory.getState().setNotice("Temporal layer kept.");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, sessionId]);

  const sound = session?.layers.find((layer) => layer.channel === "sound");
  useEffect(() => {
    if (!soundOn) return;
    bed.current.set(sound?.active ? sound.intensity : 0, equipped.includes("pulse-bed"));
  }, [soundOn, sound?.active, sound?.intensity, equipped]);

  useEffect(() => {
    const audio = bed.current;
    return () => audio.stop();
  }, []);

  const metrics = useMemo(() => (session ? resonance(session) : null), [session]);
  if (!session || !metrics) {
    return <p className="p-8 text-mist">This room has been cleared.</p>;
  }

  const locked = session.status === "sealed";
  const preview = session.snapshots.find((snap) => snap.id === previewId);
  const shown = preview ? preview.elements : session.elements;
  const selected = session.elements.find((element) => element.id === selectedId) ?? null;
  const you = session.participants.find((p) => p.isYou);
  const archetype = archetypeOf(
    `${session.intention} ${session.title} ${session.elements.map((e) => e.label).join(" ")} ${ask}`,
  );

  const runLoom = async (mode: "weave" | "chat") => {
    if (busy) return;
    if (mode === "weave" && balance < WEAVE_COST) {
      setError("Need 6 lumen for a Grok reading. The studio reading is free.");
      return;
    }
    setBusy(mode);
    setError(null);
    const payload = {
      mode,
      title: session.title,
      intention: session.intention,
      phase: session.phase,
      ask,
      labels: session.elements.map((element) => element.label),
    };
    try {
      const result = await consultLoom({ data: payload });
      if (!result.ok) {
        const local = await import("@/lib/sensory/engine").then((mod) =>
          mod.localLoom({
            mode,
            title: session.title,
            intention: session.intention,
            ask,
            labels: session.elements.map((element) => element.label),
          }),
        );
        setReading(local.reading);
        setSuggestions(mode === "weave" ? local.suggestions : []);
        if (mode === "chat" && local.line) useSensory.getState().addChat(sessionId, "loom", "Loom", local.line);
        setError(`${result.error} Used the studio reading instead — no charge.`);
        return;
      }
      setReading(result.reply.reading);
      setSuggestions(result.reply.suggestions);
      if (result.reply.line) useSensory.getState().addChat(sessionId, "loom", "Loom", result.reply.line);
      useSensory.getState().charge(WEAVE_COST, mode === "chat" ? "Grok in the room" : "Grok weave");
    } catch {
      setError("The loom could not be reached.");
    } finally {
      setBusy(null);
    }
  };

  const runLocal = () => {
    void import("@/lib/sensory/engine").then((mod) => {
      const local = mod.localLoom({
        mode: "weave",
        title: session.title,
        intention: session.intention,
        ask,
        labels: session.elements.map((element) => element.label),
      });
      setReading(local.reading);
      setSuggestions(local.suggestions);
      setError(null);
    });
  };

  const runStill = async () => {
    if (busy || balance < STILL_COST) return;
    setBusy("still");
    setError(null);
    try {
      const result = await paintStill({
        data: {
          title: session.title,
          intention: session.intention,
          labels: session.elements.map((element) => element.label),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStill(result.image);
      useSensory.getState().charge(STILL_COST, "Dream still");
      useSensory.getState().setNotice("Still painted.");
    } catch {
      setError("The still could not be painted.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:grid-rows-1">
      <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto border-parchment/10 p-4 lg:flex lg:border-r">
        <RoomFacts sessionId={sessionId} />
        <MotifBar tool={tool} onTool={setTool} />
        <Layers sessionId={sessionId} />
      </aside>

      <div className="relative min-h-0 flex-1 lg:min-h-0">
        <DreamStage
          elements={shown}
          equipped={equipped}
          selectedId={preview ? null : selectedId}
          locked={locked || Boolean(preview)}
          onPlace={(point) => {
            if (locked || preview) return;
            const motif = MOTIFS.find((item) => item.id === tool);
            useSensory.getState().addElement(sessionId, {
              kind: tool,
              x: point.x,
              z: point.z,
              label: motif?.hint.replace(/\.$/, "") ?? tool,
              channel: motif?.channel,
            });
          }}
          onSelect={setSelectedId}
          onHover={setHover}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-auto max-w-[70%] rounded-2xl border border-parchment/10 bg-ink/80 px-3 py-2 backdrop-blur-sm">
            <p className="font-display text-lg leading-tight">{session.title}</p>
            <p className="text-xs text-mist">
              {session.dreamscape} · {PHASES.find((phase) => phase.id === session.phase)?.label} · {archetype}
            </p>
          </div>
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <Button
              tone={session.status === "live" ? "tide" : "ghost"}
              className="min-h-9 px-3"
              disabled={locked}
              onClick={() =>
                useSensory.getState().setStatus(sessionId, session.status === "live" ? "paused" : "live")
              }
            >
              {session.status === "live" ? "Companions live" : session.status === "paused" ? "Paused" : session.status}
            </Button>
            <Button
              tone={soundOn ? "copper" : "ghost"}
              className="min-h-9 px-3"
              onClick={() => {
                if (soundOn) {
                  bed.current.stop();
                  setSoundOn(false);
                } else {
                  bed.current.start();
                  setSoundOn(true);
                }
              }}
            >
              {soundOn ? "Sound on" : "Sound bed"}
            </Button>
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-16 text-center text-xs text-mist lg:bottom-3">
          {hover ? hover : preview ? "Viewing an earlier layer" : "Click the floor to place. Drag to look. Keys 1–8, S to keep a layer."}
        </p>
        {preview ? (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl border border-parchment/15 bg-ink/90 p-3">
            <p className="text-sm">Viewing {preview.label}</p>
            <div className="flex gap-2">
              <Button tone="ghost" className="min-h-9" onClick={() => setPreviewId(null)}>
                Return
              </Button>
              <Button
                className="min-h-9"
                disabled={locked}
                onClick={() => {
                  useSensory.getState().restoreSnapshot(sessionId, preview.id);
                  setPreviewId(null);
                }}
              >
                Restore
              </Button>
            </div>
          </div>
        ) : null}
        {session.status === "waiting" ? (
          <form
            className="absolute inset-3 flex items-end sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(100%,28rem)] sm:-translate-x-1/2 sm:-translate-y-1/2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draftIntention.trim();
              if (!text) return;
              useSensory.getState().setIntention(sessionId, text);
            }}
          >
            <div className="w-full rounded-2xl border border-parchment/15 bg-ink/95 p-4">
              <Field label="Intention">
                <textarea
                  value={draftIntention}
                  onChange={(event) => setDraftIntention(event.target.value)}
                  rows={3}
                  className={fieldClass}
                  placeholder="What is this room for?"
                />
              </Field>
              <Button className="mt-3" type="submit">
                Open the room
              </Button>
            </div>
          </form>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex gap-1 overflow-x-auto border-t border-parchment/10 bg-ink/90 p-2 lg:hidden">
          {MOTIFS.map((motif) => (
            <button
              key={motif.id}
              type="button"
              onClick={() => setTool(motif.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm",
                tool === motif.id ? "bg-copper text-ink" : "bg-parchment/10 text-parchment",
              )}
            >
              {motif.label}
            </button>
          ))}
        </div>
      </div>

      <aside className="flex h-[46%] min-h-0 shrink-0 flex-col border-t border-parchment/10 lg:h-auto lg:max-h-none lg:border-t-0 lg:border-l">
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-parchment/10 p-2" role="tablist">
          {(
            [
              ["loom", "Loom"],
              ["room", "Room"],
              ["time", "Time"],
              ["people", "People"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-3 py-2 text-sm",
                tab === id ? "bg-parchment/10 text-parchment" : "text-mist",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "loom" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Meter label="Coherence" value={metrics.coherence} />
                <Meter label="Focus" value={metrics.focus} tone="tide" />
                <Meter label="Weave" value={metrics.weave} />
                <Meter label="Synchrony" value={metrics.synchrony} tone="tide" />
              </div>
              <p className="text-sm text-mist">
                Resonance {Math.round(metrics.score * 100)}. Pattern {archetype}. Grok is a paid reading; the studio loom is local and free.
              </p>
              <Field label="Ask the room">
                <textarea value={ask} onChange={(event) => setAsk(event.target.value)} rows={2} className={fieldClass} placeholder="What should change?" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button onClick={runLocal}>Studio reading</Button>
                <Button tone="tide" disabled={busy !== null || balance < WEAVE_COST} onClick={() => void runLoom("weave")}>
                  {busy === "weave" ? "Listening…" : `Grok weave · ${WEAVE_COST}`}
                </Button>
                <Button tone="ghost" disabled={busy !== null || balance < WEAVE_COST} onClick={() => void runLoom("chat")}>
                  {busy === "chat" ? "Listening…" : "Ask Grok"}
                </Button>
              </div>
              {error ? <p className="text-sm text-copper">{error}</p> : null}
              {reading ? <p className="text-sm leading-relaxed">{reading}</p> : null}
              {suggestions.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <li key={`${suggestion.kind}-${suggestion.label}`} className="rounded-xl border border-parchment/10 p-3">
                      <p className="text-sm">
                        <span className="text-mist">{suggestion.kind}</span> · {suggestion.label}
                      </p>
                      <Button
                        tone="ghost"
                        className="mt-2 min-h-9"
                        disabled={locked}
                        onClick={() => useSensory.getState().applySuggestions(sessionId, [suggestion])}
                      >
                        Place it
                      </Button>
                    </li>
                  ))}
                  <Button disabled={locked} onClick={() => useSensory.getState().applySuggestions(sessionId, suggestions)}>
                    Place all
                  </Button>
                </ul>
              ) : null}
              <Button tone="ghost" disabled={busy !== null || balance < STILL_COST} onClick={() => void runStill()}>
                {busy === "still" ? "Painting…" : `Paint a still · ${STILL_COST}`}
              </Button>
              {still ? <img src={still} alt={`Still of ${session.title}`} className="w-full rounded-xl" /> : null}
              {selected ? (
                <div className="rounded-xl border border-parchment/10 p-3">
                  <Field label="Selected motif">
                    <input
                      value={selected.label}
                      onChange={(event) =>
                        useSensory.getState().updateElement(sessionId, selected.id, { label: event.target.value })
                      }
                      className={fieldClass}
                      disabled={locked}
                    />
                  </Field>
                  <label className="mt-2 block text-xs text-mist">
                    Emotion
                    <select
                      value={selected.emotion}
                      disabled={locked}
                      onChange={(event) =>
                        useSensory.getState().updateElement(sessionId, selected.id, {
                          emotion: event.target.value as Emotion,
                        })
                      }
                      className={`${fieldClass} mt-1`}
                    >
                      {EMOTIONS.map((emotion) => (
                        <option key={emotion}>{emotion}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    tone="ghost"
                    className="mt-2"
                    disabled={locked}
                    onClick={() => {
                      useSensory.getState().removeElement(sessionId, selected.id);
                      setSelectedId(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "room" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-mist">{PHASES.find((phase) => phase.id === session.phase)?.hint}</p>
              <div className="flex flex-wrap gap-1">
                {PHASES.map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    disabled={locked}
                    onClick={() => useSensory.getState().setPhase(sessionId, phase.id)}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs",
                      session.phase === phase.id ? "bg-copper text-ink" : "bg-parchment/10 text-parchment",
                    )}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
              <div ref={chatRef} className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {session.chat.length === 0 ? <p className="text-sm text-mist">The room is quiet.</p> : null}
                {session.chat.map((line) => (
                  <p key={line.id} className="text-sm leading-relaxed">
                    <span className={line.authorId === "you" ? "text-copper" : "text-tide"}>{line.author}</span>
                    <span className="text-mist"> · </span>
                    {line.text}
                  </p>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  const text = String(data.get("line") ?? "");
                  useSensory.getState().addChat(sessionId, "you", youName, text);
                  form.reset();
                }}
              >
                <input name="line" className={fieldClass} placeholder={`Speak as ${youName}`} maxLength={400} />
                <Button type="submit">Send</Button>
              </form>
              <div className="lg:hidden">
                <RoomFacts sessionId={sessionId} />
                <div className="mt-4">
                  <Layers sessionId={sessionId} />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "time" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-mist">Keep a layer before the room gets polite. Twelve layers, no more.</p>
              <Button
                disabled={locked || session.snapshots.length >= 12}
                onClick={() => useSensory.getState().snapshot(sessionId)}
              >
                Keep this layer
              </Button>
              <ul className="flex flex-col gap-2">
                {session.snapshots.length === 0 ? <li className="text-sm text-mist">No earlier room yet.</li> : null}
                {session.snapshots.map((snap) => (
                  <li key={snap.id} className="rounded-xl border border-parchment/10 p-3">
                    <p className="text-sm">{snap.label}</p>
                    <p className="text-xs text-mist">
                      {snap.note} · {snap.elements.length} motifs
                    </p>
                    <Button tone="ghost" className="mt-2 min-h-9" onClick={() => setPreviewId(snap.id)}>
                      View
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                tone="ghost"
                onClick={() => downloadText(`${session.title.replace(/\s+/g, "-").toLowerCase()}.md`, sessionMarkdown(session))}
              >
                Export journal
              </Button>
            </div>
          ) : null}

          {tab === "people" ? (
            <div className="flex flex-col gap-3">
              {you ? (
                <div className="rounded-xl border border-parchment/10 p-3">
                  <p className="text-sm">{you.name} · your presence</p>
                  <label className="mt-2 block text-xs text-mist">
                    Emotion
                    <select
                      value={you.emotion}
                      onChange={(event) =>
                        useSensory.getState().setPresence(sessionId, event.target.value as Emotion, you.attention)
                      }
                      className={`${fieldClass} mt-1`}
                    >
                      {EMOTIONS.map((emotion) => (
                        <option key={emotion}>{emotion}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-2 block text-xs text-mist">
                    Attention {Math.round(you.attention * 100)}
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.01}
                      value={you.attention}
                      onChange={(event) =>
                        useSensory.getState().setPresence(sessionId, you.emotion, Number(event.target.value))
                      }
                    />
                  </label>
                </div>
              ) : null}
              <ul className="flex flex-col gap-2">
                {session.participants.map((person) => (
                  <li key={person.id} className="rounded-xl border border-parchment/10 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm">
                          {person.name}
                          {person.muted ? " · muted" : ""}
                        </p>
                        <p className="text-xs text-mist">
                          {person.role} · {person.emotion.toLowerCase()} · {person.focus}
                        </p>
                      </div>
                      {person.isYou ? null : (
                        <Button
                          tone="ghost"
                          className="min-h-9 px-3"
                          onClick={() => useSensory.getState().muteParticipant(sessionId, person.id)}
                        >
                          {person.muted ? "Unmute" : "Mute"}
                        </Button>
                      )}
                    </div>
                    {!person.isYou ? (
                      <Button
                        tone="ghost"
                        className="mt-2 min-h-9"
                        disabled={locked}
                        onClick={() => useSensory.getState().clearAuthor(sessionId, person.id)}
                      >
                        Clear their marks
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button tone="ghost" disabled={locked} onClick={() => useSensory.getState().seal(sessionId)}>
                  Seal dream
                </Button>
                <Button tone="tide" disabled={session.published} onClick={() => useSensory.getState().publish(sessionId)}>
                  {session.published ? "In the atlas" : "Publish"}
                </Button>
                {locked ? (
                  <Button tone="ghost" onClick={() => useSensory.getState().setStatus(sessionId, "live")}>
                    Reopen
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-mist">
                Lumen are studio credits, not money. Companions are presences in the room, not other accounts. Sealing pays a host share from resonance.
              </p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function RoomFacts({ sessionId }: { sessionId: string }) {
  const session = useSensory((s) => s.sessions.find((item) => item.id === sessionId));
  if (!session) return null;
  const locked = session.status === "sealed";
  return (
    <div className="flex flex-col gap-3">
      <Field label="Title">
        <input
          value={session.title}
          disabled={locked}
          onChange={(event) => useSensory.getState().setTitle(sessionId, event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="Intention">
        <textarea
          value={session.intention}
          disabled={locked}
          rows={3}
          onChange={(event) => useSensory.getState().setIntention(sessionId, event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="Dreamscape">
        <select
          value={session.dreamscape}
          disabled={locked}
          onChange={(event) =>
            useSensory.getState().setDreamscape(sessionId, event.target.value as (typeof DREAMSCAPES)[number])
          }
          className={fieldClass}
        >
          {DREAMSCAPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function MotifBar({ tool, onTool }: { tool: Motif; onTool: (motif: Motif) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wide text-mist uppercase">Motifs</p>
      <div className="grid grid-cols-2 gap-1">
        {MOTIFS.map((motif, index) => (
          <button
            key={motif.id}
            type="button"
            onClick={() => onTool(motif.id)}
            className={cn(
              "rounded-xl px-2 py-2 text-left text-sm",
              tool === motif.id ? "bg-copper text-ink" : "bg-parchment/5 text-parchment hover:bg-parchment/10",
            )}
          >
            <span className="text-mist">{index + 1}</span> {motif.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Layers({ sessionId }: { sessionId: string }) {
  const layers = useSensory((s) => s.sessions.find((item) => item.id === sessionId)?.layers ?? []);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs tracking-wide text-mist uppercase">Sensory layers</p>
      {layers.map((layer) => (
        <div key={layer.id}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">{layer.name}</span>
            <button
              type="button"
              onClick={() => useSensory.getState().setLayer(sessionId, layer.id, { active: !layer.active })}
              className={cn("rounded-full px-3 py-1 text-xs", layer.active ? "bg-tide text-ink" : "bg-parchment/10 text-mist")}
            >
              {layer.active ? "On" : "Off"}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.intensity}
            aria-label={`${layer.name} intensity`}
            onChange={(event) =>
              useSensory.getState().setLayer(sessionId, layer.id, { intensity: Number(event.target.value) })
            }
          />
          <input
            value={layer.motif}
            aria-label={`${layer.name} note`}
            onChange={(event) => useSensory.getState().setLayer(sessionId, layer.id, { motif: event.target.value })}
            className={`${fieldClass} mt-1`}
          />
        </div>
      ))}
    </div>
  );
}
