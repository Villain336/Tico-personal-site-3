"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AskTico } from "@/components/chat/ask-tico";

/** Floating "Ask Tico" launcher, mounted once in the root layout. */
export function AskTicoLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-[90] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-[calc(100vw-2rem)] max-w-[380px]"
          >
            <AskTico className="max-w-none" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close Ask Tico" : "Open Ask Tico"}
        className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
      >
        <span
          aria-hidden
          className="relative flex h-2 w-2 items-center justify-center"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-lime opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-lime" />
        </span>
        {open ? "Close" : "Ask Tico"}
      </button>
    </div>
  );
}
