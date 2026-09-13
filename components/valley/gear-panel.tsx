"use client";

import type { GearId, GearSlot, HudState } from "@/lib/valley/types";
import { GEAR, GEAR_SLOTS } from "@/lib/valley/world/gear";
import { Modal, ModalButton } from "./modal";

const SLOT_LABEL: Record<GearSlot, string> = {
  blade: "Blade",
  wrap: "Wrap",
  lamp: "Lamp",
};

export function GearPanel({
  hud,
  onEquip,
  onUnequip,
  onClose,
}: {
  hud: HudState;
  onEquip: (id: GearId) => void;
  onUnequip: (slot: GearSlot) => void;
  onClose: () => void;
}) {
  const gear = hud.gear;
  return (
    <Modal title="Gear" onClose={onClose}>
      <p className="text-xs text-white/60">
        Scraps {hud.scraps} · Relics {hud.relics}. Equip from the bag. Armor stacks with Ward.
      </p>
      <ul className="space-y-2">
        {GEAR_SLOTS.map((slot) => {
          const id = gear[slot];
          const def = id ? GEAR[id] : null;
          return (
            <li key={slot} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/45">{SLOT_LABEL[slot]}</p>
                <p className="text-sm font-semibold">{def ? def.name : "Empty"}</p>
                <p className="text-xs text-white/60">{def ? def.blurb : "Nothing in this slot."}</p>
              </div>
              {id && (
                <button
                  type="button"
                  onClick={() => onUnequip(slot)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80 hover:bg-white/10"
                >
                  Unequip
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-white/45">Bag</p>
        {gear.bag.length === 0 ? (
          <p className="text-xs text-white/50">Empty. Robbers and bosses drop gear.</p>
        ) : (
          <ul className="space-y-2">
            {gear.bag.map((id, i) => (
              <li key={`${id}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{GEAR[id].name}</p>
                  <p className="text-xs text-white/60">{GEAR[id].blurb}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEquip(id)}
                  className="rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-[#12121a]"
                >
                  Equip
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ModalButton onClick={onClose} variant="ghost">
        Close (I)
      </ModalButton>
    </Modal>
  );
}
