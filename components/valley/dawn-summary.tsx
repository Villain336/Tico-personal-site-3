"use client";

import type { DawnReport } from "@/lib/valley/types";

export function DawnSummary({ report, onClose }: { report: DawnReport; onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-16 z-20 flex justify-center px-4 font-mono text-[11px] text-white">
      <button
        type="button"
        onClick={onClose}
        className="w-full max-w-sm rounded-2xl border border-amber-300/40 bg-[#14121f]/95 p-4 text-left shadow-2xl backdrop-blur"
      >
        <p className="font-display text-base font-bold text-amber-200">☀️ Dawn of day {report.day}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-white/80">
          <span>Rent collected</span>
          <span className="text-right text-brand-lime">+{report.rent} coins</span>
          <span>Villagers leveled</span>
          <span className="text-right">{report.leveledUp}</span>
          <span>Saved / redeemed</span>
          <span className="text-right">{report.saved}</span>
          <span>Fallen or turned</span>
          <span className={`text-right ${report.fallen > 0 ? "text-brand-coral" : ""}`}>{report.fallen}</span>
          <span>Sin</span>
          <span className="text-right">{report.sinDelta > 0 ? `+${report.sinDelta}` : report.sinDelta}</span>
        </div>
        {report.arrivals?.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/10 p-2 text-amber-100">
            {report.arrivals.map((a) => (
              <p key={a.name}>
                <span className="font-semibold text-amber-200">{a.name} has arrived.</span> {a.line}
              </p>
            ))}
            <p className="mt-1 text-amber-200/60">Open the journal (J) for where to find them.</p>
          </div>
        )}
        <p className="mt-2 text-white/40">tap to dismiss</p>
      </button>
    </div>
  );
}
