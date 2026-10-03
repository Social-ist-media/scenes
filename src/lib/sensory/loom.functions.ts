import { createServerFn } from "@tanstack/react-start";
import type { Channel, Emotion, LoomReply, Motif } from "./types";

const MOTIFS: Motif[] = ["orb", "arch", "river", "spire", "bloom", "veil", "star", "gate"];
const EMOTIONS: Emotion[] = ["ECSTATIC", "JOYFUL", "CREATIVE", "CALM", "FOCUSED", "ANXIOUS", "FATIGUED"];
const CHANNELS: Channel[] = ["visual", "sound", "touch", "narrative"];

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asLoom(input: unknown): LoomReply | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const suggestions = Array.isArray(record.suggestions) ? record.suggestions : [];
  const clean = suggestions.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const kind = MOTIFS.includes(row.kind as Motif) ? (row.kind as Motif) : null;
    const emotion = EMOTIONS.includes(row.emotion as Emotion) ? (row.emotion as Emotion) : "CALM";
    const channel = CHANNELS.includes(row.channel as Channel) ? (row.channel as Channel) : "visual";
    const label = clip(row.label, 80);
    if (!kind || !label) return [];
    return [{ kind, label, emotion, channel }];
  });
  const reading = clip(record.reading, 500);
  if (!reading) return null;
  return {
    archetype: clip(record.archetype, 32) || "Threshold",
    reading,
    suggestions: clean,
    line: clip(record.line, 220),
  };
}

export const consultLoom = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const labels = Array.isArray(record.labels) ? record.labels.map((item) => clip(item, 80)).filter(Boolean).slice(0, 16) : [];
    return {
      mode: record.mode === "chat" ? "chat" : "weave",
      title: clip(record.title, 80),
      intention: clip(record.intention, 400),
      phase: clip(record.phase, 32),
      ask: clip(record.ask, 400),
      labels,
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "The loom is offline in this room." };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are the loom inside Sensory, a studio where people build shared dreams as rooms of objects. Reply with JSON only, no markdown. Shape: {\"reading\":\"2 concrete sentences, sensory and specific, never say unlock, consciousness, quantum, or vibe\",\"archetype\":\"Threshold|Orchard|Voyage|Archive|Storm|Hearth\",\"suggestions\":[{\"kind\":\"orb|arch|river|spire|bloom|veil|star|gate\",\"label\":\"a short physical phrase\",\"emotion\":\"CALM|FOCUSED|CREATIVE|JOYFUL|ECSTATIC|ANXIOUS|FATIGUED\",\"channel\":\"visual|sound|touch|narrative\"}],\"line\":\"one spoken sentence a collaborator might say\"}. For mode chat, suggestions must be []. For mode weave, exactly 3 suggestions. Do not repeat labels already in the room.",
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `The loom stumbled (${res.status}).` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = asLoom(JSON.parse(text));
      if (!parsed) return { ok: false as const, error: "The loom answered in a shape the room couldn't use." };
      if (data.mode === "chat") parsed.suggestions = [];
      return { ok: true as const, reply: parsed };
    } catch {
      return { ok: false as const, error: "The loom answered, but not in JSON." };
    }
  });

export const paintStill = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const labels = Array.isArray(record.labels) ? record.labels.map((item) => clip(item, 80)).filter(Boolean).slice(0, 12) : [];
    return {
      title: clip(record.title, 80),
      intention: clip(record.intention, 300),
      labels,
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Stills are offline in this room." };
    const motifLine = data.labels.length ? data.labels.join(", ") : "a nearly empty night floor";
    const prompt = `Cinematic still of a shared dream titled "${data.title || "Untitled room"}". Intention: ${data.intention || "a room with a job"}. Visible physical motifs: ${motifLine}. Painterly, tangible materials, night interior or landscape, no people in close-up, no text, no letters, no watermark, no logo.`;
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(40_000),
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        response_format: "b64_json",
      }),
    });
    if (!res.ok) return { ok: false as const, error: `The still failed (${res.status}).` };
    const body = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const first = body.data?.[0];
    if (first?.b64_json) return { ok: true as const, image: `data:image/png;base64,${first.b64_json}` };
    if (first?.url) return { ok: true as const, image: first.url };
    return { ok: false as const, error: "The still came back empty." };
  });
