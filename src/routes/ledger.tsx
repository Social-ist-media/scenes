import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/sensory/shell";
import { Button, Meter } from "@/components/sensory/ui";
import { resonance } from "@/lib/sensory/engine";
import { useSensory } from "@/lib/sensory/store";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

function LedgerPage() {
  const wallet = useSensory((s) => s.wallet);
  const sessions = useSensory((s) => s.sessions);
  const stipendAt = useSensory((s) => s.stipendAt);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ready = Date.now() - stipendAt > 1000 * 60 * 60 * 6;
  const chart = [...wallet.tx]
    .slice()
    .reverse()
    .map((tx, index) => ({
      name: String(index + 1),
      balance: wallet.tx
        .slice()
        .reverse()
        .slice(0, index + 1)
        .reduce((sum, item) => sum + item.amount, 0),
    }));

  return (
    <Shell>
      <div className="h-full overflow-y-auto">
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8">
          <header>
            <p className="text-sm tracking-widest text-tide uppercase">Ledger</p>
            <h1 className="mt-2 font-display text-5xl">{wallet.balance} lumen</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
              Studio credit only. A published dream pays 30. A new phase pays 8 the first time you enter it. Sealing pays a host share from resonance: 40% of the poetic split is yours, because the companions are not accounts. Platform, co-host, and contributor shares are shown so the model stays visible. They are not withdrawn.
            </p>
            <Button className="mt-4" disabled={!ready} onClick={() => useSensory.getState().claimStipend()}>
              {ready ? "Collect practice stipend · 40" : "Stipend already collected"}
            </Button>
          </header>

          <section className="h-56 rounded-2xl border border-parchment/10 p-3">
            {mounted && chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-ink)",
                      color: "var(--color-parchment)",
                      border: "1px solid color-mix(in srgb, var(--color-parchment) 20%, transparent)",
                    }}
                  />
                  <Area dataKey="balance" stroke="var(--color-copper)" fill="var(--color-copper)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-mist">The book is still opening.</p>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl">Split when a dream is sealed</h2>
              <div className="mt-4 flex flex-col gap-3">
                <Meter label="Host (you)" value={0.4} />
                <Meter label="Co-hosts" value={0.2} tone="tide" />
                <Meter label="Contributors" value={0.3} />
                <Meter label="Platform" value={0.1} tone="tide" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl">Rooms</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {sessions.map((session) => {
                  const score = resonance(session).score;
                  return (
                    <li key={session.id} className="border-t border-parchment/10 pt-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p>{session.title}</p>
                        <p className="text-sm text-copper">{Math.round(12 + score * 36)} if sealed</p>
                      </div>
                      <Meter label="Resonance" value={score} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Book</h2>
            <ul className="mt-3 divide-y divide-parchment/10">
              {wallet.tx.map((tx) => (
                <li key={tx.id} className="flex items-baseline justify-between gap-3 py-3 text-sm">
                  <span>{tx.label}</span>
                  <span className={tx.amount < 0 ? "text-mist" : "text-tide"}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </Shell>
  );
}
