"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PixelLoader } from "@/components/chat/pixel-loader";
import { RoastResult } from "@/components/roast/roast-result";
import { BookCall } from "@/components/roast/book-call";
import { roastCopy } from "@/content/roast";
import type { RoastResponse } from "@/lib/roast/schema";

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: RoastResponse };

export function RoastTool() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [stepIndex, setStepIndex] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const busy = phase.kind === "loading";

  // Rotate the loading copy so a 20-second wait feels like progress.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(
      () => setStepIndex((i) => (i + 1) % roastCopy.loading.length),
      2600,
    );
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => {
    if (phase.kind === "done") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy || !url.trim()) return;
    setStepIndex(0);
    setPhase({ kind: "loading" });
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPhase({ kind: "error", message: friendly(res.status, json?.error) });
        return;
      }
      setPhase({ kind: "done", data: json as RoastResponse });
    } catch {
      setPhase({ kind: "error", message: "Network hiccup. Try again." });
    }
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={submit}
        className="mx-auto max-w-2xl rounded-[22px] border border-border bg-surface p-2 shadow-card"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-2xl bg-field px-4">
            <span className="text-sm text-ink-3">https://</span>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//i, ""))}
              placeholder={roastCopy.placeholder}
              aria-label="Landing page URL"
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent py-3.5 text-base text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="rounded-2xl bg-brand-coral px-6 py-3.5 font-display text-base font-bold text-white transition-[transform,opacity] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
          >
            {busy ? "Roasting…" : roastCopy.button}
          </button>
        </div>
        <div className="flex min-h-8 items-center px-3 pt-2">
          <AnimatePresence mode="wait">
            {busy ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PixelLoader label={roastCopy.loading[stepIndex]} />
              </motion.div>
            ) : phase.kind === "error" ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="text-sm text-brand-coral"
              >
                {phase.message}
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-ink-3"
              >
                {roastCopy.disclaimer}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>

      {phase.kind === "done" && (
        <div ref={resultRef} className="scroll-mt-24 space-y-10">
          <RoastResult data={phase.data} />
          <BookCall />
        </div>
      )}
    </div>
  );
}

function friendly(status: number, serverMessage?: string) {
  if (status === 503) return "The Roaster isn't connected to a model yet — check back soon.";
  if (serverMessage) return serverMessage;
  if (status === 429) return "You've hit the hourly limit. Come back in a bit.";
  return "Something went wrong. Try again in a moment.";
}
