import type { WorldScene } from "../scenes/WorldScene";
import { DISCOVER_RADIUS_TILES, DISCOVER_XP, TILE } from "../config";
import type { LandmarkId } from "../types";
import { dist } from "./actor";

export type LandmarkDef = {
  name: string;
  /** One-line flavor shown on discovery. */
  flavor: string;
  /** One-time cache found on discovery. */
  reward: { coins?: number; wheat?: number; grapes?: number };
};

export const LANDMARKS: Record<LandmarkId, LandmarkDef> = {
  shepherdCamp: {
    name: "Shepherd's Camp",
    flavor: "A cold fire pit and a tent facing the woods. Someone keeps watch here.",
    reward: { wheat: 4 },
  },
  boatyard: {
    name: "Old Boatyard",
    flavor: "Timber stacked on the lake shore, cut to a plan no one here remembers.",
    reward: { coins: 15 },
  },
  standingStones: {
    name: "Standing Stones",
    flavor: "Three stones on the high ground, older than the valley's oldest story.",
    reward: { coins: 20 },
  },
  milestone: {
    name: "Eastern Milestone",
    flavor: "A road marker worn smooth by travelers. The east road goes far beyond the dark.",
    reward: { coins: 12 },
  },
  cave: {
    name: "Hidden Cave",
    flavor: "A dark mouth in the cliff. Someone once sheltered here — they left coins behind.",
    reward: { coins: 40 },
  },
  ancientOlive: {
    name: "Ancient Olive",
    flavor: "One vast tree in a clearing, still bearing fruit. Its roots hold the hill together.",
    reward: { grapes: 3, coins: 10 },
  },
  cistern: {
    name: "Broken Cistern",
    flavor: "A cracked ring of stone across the river, half full of black water.",
    reward: { coins: 25 },
  },
};

export const LANDMARK_IDS = Object.keys(LANDMARKS) as LandmarkId[];

/** Walk-up discovery of the map's fixed places: first visit toasts, rewards and persists. */
export class Landmarks {
  private checkT = 0;

  constructor(private scene: WorldScene) {}

  get discoveredCount() {
    return this.scene.state.discovered.length;
  }

  get total() {
    return LANDMARK_IDS.length;
  }

  spot(id: LandmarkId) {
    return this.scene.map.landmarks[id].spot;
  }

  /** Name of the landmark the player is standing at, if any. */
  at(x: number, y: number): LandmarkId | null {
    for (const id of LANDMARK_IDS) {
      const lm = this.scene.map.landmarks[id];
      const cx = (lm.tx + lm.fw / 2) * TILE;
      const cy = (lm.ty + lm.fh / 2) * TILE;
      if (dist(x, y, cx, cy) < (DISCOVER_RADIUS_TILES + Math.max(lm.fw, lm.fh) / 2) * TILE) return id;
    }
    return null;
  }

  update(dt: number) {
    this.checkT -= dt;
    if (this.checkT > 0) return;
    this.checkT = 0.25;
    const p = this.scene.player;
    const id = this.at(p.x, p.y);
    if (!id || this.scene.state.discovered.includes(id)) return;
    this.discover(id);
  }

  private discover(id: LandmarkId) {
    const st = this.scene.state;
    const def = LANDMARKS[id];
    st.discovered.push(id);
    const r = def.reward;
    if (r.coins) this.scene.addCoins(r.coins);
    if (r.wheat) st.wheat += r.wheat;
    if (r.grapes) st.grapes += r.grapes;
    this.scene.addXp(DISCOVER_XP);
    const found = [r.coins ? `+${r.coins} coins` : "", r.wheat ? `+${r.wheat} wheat` : "", r.grapes ? `+${r.grapes} grapes` : ""]
      .filter(Boolean)
      .join(", ");
    const p = this.scene.player;
    this.scene.fx.ring(p.x, p.y - 10, 40, 0xffe27a);
    this.scene.fx.coins(p.x, p.y - 12, Math.min(6, Math.ceil((r.coins ?? 0) / 8)));
    this.scene.toast(`Discovered: ${def.name} (${this.discoveredCount}/${this.total}). ${def.flavor} ${found}.`, "good");
  }
}
