import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...parts: Array<string | false | null | undefined>) {
  return twMerge(clsx(parts));
}

export function Button({
  tone = "copper",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "copper" | "tide" | "ghost" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tone === "copper" && "bg-copper text-ink hover:bg-copper/90",
        tone === "tide" && "bg-tide text-ink hover:bg-tide/90",
        tone === "ghost" && "border border-parchment/20 bg-transparent text-parchment hover:border-parchment/50",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-parchment/10 bg-parchment/5 p-4", className)}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-parchment">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Meter({ label, value, tone = "copper" }: { label: string; value: number; tone?: "copper" | "tide" }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-mist">{label}</span>
        <span className="text-parchment">{pct}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-parchment/10">
        <div className={cn("h-full rounded-full", tone === "tide" ? "bg-tide" : "bg-copper")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-wide text-mist uppercase">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-parchment/15 bg-ink px-3 py-2 text-base text-parchment outline-none focus-visible:border-copper";
