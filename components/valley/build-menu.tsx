"use client";

import type { BuildingType, HudState } from "@/lib/valley/types";
import { ALTAR, BUILDINGS } from "@/lib/valley/config";
import { BIG_RECRUITS } from "@/lib/valley/quests/content";

const HOTKEY_ORDER = "1234567890-[=];].,";
const ORDER = (Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]).sort(
  (a, b) => HOTKEY_ORDER.indexOf(BUILDINGS[a].hotkey) - HOTKEY_ORDER.indexOf(BUILDINGS[b].hotkey),
);

/** Compact strip so most of the canvas stays clickable while placing. */
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
  const selected = hud.buildMode && hud.buildMode in BUILDINGS ? BUILDINGS[hud.buildMode as keyof typeof BUILDINGS] : null;

  return (
    <div className="absolute inset-x-3 bottom-14 z-30 font-mono text-[11px] text-white">
      <div className="rounded-2xl border border-white/15 bg-[#14121f]/95 p-2 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-1.5">
          {ORDER.map((key) => {
            const d = BUILDINGS[key];
            const questLocked = !!d.requiresQuest && !hud.completedQuests.includes(d.requiresQuest);
            const locked = questLocked || hud.altarLevel < d.altarLevel;
            const lockLabel = questLocked ? `${BIG_RECRUITS[d.requiresQuest!].name}'s quest` : `altar ${d.altarLevel}`;
            const poor = hud.coins < d.cost;
            const active = hud.buildMode === key;
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                title={locked ? `${d.name} — unlocks after ${lockLabel}. ${d.blurb}` : `${d.name} — ${d.blurb}`}
                onClick={() => onPick(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition ${
                  active
                    ? "border-brand-lime bg-brand-lime text-[#12121a]"
                    : locked
                      ? "cursor-not-allowed border-white/10 text-white/40"
                      : "border-white/15 hover:border-white/40 hover:bg-white/5"
                }`}
              >
                <kbd className={`rounded border px-1 text-[9px] ${active ? "border-[#12121a]/40" : "border-white/30 text-white/70"}`}>
                  {d.hotkey}
                </kbd>
                <span className="font-semibold">{d.name}</span>
                <span className={active ? "text-[#12121a]/80" : locked ? "" : poor ? "text-brand-coral" : "text-brand-lime"}>
                  {locked ? `🔒 ${lockLabel}` : `${d.cost}c`}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            disabled={nextCost === null}
            onClick={onUpgradeAltar}
            title={`Bigger light, faster prayer, villagers gain XP ×${ALTAR.villagerXpMult[Math.min(ALTAR.maxLevel, hud.altarLevel + 1)]}, unlocks buildings.`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition ${
              nextCost === null ? "border-white/10 text-white/40" : "border-[#e0b53a]/50 bg-[#e0b53a]/10 hover:border-[#e0b53a]"
            }`}
          >
            <span className="font-semibold">🔥 Altar → {Math.min(ALTAR.maxLevel, hud.altarLevel + 1)}</span>
            <span className={nextCost !== null && hud.coins < nextCost ? "text-brand-coral" : "text-[#e0b53a]"}>
              {nextCost === null ? "max" : `${nextCost}c`}
            </span>
          </button>
          <button type="button" onClick={onClose} className="ml-auto px-2 text-white/60 hover:text-white">
            close (Esc)
          </button>
        </div>
        <p className="mt-1.5 px-1 text-white/60">
          {selected
            ? `${selected.name}: ${selected.blurb} Click a tile to place · right-click or Esc to stop.`
            : "Pick a building, then click a tile on the map. Number keys work too."}
        </p>
      </div>
    </div>
  );
}
