import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import { TILE, WORLD_W } from "../config";
import type { BuildingType } from "../types";

export const ENTERABLE: BuildingType[] = ["hall", "house", "store", "changer", "granary", "fold"];

const ROOM = { w: 12, h: 8 };
const ORIGIN = { x: WORLD_W + 40, y: 40 };

const TITLE: Partial<Record<BuildingType, string>> = {
  hall: "the town hall",
  house: "a house",
  store: "the storehouse",
  changer: "the money changer",
  granary: "Noah's granary",
  fold: "the sheepfold",
};

/**
 * Pocket-space rooms just east of the map. The player walks in; the valley
 * keeps running outside. E at the door returns them.
 */
export class Interiors {
  active: BuildingType | null = null;
  exit = { x: 0, y: 0 };
  private sprites: Phaser.GameObjects.GameObject[] = [];

  constructor(private scene: WorldScene) {
    scene.map.walkOverride = (x, y) => this.walkable(x, y);
  }

  get label() {
    return this.active ? TITLE[this.active] ?? "inside" : null;
  }

  contains(x: number, y: number) {
    return x >= ORIGIN.x - 4 && y >= ORIGIN.y - 4 && x <= ORIGIN.x + ROOM.w * TILE + 4 && y <= ORIGIN.y + ROOM.h * TILE + 4;
  }

  /** null = use the outdoor map. */
  walkable(x: number, y: number): boolean | null {
    if (!this.active) return null;
    if (!this.contains(x, y)) return false;
    const tx = Math.floor((x - ORIGIN.x) / TILE);
    const ty = Math.floor((y - ORIGIN.y) / TILE);
    if (tx <= 0 || ty <= 0 || tx >= ROOM.w - 1 || ty >= ROOM.h - 1) {
      return tx === Math.floor(ROOM.w / 2) && ty === ROOM.h - 1;
    }
    return true;
  }

  doorWorld() {
    return { x: ORIGIN.x + (ROOM.w / 2 + 0.5) * TILE, y: ORIGIN.y + ROOM.h * TILE - 4 };
  }

  atDoor(x: number, y: number) {
    const d = this.doorWorld();
    return Math.hypot(x - d.x, y - d.y) < TILE * 1.4;
  }

  enter(kind: BuildingType, fromX: number, fromY: number) {
    this.leave(true);
    this.active = kind;
    this.exit = { x: fromX, y: fromY };
    this.buildRoom(kind);
    const door = this.doorWorld();
    this.scene.player.setPosition(door.x, door.y - 18);
    this.scene.cameraDirector.setInterior({
      x: ORIGIN.x - 16,
      y: ORIGIN.y - 24,
      w: ROOM.w * TILE + 32,
      h: ROOM.h * TILE + 40,
    });
    this.scene.toast(`You step into ${TITLE[kind] ?? "the building"}. E at the door to leave.`, "info");
  }

  leave(silent = false) {
    if (!this.active && this.sprites.length === 0) return;
    for (const s of this.sprites) s.destroy();
    this.sprites = [];
    const was = this.active;
    this.active = null;
    this.scene.cameraDirector.setInterior(null);
    if (was && !silent) {
      this.scene.player.setPosition(this.exit.x, this.exit.y);
      this.scene.toast("Back into the valley.", "info");
    }
  }

  private buildRoom(kind: BuildingType) {
    const floor = kind === "fold" ? "dirt" : kind === "hall" ? "sand" : "dirt";
    for (let ty = 0; ty < ROOM.h; ty++) {
      for (let tx = 0; tx < ROOM.w; tx++) {
        const x = ORIGIN.x + tx * TILE;
        const y = ORIGIN.y + ty * TILE;
        const edge = tx === 0 || ty === 0 || tx === ROOM.w - 1 || ty === ROOM.h - 1;
        const door = tx === Math.floor(ROOM.w / 2) && ty === ROOM.h - 1;
        const key = door ? "dirt" : edge ? "wall" : floor;
        const img = this.scene.add.image(x, y + TILE, key).setOrigin(0, 1).setDepth(y - 80);
        this.sprites.push(img);
      }
    }
    const midX = ORIGIN.x + (ROOM.w / 2) * TILE;
    const midY = ORIGIN.y + 4 * TILE;
    if (kind === "hall") {
      this.sprites.push(this.scene.add.image(midX, midY, "changer").setOrigin(0.5, 1).setDepth(midY));
    } else if (kind === "house") {
      this.sprites.push(this.scene.add.image(ORIGIN.x + 3 * TILE, midY, "lamp").setOrigin(0.5, 1).setDepth(midY));
    } else if (kind === "store" || kind === "granary") {
      this.sprites.push(this.scene.add.image(midX, midY, "store").setOrigin(0.5, 1).setDepth(midY).setScale(0.7));
    } else if (kind === "fold") {
      this.sprites.push(this.scene.add.image(midX, midY, "beast_sheep").setOrigin(0.5, 1).setDepth(midY));
    }
  }
}

export { TITLE as INTERIOR_TITLE };
