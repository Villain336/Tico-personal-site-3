"use client";

import type { HudState } from "@/lib/valley/types";
import { Modal, ModalButton } from "./modal";

const STATE_LABEL: Record<HudState["quests"][number]["state"], string> = {
  available: "Not started",
  active: "In progress",
  ready: "Ready to turn in",
  completed: "Completed",
};

export function QuestJournal({ hud, onClose }: { hud: HudState; onClose: () => void }) {
  return (
    <Modal title="Quest Journal" onClose={onClose}>
      <ul className="space-y-2">
        {hud.quests.map((q) => (
          <li key={q.id} className="rounded-xl border border-white/10 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{q.name}</p>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  q.state === "completed" ? "text-brand-lime" : q.state === "ready" ? "text-amber-300" : "text-white/60"
                }`}
              >
                {STATE_LABEL[q.state]}
              </span>
            </div>
            {(q.state === "active" || q.state === "ready") && (
              <p className="mt-1 text-xs text-white/60">
                {q.progress}/{q.target}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-white/50">This journal tracks questlines only — day-to-day jobs still live in the ribbon at the top.</p>
      <ModalButton onClick={onClose} variant="ghost">
        Close (J)
      </ModalButton>
    </Modal>
  );
}
