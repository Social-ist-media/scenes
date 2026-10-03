export type Emotion =
  | "ECSTATIC"
  | "JOYFUL"
  | "CREATIVE"
  | "CALM"
  | "FOCUSED"
  | "ANXIOUS"
  | "FATIGUED";

export type Phase =
  | "INTENTION"
  | "BRAINSTORM"
  | "STRUCTURE"
  | "SENSES"
  | "PROJECTION"
  | "TEMPORAL"
  | "INTEGRATION"
  | "SEAL";

export type Motif = "orb" | "arch" | "river" | "spire" | "bloom" | "veil" | "star" | "gate";

export type Channel = "visual" | "sound" | "touch" | "narrative";

export type Role = "Dream Weaver" | "Architect" | "Sensory Artist" | "Narrator" | "Viewer";

export type Dreamscape = "Lucid" | "Visual" | "Kinesthetic" | "Auditory" | "Multisensory";

export type Instrument = Dreamscape;

export interface DreamElement {
  id: string;
  kind: Motif;
  label: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  emotion: Emotion;
  authorId: string;
  channel: Channel;
  at: number;
}

export interface SensoryLayer {
  id: string;
  channel: Channel;
  name: string;
  intensity: number;
  active: boolean;
  motif: string;
}

export interface Participant {
  id: string;
  name: string;
  role: Role;
  emotion: Emotion;
  attention: number;
  flow: number;
  focus: string;
  muted: boolean;
  isYou: boolean;
}

export interface ChatLine {
  id: string;
  authorId: string;
  author: string;
  text: string;
  at: number;
}

export interface Snapshot {
  id: string;
  label: string;
  at: number;
  note: string;
  elements: DreamElement[];
}

export interface Session {
  id: string;
  title: string;
  intention: string;
  phase: Phase;
  dreamscape: Dreamscape;
  status: "waiting" | "live" | "paused" | "sealed";
  elements: DreamElement[];
  layers: SensoryLayer[];
  participants: Participant[];
  chat: ChatLine[];
  snapshots: Snapshot[];
  phasesSeen: Phase[];
  published: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
  resonanceHistory: { t: number; value: number }[];
}

export interface PublishedDream {
  id: string;
  sessionId?: string;
  title: string;
  intention: string;
  archetype: string;
  excerpt: string;
  author: string;
  resonators: number;
  score: number;
  motifs: Motif[];
  at: number;
}

export interface Tx {
  id: string;
  at: number;
  label: string;
  amount: number;
  kind: "earn" | "spend" | "grant";
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  blurb: string;
  maker: string;
  sales: number;
  kind: "effect" | "template";
}

export interface Suggestion {
  kind: Motif;
  label: string;
  emotion: Emotion;
  channel: Channel;
}

export interface LoomReply {
  archetype: string;
  reading: string;
  suggestions: Suggestion[];
  line: string;
}
