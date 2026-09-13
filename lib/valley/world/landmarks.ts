import type { WorldScene } from "../scenes/WorldScene";
import { DISCOVER_RADIUS_TILES, DISCOVER_XP, SECRET_DISCOVER_RADIUS_TILES, TILE } from "../config";
import type { LandmarkId } from "../types";
import { dist } from "./actor";

export type LandmarkDef = {
  name: string;
  /** One-line flavor shown on discovery. */
  flavor: string;
  /** One-time cache found on discovery. */
  reward: { coins?: number; wheat?: number; grapes?: number; olives?: number; flax?: number };
  /** Hidden biblical sites — smaller radius, unnamed until found. */
  secret?: boolean;
  /** Standing here counts as a drink source. */
  drinkable?: boolean;
};

export const LANDMARKS: Record<LandmarkId, LandmarkDef> = {
  shepherdCamp: {
    name: "Field of the Shepherds",
    flavor: "A night-watch fire. News of a birth once reached shepherds in a field like this.",
    reward: { wheat: 4 },
  },
  boatyard: {
    name: "Galilee landing",
    flavor: "Nets and a hull rib — a place of fishermen.",
    reward: { coins: 15 },
  },
  standingStones: {
    name: "Bethel stones",
    flavor: "A pillar on the high ground. Jacob dreamed of a ladder here.",
    reward: { coins: 20 },
  },
  milestone: {
    name: "Way of the sea",
    flavor: "A worn marker on the old Via Maris.",
    reward: { coins: 12 },
  },
  cave: {
    name: "Cave of Adullam",
    flavor: "A dark mouth in the cliff. David hid here when he fled Saul.",
    reward: { coins: 40 },
  },
  ancientOlive: {
    name: "Olive of the Mount",
    flavor: "One vast tree on a rise, watching the valley like Gethsemane.",
    reward: { olives: 5, coins: 10 },
  },
  cistern: {
    name: "Jacob's well-mark",
    flavor: "Deep water, like the well at Sychar.",
    reward: { coins: 25 },
    drinkable: true,
  },
  mamre: {
    name: "Oaks of Mamre",
    flavor: "Abraham sat here when three visitors came.",
    reward: { coins: 30, wheat: 2 },
    secret: true,
  },
  beersheba: {
    name: "Well of Beersheba",
    flavor: "Seven lambs, an oath, and a well of the south.",
    reward: { coins: 22 },
    secret: true,
    drinkable: true,
  },
  cherith: {
    name: "Brook Cherith",
    flavor: "Ravens once fed a prophet beside this water.",
    reward: { wheat: 3, coins: 10 },
    secret: true,
    drinkable: true,
  },
  mizpah: {
    name: "Mizpah heap",
    flavor: "A witness-pile: the Lord watch between thee and me.",
    reward: { coins: 18 },
    secret: true,
  },
  jacobWell: {
    name: "Sychar well",
    flavor: "Living water was spoken of here.",
    reward: { coins: 28 },
    secret: true,
    drinkable: true,
  },
  enGedi: {
    name: "Spring of En-gedi",
    flavor: "David cut a robe-hem in a cave above this oasis.",
    reward: { coins: 35, olives: 2 },
    secret: true,
    drinkable: true,
  },
};

export const LANDMARK_IDS = Object.keys(LANDMARKS) as LandmarkId[];
export const SECRET_LANDMARK_IDS = LANDMARK_IDS.filter((id) => LANDMARKS[id].secret);

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

  isSecret(id: LandmarkId) {
    return !!LANDMARKS[id].secret;
  }

  isKnown(id: LandmarkId) {
    return this.scene.state.discovered.includes(id);
  }

  isDrinkable(id: LandmarkId) {
    return !!LANDMARKS[id].drinkable;
  }

  /** Name shown on the HUD. Secrets stay unnamed until walked into. */
  hudName(id: LandmarkId): string {
    if (LANDMARKS[id].secret && !this.isKnown(id)) return "A quiet place…";
    return LANDMARKS[id].name;
  }

  /** Landmark the player is standing at, if any. */
  at(x: number, y: number): LandmarkId | null {
    for (const id of LANDMARK_IDS) {
      if (this.near(id, x, y, this.senseRadius(id))) return id;
    }
    return null;
  }

  /** A known landmark close enough to tighten the camera — never an unfound secret. */
  atKnown(x: number, y: number): LandmarkId | null {
    const id = this.at(x, y);
    if (!id) return null;
    if (LANDMARKS[id].secret && !this.isKnown(id)) return null;
    return id;
  }

  update(dt: number) {
    this.checkT -= dt;
    if (this.checkT > 0) return;
    this.checkT = 0.25;
    const p = this.scene.player;
    for (const id of LANDMARK_IDS) {
      if (this.isKnown(id)) continue;
      if (this.near(id, p.x, p.y, this.discoverRadius(id))) this.discover(id);
    }
  }

  private senseRadius(id: LandmarkId) {
    const lm = this.scene.map.landmarks[id];
    const pad = LANDMARKS[id].secret ? 1.1 : DISCOVER_RADIUS_TILES;
    return (pad + Math.max(lm.fw, lm.fh) / 2) * TILE;
  }

  private discoverRadius(id: LandmarkId) {
    const lm = this.scene.map.landmarks[id];
    const pad = LANDMARKS[id].secret ? SECRET_DISCOVER_RADIUS_TILES : DISCOVER_RADIUS_TILES;
    return (pad + Math.max(lm.fw, lm.fh) / 2) * TILE;
  }

  private near(id: LandmarkId, x: number, y: number, radius: number) {
    const lm = this.scene.map.landmarks[id];
    const cx = (lm.tx + lm.fw / 2) * TILE;
    const cy = (lm.ty + lm.fh / 2) * TILE;
    return dist(x, y, cx, cy) < radius;
  }

  private discover(id: LandmarkId) {
    const st = this.scene.state;
    const def = LANDMARKS[id];
    st.discovered.push(id);
    const r = def.reward;
    if (r.coins) this.scene.addCoins(r.coins);
    if (r.wheat) st.wheat += r.wheat;
    if (r.grapes) st.grapes += r.grapes;
    if (r.olives) st.olives += r.olives;
    if (r.flax) st.flax += r.flax;
    this.scene.addXp(DISCOVER_XP);
    const found = [
      r.coins ? `+${r.coins} coins` : "",
      r.wheat ? `+${r.wheat} wheat` : "",
      r.grapes ? `+${r.grapes} grapes` : "",
      r.olives ? `+${r.olives} olives` : "",
      r.flax ? `+${r.flax} flax` : "",
    ]
      .filter(Boolean)
      .join(", ");
    const p = this.scene.player;
    this.scene.fx.ring(p.x, p.y - 10, 40, 0xffe27a);
    this.scene.fx.coins(p.x, p.y - 12, Math.min(6, Math.ceil((r.coins ?? 0) / 8)));
    const prefix = def.secret ? "A hidden place:" : "Discovered:";
    this.scene.toast(`${prefix} ${def.name} (${this.discoveredCount}/${this.total}). ${def.flavor} ${found}.`, "good");
  }
}
