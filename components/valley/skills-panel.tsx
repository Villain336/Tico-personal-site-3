"use client";

import type { HudState, SkillId } from "@/lib/valley/types";
import { SKILLS } from "@/lib/valley/config";
import { Modal, ModalButton } from "./modal";

export function SkillsPanel({
  hud,
  onSpend,
  onClose,
}: {
  hud: HudState;
  onSpend: (s: SkillId) => void;
  onClose: () => void;
}) {
  return (
    <Modal title={`Skills · ${hud.skillPoints} point${hud.skillPoints === 1 ? "" : "s"} to spend`} onClose={onClose}>
      <ul className="space-y-2">
        {(Object.keys(SKILLS) as SkillId[]).map((id) => {
          const s = SKILLS[id];
          const rank = hud.skills[id];
          const maxed = rank >= s.max;
          return (
            <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">
                  {s.name} <span className="text-white/50">{rank}/{s.max}</span>
                </p>
                <p className="text-xs text-white/60">{s.blurb}</p>
              </div>
              <button
                type="button"
                disabled={maxed || hud.skillPoints <= 0}
                onClick={() => onSpend(id)}
                className="rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-[#12121a] disabled:opacity-30"
              >
                {maxed ? "Max" : "+1"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-white/50">Earn a point every level. XP comes from kills, harvests, sales, prayer and redemptions.</p>
      <ModalButton onClick={onClose} variant="ghost">
        Close (K)
      </ModalButton>
    </Modal>
  );
}
