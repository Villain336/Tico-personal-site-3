export type NightKind = "night" | "raid" | "siege";

export type WarState = {
  raidsCleared: number;
  mustered: boolean;
  siegeNext: boolean;
  lastNight: NightKind;
  victories: number;
  forceKind: NightKind | null;
};

export const MUSTER_COST = 40;

export function emptyWar(): WarState {
  return { raidsCleared: 0, mustered: false, siegeNext: false, lastNight: "night", victories: 0, forceKind: null };
}

export function pickNightKind(input: {
  goliathDefeated: boolean;
  siegeNext: boolean;
  forceKind: NightKind | null;
  lastNight: NightKind;
  raidsCleared: number;
  day: number;
  rng: () => number;
}): NightKind {
  if (input.forceKind) return input.forceKind;
  if (input.siegeNext) return "siege";
  if (!input.goliathDefeated) return "night";
  if (input.lastNight !== "night") return "night";
  if (input.raidsCleared === 0) return input.day >= 2 && input.rng() < 0.7 ? "raid" : "night";
  return input.rng() < 0.35 ? "raid" : "night";
}

export function raidExtra(kind: NightKind) {
  if (kind === "siege") return 10;
  if (kind === "raid") return 6;
  return 0;
}

export function raidCap(kind: NightKind) {
  if (kind === "siege") return 28;
  if (kind === "raid") return 26;
  return 22;
}

export function nightCount(base: number, kind: NightKind) {
  return Math.max(1, Math.min(raidCap(kind), base + raidExtra(kind)));
}

export type MusterCheck = { ok: true } | { ok: false; reason: string };

export function canMuster(input: {
  hasHall: boolean;
  conscription: boolean;
  coins: number;
  bank: number;
  dragonDefeated: boolean;
  goliathDefeated: boolean;
  raidsCleared: number;
  siegeNext: boolean;
  cost?: number;
}): MusterCheck {
  const cost = input.cost ?? MUSTER_COST;
  if (input.dragonDefeated) return { ok: false, reason: "The outer dark already broke. The war is over." };
  if (!input.goliathDefeated) return { ok: false, reason: "Goliath still stands." };
  if (input.raidsCleared < 1) return { ok: false, reason: "Break a raid first. The idol city has not shown its banners." };
  if (!input.hasHall) return { ok: false, reason: "Build a town hall first." };
  if (!input.conscription) return { ok: false, reason: "Raise conscription before you muster a host." };
  if (input.siegeNext) return { ok: false, reason: "The host is already mustered. Night will bring the siege." };
  if (input.coins + input.bank < cost) return { ok: false, reason: `A host costs ${cost} coins (bank, then purse).` };
  return { ok: true };
}

export function payMuster(coins: number, bank: number, cost = MUSTER_COST) {
  const fromBank = Math.min(bank, cost);
  const rest = cost - fromBank;
  return { coins: coins - rest, bank: bank - fromBank };
}

export function unlockAfterCaptain(raidsCleared: number, baalDefeated: boolean) {
  return { raidsCleared: raidsCleared + 1, unlockBaal: !baalDefeated };
}

export function nextNamedBoss(unlocks: {
  goliathBoss: boolean;
  goliathDefeated: boolean;
  baalBoss: boolean;
  baalDefeated: boolean;
  molochBoss: boolean;
  molochDefeated: boolean;
  dragonBoss: boolean;
  dragonDefeated: boolean;
}): "goliath" | "baal" | "moloch" | "dragon" | null {
  if (unlocks.goliathBoss && !unlocks.goliathDefeated) return "goliath";
  if (unlocks.baalBoss && !unlocks.baalDefeated) return "baal";
  if (unlocks.molochBoss && !unlocks.molochDefeated) return "moloch";
  if (unlocks.dragonBoss && !unlocks.dragonDefeated) return "dragon";
  return null;
}
