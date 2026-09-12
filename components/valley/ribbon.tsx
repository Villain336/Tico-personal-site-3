"use client";

import type { Job } from "@/lib/valley/types";

/**
 * The top strip that changes mood: a return's job checklist by day, a red
 * takeover at dusk. One place to look — no separate dusk toast.
 */
export function Ribbon({ jobs, mode }: { jobs: Job[]; mode: "day" | "dusk" }) {
  const dusk = mode === "dusk";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-center justify-center gap-2 border-b px-4 py-2 text-[11px] font-mono backdrop-blur transition-colors ${
        dusk ? "border-brand-coral/60 bg-[#3a1210]/85 text-[#ffd8d0]" : "border-white/15 bg-black/60 text-white/90"
      }`}
    >
      <span className="font-semibold uppercase tracking-wide">{dusk ? "Night is close" : "Today"}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {jobs.map((j) => (
          <span
            key={j.id}
            className={`rounded-full border px-2.5 py-0.5 ${
              j.done
                ? "border-brand-lime/50 bg-brand-lime/10 text-brand-lime line-through"
                : dusk
                  ? "border-[#ffb3ab]/40 bg-black/25"
                  : "border-white/20 bg-black/25"
            }`}
          >
            {j.done ? "✓ " : "☐ "}
            {j.label}
          </span>
        ))}
      </div>
    </div>
  );
}
