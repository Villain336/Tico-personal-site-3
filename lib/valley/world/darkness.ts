import Phaser from "phaser";
import { LANTERN_TILES, LIT_THRESHOLD, MAP_H, MAP_W, TILE, WORLD_H, WORLD_W } from "../config";

export type LightSource = { tx: number; ty: number; radius: number };

/**
 * Per-tile light in 0..1 from all sources; fog alpha is the inverse. The fog
 * is a Graphics object redrawn only when sources change; a separate overlay
 * tints the whole world at night.
 */
export class Darkness {
  light = new Float32Array(MAP_W * MAP_H);
  private fog: Phaser.GameObjects.RenderTexture;
  private brush: Phaser.GameObjects.Image;
  private night: Phaser.GameObjects.Rectangle;
  private sources: LightSource[] = [];
  /** 1 = counts toward the lit ratio (land); 0 = water/cliff, never "lit". */
  private land = new Uint8Array(MAP_W * MAP_H).fill(1);
  /** Which edge tiles a walker can actually leave from. */
  private canSpawn: (tx: number, ty: number) => boolean = () => true;
  /** The player's lantern — purely visual, never counted as "lit". */
  private lantern = { x: -9999, y: -9999 };
  litRatio = 0;

  constructor(scene: Phaser.Scene) {
    this.fog = scene.add.renderTexture(0, 0, WORLD_W, WORLD_H).setOrigin(0, 0).setDepth(1000);
    this.brush = scene.make.image({ key: "light_grad", add: false });
    this.night = scene.add
      .rectangle(0, 0, WORLD_W, WORLD_H, 0x0b1030, 0)
      .setOrigin(0, 0)
      .setDepth(999);
  }

  /** Tell the fog which tiles are land (for the victory ratio) and which edge tiles walkers may spawn on. */
  setTerrain(isLand: (tx: number, ty: number) => boolean, canSpawn: (tx: number, ty: number) => boolean) {
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) this.land[ty * MAP_W + tx] = isLand(tx, ty) ? 1 : 0;
    this.canSpawn = canSpawn;
  }

  recompute(sources: LightSource[]) {
    this.sources = sources;
    this.light.fill(0);
    for (const s of sources) {
      const r = s.radius;
      const x0 = Math.max(0, Math.floor(s.tx - r));
      const x1 = Math.min(MAP_W - 1, Math.ceil(s.tx + r));
      const y0 = Math.max(0, Math.floor(s.ty - r));
      const y1 = Math.min(MAP_H - 1, Math.ceil(s.ty + r));
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const d = Math.hypot(tx - s.tx, ty - s.ty);
          const v = Math.max(0, 1 - d / r);
          const i = ty * MAP_W + tx;
          if (v > this.light[i]) this.light[i] = v;
        }
      }
    }
    let lit = 0;
    let land = 0;
    for (let i = 0; i < this.light.length; i++) {
      if (!this.land[i]) continue;
      land++;
      if (this.light[i] >= LIT_THRESHOLD) lit++;
    }
    this.litRatio = land > 0 ? lit / land : 0;
    this.draw();
  }

  /** Follow the player with a dim lantern so unlit ground can still be explored. Redraws only on real movement. */
  updateLantern(x: number, y: number) {
    if (Math.abs(x - this.lantern.x) < 3 && Math.abs(y - this.lantern.y) < 3) return;
    this.lantern = { x, y };
    this.draw();
  }

  /** Solid fog with each light source erased as a soft radial gradient. */
  private draw() {
    this.fog.clear();
    this.fog.fill(0x07060d, 0.9);
    this.brush.setAlpha(1);
    for (const s of this.sources) {
      const d = s.radius * TILE * 2;
      this.brush.setDisplaySize(d, d);
      this.fog.erase(this.brush, (s.tx + 0.5) * TILE, (s.ty + 0.5) * TILE);
    }
    const d = LANTERN_TILES * TILE * 2;
    this.brush.setDisplaySize(d, d).setAlpha(0.75);
    this.fog.erase(this.brush, this.lantern.x, this.lantern.y);
    this.brush.setAlpha(1);
  }

  /** 0 = full day, 1 = deepest night. */
  setNight(t: number) {
    this.night.setFillStyle(0x0b1030, 0.45 * t);
  }

  lightAt(x: number, y: number) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 0;
    return this.light[ty * MAP_W + tx];
  }

  isDark(x: number, y: number) {
    return this.lightAt(x, y) < LIT_THRESHOLD;
  }

  /** A random dark, walkable edge tile (falls back to any edge tile). */
  randomEdgeSpawn() {
    const edge: { tx: number; ty: number }[] = [];
    for (let tx = 0; tx < MAP_W; tx++) {
      edge.push({ tx, ty: 0 }, { tx, ty: MAP_H - 1 });
    }
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      edge.push({ tx: 0, ty }, { tx: MAP_W - 1, ty });
    }
    const open = edge.filter((t) => this.canSpawn(t.tx, t.ty));
    const usable = open.length > 0 ? open : edge;
    const dark = usable.filter((t) => this.light[t.ty * MAP_W + t.tx] < LIT_THRESHOLD);
    const pool = dark.length > 0 ? dark : usable;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { x: pick.tx * TILE + TILE / 2, y: pick.ty * TILE + TILE };
  }

  /** Nearest dark tile center from a point (search outward in rings). */
  nearestDark(x: number, y: number) {
    const sx = Math.floor(x / TILE);
    const sy = Math.floor(y / TILE);
    for (let r = 1; r < Math.max(MAP_W, MAP_H); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = sx + dx;
          const ty = sy + dy;
          if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
          if (this.light[ty * MAP_W + tx] < LIT_THRESHOLD) {
            return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
          }
        }
      }
    }
    return { x: x < WORLD_W / 2 ? 8 : WORLD_W - 8, y: y < WORLD_H / 2 ? 8 : WORLD_H - 8 };
  }
}
