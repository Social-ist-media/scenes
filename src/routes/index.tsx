import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/sensory/shell";
import { Button } from "@/components/sensory/ui";
import { useSensory } from "@/lib/sensory/store";

export const Route = createFileRoute("/")({ component: Home });

const MOVEMENTS = [
  {
    n: "01",
    title: "The room",
    body: "A live session with phases, presence, chat, and three companions who keep working when you leave the door open.",
  },
  {
    n: "02",
    title: "The loom",
    body: "A local reading of the dream's pattern, plus Grok when you ask — suggestions you can place, and a painted still.",
  },
  {
    n: "03",
    title: "The field",
    body: "A three-dimensional floor. Motifs, sensory layers, fog and rain you buy, and a sound bed you have to turn on.",
  },
  {
    n: "04",
    title: "The ledger",
    body: "Studio lumen, a host share when you seal, a marketplace of effects, and a record of what the room earned.",
  },
];

function Home() {
  const sessions = useSensory((s) => s.sessions);
  const dreams = useSensory((s) => s.dreams);
  const navigate = useNavigate();

  return (
    <Shell>
      <div className="h-full overflow-y-auto">
        <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 md:px-8 md:py-16">
          <section className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-sm tracking-widest text-tide uppercase">Live dream studio</p>
              <h1 className="mt-3 font-display text-5xl leading-none text-parchment md:text-7xl">
                Weave a room the others can enter.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
                Sensory is a loom for shared dreams: a field you build by hand, layers for sound and story, a temporal record, and a small creator economy that pays in studio credit.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    void navigate({ to: "/studio/$id", params: { id: sessions[0]?.id ?? "orchard" } })
                  }
                >
                  Open the orchard
                </Button>
                <Button
                  tone="ghost"
                  onClick={() => {
                    const id = useSensory.getState().createSession();
                    void navigate({ to: "/studio/$id", params: { id } });
                  }}
                >
                  Begin a new dream
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative mx-auto aspect-square w-full max-w-sm">
                <div className="loom-turn absolute inset-6 rounded-full border border-copper/50" />
                <div className="absolute inset-16 rounded-full border border-tide/40" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-display text-4xl">{sessions.length}</p>
                    <p className="text-sm text-mist">rooms in the palace</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl">Tonight's rooms</h2>
            </div>
            <ul className="grid gap-3 md:grid-cols-3">
              {sessions.slice(0, 3).map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/studio/$id", params: { id: session.id } })}
                    className="flex h-full w-full flex-col rounded-2xl border border-parchment/10 bg-parchment/5 p-4 text-left hover:border-copper/50"
                  >
                    <p className="text-xs tracking-wide text-tide uppercase">{session.status}</p>
                    <p className="mt-2 font-display text-2xl">{session.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mist">{session.intention}</p>
                    <p className="mt-4 text-xs text-mist">
                      {session.elements.length} motifs · {session.dreamscape}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-8 md:grid-cols-2">
            {MOVEMENTS.map((item) => (
              <article key={item.n} className="border-t border-parchment/15 pt-4">
                <p className="text-sm text-copper">{item.n}</p>
                <h3 className="mt-1 font-display text-3xl">{item.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-mist">{item.body}</p>
              </article>
            ))}
          </section>

          <section>
            <h2 className="font-display text-3xl">From the atlas</h2>
            <ul className="mt-4 divide-y divide-parchment/10 border-y border-parchment/10">
              {dreams.slice(0, 4).map((dream) => (
                <li key={dream.id} className="grid gap-2 py-4 md:grid-cols-[8rem_1fr_auto] md:items-baseline">
                  <p className="text-sm text-tide">{dream.archetype}</p>
                  <div>
                    <p className="font-display text-xl">{dream.title}</p>
                    <p className="text-sm text-mist">{dream.excerpt}</p>
                  </div>
                  <p className="text-sm text-mist">{dream.resonators} resonators</p>
                </li>
              ))}
            </ul>
            <Button tone="ghost" className="mt-4" onClick={() => void navigate({ to: "/atlas" })}>
              Browse the atlas
            </Button>
          </section>
        </main>
      </div>
    </Shell>
  );
}
