export type Gender = "man" | "woman";

export type Character = {
  name: string;
  gender: Gender;
  skin: number; // index into SKIN_TONES
  hairStyle: number; // 0..2
  hairColor: number; // index into HAIR_COLORS
  face: number; // 0..2
  body: number; // 0 slim, 1 average, 2 broad
  outfit: number; // 0 shepherd, 1 merchant, 2 warrior
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
  | "idol";

export type SkillId = "sword" | "fleet" | "faith" | "fortitude" | "steward";

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
  building: boolean;
  abilities: BigRecruitId[];
  blessing: boolean;
};

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
  sin: number;
  health: number;
  hunger: number;
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
  player: { x: number; y: number };
  stats: { kills: number; redeemed: number; fallen: number; idolsSmashed: number };
  tutorialStep: number;
  won: boolean;
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
  sin: number;
  health: number;
  maxHealth: number;
  hunger: number;
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
  paused: boolean;
  won: boolean;
  tutorialStep: number;
  /** null when this visit has no day ribbon yet (no qualifying letter and not dusk). */
  jobs: Job[] | null;
  ribbonMode: "day" | "dusk" | null;
  recruits: HudRecruit[];
  quests: HudQuest[];
  scatteredOffers: ScatteredRecruitOffer[];
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
  | { type: "sell"; what: "wheat" | "grapes" | "all" }
  | { type: "toggleAutoSell" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "save" }
  | { type: "advanceTutorial" }
  | { type: "acceptQuest"; id: BigRecruitId }
  | { type: "turnInQuest"; id: BigRecruitId }
  | { type: "setDeployment"; id: RecruitId; mode: DeploymentMode }
  | { type: "recruitScattered"; id: ScatteredRecruitId };

export type GameEvent =
  | { type: "hud"; state: HudState }
  | { type: "dawn"; report: DawnReport }
  | { type: "away"; report: AwayReport }
  | { type: "toast"; text: string; tone?: "info" | "good" | "bad" }
  | { type: "victory" }
  | { type: "gameover" };
