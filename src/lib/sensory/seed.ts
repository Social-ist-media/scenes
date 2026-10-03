import { defaultLayers } from "./engine";
import type {
  ChatLine,
  DreamElement,
  MarketItem,
  Participant,
  PublishedDream,
  Session,
  Tx,
} from "./types";

const T = 1_759_200_000_000;

const PEOPLE: Participant[] = [
  {
    id: "you",
    name: "Salvatore",
    role: "Dream Weaver",
    emotion: "FOCUSED",
    attention: 0.74,
    flow: 0.62,
    focus: "The sentence the room is for",
    muted: false,
    isYou: true,
  },
  {
    id: "ione",
    name: "Ione Voss",
    role: "Sensory Artist",
    emotion: "CREATIVE",
    attention: 0.81,
    flow: 0.77,
    focus: "Temperature and light",
    muted: false,
    isYou: false,
  },
  {
    id: "marek",
    name: "Marek Ell",
    role: "Architect",
    emotion: "FOCUSED",
    attention: 0.7,
    flow: 0.48,
    focus: "What holds the ground",
    muted: false,
    isYou: false,
  },
  {
    id: "nia",
    name: "Nia Sol",
    role: "Narrator",
    emotion: "CALM",
    attention: 0.66,
    flow: 0.71,
    focus: "The line we will keep",
    muted: false,
    isYou: false,
  },
];

function people(): Participant[] {
  return PEOPLE.map((p) => ({ ...p }));
}

function el(
  id: string,
  kind: DreamElement["kind"],
  label: string,
  x: number,
  z: number,
  emotion: DreamElement["emotion"],
  authorId: string,
  channel: DreamElement["channel"],
): DreamElement {
  return {
    id,
    kind,
    label,
    x,
    y: 0,
    z,
    scale: 1,
    emotion,
    authorId,
    channel,
    at: T,
  };
}

export const ORCHARD_ELEMENTS: DreamElement[] = [
  el("o1", "spire", "Unfinished pear", -2.1, 1.1, "CALM", "ione", "touch"),
  el("o2", "bloom", "A conversation you left", 1.3, -0.5, "CREATIVE", "you", "visual"),
  el("o3", "arch", "Gate in the hedge", -0.3, -2.3, "FOCUSED", "marek", "narrative"),
  el("o4", "orb", "Warm coin of light", 2.5, 1.5, "JOYFUL", "nia", "visual"),
  el("o5", "river", "Ditch that remembers", 0.5, 2.3, "CALM", "ione", "sound"),
  el("o6", "veil", "Dusk between rows", -3.1, -0.8, "CREATIVE", "nia", "touch"),
  el("o7", "star", "The sentence you meant", 3.1, -1.6, "FOCUSED", "you", "narrative"),
];

const FERRY_ELEMENTS: DreamElement[] = [
  el("f1", "river", "Black fare", 0.2, 0.4, "CALM", "marek", "sound"),
  el("f2", "orb", "Lantern for a borrowed name", -1.8, 1.2, "JOYFUL", "ione", "visual"),
  el("f3", "arch", "Gangplank", 1.6, -1.4, "FOCUSED", "you", "narrative"),
  el("f4", "veil", "Fog that knows the stop", -2.4, -1.6, "ANXIOUS", "nia", "touch"),
];

const LIBRARY_ELEMENTS: DreamElement[] = [
  el("l1", "gate", "Stack that moved when you told the truth", 0, -1.2, "ANXIOUS", "nia", "narrative"),
  el("l2", "veil", "Dust in a useful shaft", -2, 0.6, "CALM", "ione", "visual"),
  el("l3", "star", "Margin you didn't mean to keep", 2.1, 1.1, "FOCUSED", "you", "touch"),
  el("l4", "bloom", "Index card breathing", 1.2, -2.2, "CREATIVE", "marek", "visual"),
];

function chat(lines: [string, string, string][]): ChatLine[] {
  return lines.map(([id, authorId, text], i) => ({
    id,
    authorId,
    author: PEOPLE.find((p) => p.id === authorId)?.name ?? "Loom",
    text,
    at: T + i * 60_000,
  }));
}

function session(
  partial: Pick<Session, "id" | "title" | "intention" | "phase" | "dreamscape" | "elements" | "chat"> &
    Partial<Session>,
): Session {
  return {
    status: "live",
    layers: defaultLayers(),
    participants: people(),
    snapshots: [],
    phasesSeen: ["INTENTION", partial.phase],
    published: true,
    notes: "",
    createdAt: T,
    updatedAt: T,
    resonanceHistory: [
      { t: T, value: 0.42 },
      { t: T + 80_000, value: 0.55 },
      { t: T + 160_000, value: 0.63 },
    ],
    ...partial,
  };
}

export const SEED_SESSIONS: Session[] = [
  session({
    id: "orchard",
    title: "The Copper Orchard",
    intention: "A hillside where each tree keeps a conversation you did not finish.",
    phase: "SENSES",
    dreamscape: "Multisensory",
    elements: ORCHARD_ELEMENTS,
    chat: chat([
      ["c1", "nia", "The pear doesn't need a face. It needs the sentence it interrupted."],
      ["c2", "marek", "Hedge gate is load-bearing. Don't float another arch beside it."],
      ["c3", "ione", "Dusk is a temperature, not a color grade. I'm leaving the ditch audible."],
    ]),
    notes: "Keep one tree rude. The rest can be kind.",
  }),
  session({
    id: "ferry",
    title: "Night Ferry",
    intention: "Cross a black river on lanterns that are other people's names.",
    phase: "STRUCTURE",
    dreamscape: "Auditory",
    elements: FERRY_ELEMENTS,
    chat: chat([
      ["c4", "marek", "No horizon yet. The fare is the whole set."],
      ["c5", "you", "The lantern is not mine. That's why it stays lit."],
    ]),
  }),
  session({
    id: "library",
    title: "Library of Unsent Letters",
    intention: "Stacks that rearrange when someone tells the truth.",
    phase: "BRAINSTORM",
    dreamscape: "Visual",
    elements: LIBRARY_ELEMENTS,
    chat: chat([["c6", "nia", "If the stack is tidy, it is performing. Move one."]]),
  }),
];

export const SEED_DREAMS: PublishedDream[] = [
  {
    id: "d-orchard",
    sessionId: "orchard",
    title: "The Copper Orchard",
    intention: "A hillside where each tree keeps a conversation you did not finish.",
    archetype: "Orchard",
    excerpt: "One pear still holds the sentence. The ditch is louder than the sky.",
    author: "Salvatore",
    resonators: 186,
    score: 78,
    motifs: ["spire", "bloom", "arch", "river"],
    at: T,
  },
  {
    id: "d-ferry",
    sessionId: "ferry",
    title: "Night Ferry",
    intention: "Cross a black river on lanterns that are other people's names.",
    archetype: "Voyage",
    excerpt: "You pay with a name you do not get back. The far bank stays offstage.",
    author: "Salvatore",
    resonators: 240,
    score: 84,
    motifs: ["river", "orb", "arch"],
    at: T - 86_400_000,
  },
  {
    id: "d-library",
    sessionId: "library",
    title: "Library of Unsent Letters",
    intention: "Stacks that rearrange when someone tells the truth.",
    archetype: "Archive",
    excerpt: "Dust does the lighting. The index card is breathing, which is a problem.",
    author: "Nia Sol",
    resonators: 132,
    score: 71,
    motifs: ["gate", "veil", "star"],
    at: T - 172_800_000,
  },
  {
    id: "d-glass",
    title: "Glass Weather",
    intention: "Rain that falls upward over a city of conservatories.",
    archetype: "Storm",
    excerpt: "Everyone brought a dry cup, as if that could negotiate with the sky.",
    author: "Ione Voss",
    resonators: 310,
    score: 88,
    motifs: ["veil", "orb", "star"],
    at: T - 250_000_000,
  },
  {
    id: "d-kitchen",
    title: "The Second Kitchen",
    intention: "A room that only exists between three and four in the morning.",
    archetype: "Hearth",
    excerpt: "The lamp cord is too short, which is how you know the room is honest.",
    author: "Marek Ell",
    resonators: 97,
    score: 69,
    motifs: ["orb", "arch", "bloom"],
    at: T - 400_000_000,
  },
  {
    id: "d-salt",
    title: "Salt Cathedral",
    intention: "An underwater nave where the choir is breath and cutlery.",
    archetype: "Voyage",
    excerpt: "Pews of salt. A fork keeps time. Nobody agreed to sing.",
    author: "Ione Voss",
    resonators: 154,
    score: 76,
    motifs: ["spire", "river", "star"],
    at: T - 520_000_000,
  },
  {
    id: "d-map",
    title: "Map of the Unwalked",
    intention: "Streets drawn by people who already left.",
    archetype: "Threshold",
    excerpt: "The legend is in a handwriting you outgrew. The streets still accept it.",
    author: "Nia Sol",
    resonators: 208,
    score: 81,
    motifs: ["gate", "river", "veil"],
    at: T - 640_000_000,
  },
  {
    id: "d-static",
    title: "Warm Static",
    intention: "Television snow in which a childhood room sometimes resolves.",
    archetype: "Storm",
    excerpt: "Between stations, the wallpaper wins for half a second.",
    author: "Marek Ell",
    resonators: 121,
    score: 74,
    motifs: ["veil", "orb", "bloom"],
    at: T - 800_000_000,
  },
];

export const MARKET: MarketItem[] = [
  {
    id: "ink-rain",
    name: "Ink Rain",
    price: 36,
    blurb: "A slow fall of dark motes through the field. Good for storms and archives.",
    maker: "Ione Voss",
    sales: 420,
    kind: "effect",
  },
  {
    id: "amber-motes",
    name: "Amber Motes",
    price: 36,
    blurb: "Warm dust that rises. Hearths, orchards, lamps with short cords.",
    maker: "Ione Voss",
    sales: 388,
    kind: "effect",
  },
  {
    id: "cathedral-fog",
    name: "Cathedral Fog",
    price: 48,
    blurb: "Thicker air. The far motifs recede so the near ones can speak.",
    maker: "Marek Ell",
    sales: 265,
    kind: "effect",
  },
  {
    id: "lucid-gate",
    name: "Lucid Gate",
    price: 52,
    blurb: "Pushes the inner light of every motif. The room stops pretending to be shy.",
    maker: "Nia Sol",
    sales: 190,
    kind: "effect",
  },
  {
    id: "pulse-bed",
    name: "Pulse Bed",
    price: 28,
    blurb: "A slow throb in the key light, locked to the sound layer if you let it.",
    maker: "Ione Voss",
    sales: 501,
    kind: "effect",
  },
  {
    id: "tide-veil",
    name: "Tide Veil",
    price: 32,
    blurb: "Shifts the ground toward deep water. Ferries like this. Kitchens don't.",
    maker: "Marek Ell",
    sales: 144,
    kind: "effect",
  },
  {
    id: "star-salt",
    name: "Star Salt",
    price: 40,
    blurb: "A farther field of points, like salt thrown at the dark.",
    maker: "Nia Sol",
    sales: 233,
    kind: "effect",
  },
  {
    id: "hearth-glow",
    name: "Hearth Glow",
    price: 44,
    blurb: "Warms the key light until the field reads as an interior.",
    maker: "Marek Ell",
    sales: 276,
    kind: "effect",
  },
  {
    id: "tpl-threshold",
    name: "Threshold rite",
    price: 24,
    blurb: "Opens a spare room: one gate, one nail, a curtain. For beginnings.",
    maker: "Sensory",
    sales: 88,
    kind: "template",
  },
  {
    id: "tpl-storm",
    name: "Storm kitchen",
    price: 24,
    blurb: "A dry cup, upward rain, and a lamp. Weather with a scale.",
    maker: "Sensory",
    sales: 73,
    kind: "template",
  },
];

export const SEED_TX: Tx[] = [
  { id: "tx0", at: T, label: "Opening grant", amount: 160, kind: "grant" },
  { id: "tx1", at: T + 10_000, label: "Host share · Copper Orchard", amount: 22, kind: "earn" },
];

export function templateElements(id: string): { title: string; intention: string; elements: DreamElement[] } | null {
  if (id === "tpl-threshold") {
    return {
      title: "Threshold rite",
      intention: "A door with the hinge left visible.",
      elements: [
        el(uidish("g"), "gate", "Visible hinge", 0, -1.2, "FOCUSED", "you", "narrative"),
        el(uidish("v"), "veil", "Curtain that answers", -1.8, 0.4, "CALM", "you", "touch"),
        el(uidish("s"), "star", "Threshold nail", 1.6, 0.8, "FOCUSED", "you", "visual"),
      ],
    };
  }
  if (id === "tpl-storm") {
    return {
      title: "Storm kitchen",
      intention: "Rain that falls upward, and one dry cup to give it scale.",
      elements: [
        el(uidish("v"), "veil", "Rain that falls upward", -1.2, -1, "CREATIVE", "you", "visual"),
        el(uidish("o"), "orb", "Dry cup", 1.2, 0.4, "CALM", "you", "touch"),
        el(uidish("l"), "orb", "Lamp with a short cord", 0.2, 1.6, "JOYFUL", "you", "visual"),
      ],
    };
  }
  return null;
}

function uidish(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}
