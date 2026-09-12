import type { BuildingType, SkillId } from "./types";

/** Every balance number lives here so tuning never means hunting through scenes. */

export const TILE = 16;
export const MAP_W = 48;
export const MAP_H = 36;
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;

export const VIEW_W = 960;
export const VIEW_H = 600;
export const ZOOM = 2;

export const DAY_SECONDS = 240;
export const NIGHT_SECONDS = 120;
export const CYCLE_SECONDS = DAY_SECONDS + NIGHT_SECONDS;

export const SAVE_KEY = "shalom-valley-save";
export const SAVE_VERSION = 1;
export const AUTOSAVE_MS = 30_000;
export const OFFLINE_CAP_HOURS = 8;
export const OFFLINE_RENT_RATE = 0.5;
/** A return earns a dawn letter only past this many seconds gone; shorter is a silent peek. */
export const AWAY_LETTER_THRESHOLD_S = 1800;
/** Seconds before night when the ribbon takes over as the dusk warning. */
export const DUSK_WARN_S = 30;

export const PLAYER = {
  speed: 78,
  maxHealth: 100,
  maxPrayer: 100,
  hungerPerSecond: 100 / 720, // empty after ~12 minutes without eating
  hungerWeakBelow: 20,
  prayerRegenAtAltar: 22, // per second while holding E near the altar
  prayerRegenIdle: 0.6,
  castCost: 30,
  castRadius: 56,
  swordDamage: 10,
  swordRange: 22,
  swordArc: Math.PI * 0.75,
  swordCooldownMs: 320,
  invulnMs: 500,
  eatRestore: 40,
};

export const XP = {
  toNext: (level: number) => 40 + (level - 1) * 35,
  kill: 12,
  harvest: 4,
  sale: 1,
  prayTick: 1, // per second at altar
  redeem: 20,
  idol: 40,
  prophet: 60,
};

export const SKILLS: Record<
  SkillId,
  { name: string; blurb: string; max: number }
> = {
  sword: { name: "Swordsmanship", blurb: "+35% sword damage per rank", max: 3 },
  fleet: { name: "Fleetfoot", blurb: "+12% move speed per rank", max: 3 },
  faith: { name: "Faith", blurb: "+30 max prayer, +12 cast radius per rank", max: 3 },
  fortitude: { name: "Fortitude", blurb: "+30 max health, hunger 20% slower per rank", max: 3 },
  steward: { name: "Stewardship", blurb: "+15% crop yield and rent per rank", max: 3 },
};

export type BuildingDef = {
  name: string;
  cost: number;
  altarLevel: number; // required altar level to unlock
  light: number; // radius in tiles (0 = none)
  blocks: boolean;
  size: 1 | 2;
  blurb: string;
  hotkey: string;
};

export const BUILDINGS: Record<Exclude<BuildingType, "altar" | "idol">, BuildingDef> = {
  farm: { name: "Farm plot", cost: 10, altarLevel: 1, light: 0, blocks: false, size: 1, blurb: "Wheat. 3 stages, then harvest.", hotkey: "1" },
  house: { name: "House", cost: 45, altarLevel: 1, light: 4, blocks: true, size: 2, blurb: "+2 villagers. Pays rent at dawn.", hotkey: "2" },
  wall: { name: "Wall", cost: 6, altarLevel: 1, light: 0, blocks: true, size: 1, blurb: "Blocks walkers. Spirits pass.", hotkey: "3" },
  market: { name: "Market stall", cost: 30, altarLevel: 1, light: 2, blocks: true, size: 1, blurb: "Sell crops here. Auto-sell toggle.", hotkey: "4" },
  vineyard: { name: "Vineyard", cost: 24, altarLevel: 2, light: 0, blocks: false, size: 1, blurb: "Grapes. Slower, worth more.", hotkey: "5" },
  well: { name: "Well", cost: 40, altarLevel: 2, light: 3, blocks: true, size: 1, blurb: "Villagers recover. Small light.", hotkey: "6" },
  tower: { name: "Watchtower", cost: 70, altarLevel: 2, light: 3, blocks: true, size: 1, blurb: "Shoots arrows at enemies.", hotkey: "7" },
  lamp: { name: "Lamp post", cost: 18, altarLevel: 3, light: 4, blocks: false, size: 1, blurb: "Light only. Pushes the dark.", hotkey: "8" },
};

/** A tile counts as "lit" above this light value; victory when this share of tiles is lit. */
export const LIT_THRESHOLD = 0.2;
export const VICTORY_LIT_RATIO = 0.85;

export const TOWER_RANGE = 96;
export const TOWER_DAMAGE = 6;
export const TOWER_COOLDOWN_MS = 1400;

export const ALTAR = {
  maxLevel: 4,
  upgradeCost: [0, 80, 200, 450],
  light: [0, 8, 10, 12, 15],
  prayerRegenMult: [0, 1, 1.4, 1.8, 2.4],
  villagerXpMult: [0, 1, 1.5, 2, 3],
};

export const CROPS = {
  wheat: { growSeconds: 75, yield: 3, price: 4 },
  grapes: { growSeconds: 140, yield: 2, price: 11 },
};

export const HOUSE = { capacity: 2, rentPerVillagerLevel: 6, spawnDelayS: 12 };

export const VILLAGER = {
  speed: 34,
  maxLevel: 5,
  xpToNext: (level: number) => 30 + level * 25,
  prayXpPerSecond: 1.2,
  fightLevel: 3,
  banishLevel: 5,
  staffDamage: 6,
  fallDurationS: 6,
  lureToFallS: 4,
  hypnosisS: 5, // base; +2 s per villager level, half speed while the deceiver is revealed
  hp: 30,
  greetCooldownMs: 15_000,
};

export const SIN = {
  fall: 8,
  converted: 10,
  idolPlanted: 6,
  idolSmashed: -10,
  redeem: -3,
  dawnDecay: -4,
  rentHalvedAt: 50,
  extraEnemiesAt: 50,
};

export type EnemyKind = "robber" | "tempter" | "deceiver" | "spirit" | "prophet";

export type EnemyDef = {
  name: string;
  minDay: number;
  minLevel: number;
  minAltar: number;
  speed: number;
  hp: number;
  damage: number;
  bounty: number;
  swordImmune: boolean;
  ghost: boolean; // passes through walls
};

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  robber: { name: "Robber", minDay: 1, minLevel: 1, minAltar: 1, speed: 52, hp: 30, damage: 5, bounty: 7, swordImmune: false, ghost: false },
  tempter: { name: "Tempter", minDay: 2, minLevel: 2, minAltar: 1, speed: 118, hp: 14, damage: 0, bounty: 10, swordImmune: false, ghost: false },
  deceiver: { name: "Deceiver", minDay: 4, minLevel: 3, minAltar: 1, speed: 34, hp: 36, damage: 0, bounty: 14, swordImmune: false, ghost: false },
  spirit: { name: "Spirit", minDay: 6, minLevel: 4, minAltar: 2, speed: 58, hp: 1, damage: 6, bounty: 18, swordImmune: true, ghost: true },
  prophet: { name: "False Prophet", minDay: 8, minLevel: 5, minAltar: 3, speed: 30, hp: 90, damage: 4, bounty: 60, swordImmune: false, ghost: false },
};

export const WAVES = {
  // day 1 → 1 robber, day 5 → 5, day 10 → 10 (+population and sin bonuses)
  baseCount: (day: number) => 1 + Math.floor(day * 0.9),
  perPopulation: 0.25,
  sinBonus: 3,
  spawnIntervalS: 6,
  idolHp: 8,
  idolSpawnEveryS: 20,
  protectionRadius: 64,
};

export const IDOL_REWARD = 35;
export const START_COINS = 60;
export const START_WHEAT = 3;
