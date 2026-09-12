"use client";

import type { BuildingType, HudState } from "@/lib/valley/types";
import { ALTAR, BUILDINGS } from "@/lib/valley/config";

const ORDER = (Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]).sort(
  (a, b) => Number(BUILDINGS[a].hotkey) - Number(BUILDINGS[b].hotkey),
);

export function BuildMenu({
  hud,
  onPick,
  onUpgradeAltar,
  onClose,
}: {
  hud: HudState;
  onPick: (b: BuildingType) => void;
  onUpgradeAltar: () => void;
  onClose: () => void;
}) {
  const nextCost = hud.altarLevel < ALTAR.maxLevel ? ALTAR.upgradeCost[hud.altarLevel] : null;
  return (
    <div className="absolute inset-x-3 bottom-14 z-30 font-mono text-[11px] text-white">
      <div className="rounded-2xl border border-white/15 bg-[#14121f]/95 p-3 shadow-2xl backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold">Build · click a tile to place · right-click or Esc to stop</p>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            close
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
          {ORDER.map((key) => {
            const d = BUILDINGS[key];
            const locked = hud.altarLevel < d.altarLevel;
            const poor = hud.coins < d.cost;
            const active = hud.buildMode === key;
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => onPick(key)}
                className={`rounded-xl border p-2 text-left transition ${
                  active
                    ? "border-brand-lime bg-brand-lime/15"
                    : locked
                      ? "cursor-not-allowed border-white/10 opacity-40"
                      : "border-white/15 hover:border-white/40 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{d.name}</span>
                  <kbd className="rounded border border-white/30 px-1 text-[9px] text-white/70">{d.hotkey}</kbd>
                </div>
                <p className="mt-0.5 text-white/60">{d.blurb}</p>
                <p className={`mt-1 ${poor && !locked ? "text-brand-coral" : "text-brand-lime"}`}>
                  {locked ? `Altar lvl ${d.altarLevel}` : `${d.cost} coins`}
                </p>
              </button>
            );
          })}
          <button
            type="button"
            disabled={nextCost === null}
            onClick={onUpgradeAltar}
            className={`rounded-xl border p-2 text-left transition ${
              nextCost === null
                ? "border-white/10 opacity-50"
                : "border-[#e0b53a]/50 bg-[#e0b53a]/10 hover:border-[#e0b53a]"
            }`}
          >
            <span className="font-semibold">🔥 Altar → lvl {Math.min(ALTAR.maxLevel, hud.altarLevel + 1)}</span>
            <p className="mt-0.5 text-white/60">
              Bigger light, faster prayer, villagers gain XP ×{ALTAR.villagerXpMult[Math.min(ALTAR.maxLevel, hud.altarLevel + 1)]}, unlocks buildings.
            </p>
            <p className={`mt-1 ${nextCost !== null && hud.coins < nextCost ? "text-brand-coral" : "text-[#e0b53a]"}`}>
              {nextCost === null ? "Max level" : `${nextCost} coins`}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
