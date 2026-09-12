"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { Artwork } from "@/content/gallery";

export function ArtGrid({ pieces }: { pieces: Artwork[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : pieces[activeIndex];

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActiveIndex((i) => (i === null ? i : (i + dir + pieces.length) % pieces.length)),
    [pieces.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, step]);

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {pieces.map((p, i) => (
          <motion.button
            key={p.slug}
            type="button"
            layoutId={`art-${p.slug}`}
            onClick={() => setActiveIndex(i)}
            className="group block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-card"
            whileHover={{ y: -3 }}
          >
            <div className="relative overflow-hidden">
              <Image
                src={p.src}
                alt={p.title}
                width={p.width}
                height={p.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {p.placeholder && (
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Placeholder
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-3 px-4 py-3">
              <p className="font-display text-base font-bold">{p.title}</p>
              <p className="shrink-0 text-xs text-muted">{p.year}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#12121a]/80 p-4 backdrop-blur-sm sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ×
            </button>
            {pieces.length > 1 && (
              <>
                <NavButton side="left" onClick={() => step(-1)} />
                <NavButton side="right" onClick={() => step(1)} />
              </>
            )}

            <motion.figure
              layoutId={`art-${active.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl lg:flex-row"
            >
              <div className="flex min-h-0 flex-1 items-center justify-center bg-field">
                <Image
                  src={active.src}
                  alt={active.title}
                  width={active.width}
                  height={active.height}
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className="max-h-[60vh] w-auto max-w-full object-contain lg:max-h-[82vh]"
                  priority
                />
              </div>
              <figcaption className="w-full shrink-0 p-6 lg:w-80 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
                  {active.medium} · {active.year}
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold">{active.title}</h3>
                <p className="mt-3 text-sm text-muted">{active.description}</p>
                <p className="mt-6 text-xs text-ink-3">
                  {activeIndex! + 1} / {pieces.length} · ← → to browse · Esc to close
                </p>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous piece" : "Next piece"}
      className={`absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 sm:flex ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}
