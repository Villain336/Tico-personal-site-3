import type { EnemyKind } from "../config";
import type { GearId, GearSlot, GearState } from "../types";

export type GearDef = {
  id: GearId;
  slot: GearSlot;
  name: string;
  blurb: string;
  unique: boolean;
  damageMult: number;
  rangeBonus: number;
  armor: number;
  lanternBonus: number;
};

export const GEAR: Record<GearId, GearDef> = {
  davidsBlade: {
    id: "davidsBlade",
    slot: "blade",
    name: "David's blade",
    blurb: "+50% sword damage and longer reach.",
    unique: true,
    damageMult: 1.5,
    rangeBonus: 8,
    armor: 0,
    lanternBonus: 0,
  },
  scrapBlade: {
    id: "scrapBlade",
    slot: "blade",
    name: "Scrap blade",
    blurb: "+20% sword damage and a little more reach.",
    unique: false,
    damageMult: 1.2,
    rangeBonus: 4,
    armor: 0,
    lanternBonus: 0,
  },
  hideWrap: {
    id: "hideWrap",
    slot: "wrap",
    name: "Hide wrap",
    blurb: "Softens blows. 15% less damage taken.",
    unique: false,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0.15,
    lanternBonus: 0,
  },
  goliathMail: {
    id: "goliathMail",
    slot: "wrap",
    name: "Goliath's mail",
    blurb: "Bronze from the giant. 35% less damage taken.",
    unique: true,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0.35,
    lanternBonus: 0,
  },
  prophetLamp: {
    id: "prophetLamp",
    slot: "lamp",
    name: "Prophet's lamp",
    blurb: "A stolen light. Your lantern reaches farther.",
    unique: true,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0,
    lanternBonus: 2,
  },
  raidBanner: {
    id: "raidBanner",
    slot: "lamp",
    name: "Raid banner",
    blurb: "A captured hill-flag. Your lantern reaches a little farther.",
    unique: true,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0,
    lanternBonus: 1.2,
  },
  baalsCenser: {
    id: "baalsCenser",
    slot: "lamp",
    name: "Baal's censer",
    blurb: "Stolen fire. Your lantern reaches much farther.",
    unique: true,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0,
    lanternBonus: 3,
  },
  molochBrand: {
    id: "molochBrand",
    slot: "blade",
    name: "Moloch's brand",
    blurb: "+70% sword damage. A furnace-iron blade.",
    unique: true,
    damageMult: 1.7,
    rangeBonus: 6,
    armor: 0,
    lanternBonus: 0,
  },
  dragonScale: {
    id: "dragonScale",
    slot: "wrap",
    name: "Dragon scale",
    blurb: "Hide of the outer dark. 45% less damage taken.",
    unique: true,
    damageMult: 1,
    rangeBonus: 0,
    armor: 0.45,
    lanternBonus: 0,
  },
};

export const GEAR_SLOTS: GearSlot[] = ["blade", "wrap", "lamp"];
export const ARMOR_CAP = 0.65;
export const WARD_PER_RANK = 0.08;
export const HUNTER_SCRAP_PER_RANK = 0.2;
export const HUNTER_BOUNTY_PER_RANK = 0.1;
export const HUNTER_GEAR_PER_RANK = 0.05;
export const UNIQUE_DUPLICATE_SCRAPS = 4;

const EMPTY_BLADE: Pick<GearDef, "damageMult" | "rangeBonus"> = { damageMult: 1, rangeBonus: 0 };

export function emptyGear(): GearState {
  return { blade: null, wrap: null, lamp: null, scraps: 0, bag: [] };
}

export function ownsGear(gear: GearState, id: GearId) {
  return gear.blade === id || gear.wrap === id || gear.lamp === id || gear.bag.includes(id);
}

export function equippedDef(gear: GearState, slot: GearSlot): GearDef | null {
  const id = gear[slot];
  return id ? GEAR[id] : null;
}

export function bladeStats(gear: GearState) {
  const blade = equippedDef(gear, "blade");
  return blade ? { damageMult: blade.damageMult, rangeBonus: blade.rangeBonus } : EMPTY_BLADE;
}

export function wrapArmor(gear: GearState) {
  return equippedDef(gear, "wrap")?.armor ?? 0;
}

export function lanternBonus(gear: GearState) {
  return equippedDef(gear, "lamp")?.lanternBonus ?? 0;
}

export function incomingDamage(raw: number, wrap: number, wardRank: number) {
  if (raw <= 0) return 0;
  const reduced = raw * (1 - Math.min(ARMOR_CAP, wrap + wardRank * WARD_PER_RANK));
  return Math.max(0, reduced);
}

export function bountyCoins(base: number, hunterRank: number) {
  return Math.max(0, Math.round(base * (1 + hunterRank * HUNTER_BOUNTY_PER_RANK)));
}

export function grantGear(gear: GearState, id: GearId): { gear: GearState; equipped: boolean } {
  const slot = GEAR[id].slot;
  if (!gear[slot]) return { gear: { ...gear, [slot]: id, bag: [...gear.bag] }, equipped: true };
  return { gear: { ...gear, bag: [...gear.bag, id] }, equipped: false };
}

export function equipGear(gear: GearState, id: GearId): GearState | null {
  const slot = GEAR[id].slot;
  const bagIdx = gear.bag.indexOf(id);
  if (bagIdx < 0 && gear[slot] !== id) return null;
  if (gear[slot] === id) return { ...gear, bag: [...gear.bag] };
  const bag = gear.bag.filter((_, i) => i !== bagIdx);
  const current = gear[slot];
  if (current) bag.push(current);
  return { ...gear, bag, [slot]: id };
}

export function unequipSlot(gear: GearState, slot: GearSlot): GearState {
  const id = gear[slot];
  if (!id) return { ...gear, bag: [...gear.bag] };
  return { ...gear, [slot]: null, bag: [...gear.bag, id] };
}

export type DropRoll = {
  scraps: number;
  relic: boolean;
  gear: GearId | null;
};

type DropTable = {
  scraps: (roll: number) => number;
  relic: boolean;
  gear: { id: GearId; chance: number }[];
};

const DROPS: Record<EnemyKind, DropTable> = {
  robber: {
    scraps: (roll) => Math.floor(roll * 3),
    relic: false,
    gear: [
      { id: "scrapBlade", chance: 0.06 },
      { id: "hideWrap", chance: 0.18 },
    ],
  },
  tempter: {
    scraps: (roll) => (roll < 0.55 ? 1 : 0),
    relic: false,
    gear: [{ id: "hideWrap", chance: 0.08 }],
  },
  deceiver: {
    scraps: (roll) => 1 + Math.floor(roll * 2),
    relic: false,
    gear: [{ id: "prophetLamp", chance: 0.06 }],
  },
  spirit: {
    scraps: () => 0,
    relic: false,
    gear: [],
  },
  prophet: {
    scraps: (roll) => 3 + Math.floor(roll * 3),
    relic: true,
    gear: [{ id: "prophetLamp", chance: 0.45 }],
  },
  goliath: {
    scraps: () => 8,
    relic: true,
    gear: [{ id: "goliathMail", chance: 1 }],
  },
  raidLeader: {
    scraps: () => 5,
    relic: false,
    gear: [{ id: "raidBanner", chance: 1 }],
  },
  baal: {
    scraps: () => 10,
    relic: true,
    gear: [{ id: "baalsCenser", chance: 1 }],
  },
  moloch: {
    scraps: () => 12,
    relic: true,
    gear: [{ id: "molochBrand", chance: 1 }],
  },
  dragon: {
    scraps: () => 16,
    relic: true,
    gear: [{ id: "dragonScale", chance: 1 }],
  },
};

export function rollEnemyDrop(kind: EnemyKind, hunterRank: number, rng: () => number): DropRoll {
  const table = DROPS[kind];
  const scraps = Math.max(0, Math.round(table.scraps(rng()) * (1 + hunterRank * HUNTER_SCRAP_PER_RANK)));
  const boost = hunterRank * HUNTER_GEAR_PER_RANK;
  const gearRoll = rng();
  let gear: GearId | null = null;
  for (const entry of table.gear) {
    if (gearRoll < entry.chance + boost) {
      gear = entry.id;
      break;
    }
  }
  return { scraps, relic: table.relic, gear };
}

export function applyDrop(gear: GearState, roll: DropRoll): { gear: GearState; gained: GearId | null; extraScraps: number } {
  let next: GearState = { ...gear, bag: [...gear.bag], scraps: gear.scraps + roll.scraps };
  let extraScraps = 0;
  let gained: GearId | null = null;
  if (roll.gear) {
    if (GEAR[roll.gear].unique && ownsGear(next, roll.gear)) {
      extraScraps = UNIQUE_DUPLICATE_SCRAPS;
      next.scraps += extraScraps;
    } else {
      const granted = grantGear(next, roll.gear);
      next = granted.gear;
      gained = roll.gear;
    }
  }
  return { gear: next, gained, extraScraps };
}
