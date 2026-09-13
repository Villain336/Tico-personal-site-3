"use client";

import { valleyCopy } from "@/content/valley";

export function ValleyAbout({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 pt-16 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">{valleyCopy.eyebrow}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{valleyCopy.heading}</h2>
            <p className="mt-2 text-sm text-muted">{valleyCopy.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-foreground/5"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-sm text-foreground/80">{valleyCopy.instructions}</p>

        <h3 className="mt-6 font-display text-lg font-bold">{valleyCopy.howHeading}</h3>
        <ol className="mt-2 space-y-2 text-sm text-muted">
          {valleyCopy.how.map((h) => (
            <li key={h.title}>
              <span className="font-semibold text-foreground">{h.title}.</span> {h.body}
            </li>
          ))}
        </ol>

        <h3 className="mt-6 font-display text-lg font-bold">{valleyCopy.enemiesHeading}</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {valleyCopy.enemies.map((e) => (
            <li key={e.name}>
              <span className="font-semibold text-foreground">{e.name}.</span> {e.body}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-display text-lg font-bold">FAQ</h3>
        <div className="mt-2 space-y-3">
          {valleyCopy.faq.map((f) => (
            <details key={f.q} className="rounded-xl border border-border bg-background px-4 py-3">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
