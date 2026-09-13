import type { BuildingType, CropKind, SkillId } from "./types";

/** Every balance number lives here so tuning never means hunting through scenes. */

export const TILE = 16;
export const MAP_W = 64;
export const MAP_H = 48;
/** Fixed seed so every save sees the same valley — only buildings are persisted, not terrain. */
export const MAP_SEED = 7331;
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;

export const VIEW_W = 960;
export const VIEW_H = 600;
export const ZOOM = 2.15;
/** Cinematic zoom targets. Wheel multiplies these, then we clamp. */
export const ZOOM_MODES = {
  explore: 2.15,
  highland: 1.95,
  landmark: 2.55,
  pray: 2.7,
  talk: 2.6,
  dusk: 1.9,
  night: 1.75,
  dawn: 1.85,
} as const;
export const ZOOM_WHEEL_MIN = 1.45;
export const ZOOM_WHEEL_MAX = 3.1;
export const LOOK_AHEAD = 38;

export const DAY_SECONDS = 240;
export const NIGHT_SECONDS = 120;
export const CYCLE_SECONDS = DAY_SECONDS + NIGHT_SECONDS;

export const SAVE_KEY = "shalom-valley-save";
export const SAVE_VERSION = 11;
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
  thirstPerSecond: 100 / 600, // empty after ~10 minutes without drinking
  thirstWeakBelow: 18,
  drinkRestore: 38,
  shallowDrinkPerSecond: 14,
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
  goliath: 140,
  raidLeader: 40,
  baal: 160,
  moloch: 180,
  dragon: 220,
};

export const SKILLS: Record<
  SkillId,
  { name: string; blurb: string; max: number }
> = {
  sword: { name: "Swordsmanship", blurb: "+35% sword damage per rank", max: 5 },
  fleet: { name: "Fleetfoot", blurb: "+12% move speed per rank", max: 5 },
  faith: { name: "Faith", blurb: "+30 max prayer, +12 cast radius per rank", max: 5 },
  fortitude: { name: "Fortitude", blurb: "+30 max health, hunger and thirst 12% slower per rank", max: 5 },
  steward: { name: "Stewardship", blurb: "+15% crop yield and rent per rank", max: 5 },
  ward: { name: "Ward", blurb: "8% less damage taken per rank, capped with armor", max: 5 },
  hunter: { name: "Hunter", blurb: "Richer bounties and a better chance at gear drops", max: 5 },
};

export const emptySkills = (): Record<SkillId, number> => ({
  sword: 0,
  fleet: 0,
  faith: 0,
  fortitude: 0,
  steward: 0,
  ward: 0,
  hunter: 0,
});

export const emptyUnlocks = () => ({
  weapon: false,
  goliathBoss: false,
  goliathDefeated: false,
  baalBoss: false,
  baalDefeated: false,
  molochBoss: false,
  molochDefeated: false,
  dragonBoss: false,
  dragonDefeated: false,
  jesusComing: false,
  judgmentReady: false,
  judged: false,
  building: false,
  abilities: [] as import("./types").BigRecruitId[],
  blessing: false,
});

export type BuildingDef = {
  name: string;
  cost: number;
  altarLevel: number; // required altar level to unlock
  light: number; // radius in tiles (0 = none)
  blocks: boolean;
  size: 1 | 2;
  blurb: string;
  hotkey: string;
  /** Questline that must be completed before this shows as buildable. */
  requiresQuest?: "noah";
  /** Only placeable on water tiles (and makes them walkable). */
  onWater?: boolean;
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
  bridge: { name: "Bridge", cost: 20, altarLevel: 2, light: 0, blocks: false, size: 1, blurb: "Crosses the river. Place on water.", hotkey: "9", onWater: true },
  beacon: { name: "Beacon", cost: 110, altarLevel: 3, light: 7, blocks: true, size: 1, blurb: "A great fire. Lights far ground.", hotkey: "0" },
  granary: {
    name: "Granary",
    cost: 60,
    altarLevel: 2,
    light: 1,
    blocks: true,
    size: 2,
    blurb: "Noah's storehouse. Nearby harvests +1.",
    hotkey: "-",
    requiresQuest: "noah",
  },
  flax: { name: "Flax plot", cost: 14, altarLevel: 1, light: 0, blocks: false, size: 1, blurb: "Flax. Blue flowers, sells well.", hotkey: "[" },
  grove: { name: "Olive grove", cost: 28, altarLevel: 2, light: 0, blocks: false, size: 1, blurb: "Olives. Slow. Eating also drinks.", hotkey: "=" },
  store: { name: "Storehouse", cost: 35, altarLevel: 1, light: 1, blocks: true, size: 2, blurb: "Village grain. Deposit crops (E).", hotkey: ";" },
  changer: { name: "Money changer", cost: 40, altarLevel: 1, light: 2, blocks: true, size: 1, blurb: "Bank. Deposit coins (E). Earns at dawn.", hotkey: "]" },
  hall: { name: "Town hall", cost: 55, altarLevel: 2, light: 3, blocks: true, size: 2, blurb: "Edicts, court, offices. Press G. E to enter.", hotkey: "." },
  fold: { name: "Sheepfold", cost: 28, altarLevel: 1, light: 1, blocks: true, size: 2, blurb: "Raise sheep and goats. Wool at dawn.", hotkey: "," },
  temple: { name: "Temple", cost: 90, altarLevel: 3, light: 4, blocks: true, size: 2, blurb: "Offer a gift. Lowers sin. E to enter.", hotkey: "'" },
  loom: { name: "Loom", cost: 40, altarLevel: 2, light: 1, blocks: true, size: 2, blurb: "Weave wool and flax into a tunic.", hotkey: "/" },
};

export const CROP_KINDS = ["wheat", "grapes", "olives", "flax"] as const;

export const emptyStores = (): Record<CropKind, number> => ({ wheat: 0, grapes: 0, olives: 0, flax: 0 });
export const evenPrices = (): Record<CropKind, number> => ({ wheat: 1, grapes: 1, olives: 1, flax: 1 });

export const ECONOMY = {
  titheRate: 0.1,
  wagePerVillager: 2,
  interestGood: 0.02,
  interestMid: 0.01,
  bankRunSin: 50,
  bankRunLoss: 0.15,
  bankRunMinSpawns: 3,
  priceFloor: 0.6,
  priceCeil: 1.8,
  glutPerUnit: 0.025,
  priceRecover: 0.08,
  raidPriceBump: 0.12,
  shareSinRelief: -2,
  hungrySin: 3,
  hoardSin: 4,
  unpaidWageSin: 3,
  titheSinRelief: -1,
};

export const CIVIC = {
  startLoyalty: 70,
  fineCoins: 8,
  mercyLoyalty: 3,
  fineLoyalty: 1,
  exileLoyalty: -4,
  ignoreLoyalty: -4,
  ignoreSin: 2,
  exileSin: -6,
  fineSin: -2,
  highLoyalty: 80,
  lowLoyalty: 40,
  highLoyaltyRent: 1,
  lowLoyaltyRent: -1,
  lowLoyaltySin: 2,
  conscriptionWage: 1,
  conscriptionLoyalty: -1,
  conscriptionFightLevel: 2,
  conscriptionDamage: 1.12,
  openGatesSpawn: 2,
  openGatesRent: 1,
  curfewSpawn: -1,
  watchmanSpawn: -1,
  treasurerInterest: 0.005,
  scribeLoyalty: 2,
  mosesMercy: 2,
  mosesExile: 2,
  sanctuaryHypnoMult: 0.4,
  sanctuaryCastBonus: 14,
  hoardStores: 80,
  maxLaws: 8,
};

export const FLOCK = {
  woolPerSheep: 1,
  meatOnHunt: 2,
  woolOnHunt: 1,
  woolPrice: 5,
  meatRestore: 50,
  gazelleCount: 7,
  startSheep: 2,
};

export const GRANARY_RADIUS_TILES = 5;
export const GRANARY_BONUS = 1;

/** A tile counts as "lit" above this light value; victory when this share of land tiles is lit. */
export const LIT_THRESHOLD = 0.2;
export const VICTORY_LIT_RATIO = 0.75;
/** Radius (tiles) of the player's own lantern glow — visual only, never counts as lit ground. */
export const LANTERN_TILES = 3.5;

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
  flax: { growSeconds: 95, yield: 3, price: 6 },
  olives: { growSeconds: 160, yield: 2, price: 13 },
};

export const CROP_BUILDINGS = {
  farm: "wheat",
  vineyard: "grapes",
  flax: "flax",
  grove: "olives",
} as const;

export type CropBuilding = keyof typeof CROP_BUILDINGS;

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

export type EnemyKind =
  | "robber"
  | "tempter"
  | "deceiver"
  | "spirit"
  | "prophet"
  | "goliath"
  | "raidLeader"
  | "baal"
  | "moloch"
  | "dragon";

export const NAMED_BOSSES: EnemyKind[] = ["goliath", "baal", "moloch", "dragon"];

export function isNamedBoss(kind: EnemyKind) {
  return NAMED_BOSSES.includes(kind);
}

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
  /** Extra melee reach past the sword tip. Bosses need this so a slam can be answered. */
  hitRadius?: number;
};

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  robber: { name: "Robber", minDay: 1, minLevel: 1, minAltar: 1, speed: 52, hp: 30, damage: 5, bounty: 7, swordImmune: false, ghost: false },
  tempter: { name: "Tempter", minDay: 2, minLevel: 2, minAltar: 1, speed: 118, hp: 14, damage: 0, bounty: 10, swordImmune: false, ghost: false },
  deceiver: { name: "Deceiver", minDay: 4, minLevel: 3, minAltar: 1, speed: 34, hp: 36, damage: 0, bounty: 14, swordImmune: false, ghost: false },
  spirit: { name: "Spirit", minDay: 6, minLevel: 4, minAltar: 2, speed: 58, hp: 1, damage: 6, bounty: 18, swordImmune: true, ghost: true },
  prophet: { name: "False Prophet", minDay: 8, minLevel: 5, minAltar: 3, speed: 30, hp: 90, damage: 4, bounty: 60, swordImmune: false, ghost: false },
  goliath: { name: "Goliath", minDay: 99, minLevel: 99, minAltar: 99, speed: 26, hp: 220, damage: 12, bounty: 80, swordImmune: false, ghost: false, hitRadius: 38 },
  raidLeader: { name: "Raid captain", minDay: 99, minLevel: 99, minAltar: 99, speed: 48, hp: 80, damage: 8, bounty: 28, swordImmune: false, ghost: false, hitRadius: 16 },
  baal: { name: "Baal", minDay: 99, minLevel: 99, minAltar: 99, speed: 28, hp: 240, damage: 8, bounty: 90, swordImmune: false, ghost: false, hitRadius: 36 },
  moloch: { name: "Moloch", minDay: 99, minLevel: 99, minAltar: 99, speed: 24, hp: 280, damage: 14, bounty: 100, swordImmune: false, ghost: false, hitRadius: 40 },
  dragon: { name: "The dragon", minDay: 99, minLevel: 99, minAltar: 99, speed: 34, hp: 320, damage: 16, bounty: 140, swordImmune: false, ghost: false, hitRadius: 42 },
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

/** What each Big Recruit's unlock actually does once earned. */
export const UNLOCK_FX = {
  /** David — a real blade: damage and reach. */
  weaponDamageMult: 1.5,
  weaponRangeBonus: 8,
  /** Moses — casting also strikes the wicked in the ring. */
  staffCastDamage: 14,
  /** Paul — casting reveals hidden deceivers this far out; hypnosis takes twice as long. */
  clearSightRadiusMult: 2,
  clearSightHypnoMult: 0.5,
  /** Holy Ghost — spirit refills away from the altar; dawn washes more sin. */
  blessingIdleRegenMult: 4,
  blessingDawnDecayMult: 2,
};

/** Discovering a landmark for the first time. */
export const DISCOVER_XP = 25;
export const DISCOVER_RADIUS_TILES = 2.2;
export const SECRET_DISCOVER_RADIUS_TILES = 0.95;
