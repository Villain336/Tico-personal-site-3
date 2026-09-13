import type { NightKind, WarState } from "./world/war";

export type Gender = "man" | "woman";

export type Character = {
  name: string;
  gender: Gender;
  skin: number; // index into SKIN_TONES
  hairStyle: number; // 0..2
  hairColor: number; // index into HAIR_COLORS
  face: number; // 0..2
  body: number; // 0 slim, 1 average, 2 broad
  outfit: number; // 0 shepherd, 1 merchant, 2 warrior, 3 linen
};

export type BuildingType =
  | "altar"
  | "farm"
  | "vineyard"
  | "house"
  | "well"
  | "wall"
  | "tower"
  | "market"
  | "lamp"
  | "bridge"
  | "beacon"
  | "granary"
  | "flax"
  | "grove"
  | "store"
  | "changer"
  | "hall"
  | "fold"
  | "temple"
  | "loom"
  | "idol";

export type CropKind = "wheat" | "grapes" | "olives" | "flax";

export type SkillId = "sword" | "fleet" | "faith" | "fortitude" | "steward" | "ward" | "hunter";

export type GearSlot = "blade" | "wrap" | "lamp";
export type GearId =
  | "davidsBlade"
  | "scrapBlade"
  | "hideWrap"
  | "goliathMail"
  | "prophetLamp"
  | "raidBanner"
  | "baalsCenser"
  | "molochBrand"
  | "dragonScale";

export type GearState = {
  blade: GearId | null;
  wrap: GearId | null;
  lamp: GearId | null;
  scraps: number;
  bag: GearId[];
};

export type SavedBuilding = {
  type: BuildingType;
  tx: number;
  ty: number;
  // farm/vineyard growth 0..3 (3 = ready); altar level 1..4; idol hp
  stage?: number;
  level?: number;
  plantedAt?: number;
};

export type SavedVillager = {
  seed: number;
  gender: Gender;
  level: number;
  xp: number;
  tx: number;
  ty: number;
};

export type BigRecruitId = "moses" | "david" | "paul" | "noah" | "holyGhost";
export type ScatteredRecruitId = "deborah" | "gideon" | "ruth";
export type RecruitId = BigRecruitId | ScatteredRecruitId;

export type RecruitRole = "guard" | "harvester" | "healer" | null;
export type DeploymentMode = "follow" | "station";

export type SavedRecruit = {
  id: RecruitId;
  mode: DeploymentMode | null;
  station?: { x: number; y: number };
};

export type QuestState = "available" | "active" | "ready" | "completed";

export type SavedQuest = {
  id: BigRecruitId;
  state: QuestState;
  progress: number;
};

export type Unlocks = {
  weapon: boolean;
  goliathBoss: boolean;
  goliathDefeated: boolean;
  baalBoss: boolean;
  baalDefeated: boolean;
  molochBoss: boolean;
  molochDefeated: boolean;
  dragonBoss: boolean;
  dragonDefeated: boolean;
  building: boolean;
  abilities: BigRecruitId[];
  blessing: boolean;
};

export type EdictId = "curfew" | "openGates" | "sanctuary" | "conscription";
export type StatuteId = "noIdols" | "protectWeak" | "keepSabbath" | "openHand";
export type OfficeId = "watchman" | "scribe" | "treasurer";
export type CaseKind = "fall" | "nightSale" | "idol" | "hoard" | "hunt" | "custom";
export type LawIntent =
  | "curfew"
  | "openGates"
  | "sanctuary"
  | "conscription"
  | "noIdols"
  | "protectWeak"
  | "keepSabbath"
  | "openHand"
  | "noHunt"
  | "kindToBeasts"
  | "stayLit"
  | "tithe";

export type WrittenLaw = {
  id: string;
  text: string;
  intents: LawIntent[];
};

export type BeastKind = "sheep" | "goat" | "gazelle";

export type SavedBeast = {
  kind: BeastKind;
  tame: boolean;
  x: number;
  y: number;
};
export type Verdict = "mercy" | "fine" | "exile";
export type TitheRate = 0 | 10 | 20;
export type StewardId = RecruitId | "self";

export type CivicCase = {
  id: string;
  kind: CaseKind;
  day: number;
  accused: string;
  accusedSeed?: number;
  note: string;
};

export type CivicState = {
  loyalty: number;
  steward: StewardId | null;
  edicts: Record<EdictId, boolean>;
  statutes: Record<StatuteId, boolean>;
  titheRate: TitheRate;
  offices: Partial<Record<OfficeId, number>>;
  docket: CivicCase[];
  nextCaseId: number;
  /** Player-written laws. NPCs compile these into intents they can keep. */
  laws: WrittenLaw[];
  nextLawId: number;
};

export type LandmarkId =
  | "shepherdCamp"
  | "boatyard"
  | "standingStones"
  | "milestone"
  | "cave"
  | "ancientOlive"
  | "cistern"
  | "mamre"
  | "beersheba"
  | "cherith"
  | "mizpah"
  | "jacobWell"
  | "enGedi";

export type SaveData = {
  version: number;
  savedAt: number;
  character: Character;
  day: number;
  /** seconds into the current day/night cycle */
  clock: number;
  coins: number;
  wheat: number;
  grapes: number;
  olives: number;
  flax: number;
  meat: number;
  wool: number;
  cloth: number;
  relics: number;
  templeOffersToday: number;
  gear: GearState;
  beasts: SavedBeast[];
  /** Coins held by the money changer. */
  bank: number;
  /** Grain in the storehouse / granary. */
  stores: Record<CropKind, number>;
  /** Price multipliers vs the crop table (glut and raids move these). */
  prices: Record<CropKind, number>;
  titheOn: boolean;
  shareOn: boolean;
  civic: CivicState;
  sin: number;
  health: number;
  hunger: number;
  thirst: number;
  prayer: number;
  level: number;
  xp: number;
  skillPoints: number;
  skills: Record<SkillId, number>;
  autoSell: boolean;
  buildings: SavedBuilding[];
  villagers: SavedVillager[];
  recruits: SavedRecruit[];
  quests: SavedQuest[];
  unlocks: Unlocks;
  /** Landmarks the player has walked up to at least once. */
  discovered: LandmarkId[];
  /** The prologue has been shown once for this valley. */
  introSeen: boolean;
  player: { x: number; y: number };
  stats: { kills: number; redeemed: number; fallen: number; idolsSmashed: number };
  tutorialStep: number;
  won: boolean;
  war: WarState;
};

/** What the scene pushes to React ~10×/s. */
export type HudState = {
  day: number;
  isNight: boolean;
  /** 0..1 progress through the current phase */
  phaseProgress: number;
  coins: number;
  wheat: number;
  grapes: number;
  olives: number;
  flax: number;
  meat: number;
  wool: number;
  cloth: number;
  scraps: number;
  relics: number;
  gear: GearState;
  boss: { name: string; hp: number; maxHp: number } | null;
  nightKind: NightKind;
  war: {
    raidsCleared: number;
    victories: number;
    siegeNext: boolean;
    canMuster: boolean;
    hint: string;
    cost: number;
  };
  inside: string | null;
  nearEnter: string | null;
  bank: number;
  stores: Record<CropKind, number>;
  prices: Record<CropKind, number>;
  titheOn: boolean;
  shareOn: boolean;
  nearChanger: boolean;
  nearStore: boolean;
  nearHall: boolean;
  hasChanger: boolean;
  hasStore: boolean;
  hasHall: boolean;
  civic: CivicState;
  villagerOffices: { seed: number; name: string }[];
  sin: number;
  health: number;
  maxHealth: number;
  hunger: number;
  thirst: number;
  prayer: number;
  maxPrayer: number;
  level: number;
  xp: number;
  xpToNext: number;
  skillPoints: number;
  skills: Record<SkillId, number>;
  population: number;
  capacity: number;
  altarLevel: number;
  darknessPushed: number; // 0..1
  autoSell: boolean;
  buildMode: BuildingType | null;
  enemiesAlive: number;
  nearAltar: boolean;
  nearMarket: boolean;
  nearDrink: boolean;
  paused: boolean;
  won: boolean;
  tutorialStep: number;
  /** null when this visit has no day ribbon yet (no qualifying letter and not dusk). */
  jobs: Job[] | null;
  ribbonMode: "day" | "dusk" | null;
  recruits: HudRecruit[];
  quests: HudQuest[];
  scatteredOffers: ScatteredRecruitOffer[];
  /** Landmarks found so far, out of the total on the map. */
  discovered: number;
  landmarks: number;
  /** Which questlines are done — the build menu reads this for quest-gated buildings. */
  completedQuests: BigRecruitId[];
  /** Name of a landmark the player is standing at, if any. */
  atLandmark: string | null;
};

export type HudRecruit = {
  id: RecruitId;
  name: string;
  big: boolean;
  mode: DeploymentMode | null;
  role: RecruitRole;
};

export type HudQuest = {
  id: BigRecruitId;
  name: string;
  state: QuestState;
  progress: number;
  target: number;
  /** What the player has to do, in words. */
  objective: string;
  /** Dawn of the day this recruit walks into the valley; the Holy Ghost has none. */
  arrivesDay: number | null;
  /** True once the quest-giver is somewhere in the world (or has joined). */
  arrived: boolean;
  /** Where to find the quest-giver, in words. */
  landmark: string | null;
};

export type ScatteredRecruitOffer = {
  id: ScatteredRecruitId;
  name: string;
  unlockLevel: number;
  cost: number;
  role: RecruitRole;
  unlocked: boolean;
  recruited: boolean;
};

export type DawnReport = {
  day: number;
  rent: number;
  leveledUp: number;
  sinDelta: number;
  fallen: number;
  saved: number;
  /** Strangers who walked into the valley this dawn — their arrival lines. */
  arrivals: { name: string; line: string }[];
  wages: number;
  wagesShort: number;
  titheHeld: number;
  interest: number;
  bankRun: number;
  rationsFed: number;
  rationsShort: number;
  loyalty: number;
  casesPending: number;
  casesIgnored: number;
};

export type AwayReport = {
  hours: number;
  cropsGrown: number;
  rent: number;
  /** Third-person beat: what happened while gone. */
  storyLine: string;
  /** A voice from the valley: a named villager, or the valley itself. */
  voiceLine: string;
  /** First name bound to a living villager for this visit only; not persisted. */
  villagerName: string | null;
};

export type JobId = "harvest" | "pray" | "altar" | "darkEdge" | "duskWall" | "duskProtect" | "duskLight";

export type Job = {
  id: JobId;
  label: string;
  done: boolean;
};

export type GameCommand =
  | { type: "setBuildMode"; building: BuildingType | null }
  | { type: "upgradeAltar" }
  | { type: "spendSkill"; skill: SkillId }
  | { type: "sell"; what: CropKind | "all" }
  | { type: "toggleAutoSell" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "save" }
  | { type: "advanceTutorial" }
  | { type: "acceptQuest"; id: BigRecruitId }
  | { type: "turnInQuest"; id: BigRecruitId }
  | { type: "setDeployment"; id: RecruitId; mode: DeploymentMode }
  | { type: "recruitScattered"; id: ScatteredRecruitId }
  | { type: "introSeen" }
  | { type: "bank"; op: "deposit" | "withdraw"; amount: number }
  | { type: "store"; op: "deposit" | "withdraw"; kind: CropKind | "all"; amount?: number }
  | { type: "toggleTithe" }
  | { type: "toggleShare" }
  | { type: "setEdict"; id: EdictId; on: boolean }
  | { type: "setStatute"; id: StatuteId; on: boolean }
  | { type: "setTitheRate"; rate: TitheRate }
  | { type: "setSteward"; who: StewardId }
  | { type: "setOffice"; office: OfficeId; seed: number | null }
  | { type: "judge"; id: string; verdict: Verdict }
  | { type: "writeLaw"; text: string }
  | { type: "repealLaw"; id: string }
  | { type: "equip"; id: GearId }
  | { type: "unequip"; slot: GearSlot }
  | { type: "muster" };

export type GameEvent =
  | { type: "hud"; state: HudState }
  | { type: "dawn"; report: DawnReport }
  | { type: "away"; report: AwayReport }
  | { type: "toast"; text: string; tone?: "info" | "good" | "bad" }
  | { type: "victory" }
  | { type: "gameover" }
  | { type: "openCivic" };
