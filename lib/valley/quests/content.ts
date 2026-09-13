import type { BigRecruitId, LandmarkId, RecruitRole, ScatteredRecruitId } from "../types";

/** How a Big Recruit's objective progress is measured — each reuses an existing gameplay counter (KTD6). */
export type QuestObjective =
  | { kind: "killCount"; enemyKind: "robber" | "deceiver"; count: number }
  | { kind: "harvestCount"; count: number }
  | { kind: "redeemCount"; count: number }
  | { kind: "altarPrayerCycles"; count: number };

export type UnlockHook =
  | { kind: "weapon" }
  | { kind: "boss"; boss: "goliath" }
  | { kind: "building" }
  | { kind: "ability" }
  | { kind: "blessing" };

export type BigRecruitDef = {
  name: string;
  /** One-line who-they-are for the arrival toast and journal. */
  title: string;
  /** Dawn of this day the recruit walks into the valley. Null for the Holy Ghost (altar-delivered). */
  arrivesDay: number | null;
  /** Where the quest-giver waits once arrived. Null for the Holy Ghost. */
  landmark: LandmarkId | null;
  objective: QuestObjective;
  /** The objective in words, for the journal. */
  objectiveText: string;
  unlock: UnlockHook[];
  /** What the reward actually does, for the turn-in toast. */
  rewardText: string;
  lines: {
    arrival: string;
    offer: string;
    progress: string;
    turnIn: string;
  };
};

export const BIG_RECRUITS: Record<BigRecruitId, BigRecruitDef> = {
  david: {
    name: "David",
    title: "a shepherd boy from Bethlehem",
    arrivesDay: 2,
    landmark: "shepherdCamp",
    objective: { kind: "killCount", enemyKind: "robber", count: 8 },
    objectiveText: "Drive off 8 robbers",
    unlock: [{ kind: "weapon" }, { kind: "boss", boss: "goliath" }],
    rewardText: "David's blade: sword damage +50%, longer reach. A giant now waits in your future.",
    lines: {
      arrival: "A shepherd boy walked in from the south woods at dawn, a sling at his belt. He's made camp at the Shepherd's Camp.",
      offer: "I kept my father's sheep from wolves and robbers. Drive off 8 robbers, and I'll stand with you against worse than wolves.",
      progress: "The flock still needs watching. Keep at it.",
      turnIn: "You have a shepherd's courage. I'm with you now — and I know a giant we'll face together one day.",
    },
  },
  noah: {
    name: "Noah",
    title: "a builder who has seen a flood",
    arrivesDay: 3,
    landmark: "boatyard",
    objective: { kind: "harvestCount", count: 12 },
    objectiveText: "Bring in 12 crops",
    unlock: [{ kind: "building" }],
    rewardText: "The Granary is now buildable: nearby harvests yield +1.",
    lines: {
      arrival: "An old builder came down the river at dawn and is measuring timber at the Boatyard on the lake shore.",
      offer: "I built through a flood on provisions gathered ahead of the rain. Bring in 12 crops, and I'll show you what to build next.",
      progress: "Keep gathering. The rain always comes eventually.",
      turnIn: "You know how to prepare for what's coming. Let's build.",
    },
  },
  moses: {
    name: "Moses",
    title: "a lawgiver come down from the mountain",
    arrivesDay: 5,
    landmark: "standingStones",
    objective: { kind: "redeemCount", count: 3 },
    objectiveText: "Redeem 3 fallen villagers",
    unlock: [{ kind: "ability" }],
    rewardText: "Staff of Moses: casting (E) now strikes every enemy in the ring.",
    lines: {
      arrival: "A bearded man with a staff was seen on the high ground at dawn, standing among the Standing Stones.",
      offer: "I led a people out of bondage once. Redeem 3 who have fallen, and I'll teach you what I learned in the wilderness.",
      progress: "Every soul redeemed is a small exodus. Keep going.",
      turnIn: "You have a shepherd's patience for lost sheep. Take this — you've earned it.",
    },
  },
  paul: {
    name: "Paul",
    title: "a traveler on the eastern road",
    arrivesDay: 7,
    landmark: "milestone",
    objective: { kind: "killCount", enemyKind: "deceiver", count: 5 },
    objectiveText: "Strike down 5 deceivers",
    unlock: [{ kind: "ability" }],
    rewardText: "Clear Sight: casting reveals hidden deceivers far out, and their lies take twice as long to work.",
    lines: {
      arrival: "A traveler arrived on the eastern road at dawn and is resting by the Milestone.",
      offer: "Scales once covered my own eyes before I saw clearly. Strike down 5 deceivers, and I'll show you what clear sight can do.",
      progress: "The lies don't stop coming. Neither should you.",
      turnIn: "You see clearly now, same as I did. Let me share what that sight is worth.",
    },
  },
  holyGhost: {
    name: "Holy Ghost",
    title: "the Comforter",
    arrivesDay: null,
    landmark: null,
    objective: { kind: "altarPrayerCycles", count: 3 },
    objectiveText: "Fill your prayer fully 3 times at a level-2 altar",
    unlock: [{ kind: "blessing" }],
    rewardText: "Blessing: prayer refills away from the altar four times faster, and dawn washes away twice the sin.",
    lines: {
      arrival: "",
      offer: "",
      progress: "",
      turnIn: "",
    },
  },
};

export type ScatteredRecruitDef = {
  name: string;
  unlockLevel: number;
  cost: number;
  role: RecruitRole;
};

/** First batch of scattered NPCs (KTD assumption) — the wider pool stays deferred per Scope Boundaries. */
export const SCATTERED_RECRUITS: Record<ScatteredRecruitId, ScatteredRecruitDef> = {
  deborah: { name: "Deborah", unlockLevel: 3, cost: 40, role: "harvester" },
  gideon: { name: "Gideon", unlockLevel: 5, cost: 70, role: "guard" },
  ruth: { name: "Ruth", unlockLevel: 7, cost: 100, role: "healer" },
};

export type BossId = "goliath";

/** Boss roster entries are name-only flags (R5) — no fight logic ships in this plan. */
export const BOSSES: Record<BossId, { name: string }> = {
  goliath: { name: "Goliath" },
};
