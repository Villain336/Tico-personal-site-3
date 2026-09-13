import type { BigRecruitId, RecruitRole, ScatteredRecruitId } from "../types";

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
  /** Tile offset from the altar center — fixed quest-giver spawn spot (KTD4). Unused by the Holy Ghost (KTD5). */
  spawnOffset: { dx: number; dy: number };
  objective: QuestObjective;
  unlock: UnlockHook[];
  lines: {
    offer: string;
    progress: string;
    turnIn: string;
  };
};

export const BIG_RECRUITS: Record<BigRecruitId, BigRecruitDef> = {
  david: {
    name: "David",
    spawnOffset: { dx: 6, dy: -5 },
    objective: { kind: "killCount", enemyKind: "robber", count: 8 },
    unlock: [{ kind: "weapon" }, { kind: "boss", boss: "goliath" }],
    lines: {
      offer: "I kept my father's sheep from wolves and robbers. Drive off 8 robbers, and I'll stand with you against worse than wolves.",
      progress: "The flock still needs watching. Keep at it.",
      turnIn: "You have a shepherd's courage. I'm with you now — and I know a giant we'll face together one day.",
    },
  },
  moses: {
    name: "Moses",
    spawnOffset: { dx: -6, dy: -5 },
    objective: { kind: "redeemCount", count: 3 },
    unlock: [{ kind: "ability" }],
    lines: {
      offer: "I led a people out of bondage once. Redeem 3 who have fallen, and I'll teach you what I learned in the wilderness.",
      progress: "Every soul redeemed is a small exodus. Keep going.",
      turnIn: "You have a shepherd's patience for lost sheep. Take this — you've earned it.",
    },
  },
  paul: {
    name: "Paul",
    spawnOffset: { dx: 6, dy: 5 },
    objective: { kind: "killCount", enemyKind: "deceiver", count: 5 },
    unlock: [{ kind: "ability" }],
    lines: {
      offer: "Scales once covered my own eyes before I saw clearly. Strike down 5 deceivers, and I'll show you what clear sight can do.",
      progress: "The lies don't stop coming. Neither should you.",
      turnIn: "You see clearly now, same as I did. Let me share what that sight is worth.",
    },
  },
  noah: {
    name: "Noah",
    spawnOffset: { dx: -6, dy: 5 },
    objective: { kind: "harvestCount", count: 12 },
    unlock: [{ kind: "building" }],
    lines: {
      offer: "I built through a flood on provisions gathered ahead of the rain. Bring in 12 crops, and I'll show you what to build next.",
      progress: "Keep gathering. The rain always comes eventually.",
      turnIn: "You know how to prepare for what's coming. Let's build.",
    },
  },
  holyGhost: {
    name: "Holy Ghost",
    spawnOffset: { dx: 0, dy: 0 },
    objective: { kind: "altarPrayerCycles", count: 3 },
    unlock: [{ kind: "blessing" }],
    lines: {
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
