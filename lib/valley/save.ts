import type { AwayReport, Character, SaveData } from "./types";
import {
  AWAY_LETTER_THRESHOLD_S,
  CROPS,
  CYCLE_SECONDS,
  HOUSE,
  MAP_H,
  MAP_W,
  OFFLINE_CAP_HOURS,
  OFFLINE_RENT_RATE,
  PLAYER,
  SAVE_KEY,
  SAVE_VERSION,
  SIN,
  START_COINS,
  START_WHEAT,
  TILE,
  emptyStores,
  evenPrices,
} from "./config";
import { defaultCivic } from "./world/civic";
import { settleDawnOn } from "./world/ledger";
import { LETTER, letterLine, pickVisitName } from "./dialogue";

export const ALTAR_TILE = { tx: Math.floor(MAP_W / 2) - 1, ty: Math.floor(MAP_H / 2) - 1 };

export function newSave(character: Character): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    character,
    day: 1,
    clock: 0,
    coins: START_COINS,
    wheat: START_WHEAT,
    grapes: 0,
    olives: 0,
    flax: 0,
    meat: 0,
    wool: 0,
    beasts: [],
    bank: 0,
    stores: emptyStores(),
    prices: evenPrices(),
    titheOn: true,
    shareOn: true,
    civic: defaultCivic(),
    sin: 0,
    health: PLAYER.maxHealth,
    hunger: 100,
    thirst: 100,
    prayer: 40,
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: { sword: 0, fleet: 0, faith: 0, fortitude: 0, steward: 0 },
    autoSell: true,
    buildings: [{ type: "altar", tx: ALTAR_TILE.tx, ty: ALTAR_TILE.ty, level: 1 }],
    villagers: [],
    recruits: [],
    quests: [],
    unlocks: { weapon: false, goliathBoss: false, building: false, abilities: [], blessing: false },
    discovered: [],
    introSeen: false,
    player: { x: (ALTAR_TILE.tx + 1) * TILE, y: (ALTAR_TILE.ty + 4) * TILE },
    stats: { kills: 0, redeemed: 0, fallen: 0, idolsSmashed: 0 },
    tutorialStep: 0,
    won: false,
  };
}

export function loadSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!data || typeof data !== "object" || data.version !== SAVE_VERSION) return null;
    if (!data.character || !Array.isArray(data.buildings)) return null;
    if (!data.civic) data.civic = defaultCivic();
    if (!data.civic.laws) data.civic.laws = [];
    if (!data.civic.nextLawId) data.civic.nextLawId = 1;
    if (data.meat == null) data.meat = 0;
    if (data.wool == null) data.wool = 0;
    if (!data.beasts) data.beasts = [];
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // storage full or blocked: play on without persistence
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/** Worldtime (seconds) for a save: used for crop growth. */
export function worldTime(save: Pick<SaveData, "day" | "clock">) {
  return (save.day - 1) * CYCLE_SECONDS + save.clock;
}

/**
 * Apply elapsed real time since the last save (capped). Crops keep growing,
 * rent accrues at half rate per dawn passed. No raids, no sin, no clock change.
 * Short absences (tab switch, quick refresh) apply silently with no letter.
 */
export function applyOfflineProgress(save: SaveData, now = Date.now()): { save: SaveData; report: AwayReport | null } {
  const elapsedMs = Math.max(0, now - (save.savedAt ?? now));
  const capped = Math.min(elapsedMs / 1000, OFFLINE_CAP_HOURS * 3600);
  if (capped < AWAY_LETTER_THRESHOLD_S) return { save, report: null };

  const next: SaveData = { ...save, buildings: save.buildings.map((b) => ({ ...b })) };
  const t = worldTime(save);
  let cropsGrown = 0;
  for (const b of next.buildings) {
    if (b.type !== "farm" && b.type !== "vineyard" && b.type !== "flax" && b.type !== "grove") continue;
    if ((b.stage ?? 0) >= 3) continue;
    const grow =
      b.type === "farm"
        ? CROPS.wheat.growSeconds
        : b.type === "vineyard"
          ? CROPS.grapes.growSeconds
          : b.type === "flax"
            ? CROPS.flax.growSeconds
            : CROPS.olives.growSeconds;
    const planted = b.plantedAt ?? t;
    const stageAfter = Math.min(3, Math.floor(((t - planted + capped) / grow) * 3));
    if (stageAfter === 3) cropsGrown++;
    b.stage = stageAfter;
  }

  const dawns = Math.floor(capped / CYCLE_SECONDS);
  const stewardMult = 1 + next.skills.steward * 0.15;
  let rentPerDawn = 0;
  for (const v of next.villagers) rentPerDawn += v.level * HOUSE.rentPerVillagerLevel * stewardMult;
  if (next.sin > SIN.rentHalvedAt) rentPerDawn *= 0.5;
  let rent = 0;
  for (let i = 0; i < dawns; i++) {
    const books = settleDawnOn(next, next.villagers.length, rentPerDawn * OFFLINE_RENT_RATE, 0);
    rent += books.rentPaid;
  }

  const villagerName = next.villagers.length > 0 ? pickVisitName(next.villagers[0].seed) : null;
  const storyLine =
    cropsGrown > 0
      ? letterLine(LETTER.storyCrops)
      : villagerName
        ? letterLine(LETTER.storyNamed, villagerName)
        : letterLine(LETTER.storyQuiet);
  const voiceLine = villagerName ? letterLine(LETTER.voiceNamed, villagerName) : letterLine(LETTER.voiceValley);

  return {
    save: next,
    report: {
      hours: Math.round((capped / 3600) * 10) / 10,
      cropsGrown,
      rent,
      storyLine,
      voiceLine,
      villagerName,
    },
  };
}
