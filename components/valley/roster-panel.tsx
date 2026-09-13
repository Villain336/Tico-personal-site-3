"use client";

import type { DeploymentMode, HudState, RecruitId, ScatteredRecruitId } from "@/lib/valley/types";
import { Modal, ModalButton } from "./modal";

export function RosterPanel({
  hud,
  onSetDeployment,
  onRecruitScattered,
  onClose,
}: {
  hud: HudState;
  onSetDeployment: (id: RecruitId, mode: DeploymentMode) => void;
  onRecruitScattered: (id: ScatteredRecruitId) => void;
  onClose: () => void;
}) {
  const blessed = hud.quests.find((q) => q.id === "holyGhost")?.state === "completed";

  return (
    <Modal title="Roster" onClose={onClose}>
      <div className="space-y-2">
        {blessed && (
          <div className="rounded-xl border border-brand-lime/40 bg-brand-lime/10 px-3 py-2 text-xs text-brand-lime">
            Holy Ghost · blessing active — no companion form, no deployment.
          </div>
        )}
        {hud.recruits.length === 0 && !blessed && (
          <p className="text-xs text-white/60">No one has joined you yet. Find a quest-giver, or recruit someone below once you&apos;re the right level.</p>
        )}
        <ul className="space-y-2">
          {hud.recruits.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className={`text-[10px] uppercase tracking-wide ${r.big ? "text-brand-lime" : "text-[#ffb3ab]"}`}>
                    {r.big ? "Permanent · exempt from harm" : "Vulnerable · like any villager"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <ModeButton active={r.mode === "follow"} onClick={() => onSetDeployment(r.id, "follow")}>
                    Follow
                  </ModeButton>
                  <ModeButton active={r.mode === "station"} onClick={() => onSetDeployment(r.id, "station")}>
                    Station
                  </ModeButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">Recruit</p>
        <ul className="space-y-2">
          {hud.scatteredOffers
            .filter((o) => o.unlocked && !o.recruited)
            .map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{o.name}</p>
                  <p className="text-xs text-white/60">{o.role} · {o.cost} coins</p>
                </div>
                <button
                  type="button"
                  disabled={hud.coins < o.cost}
                  onClick={() => onRecruitScattered(o.id)}
                  className="rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-[#12121a] disabled:opacity-30"
                >
                  Pay
                </button>
              </li>
            ))}
          {hud.scatteredOffers.filter((o) => o.unlocked && !o.recruited).length === 0 && (
            <p className="text-xs text-white/50">
              {hud.scatteredOffers.every((o) => o.recruited || !o.unlocked) && hud.scatteredOffers.some((o) => !o.unlocked)
                ? `Reach level ${Math.min(...hud.scatteredOffers.filter((o) => !o.unlocked).map((o) => o.unlockLevel))} to unlock the next recruit.`
                : "No one new to recruit right now."}
            </p>
          )}
        </ul>
      </div>

      <ModalButton onClick={onClose} variant="ghost">
        Close (R)
      </ModalButton>
    </Modal>
  );
}

function ModeButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        active ? "border-brand-lime bg-brand-lime text-[#12121a]" : "border-white/20 text-white/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
