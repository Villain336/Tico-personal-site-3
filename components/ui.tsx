import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  heading,
  sub,
}: {
  eyebrow: string;
  heading: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center sm:pt-24">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        {heading}
      </h1>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </div>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5";
  const styles =
    variant === "primary"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "border border-border bg-surface text-foreground hover:bg-foreground/5";
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground/80">
      {children}
    </span>
  );
}
