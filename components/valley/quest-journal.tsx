"use client";

import type { HudQuest, HudState } from "@/lib/valley/types";
import { Modal, ModalButton } from "./modal";

const STATE_LABEL: Record<HudQuest["state"], string> = {
  available: "Not started",
  active: "In progress",
  ready: "Ready to turn in",
  completed: "Completed",
};

function hint(q: HudQuest, day: number) {
  if (!q.arrived) {
    if (q.id === "jesus") return "A sign in the land will call him to the oaks.";
    const days = (q.arrivesDay ?? day) - day;
    return days <= 1 ? "A stranger is expected at tomorrow's dawn." : `A stranger is expected in ${days} dawns.`;
  }
  if (q.state === "available") return q.landmark ? `Find ${q.name} at the ${q.landmark} — look for the "!" and press E.` : q.objective;
  if (q.state === "active") return q.objective;
  if (q.state === "ready") return q.landmark ? `Return to ${q.name} at the ${q.landmark} and press E.` : "Reward incoming.";
  return q.objective;
}

export function QuestJournal({ hud, onClose }: { hud: HudState; onClose: () => void }) {
  const ordered = [...hud.quests].sort((a, b) => (a.arrivesDay ?? 99) - (b.arrivesDay ?? 99));
  return (
    <Modal title="Quest Journal" onClose={onClose}>
      <ul className="space-y-2">
        {ordered.map((q) => {
          const hidden = !q.arrived;
          return (
            <li key={q.id} className={`rounded-xl border px-3 py-2 ${hidden ? "border-dashed border-white/10" : "border-white/10"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${hidden ? "text-white/40" : ""}`}>{hidden ? "? ? ?" : q.name}</p>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    hidden
                      ? "text-white/30"
                      : q.state === "completed"
                        ? "text-brand-lime"
                        : q.state === "ready"
                          ? "text-amber-300"
                          : "text-white/60"
                  }`}
                >
                  {hidden ? (q.arrivesDay == null ? "A sign" : `Day ${q.arrivesDay}`) : STATE_LABEL[q.state]}
                </span>
              </div>
              <p className={`mt-1 text-xs ${hidden ? "text-white/40 italic" : "text-white/70"}`}>{hint(q, hud.day)}</p>
              {(q.state === "active" || q.state === "ready") && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-white/60">
                    {q.progress}/{q.target}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-white/50">
        Places found: {hud.discovered}/{hud.landmarks}. Some are named in Scripture and stay quiet until you walk into them.
      </p>
      <ModalButton onClick={onClose} variant="ghost">
        Close (J)
      </ModalButton>
    </Modal>
  );
}
