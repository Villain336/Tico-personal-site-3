"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/content/site";
import { RadioDock } from "@/components/radio/radio-dock";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <RadioDock />
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight">
              {site.name}
            </span>
            <span className="hidden rounded-full bg-brand-lime px-2 py-0.5 text-xs font-semibold text-foreground sm:inline-block">
              {site.agency}
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-4 bg-foreground" />
            <span className="h-0.5 w-4 bg-foreground" />
            <span className="h-0.5 w-4 bg-foreground" />
          </div>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/90 hover:bg-foreground/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
