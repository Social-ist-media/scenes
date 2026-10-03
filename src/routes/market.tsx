import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/sensory/shell";
import { Button } from "@/components/sensory/ui";
import { MARKET } from "@/lib/sensory/seed";
import { useSensory } from "@/lib/sensory/store";

export const Route = createFileRoute("/market")({ component: MarketPage });

function MarketPage() {
  const inventory = useSensory((s) => s.inventory);
  const equipped = useSensory((s) => s.equipped);
  const balance = useSensory((s) => s.wallet.balance);
  const navigate = useNavigate();
  const effects = MARKET.filter((item) => item.kind === "effect");
  const templates = MARKET.filter((item) => item.kind === "template");

  return (
    <Shell>
      <div className="h-full overflow-y-auto">
        <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-8">
          <header>
            <p className="text-sm tracking-widest text-tide uppercase">Market</p>
            <h1 className="mt-2 font-display text-5xl">Effects and rites.</h1>
            <p className="mt-3 max-w-2xl text-mist">
              Spend lumen on weather for the field, or on a rite that opens a room already mid-sentence. Creators listed here are studio presences. Nothing on this page is a charge to a card.
            </p>
            <p className="mt-2 text-copper">{balance} lumen</p>
          </header>

          <section>
            <h2 className="font-display text-3xl">Field effects</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {effects.map((item) => {
                const owned = inventory.includes(item.id);
                const on = equipped.includes(item.id);
                return (
                  <li key={item.id} className="flex flex-col rounded-2xl border border-parchment/10 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-2xl">{item.name}</h3>
                      <p className="text-sm text-copper">{item.price}</p>
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{item.blurb}</p>
                    <p className="mt-3 text-xs text-mist">
                      {item.maker} · {item.sales + (owned ? 1 : 0)} held across the studio
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {owned ? (
                        <Button tone={on ? "tide" : "ghost"} onClick={() => useSensory.getState().toggleEquip(item.id)}>
                          {on ? "Equipped" : "Equip"}
                        </Button>
                      ) : (
                        <Button
                          disabled={balance < item.price}
                          onClick={() => useSensory.getState().buy(item.id)}
                        >
                          Acquire
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-3xl">Rites</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {templates.map((item) => {
                const owned = inventory.includes(item.id);
                return (
                  <li key={item.id} className="rounded-2xl border border-parchment/10 p-4">
                    <h3 className="font-display text-2xl">{item.name}</h3>
                    <p className="mt-2 text-sm text-mist">{item.blurb}</p>
                    <p className="mt-2 text-sm text-copper">{item.price} lumen</p>
                    <div className="mt-3 flex gap-2">
                      {owned ? (
                        <Button
                          onClick={() => {
                            const id = useSensory.getState().openTemplate(item.id);
                            if (id) void navigate({ to: "/studio/$id", params: { id } });
                          }}
                        >
                          Open as a room
                        </Button>
                      ) : (
                        <Button disabled={balance < item.price} onClick={() => useSensory.getState().buy(item.id)}>
                          Acquire
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </main>
      </div>
    </Shell>
  );
}
