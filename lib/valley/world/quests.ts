import type { WorldScene } from "../scenes/WorldScene";
import { BIG_RECRUITS } from "../quests/content";
import type { BigRecruitId, HudQuest, QuestState, SavedQuest } from "../types";

type Entry = { id: BigRecruitId; state: QuestState; progress: number };

/**
 * One state machine per Big Recruit questline: available -> active -> ready
 * -> completed (KTD3). Separate from `Jobs` (Daily Bread) — this manager
 * never touches the day ribbon (R14).
 */
export class Quests {
  list: Entry[] = [];
  private holyGhostPrayerCycles = 0;
  private wasAtFullPrayer = false;

  constructor(private scene: WorldScene) {
    for (const id of Object.keys(BIG_RECRUITS) as BigRecruitId[]) {
      this.list.push({ id, state: "available", progress: 0 });
    }
  }

  private entry(id: BigRecruitId) {
    return this.list.find((q) => q.id === id) ?? null;
  }

  isActive(id: BigRecruitId) {
    return this.entry(id)?.state === "active";
  }

  accept(id: BigRecruitId) {
    const q = this.entry(id);
    if (q && q.state === "available") q.state = "active";
  }

  /** No-op unless the questline is active — hooks can call this unconditionally (KTD6). */
  reportProgress(id: BigRecruitId, delta: number) {
    const q = this.entry(id);
    if (!q || q.state !== "active") return;
    const target = BIG_RECRUITS[id].objective.count;
    q.progress = Math.min(target, q.progress + delta);
    if (q.progress >= target) q.state = "ready";
  }

  turnIn(id: BigRecruitId) {
    const q = this.entry(id);
    if (!q || q.state !== "ready") return;
    q.state = "completed";
    const def = BIG_RECRUITS[id];
    const st = this.scene.state;
    for (const hook of def.unlock) {
      if (hook.kind === "weapon") st.unlocks.weapon = true;
      else if (hook.kind === "boss") st.unlocks.goliathBoss = true;
      else if (hook.kind === "building") st.unlocks.building = true;
      else if (hook.kind === "ability") st.unlocks.abilities.push(id);
      else if (hook.kind === "blessing") st.unlocks.blessing = true;
    }
    if (id === "holyGhost") {
      const c = this.scene.buildings.center(this.scene.buildings.altar);
      this.scene.fx.ring(c.x, c.y, 90, 0xffe27a);
      this.scene.fx.burst(c.x, c.y - 10, "px_gold", 14);
      this.scene.toast("The Holy Ghost's blessing rests on the valley.", "good");
    } else {
      const giver = this.scene.recruitManager.byId(id);
      this.scene.recruitManager.add(id, true, giver?.x, giver?.y);
      if (giver && giver.state === "questgiver") giver.state = "idle";
      this.scene.toast(`${def.name} joins you.`, "good");
    }
  }

  /** Holy Ghost delivery: 3 full-prayer cycles at altar level 2+, no walking NPC (KTD5). */
  updateHolyGhost() {
    const q = this.entry("holyGhost");
    if (!q || q.state === "completed") return;
    if (q.state === "available") q.state = "active";
    const sc = this.scene;
    const atFull = sc.player.praying && sc.buildings.altarLevel >= 2 && sc.state.prayer >= sc.player.stats.maxPrayer - 0.01;
    if (atFull && !this.wasAtFullPrayer) {
      this.wasAtFullPrayer = true;
      this.reportProgress("holyGhost", 1);
      if (q.state === "ready") this.turnIn("holyGhost");
    }
    if (!sc.player.praying || !sc.player.nearAltar) this.wasAtFullPrayer = false;
  }

  serialize(): SavedQuest[] {
    return this.list.map((q) => ({ id: q.id, state: q.state, progress: q.progress }));
  }

  loadFrom(saved: SavedQuest[]) {
    for (const s of saved) {
      const q = this.entry(s.id);
      if (q) {
        q.state = s.state;
        q.progress = s.progress;
      }
    }
  }

  toHud(): HudQuest[] {
    return this.list.map((q) => ({
      id: q.id,
      name: BIG_RECRUITS[q.id].name,
      state: q.state,
      progress: q.progress,
      target: BIG_RECRUITS[q.id].objective.count,
    }));
  }
}
