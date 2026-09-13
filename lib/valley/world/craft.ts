export const LINEN_OUTFIT = 3;
export const TUNIC_WOOL = 2;
export const TUNIC_FLAX = 2;

export type CraftBag = {
  wool: number;
  flax: number;
  cloth: number;
};

export function canWeave(bag: CraftBag) {
  return bag.wool >= TUNIC_WOOL && bag.flax >= TUNIC_FLAX;
}

export function weave(bag: CraftBag): { ok: true; toast: string; bag: CraftBag } | { ok: false; toast: string; bag: CraftBag } {
  if (!canWeave(bag)) {
    return { ok: false, toast: "The loom needs 2 wool and 2 flax.", bag };
  }
  return {
    ok: true,
    toast: "You wove a linen tunic.",
    bag: { wool: bag.wool - TUNIC_WOOL, flax: bag.flax - TUNIC_FLAX, cloth: bag.cloth + 1 },
  };
}

export function wearTunic(
  bag: CraftBag,
  outfit: number,
): { ok: true; toast: string; bag: CraftBag; outfit: number } | { ok: false; toast: string; bag: CraftBag; outfit: number } {
  if (bag.cloth < 1) return { ok: false, toast: "Weave a tunic first.", bag, outfit };
  if (outfit === LINEN_OUTFIT) return { ok: false, toast: "You are already wearing linen.", bag, outfit };
  return {
    ok: true,
    toast: "You put on the linen tunic.",
    bag: { ...bag, cloth: bag.cloth - 1 },
    outfit: LINEN_OUTFIT,
  };
}
