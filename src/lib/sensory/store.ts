import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { archetypeOf, companionBeat, defaultLayers, resonance, ringSlot, uid } from "./engine";
import { MARKET, SEED_DREAMS, SEED_SESSIONS, SEED_TX, templateElements } from "./seed";
import type {
  Channel,
  DreamElement,
  Dreamscape,
  Emotion,
  Instrument,
  Motif,
  Phase,
  Session,
  Suggestion,
} from "./types";

interface SensoryState {
  youName: string;
  instrument: Instrument;
  wallet: { balance: number; tx: typeof SEED_TX };
  inventory: string[];
  equipped: string[];
  sessions: Session[];
  dreams: typeof SEED_DREAMS;
  journal: string;
  stipendAt: number;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  setYouName: (name: string) => void;
  setInstrument: (instrument: Instrument) => void;
  setJournal: (journal: string) => void;
  createSession: (opts?: {
    title?: string;
    intention?: string;
    dreamscape?: Dreamscape;
    elements?: DreamElement[];
  }) => string;
  patchSession: (id: string, fn: (session: Session) => Session) => void;
  setIntention: (id: string, intention: string) => void;
  setTitle: (id: string, title: string) => void;
  setDreamscape: (id: string, dreamscape: Dreamscape) => void;
  setStatus: (id: string, status: Session["status"]) => void;
  setPhase: (id: string, phase: Phase) => void;
  setPresence: (id: string, emotion: Emotion, attention: number) => void;
  setLayer: (id: string, layerId: string, patch: { active?: boolean; intensity?: number; motif?: string }) => void;
  addElement: (
    id: string,
    input: { kind: Motif; x: number; z: number; label?: string; emotion?: Emotion; channel?: Channel },
  ) => void;
  applySuggestions: (id: string, suggestions: Suggestion[]) => void;
  updateElement: (id: string, elementId: string, patch: Partial<Pick<DreamElement, "label" | "emotion">>) => void;
  removeElement: (id: string, elementId: string) => void;
  clearAuthor: (id: string, authorId: string) => void;
  muteParticipant: (id: string, participantId: string) => void;
  addChat: (id: string, authorId: string, author: string, text: string) => void;
  snapshot: (id: string, label?: string) => void;
  restoreSnapshot: (id: string, snapshotId: string) => void;
  tickCompanion: (id: string) => void;
  sampleResonance: (id: string) => void;
  publish: (id: string) => void;
  seal: (id: string) => void;
  removeSession: (id: string) => void;
  buy: (itemId: string) => { ok: boolean; error?: string };
  toggleEquip: (itemId: string) => void;
  openTemplate: (itemId: string) => string | null;
  claimStipend: () => void;
  charge: (amount: number, label: string) => void;
}

function pushTx(
  wallet: SensoryState["wallet"],
  label: string,
  amount: number,
  kind: "earn" | "spend" | "grant",
): SensoryState["wallet"] {
  return {
    balance: wallet.balance + amount,
    tx: [{ id: uid("tx"), at: Date.now(), label, amount, kind }, ...wallet.tx].slice(0, 40),
  };
}

function blankSession(opts?: {
  title?: string;
  intention?: string;
  dreamscape?: Dreamscape;
  elements?: DreamElement[];
}): Session {
  const id = uid("room");
  const now = Date.now();
  return {
    id,
    title: opts?.title?.trim() || "Untitled room",
    intention: opts?.intention?.trim() || "",
    phase: "INTENTION",
    dreamscape: opts?.dreamscape ?? "Multisensory",
    status: opts?.intention?.trim() ? "live" : "waiting",
    elements: opts?.elements ?? [],
    layers: defaultLayers(),
    participants: SEED_SESSIONS[0]!.participants.map((p) => ({ ...p })),
    chat: [],
    snapshots: [],
    phasesSeen: ["INTENTION"],
    published: false,
    notes: "",
    createdAt: now,
    updatedAt: now,
    resonanceHistory: [{ t: now, value: 0.2 }],
  };
}

export const useSensory = create<SensoryState>()(
  persist(
    (set, get) => ({
      youName: "Salvatore",
      instrument: "Multisensory",
      wallet: { balance: 182, tx: SEED_TX },
      inventory: [],
      equipped: [],
      sessions: SEED_SESSIONS,
      dreams: SEED_DREAMS,
      journal: "",
      stipendAt: 0,
      notice: null,
      setNotice: (notice) => set({ notice }),
      setYouName: (youName) =>
        set((s) => ({
          youName: youName.trim().slice(0, 32) || s.youName,
          sessions: s.sessions.map((session) => ({
            ...session,
            participants: session.participants.map((p) =>
              p.isYou ? { ...p, name: youName.trim().slice(0, 32) || p.name } : p,
            ),
          })),
        })),
      setInstrument: (instrument) => set({ instrument }),
      setJournal: (journal) => set({ journal }),
      createSession: (opts) => {
        const dreamscape = opts?.dreamscape ?? get().instrument;
        const session = blankSession({ ...opts, dreamscape });
        session.participants = session.participants.map((p) =>
          p.isYou ? { ...p, name: get().youName } : p,
        );
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session.id;
      },
      patchSession: (id, fn) =>
        set((s) => ({
          sessions: s.sessions.map((session) =>
            session.id === id ? { ...fn(session), updatedAt: Date.now() } : session,
          ),
        })),
      setIntention: (id, intention) =>
        get().patchSession(id, (session) => ({
          ...session,
          intention,
          status: session.status === "waiting" && intention.trim() ? "live" : session.status,
        })),
      setTitle: (id, title) => get().patchSession(id, (session) => ({ ...session, title })),
      setDreamscape: (id, dreamscape) =>
        get().patchSession(id, (session) => ({ ...session, dreamscape })),
      setStatus: (id, status) => get().patchSession(id, (session) => ({ ...session, status })),
      setPhase: (id, phase) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.status === "sealed") return;
        const first = !session.phasesSeen.includes(phase);
        get().patchSession(id, (current) => ({
          ...current,
          phase,
          phasesSeen: first ? [...current.phasesSeen, phase] : current.phasesSeen,
        }));
        if (first && phase !== "INTENTION") {
          set((s) => ({
            wallet: pushTx(s.wallet, `Phase · ${phase.toLowerCase()}`, 8, "earn"),
            notice: "Phase marked. +8 lumen",
          }));
        }
      },
      setPresence: (id, emotion, attention) =>
        get().patchSession(id, (session) => ({
          ...session,
          participants: session.participants.map((p) =>
            p.isYou ? { ...p, emotion, attention } : p,
          ),
        })),
      setLayer: (id, layerId, patch) =>
        get().patchSession(id, (session) => ({
          ...session,
          layers: session.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
        })),
      addElement: (id, input) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.status === "sealed" || session.elements.length >= 48) return;
        const motif = input.kind;
        const element: DreamElement = {
          id: uid("el"),
          kind: motif,
          label: input.label?.trim() || motif,
          x: input.x,
          y: 0,
          z: input.z,
          scale: 1,
          emotion: input.emotion ?? session.participants.find((p) => p.isYou)?.emotion ?? "CALM",
          authorId: "you",
          channel: input.channel ?? "visual",
          at: Date.now(),
        };
        get().patchSession(id, (current) => ({ ...current, elements: [...current.elements, element] }));
      },
      applySuggestions: (id, suggestions) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.status === "sealed") return;
        const room = Math.max(0, 48 - session.elements.length);
        const take = suggestions.slice(0, room);
        const elements = take.map((suggestion, index) => {
          const spot = ringSlot(index, take.length);
          const element: DreamElement = {
            id: uid("el"),
            kind: suggestion.kind,
            label: suggestion.label,
            x: spot.x,
            y: spot.y,
            z: spot.z,
            scale: 1,
            emotion: suggestion.emotion,
            authorId: "loom",
            channel: suggestion.channel,
            at: Date.now(),
          };
          return element;
        });
        get().patchSession(id, (current) => ({
          ...current,
          elements: [...current.elements, ...elements],
        }));
      },
      updateElement: (id, elementId, patch) =>
        get().patchSession(id, (session) => ({
          ...session,
          elements: session.elements.map((element) =>
            element.id === elementId ? { ...element, ...patch } : element,
          ),
        })),
      removeElement: (id, elementId) =>
        get().patchSession(id, (session) => ({
          ...session,
          elements: session.elements.filter((element) => element.id !== elementId),
        })),
      clearAuthor: (id, authorId) =>
        get().patchSession(id, (session) => ({
          ...session,
          elements: session.elements.filter((element) => element.authorId !== authorId),
        })),
      muteParticipant: (id, participantId) =>
        get().patchSession(id, (session) => ({
          ...session,
          participants: session.participants.map((p) =>
            p.id === participantId ? { ...p, muted: !p.muted } : p,
          ),
        })),
      addChat: (id, authorId, author, text) => {
        const clean = text.trim().slice(0, 400);
        if (!clean) return;
        get().patchSession(id, (session) => ({
          ...session,
          chat: [...session.chat, { id: uid("chat"), authorId, author, text: clean, at: Date.now() }].slice(-80),
        }));
      },
      snapshot: (id, label) =>
        get().patchSession(id, (session) => {
          if (session.snapshots.length >= 12) {
            return session;
          }
          return {
            ...session,
            snapshots: [
              {
                id: uid("snap"),
                label: label?.trim() || `Layer ${session.snapshots.length + 1}`,
                at: Date.now(),
                note: session.phase,
                elements: session.elements.map((element) => ({ ...element })),
              },
              ...session.snapshots,
            ],
          };
        }),
      restoreSnapshot: (id, snapshotId) =>
        get().patchSession(id, (session) => {
          const snap = session.snapshots.find((item) => item.id === snapshotId);
          if (!snap || session.status === "sealed") return session;
          return {
            ...session,
            elements: snap.elements.map((element) => ({ ...element, id: uid("el"), at: Date.now() })),
          };
        }),
      tickCompanion: (id) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.status !== "live") return;
        const beat = companionBeat(session);
        if (!beat) return;
        const last = session.chat[session.chat.length - 1];
        if (last && last.text === beat.text) return;
        get().patchSession(id, (current) => {
          const element: DreamElement | null = beat.element
            ? { ...beat.element, id: uid("el"), at: Date.now() }
            : null;
          return {
            ...current,
            participants: current.participants.map((p) =>
              p.id === beat.authorId ? { ...p, attention: beat.attention } : p,
            ),
            chat: [
              ...current.chat,
              { id: uid("chat"), authorId: beat.authorId, author: beat.author, text: beat.text, at: Date.now() },
            ].slice(-80),
            elements: element ? [...current.elements, element] : current.elements,
          };
        });
        get().sampleResonance(id);
      },
      sampleResonance: (id) =>
        get().patchSession(id, (session) => {
          const last = session.resonanceHistory[session.resonanceHistory.length - 1];
          if (last && Date.now() - last.t < 7000) return session;
          return {
            ...session,
            resonanceHistory: [
              ...session.resonanceHistory,
              { t: Date.now(), value: resonance(session).score },
            ].slice(-28),
          };
        }),
      publish: (id) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.published) return;
        const score = Math.round(resonance(session).score * 100);
        set((s) => ({
          dreams: [
            {
              id: uid("dream"),
              sessionId: session.id,
              title: session.title,
              intention: session.intention,
              archetype: archetypeOf(`${session.intention} ${session.title} ${session.elements.map((e) => e.label).join(" ")}`),
              excerpt: session.intention || "A room with no sentence yet.",
              author: s.youName,
              resonators: 1,
              score,
              motifs: [...new Set(session.elements.map((e) => e.kind))].slice(0, 4),
              at: Date.now(),
            },
            ...s.dreams,
          ],
          wallet: pushTx(s.wallet, `Published · ${session.title}`, 30, "earn"),
          notice: "Entered the atlas. +30 lumen",
        }));
        get().patchSession(id, (current) => ({ ...current, published: true }));
      },
      seal: (id) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session || session.status === "sealed") return;
        const payout = Math.round(12 + resonance(session).score * 36);
        get().patchSession(id, (current) => ({
          ...current,
          status: "sealed",
          phase: "SEAL",
          phasesSeen: current.phasesSeen.includes("SEAL") ? current.phasesSeen : [...current.phasesSeen, "SEAL"],
        }));
        set((s) => ({
          wallet: pushTx(s.wallet, `Host share · ${session.title}`, payout, "earn"),
          notice: `Sealed. Host share +${payout} lumen`,
        }));
      },
      removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((session) => session.id !== id) })),
      buy: (itemId) => {
        const item = MARKET.find((entry) => entry.id === itemId);
        if (!item) return { ok: false, error: "That lot is gone." };
        const state = get();
        if (state.inventory.includes(itemId)) return { ok: false, error: "You already hold this." };
        if (state.wallet.balance < item.price) return { ok: false, error: "Not enough lumen." };
        set((s) => ({
          inventory: [...s.inventory, itemId],
          wallet: pushTx(s.wallet, item.name, -item.price, "spend"),
          notice: `Acquired ${item.name}`,
        }));
        return { ok: true };
      },
      toggleEquip: (itemId) =>
        set((s) => ({
          equipped: s.equipped.includes(itemId)
            ? s.equipped.filter((id) => id !== itemId)
            : [...s.equipped, itemId],
        })),
      openTemplate: (itemId) => {
        if (!get().inventory.includes(itemId)) return null;
        const tpl = templateElements(itemId);
        if (!tpl) return null;
        return get().createSession({
          title: tpl.title,
          intention: tpl.intention,
          elements: tpl.elements,
        });
      },
      claimStipend: () => {
        const wait = 1000 * 60 * 60 * 6;
        if (Date.now() - get().stipendAt < wait) return;
        set((s) => ({
          stipendAt: Date.now(),
          wallet: pushTx(s.wallet, "Practice stipend", 40, "grant"),
          notice: "Practice stipend +40 lumen",
        }));
      },
      charge: (amount, label) =>
        set((s) => ({
          wallet: pushTx(s.wallet, label, -Math.abs(amount), "spend"),
        })),
    }),
    {
      name: "sensory-loom-v1",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        youName: state.youName,
        instrument: state.instrument,
        wallet: state.wallet,
        inventory: state.inventory,
        equipped: state.equipped,
        sessions: state.sessions,
        dreams: state.dreams,
        journal: state.journal,
        stipendAt: state.stipendAt,
      }),
    },
  ),
);

export function findSession(id: string) {
  return useSensory.getState().sessions.find((session) => session.id === id);
}
