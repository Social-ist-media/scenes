import type {
  Channel,
  DreamElement,
  Dreamscape,
  Emotion,
  LoomReply,
  Motif,
  Phase,
  SensoryLayer,
  Session,
  Suggestion,
} from "./types";

export const EMOTIONS: Emotion[] = [
  "CALM",
  "FOCUSED",
  "CREATIVE",
  "JOYFUL",
  "ECSTATIC",
  "ANXIOUS",
  "FATIGUED",
];

export const DREAMSCAPES: Dreamscape[] = [
  "Lucid",
  "Visual",
  "Kinesthetic",
  "Auditory",
  "Multisensory",
];

export const PHASES: { id: Phase; label: string; hint: string }[] = [
  { id: "INTENTION", label: "Intention", hint: "Name what the room is for before you decorate it." },
  { id: "BRAINSTORM", label: "Brainstorm", hint: "Set motifs down without defending them." },
  { id: "STRUCTURE", label: "Structure", hint: "Decide what is gate, what is path, what is weather." },
  { id: "SENSES", label: "Senses", hint: "Turn layers up. Sound, touch, and story count as much as shape." },
  { id: "PROJECTION", label: "Projection", hint: "Look at the field as a place, not a diagram." },
  { id: "TEMPORAL", label: "Temporal", hint: "Keep a layer. The earlier room is still a room." },
  { id: "INTEGRATION", label: "Integration", hint: "Cut what repeats. Keep what changes the air." },
  { id: "SEAL", label: "Seal", hint: "Close the dream and decide whether it enters the atlas." },
];

export const MOTIFS: { id: Motif; label: string; channel: Channel; hint: string }[] = [
  { id: "orb", label: "Orb", channel: "visual", hint: "A held light." },
  { id: "arch", label: "Arch", channel: "narrative", hint: "A way through." },
  { id: "river", label: "River", channel: "sound", hint: "Something moving past." },
  { id: "spire", label: "Spire", channel: "touch", hint: "A vertical decision." },
  { id: "bloom", label: "Bloom", channel: "visual", hint: "A soft event." },
  { id: "veil", label: "Veil", channel: "touch", hint: "What you see through." },
  { id: "star", label: "Star", channel: "narrative", hint: "A fixed point." },
  { id: "gate", label: "Gate", channel: "narrative", hint: "The room's door." },
];

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function defaultLayers(): SensoryLayer[] {
  return [
    { id: "visual", channel: "visual", name: "Sight", intensity: 0.72, active: true, motif: "Warm metals, night ground" },
    { id: "sound", channel: "sound", name: "Sound", intensity: 0.4, active: true, motif: "Low fifth, no melody yet" },
    { id: "touch", channel: "touch", name: "Touch", intensity: 0.35, active: false, motif: "Cool air, one warm object" },
    { id: "narrative", channel: "narrative", name: "Story", intensity: 0.55, active: true, motif: "A room with a job" },
  ];
}

export function resonance(session: Session) {
  const people = session.participants.filter((p) => !p.muted);
  const unique = new Set(people.map((p) => p.emotion)).size;
  const coherence = people.length === 0 ? 0 : clamp(1 - (unique - 1) / 5, 0, 1);
  const focus = people.length === 0 ? 0 : people.reduce((s, p) => s + p.attention, 0) / people.length;
  const kinds = new Set(session.elements.map((e) => e.kind)).size;
  const layers = session.layers.filter((l) => l.active).length / 4;
  const weave = clamp(0.4 * layers + 0.35 * (kinds / 6) + 0.25 * Math.min(1, session.elements.length / 10), 0, 1);
  const authors = new Set(session.elements.map((e) => e.authorId));
  const recentCut = Date.now() - 1000 * 60 * 8;
  const recentAuthors = new Set(session.elements.filter((e) => e.at > recentCut).map((e) => e.authorId));
  const synchrony = clamp((authors.size >= 2 ? 0.4 : 0.12) + recentAuthors.size * 0.18, 0, 1);
  const score = coherence * 0.25 + focus * 0.25 + weave * 0.3 + synchrony * 0.2;
  return { coherence, focus, weave, synchrony, score };
}

const ARCH_KEYS: { name: string; keys: string[] }[] = [
  { name: "Threshold", keys: ["door", "gate", "between", "enter", "threshold", "hall"] },
  { name: "Orchard", keys: ["tree", "fruit", "orchard", "garden", "root", "pear", "leaf"] },
  { name: "Voyage", keys: ["river", "ferry", "sea", "boat", "salt", "cross", "water", "lantern"] },
  { name: "Archive", keys: ["letter", "book", "library", "page", "unread", "archive", "name"] },
  { name: "Storm", keys: ["rain", "static", "weather", "wind", "glass", "storm", "snow"] },
  { name: "Hearth", keys: ["kitchen", "warm", "table", "room", "night", "hearth", "cup"] },
];

export function archetypeOf(text: string) {
  const hay = text.toLowerCase();
  let best = { name: "Threshold", score: 0 };
  for (const book of ARCH_KEYS) {
    const score = book.keys.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
    if (score > best.score) best = { name: book.name, score };
  }
  return best.name;
}

const PACKS: Record<string, { reading: (intention: string) => string; line: string; suggestions: Suggestion[] }> = {
  Threshold: {
    reading: (intention) =>
      `The room is a doorway, not a destination. ${intention ? `It keeps returning to “${clip(intention, 80)}”.` : "Nothing has been named yet, so the door is doing all the talking."} Put a gate down before you add weather.`,
    line: "Leave the hinge visible. People trust a door they can see.",
    suggestions: [
      { kind: "gate", label: "The hinge we didn't oil", emotion: "FOCUSED", channel: "narrative" },
      { kind: "veil", label: "Curtain that answers", emotion: "CALM", channel: "touch" },
      { kind: "star", label: "Threshold nail", emotion: "FOCUSED", channel: "visual" },
    ],
  },
  Orchard: {
    reading: (intention) =>
      `This dream grows sideways, like a tree trained along a wall. ${intention ? `The intention — ${clip(intention, 80)} — wants fruit, not forest.` : "Give one tree a job."} Keep the ground readable.`,
    line: "One tree should remember a sentence. The rest can just be shade.",
    suggestions: [
      { kind: "spire", label: "Pear that kept a name", emotion: "CALM", channel: "touch" },
      { kind: "bloom", label: "Blossom out of season", emotion: "JOYFUL", channel: "visual" },
      { kind: "river", label: "Ditch between rows", emotion: "CREATIVE", channel: "sound" },
    ],
  },
  Voyage: {
    reading: (intention) =>
      `Something here is crossing. ${intention ? `“${clip(intention, 80)}” is the fare, not the boat.` : "Name who is being carried."} Lanterns work better than horizons.`,
    line: "Don't show the far bank yet. The fare is the scene.",
    suggestions: [
      { kind: "river", label: "Black water with a job", emotion: "CALM", channel: "sound" },
      { kind: "orb", label: "Lantern that is a name", emotion: "JOYFUL", channel: "visual" },
      { kind: "arch", label: "Gangplank", emotion: "FOCUSED", channel: "narrative" },
    ],
  },
  Archive: {
    reading: (intention) =>
      `The dream wants to be reread. ${intention ? `It files “${clip(intention, 80)}” under something unsent.` : "Add one object that is a letter."} Stacks should rearrange when the truth shows up.`,
    line: "If a stack is too neat, it is lying.",
    suggestions: [
      { kind: "gate", label: "Stack that moved", emotion: "ANXIOUS", channel: "narrative" },
      { kind: "veil", label: "Dust in a shaft", emotion: "CALM", channel: "visual" },
      { kind: "star", label: "Margin mark", emotion: "FOCUSED", channel: "touch" },
    ],
  },
  Storm: {
    reading: (intention) =>
      `Weather is the protagonist. ${intention ? `“${clip(intention, 80)}” is what the rain is trying to say.` : "Decide if the rain falls up."} Keep one dry object so the storm has a scale.`,
    line: "Put one dry cup in the shot or the storm is just noise.",
    suggestions: [
      { kind: "veil", label: "Rain that falls upward", emotion: "CREATIVE", channel: "visual" },
      { kind: "orb", label: "Dry cup", emotion: "CALM", channel: "touch" },
      { kind: "star", label: "Static between stations", emotion: "ANXIOUS", channel: "sound" },
    ],
  },
  Hearth: {
    reading: (intention) =>
      `This is a room that only exists at a certain hour. ${intention ? `The hour is hiding inside “${clip(intention, 80)}”.` : "Name the hour."} Warmth should come from one source.`,
    line: "Three a.m. kitchens do not need extra guests. They need a working lamp.",
    suggestions: [
      { kind: "orb", label: "Lamp with a short cord", emotion: "JOYFUL", channel: "visual" },
      { kind: "arch", label: "Door to the second kitchen", emotion: "CALM", channel: "narrative" },
      { kind: "bloom", label: "Steam over the sink", emotion: "CREATIVE", channel: "touch" },
    ],
  },
};

function clip(text: string, n: number) {
  const t = text.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export function localLoom(input: {
  mode: "weave" | "chat";
  intention: string;
  title: string;
  labels: string[];
  ask: string;
}): LoomReply {
  const name = archetypeOf(`${input.intention} ${input.title} ${input.labels.join(" ")} ${input.ask}`);
  const pack = PACKS[name] ?? PACKS.Threshold;
  if (input.mode === "chat") {
    const ask = input.ask.trim();
    return {
      archetype: name,
      reading: ask
        ? `Heard: ${clip(ask, 120)} The room's pattern is still ${name}.`
        : pack.reading(input.intention),
      suggestions: [],
      line: ask ? `I'd keep “${clip(ask, 70)}” and cut the second version of it.` : pack.line,
    };
  }
  return {
    archetype: name,
    reading: pack.reading(input.intention || input.title),
    suggestions: pack.suggestions,
    line: "",
  };
}

const LINES: Record<Phase, string[]> = {
  INTENTION: [
    "Say it plainer. The room will get fancy on its own.",
    "If we can't tell a stranger the job of this dream, it isn't a room yet.",
  ],
  BRAINSTORM: [
    "Put the ugly one down too. We can bury it later.",
    "I'm dropping something off-center on purpose.",
  ],
  STRUCTURE: [
    "That arch is doing the work of three objects. Let it.",
    "We have weather and no path. I want a path.",
  ],
  SENSES: [
    "Turn the sound down until the story can sit on it.",
    "Touch is still a rumor. Give us one temperature.",
  ],
  PROJECTION: [
    "From here it reads as a place. Don't add a caption.",
    "The empty ground is part of the shot.",
  ],
  TEMPORAL: [
    "Keep the earlier version. We were ruder then, and ruder was better.",
    "Snapshot before we get polite.",
  ],
  INTEGRATION: [
    "Two lights are arguing. One of them has to leave.",
    "I can hear the intention again. That's the test.",
  ],
  SEAL: [
    "Seal it before we explain it to death.",
    "If we publish, publish the strange sentence, not the summary.",
  ],
};

export function companionBeat(session: Session): {
  authorId: string;
  author: string;
  text: string;
  element?: Omit<DreamElement, "id" | "at">;
  attention: number;
} | null {
  const mates = session.participants.filter((p) => !p.isYou && !p.muted);
  if (mates.length === 0) return null;
  const mate = mates[Math.floor(Math.random() * mates.length)]!;
  const pool = LINES[session.phase];
  const text = pool[Math.floor(Math.random() * pool.length)]!;
  const place = session.elements.length < 32 && Math.random() < 0.5;
  const motif = MOTIFS[Math.floor(Math.random() * MOTIFS.length)]!;
  const angle = Math.random() * Math.PI * 2;
  const radius = 1.4 + Math.random() * 3.2;
  const element = place
    ? {
        kind: motif.id,
        label: motif.hint.replace(/\.$/, ""),
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
        scale: 0.85 + Math.random() * 0.35,
        emotion: mate.emotion,
        authorId: mate.id,
        channel: motif.channel,
      }
    : undefined;
  return {
    authorId: mate.id,
    author: mate.name,
    text,
    element,
    attention: clamp(mate.attention + (Math.random() - 0.45) * 0.08, 0.3, 0.95),
  };
}

export function ringSlot(index: number, count: number) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2 + 0.5;
  const radius = 2.4;
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, y: 0 };
}

export function sessionMarkdown(session: Session) {
  const metrics = resonance(session);
  const lines = [
    `# ${session.title}`,
    ``,
    session.intention ? `> ${session.intention}` : `> No intention set.`,
    ``,
    `${session.dreamscape} · ${session.phase} · ${session.status}`,
    `Resonance ${Math.round(metrics.score * 100)}`,
    ``,
    `## Field`,
    ...session.elements.map(
      (e) => `- ${e.kind}: ${e.label} (${e.emotion.toLowerCase()}, ${e.channel})`,
    ),
    ``,
    `## Layers`,
    ...session.layers.map(
      (l) => `- ${l.name}${l.active ? "" : " (off)"} · ${Math.round(l.intensity * 100)} · ${l.motif}`,
    ),
    ``,
    `## Room`,
    ...session.chat.map((c) => `- **${c.author}:** ${c.text}`),
    ``,
    session.notes ? `## Notes\n\n${session.notes}\n` : "",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

export function downloadText(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
