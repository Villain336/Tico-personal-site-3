export const MAX_OFFERS_PER_DAWN = 2;

export type GiftId = "wheat" | "coins" | "meat" | "wool" | "greater";

export type Gift = {
  id: GiftId;
  label: string;
  sin: number;
  wheat?: number;
  coins?: number;
  meat?: number;
  wool?: number;
};

export const GIFTS: Gift[] = [
  { id: "wheat", label: "4 wheat", sin: -3, wheat: 4 },
  { id: "coins", label: "8 coins", sin: -3, coins: 8 },
  { id: "meat", label: "1 meat", sin: -6, meat: 1 },
  { id: "wool", label: "2 wool", sin: -6, wool: 2 },
  { id: "greater", label: "20 coins and 2 wheat", sin: -10, coins: 20, wheat: 2 },
];

export type WorshipBag = {
  sin: number;
  coins: number;
  wheat: number;
  meat: number;
  wool: number;
  templeOffersToday: number;
};

export function canAfford(bag: WorshipBag, gift: Gift) {
  if ((gift.wheat ?? 0) > bag.wheat) return false;
  if ((gift.coins ?? 0) > bag.coins) return false;
  if ((gift.meat ?? 0) > bag.meat) return false;
  if ((gift.wool ?? 0) > bag.wool) return false;
  return true;
}

export function firstAffordable(bag: WorshipBag) {
  return GIFTS.find((g) => canAfford(bag, g)) ?? null;
}

export function applyOffer(bag: WorshipBag, giftId?: GiftId): { ok: true; toast: string; bag: WorshipBag } | { ok: false; toast: string; bag: WorshipBag } {
  if (bag.templeOffersToday >= MAX_OFFERS_PER_DAWN) {
    return { ok: false, toast: "Two gifts is enough for this dawn.", bag };
  }
  const gift = (giftId && GIFTS.find((g) => g.id === giftId)) || firstAffordable(bag);
  if (!gift) return { ok: false, toast: "The temple waits for a gift you can spare.", bag };
  if (!canAfford(bag, gift)) return { ok: false, toast: "That gift is more than you have.", bag };

  const next: WorshipBag = {
    ...bag,
    wheat: bag.wheat - (gift.wheat ?? 0),
    coins: bag.coins - (gift.coins ?? 0),
    meat: bag.meat - (gift.meat ?? 0),
    wool: bag.wool - (gift.wool ?? 0),
    templeOffersToday: bag.templeOffersToday + 1,
    sin: Math.max(0, bag.sin + gift.sin),
  };
  return { ok: true, toast: `A gift at the temple: ${gift.label}. Sin ${gift.sin}.`, bag: next };
}
