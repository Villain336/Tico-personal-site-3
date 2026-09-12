import Phaser from "phaser";
import { MAP_H, MAP_W, TILE, WORLD_H, WORLD_W } from "../config";
import { ALTAR_TILE } from "../save";

export type Ground = "grass" | "sand" | "dirt" | "water";

/** Static ground + a blocking grid that buildings and water write into. */
export class WorldMap {
  ground: Ground[] = [];
  private blocked = new Uint8Array(MAP_W * MAP_H);
  private rt: Phaser.GameObjects.RenderTexture;

  constructor(scene: Phaser.Scene) {
    this.generate();
    this.rt = scene.add.renderTexture(0, 0, WORLD_W, WORLD_H).setOrigin(0, 0).setDepth(-100);
    this.draw();
  }

  private generate() {
    const cx = ALTAR_TILE.tx + 1;
    const cy = ALTAR_TILE.ty + 1;
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        let g: Ground = "grass";
        const d = Math.hypot(tx - cx + 0.5, ty - cy + 0.5);
        if (d < 3.6) g = "sand";
        // two dirt roads crossing at the altar
        if ((tx === cx || tx === cx - 1) && d >= 3.6) g = "dirt";
        if ((ty === cy || ty === cy - 1) && d >= 3.6) g = "dirt";
        // a small pond in the north-east
        if (tx >= MAP_W - 9 && tx <= MAP_W - 5 && ty >= 4 && ty <= 6) g = "water";
        if (tx >= MAP_W - 8 && tx <= MAP_W - 6 && (ty === 3 || ty === 7)) g = "water";
        this.ground.push(g);
        if (g === "water") this.blocked[ty * MAP_W + tx] = 1;
      }
    }
  }

  private draw() {
    this.rt.beginDraw();
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const g = this.ground[ty * MAP_W + tx];
        let key = "grass_0";
        if (g === "grass") key = `grass_${(tx * 7 + ty * 13) % 3}`;
        else if (g === "sand") key = "sand";
        else if (g === "dirt") key = "dirt";
        else key = "water";
        this.rt.batchDraw(key, tx * TILE, ty * TILE);
      }
    }
    this.rt.endDraw();
  }

  inBounds(tx: number, ty: number) {
    return tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H;
  }

  isBlocked(tx: number, ty: number) {
    if (!this.inBounds(tx, ty)) return true;
    return this.blocked[ty * MAP_W + tx] === 1;
  }

  setBlocked(tx: number, ty: number, value: boolean) {
    if (!this.inBounds(tx, ty)) return;
    this.blocked[ty * MAP_W + tx] = value ? 1 : 0;
  }

  isWater(tx: number, ty: number) {
    return this.inBounds(tx, ty) && this.ground[ty * MAP_W + tx] === "water";
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
