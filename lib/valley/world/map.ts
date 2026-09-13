import Phaser from "phaser";
import { createNoise2D } from "simplex-noise";
import { MAP_H, MAP_SEED, MAP_W, TILE, WORLD_H, WORLD_W } from "../config";
import { ALTAR_TILE } from "../save";
import type { LandmarkId } from "../types";

export type Ground = "grass" | "grassHi" | "sand" | "dirt" | "water" | "shallow" | "cliff" | "ramp";

/** A world prop's tile footprint plus the walkable tile in front of it. */
export type LandmarkSpot = {
  tx: number;
  ty: number;
  fw: number;
  fh: number;
  /** World-space point to stand at (and for the quest-giver to wait at). */
  spot: { x: number; y: number };
};

const LANDMARK_IDS: LandmarkId[] = ["shepherdCamp", "boatyard", "standingStones", "milestone", "cave", "ancientOlive", "cistern"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The valley: lowland around the altar, a river with fords to the west, a
 * cliff-edged plateau to the north-east, woods to the south, and seven
 * landmarks to find. Generated from a fixed seed so every save shares one
 * geography; only buildings persist.
 */
export class WorldMap {
  ground: Ground[] = [];
  /** 1 = highland (including its cliff and ramp tiles). */
  high = new Uint8Array(MAP_W * MAP_H);
  /** 0 none · 1 tree · 2 rock. */
  prop = new Uint8Array(MAP_W * MAP_H);
  /** 1 = cliff tile whose drop is to the south (draws as a face). */
  private cliffFace = new Uint8Array(MAP_W * MAP_H);
  private blocked = new Uint8Array(MAP_W * MAP_H);
  private reach = new Uint8Array(MAP_W * MAP_H);
  landmarks = {} as Record<LandmarkId, LandmarkSpot>;
  private rt: Phaser.GameObjects.RenderTexture;
  private rng = mulberry32(MAP_SEED);
  private noise = createNoise2D(mulberry32(MAP_SEED ^ 0x9e3779b9));
  private cx = ALTAR_TILE.tx + 1;
  private cy = ALTAR_TILE.ty + 1;

  constructor(scene: Phaser.Scene) {
    this.generate();
    this.rt = scene.add.renderTexture(0, 0, WORLD_W, WORLD_H).setOrigin(0, 0).setDepth(-100);
    this.draw();
    this.drawProps(scene);
  }

  // ------------------------------------------------------------ generate

  private idx(tx: number, ty: number) {
    return ty * MAP_W + tx;
  }

  private altarDist(tx: number, ty: number) {
    return Math.hypot(tx - this.cx + 0.5, ty - this.cy + 0.5);
  }

  private generate() {
    const { cx, cy } = this;
    for (let i = 0; i < MAP_W * MAP_H; i++) this.ground.push("grass");

    // --- elevation: a plateau biased to the north-east, never near the altar
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const n = this.noise(tx / 13, ty / 13);
        const bias = (tx - cx) / MAP_W + (cy - ty) / MAP_H;
        const forced = Math.hypot(tx - (cx + 18), ty - (cy - 13)) < 8;
        const h = n * 0.6 + bias * 1.7;
        if ((h > 0.55 || forced) && this.altarDist(tx, ty) > 11) this.high[this.idx(tx, ty)] = 1;
      }
    }
    for (let pass = 0; pass < 2; pass++) this.smoothHigh();
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) if (this.high[this.idx(tx, ty)]) this.ground[this.idx(tx, ty)] = "grassHi";
    }

    // --- cliffs: every highland tile touching lowland
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const i = this.idx(tx, ty);
        if (!this.high[i]) continue;
        const lowS = this.inBounds(tx, ty + 1) && !this.high[this.idx(tx, ty + 1)];
        const lowN = this.inBounds(tx, ty - 1) && !this.high[this.idx(tx, ty - 1)];
        const lowE = this.inBounds(tx + 1, ty) && !this.high[this.idx(tx + 1, ty)];
        const lowW = this.inBounds(tx - 1, ty) && !this.high[this.idx(tx - 1, ty)];
        if (lowS || lowN || lowE || lowW) {
          this.ground[i] = "cliff";
          if (lowS) this.cliffFace[i] = 1;
        }
      }
    }

    // --- ramps: worn paths through the cliff line at three approaches
    this.carveRamp(cx, cy);
    this.carveRamp(cx + 24, cy + 2);
    this.carveRamp(cx + 6, cy - 22);

    // --- river down the west side, a lake where it slows, two fords
    const lake = { x: cx - 19, y: cy + 11, rx: 6, ry: 4 };
    for (let ty = 0; ty < MAP_H; ty++) {
      const center = cx - 17 + Math.sin(ty * 0.18) * 3 + this.noise(ty / 9, 5.5) * 3;
      const width = 2 + (this.noise(ty / 6, 9.5) > 0.4 ? 1 : 0);
      for (let tx = Math.round(center) - Math.floor(width / 2); tx < Math.round(center) - Math.floor(width / 2) + width; tx++) {
        this.setWater(tx, ty);
      }
    }
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const e = ((tx - lake.x) / lake.rx) ** 2 + ((ty - lake.y) / lake.ry) ** 2;
        if (e <= 1 + this.noise(tx / 3, ty / 3) * 0.25) this.setWater(tx, ty);
      }
    }
    for (let ty = cy - 1; ty <= cy; ty++) this.fordRow(ty);
    for (let ty = cy - 13; ty <= cy - 12; ty++) this.fordRow(ty);

    // --- sacred sand around the altar; two roads that wander a little
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const i = this.idx(tx, ty);
        if (this.altarDist(tx, ty) < 3.6 && this.ground[i] === "grass") this.ground[i] = "sand";
      }
    }
    for (let ty = 0; ty < MAP_H; ty++) {
      const x = cx + Math.round(this.noise(ty / 7, 11.5) * 1.2);
      this.setRoad(x - 1, ty);
      this.setRoad(x, ty);
    }
    for (let tx = 0; tx < MAP_W; tx++) {
      const y = cy + Math.round(this.noise(tx / 7, 21.5) * 1.2);
      this.setRoad(tx, y - 1);
      this.setRoad(tx, y);
    }

    // --- woods to the south and west, boulders on the heights
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        const i = this.idx(tx, ty);
        const g = this.ground[i];
        if (this.altarDist(tx, ty) < 9) continue;
        if (g === "grass") {
          let f = this.noise(tx / 6 + 100, ty / 6);
          if (ty > cy + 6) f += 0.2;
          if (tx < cx - 8 && ty < cy + 6) f += 0.1;
          if (f > 0.38 && this.rng() < 0.85) this.prop[i] = 1;
          else if (this.noise(tx / 3 + 300, ty / 3) > 0.72 && this.rng() < 0.3) this.prop[i] = 2;
        } else if (g === "grassHi") {
          if (this.noise(tx / 4 + 50, ty / 4 + 50) > 0.58 && this.rng() < 0.5) this.prop[i] = 2;
          else if (this.noise(tx / 5 + 200, ty / 5) > 0.62 && this.rng() < 0.4) this.prop[i] = 1;
        }
      }
    }

    // --- landmarks, then make sure each is walkable-to
    this.placeLandmarks(lake);
    this.rebuildBlocked();
    for (const id of LANDMARK_IDS) this.ensureReachable(this.landmarks[id].spot);
    this.rebuildBlocked();
    this.computeReach();
  }

  private smoothHigh() {
    const next = new Uint8Array(this.high);
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const x = tx + dx;
            const y = ty + dy;
            if (this.inBounds(x, y) ? this.high[this.idx(x, y)] : this.high[this.idx(tx, ty)]) n++;
          }
        }
        const i = this.idx(tx, ty);
        if (n >= 5) next[i] = 1;
        else if (n <= 2) next[i] = 0;
        if (this.altarDist(tx, ty) <= 11) next[i] = 0;
      }
    }
    this.high = next;
  }

  /** Turn the cliff tiles nearest `(tx, ty)` into a walkable ramp about three tiles wide. */
  private carveRamp(tx: number, ty: number) {
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < this.ground.length; i++) {
      if (this.ground[i] !== "cliff") continue;
      const d = Math.hypot((i % MAP_W) - tx, Math.floor(i / MAP_W) - ty);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    if (best < 0) return;
    const bx = best % MAP_W;
    const by = Math.floor(best / MAP_W);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = bx + dx;
        const y = by + dy;
        if (!this.inBounds(x, y)) continue;
        const i = this.idx(x, y);
        if (this.ground[i] === "cliff") this.ground[i] = "ramp";
        this.prop[i] = 0;
      }
    }
  }

  private setWater(tx: number, ty: number) {
    if (!this.inBounds(tx, ty)) return;
    const i = this.idx(tx, ty);
    if (this.high[i]) return;
    this.ground[i] = "water";
    this.prop[i] = 0;
  }

  private fordRow(ty: number) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const i = this.idx(tx, ty);
      if (this.ground[i] === "water") this.ground[i] = "shallow";
    }
  }

  private setRoad(tx: number, ty: number) {
    if (!this.inBounds(tx, ty)) return;
    const i = this.idx(tx, ty);
    if (this.ground[i] === "grass" && this.altarDist(tx, ty) >= 3.6) {
      this.ground[i] = "dirt";
      this.prop[i] = 0;
    }
  }

  private placeLandmarks(lake: { x: number; y: number; rx: number; ry: number }) {
    const { cx, cy } = this;
    const low = (tx: number, ty: number) => this.ground[this.idx(tx, ty)] === "grass" || this.ground[this.idx(tx, ty)] === "dirt";
    const hi = (tx: number, ty: number) => this.ground[this.idx(tx, ty)] === "grassHi";

    this.landmarks.shepherdCamp = this.findSpot(cx + 9, cy + 15, 2, 2, low);
    this.landmarks.ancientOlive = this.findSpot(cx - 5, cy + 17, 2, 2, low);
    this.landmarks.cistern = this.findSpot(cx - 25, cy - 7, 2, 1, low);
    this.landmarks.standingStones = this.findSpot(cx + 18, cy - 13, 2, 2, hi);
    this.landmarks.milestone = this.findSpot(cx + 22, cy - 3, 1, 1, low);
    this.landmarks.boatyard = this.findSpot(lake.x + lake.rx + 2, lake.y - 1, 2, 1, (tx, ty) => {
      if (!low(tx, ty)) return false;
      for (const [dx, dy] of [[-1, 0], [0, 1], [0, -1], [-2, 0]]) {
        if (this.inBounds(tx + dx, ty + dy) && this.ground[this.idx(tx + dx, ty + dy)] === "water") return true;
      }
      return false;
    });
    // The cave sits in a south-facing cliff; the player stands on the lowland below it.
    this.landmarks.cave = this.findSpot(cx + 10, cy - 12, 2, 1, (tx, ty) => {
      const i = this.idx(tx, ty);
      return this.ground[i] === "cliff" && this.cliffFace[i] === 1 && this.ground[this.idx(tx + 1, ty)] === "cliff";
    });

    for (const id of LANDMARK_IDS) {
      const lm = this.landmarks[id];
      // Clear brush around each landmark and make sure its doorstep is walkable ground.
      for (let dy = -2; dy <= lm.fh + 1; dy++) {
        for (let dx = -2; dx <= lm.fw + 1; dx++) {
          const x = lm.tx + dx;
          const y = lm.ty + dy;
          if (this.inBounds(x, y)) this.prop[this.idx(x, y)] = 0;
        }
      }
      const sx = lm.tx + Math.floor(lm.fw / 2);
      const sy = lm.ty + lm.fh;
      if (this.inBounds(sx, sy)) {
        const i = this.idx(sx, sy);
        if (this.ground[i] === "water") this.ground[i] = "shallow";
        if (this.ground[i] === "cliff") this.ground[i] = "ramp";
      }
      lm.spot = { x: (sx + 0.5) * TILE, y: (sy + 1) * TILE - 2 };
    }
  }

  /** Nearest tile to `(tx, ty)` whose `fw×fh` footprint all satisfies `ok`, searching outward in rings. */
  private findSpot(tx: number, ty: number, fw: number, fh: number, ok: (x: number, y: number) => boolean): LandmarkSpot {
    for (let r = 0; r < Math.max(MAP_W, MAP_H); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const x = tx + dx;
          const y = ty + dy;
          if (x < 2 || y < 2 || x + fw > MAP_W - 2 || y + fh > MAP_H - 2) continue;
          let good = true;
          for (let fy = 0; fy < fh && good; fy++) for (let fx = 0; fx < fw && good; fx++) if (!ok(x + fx, y + fy)) good = false;
          if (good) return { tx: x, ty: y, fw, fh, spot: { x: 0, y: 0 } };
        }
      }
    }
    return { tx, ty, fw, fh, spot: { x: 0, y: 0 } };
  }

  private rebuildBlocked() {
    for (let i = 0; i < this.blocked.length; i++) {
      const g = this.ground[i];
      this.blocked[i] = g === "water" || g === "cliff" || this.prop[i] !== 0 ? 1 : 0;
    }
    for (const id of LANDMARK_IDS) {
      const lm = this.landmarks[id];
      for (let fy = 0; fy < lm.fh; fy++) for (let fx = 0; fx < lm.fw; fx++) if (this.inBounds(lm.tx + fx, lm.ty + fy)) this.blocked[this.idx(lm.tx + fx, lm.ty + fy)] = 1;
    }
  }

  private computeReach() {
    this.reach.fill(0);
    const start = this.idx(this.cx, this.cy + 3);
    if (this.blocked[start]) return;
    const queue = [start];
    this.reach[start] = 1;
    while (queue.length) {
      const i = queue.pop()!;
      const tx = i % MAP_W;
      const ty = Math.floor(i / MAP_W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = tx + dx;
        const y = ty + dy;
        if (!this.inBounds(x, y)) continue;
        const j = this.idx(x, y);
        if (this.reach[j] || this.blocked[j]) continue;
        this.reach[j] = 1;
        queue.push(j);
      }
    }
  }

  /** If `spot` can't be walked to from the altar, cut a two-wide path straight toward it. */
  private ensureReachable(spot: { x: number; y: number }) {
    this.computeReach();
    const t = WorldMap.tileOf(spot.x, spot.y);
    if (this.reach[this.idx(t.tx, t.ty)]) return;
    let x0 = t.tx;
    let y0 = t.ty;
    const x1 = this.cx;
    const y1 = this.cy + 3;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.clearForPath(x0, y0);
      this.clearForPath(x0 + 1, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  private clearForPath(tx: number, ty: number) {
    if (!this.inBounds(tx, ty)) return;
    const i = this.idx(tx, ty);
    this.prop[i] = 0;
    if (this.ground[i] === "cliff") this.ground[i] = "ramp";
    if (this.ground[i] === "water") this.ground[i] = "shallow";
  }

  // ---------------------------------------------------------------- draw

  private draw() {
    this.rt.beginDraw();
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const i = this.idx(tx, ty);
        const g = this.ground[i];
        let key: string;
        switch (g) {
          case "grass":
            key = `grass_${(tx * 7 + ty * 13) % 3}`;
            break;
          case "grassHi":
            key = `grass_hi_${(tx * 5 + ty * 11) % 2}`;
            break;
          case "cliff":
            key = this.cliffFace[i] ? "cliff_face" : "cliff_rim";
            break;
          default:
            key = g;
        }
        this.rt.batchDraw(key, tx * TILE, ty * TILE);
      }
    }
    this.rt.endDraw();
  }

  /** Trees, boulders and landmark props are sprites so walkers pass behind them. */
  private drawProps(scene: Phaser.Scene) {
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const p = this.prop[this.idx(tx, ty)];
        if (!p) continue;
        const key = p === 1 ? `tree_${(tx * 3 + ty * 7) % 2}` : "rock";
        const y = (ty + 1) * TILE;
        scene.add.image(tx * TILE + TILE / 2, y, key).setOrigin(0.5, 1).setDepth(y - 2);
      }
    }
    for (const id of LANDMARK_IDS) {
      const lm = this.landmarks[id];
      const y = (lm.ty + lm.fh) * TILE;
      scene.add.image(lm.tx * TILE, y, `lm_${id}`).setOrigin(0, 1).setDepth(y - 1);
    }
  }

  // --------------------------------------------------------------- query

  inBounds(tx: number, ty: number) {
    return tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H;
  }

  groundAt(tx: number, ty: number): Ground | null {
    return this.inBounds(tx, ty) ? this.ground[this.idx(tx, ty)] : null;
  }

  isBlocked(tx: number, ty: number) {
    if (!this.inBounds(tx, ty)) return true;
    return this.blocked[this.idx(tx, ty)] === 1;
  }

  setBlocked(tx: number, ty: number, value: boolean) {
    if (!this.inBounds(tx, ty)) return;
    this.blocked[this.idx(tx, ty)] = value ? 1 : 0;
  }

  isSand(tx: number, ty: number) {
    return this.groundAt(tx, ty) === "sand";
  }

  /** Deep water — blocks walkers, takes a bridge. */
  isWater(tx: number, ty: number) {
    return this.groundAt(tx, ty) === "water";
  }

  /** Solid, open ground a building can stand on. */
  isBuildable(tx: number, ty: number) {
    const g = this.groundAt(tx, ty);
    if (!g || g === "water" || g === "shallow" || g === "cliff" || g === "ramp") return false;
    return this.prop[this.idx(tx, ty)] === 0 && !this.isLandmarkTile(tx, ty);
  }

  isLandmarkTile(tx: number, ty: number) {
    for (const id of LANDMARK_IDS) {
      const lm = this.landmarks[id];
      if (tx >= lm.tx && tx < lm.tx + lm.fw && ty >= lm.ty && ty < lm.ty + lm.fh) return true;
    }
    return false;
  }

  /** True when a walker starting at the altar can reach this tile. */
  isReachable(tx: number, ty: number) {
    return this.inBounds(tx, ty) && this.reach[this.idx(tx, ty)] === 1;
  }

  /** Tiles that count toward "lighting the valley": everything but water and cliff. */
  isLand(tx: number, ty: number) {
    const g = this.groundAt(tx, ty);
    return g !== null && g !== "water" && g !== "cliff";
  }

  isWalkablePoint(x: number, y: number, ghost: boolean) {
    if (x < 2 || y < 2 || x > WORLD_W - 2 || y > WORLD_H - 2) return false;
    if (ghost) return true;
    return !this.isBlocked(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  static tileOf(x: number, y: number) {
    return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
  }

  static center(tx: number, ty: number) {
    return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  }
}
