"use client";

import { useMemo, useState } from "react";
import { gemCategories, gems } from "@/content/gems";

export function GemsGrid() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return gems.filter((g) => {
      const matchesCategory = category === "All" || g.category === category;
      const matchesQuery =
        query.trim().length === 0 ||
        g.title.toLowerCase().includes(query.toLowerCase()) ||
        g.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gems…"
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-violet sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {["All", ...gemCategories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-foreground text-background"
                  : "border border-border bg-surface text-foreground/80 hover:bg-foreground/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => (
          <a
            key={g.title}
            href={g.url}
            target="_blank"
            rel="noreferrer noopener"
            className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-foreground/20"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-violet">
              {g.category}
            </p>
            <h3 className="font-display mt-2 text-base font-bold">
              {g.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted">{g.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
              Visit
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </a>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted">
            No gems match that search.
          </p>
        )}
      </div>
    </div>
  );
}
