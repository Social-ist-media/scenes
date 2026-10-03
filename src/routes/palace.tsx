import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/sensory/shell";
import { Button, Field, fieldClass } from "@/components/sensory/ui";
import { DREAMSCAPES, downloadText, resonance, sessionMarkdown } from "@/lib/sensory/engine";
import { useSensory } from "@/lib/sensory/store";

export const Route = createFileRoute("/palace")({ component: PalacePage });

function PalacePage() {
  const sessions = useSensory((s) => s.sessions);
  const journal = useSensory((s) => s.journal);
  const youName = useSensory((s) => s.youName);
  const instrument = useSensory((s) => s.instrument);
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <Shell>
      <div className="h-full overflow-y-auto">
        <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 md:px-8">
          <header>
            <p className="text-sm tracking-widest text-tide uppercase">Palace</p>
            <h1 className="mt-2 font-display text-5xl">What you kept.</h1>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Your name in the room">
              <input
                value={youName}
                onChange={(event) => useSensory.getState().setYouName(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Instrument">
              <select
                value={instrument}
                onChange={(event) =>
                  useSensory.getState().setInstrument(event.target.value as (typeof DREAMSCAPES)[number])
                }
                className={fieldClass}
              >
                {DREAMSCAPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </section>
          <p className="text-sm text-mist">New rooms open in the instrument you pick here. It is a leaning, not a diagnosis.</p>

          <section>
            <h2 className="font-display text-3xl">Rooms</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {sessions.map((session) => {
                const score = Math.round(resonance(session).score * 100);
                return (
                  <li key={session.id} className="rounded-2xl border border-parchment/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl">{session.title}</p>
                        <p className="mt-1 text-sm text-mist">
                          {session.status} · {session.phase.toLowerCase()} · resonance {score}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void navigate({ to: "/studio/$id", params: { id: session.id } })}>
                          Enter
                        </Button>
                        <Button
                          tone="ghost"
                          onClick={() =>
                            downloadText(`${session.title.replace(/\s+/g, "-").toLowerCase()}.md`, sessionMarkdown(session))
                          }
                        >
                          Export
                        </Button>
                        <Button
                          tone="ghost"
                          onClick={() => {
                            if (pendingDelete === session.id) {
                              useSensory.getState().removeSession(session.id);
                              setPendingDelete(null);
                            } else {
                              setPendingDelete(session.id);
                            }
                          }}
                        >
                          {pendingDelete === session.id ? "Confirm delete" : "Delete"}
                        </Button>
                      </div>
                    </div>
                    {session.notes ? <p className="mt-3 text-sm text-mist">{session.notes}</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-3xl">Subconscious</h2>
            <p className="mt-2 text-sm text-mist">Private scratch. It stays in this browser.</p>
            <textarea
              value={journal}
              onChange={(event) => useSensory.getState().setJournal(event.target.value)}
              rows={8}
              className={`${fieldClass} mt-3`}
              placeholder="The thing you didn't put in the room."
            />
          </section>
        </main>
      </div>
    </Shell>
  );
}
