import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSensory } from "@/lib/sensory/store";
import { cn } from "./ui";

const NAV = [
  { to: "/", label: "Lobby", exact: true },
  { to: "/atlas", label: "Atlas", exact: false },
  { to: "/palace", label: "Palace", exact: false },
  { to: "/market", label: "Market", exact: false },
  { to: "/ledger", label: "Ledger", exact: false },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const balance = useSensory((s) => s.wallet.balance);
  const notice = useSensory((s) => s.notice);
  const latest = useSensory((s) => s.sessions[0]);

  useEffect(() => {
    void useSensory.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => useSensory.getState().setNotice(null), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="flex h-dvh flex-col bg-ink text-parchment">
      <header className="shrink-0 border-b border-parchment/10 px-4 py-2 lg:flex lg:h-14 lg:items-center lg:justify-between lg:py-0">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="font-display text-2xl tracking-tight">
            Sensory
          </Link>
          <p className="text-sm text-copper lg:hidden">{balance} lumen</p>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto lg:mt-0" aria-label="Studio">
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 text-sm",
                  active ? "bg-parchment/10 text-parchment" : "text-mist hover:text-parchment",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {latest ? (
            <Link
              to="/studio/$id"
              params={{ id: latest.id }}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm",
                path.startsWith("/studio") ? "bg-parchment/10 text-parchment" : "text-mist hover:text-parchment",
              )}
            >
              Field
            </Link>
          ) : null}
        </nav>
        <p className="hidden text-sm text-copper lg:block">{balance} lumen</p>
      </header>
      {notice ? (
        <p className="shrink-0 border-b border-parchment/10 bg-copper/15 px-4 py-2 text-sm text-parchment" role="status">
          {notice}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
