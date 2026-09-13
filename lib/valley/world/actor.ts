import Phaser from "phaser";
import type { WorldMap } from "./map";
import type { Enemy } from "./enemy";

export function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

/**
 * Shared shape for anything a tempter/deceiver can target — `Villager` and a
 * vulnerable scattered-NPC `Recruit`. `state` stays a plain `string` here so
 * each implementer keeps its own narrower state union; affliction code reads
 * and writes the shared affliction states ("lured", "fallen", "hypno") only.
 */
export interface Afflictable {
  readonly x: number;
  readonly y: number;
  alive: boolean;
  state: string;
  lureBy: Enemy | null;
  lureT: number;
  hypnoBy: Enemy | null;
  hypnoT: number;
  level: number;
}

/**
 * A sprite with feet-anchored movement and tile collision. All walkers
 * (player, villagers, enemies) share this so walls behave identically.
 */
export class Actor {
  sprite: Phaser.GameObjects.Sprite;
  bob = 0;
  facing = 1; // 1 right, -1 left
  ghost = false;
  /** Which way to slide when a wall blocks the straight line; kept so the slide is coherent across frames. */
  private slideSide = 1;
  private slideT = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.sprite = scene.add.sprite(x, y, texture).setOrigin(0.5, 1);
    this.sprite.setDepth(y);
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }

  setPosition(x: number, y: number) {
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(y);
  }

  /** Move by a direction vector for one frame. Returns true if any movement happened. */
  move(dx: number, dy: number, speed: number, dt: number, map: WorldMap): boolean {
    const len = Math.hypot(dx, dy);
    if (len < 0.001) {
      this.bob = 0;
      this.sprite.y = Math.round(this.sprite.y);
      return false;
    }
    const nx = (dx / len) * speed * dt;
    const ny = (dy / len) * speed * dt;
    let moved = false;
    const feetY = this.sprite.y - 3;

    const tryX = this.sprite.x + nx;
    if (map.isWalkablePoint(tryX, feetY, this.ghost)) {
      this.sprite.x = tryX;
      moved = true;
    }
    const tryY = this.sprite.y + ny;
    if (map.isWalkablePoint(this.sprite.x, tryY - 3, this.ghost)) {
      this.sprite.y = tryY;
      moved = true;
    }
    if (Math.abs(dx) > 0.01) {
      this.facing = dx > 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing < 0);
    }
    if (moved) {
      this.bob += dt * 14;
      this.sprite.setDepth(this.sprite.y);
    }
    return moved;
  }

  /** Steer toward a target point. Returns true when within `arrive` px. */
  moveToward(tx: number, ty: number, speed: number, dt: number, map: WorldMap, arrive = 4): boolean {
    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const d = Math.hypot(dx, dy);
    if (d <= arrive) return true;
    const step = Math.min(d, speed * dt);
    const moved = this.move(dx, dy, step / dt, dt, map);
    if (!moved) {
      // Slide along the wall in one consistent direction; flip if that's blocked too,
      // and re-roll the side now and then so long cliff lines don't trap anyone.
      this.slideT -= dt;
      if (this.slideT <= 0) {
        this.slideT = 1.5 + Math.random() * 1.5;
        this.slideSide = Math.random() < 0.5 ? 1 : -1;
      }
      if (!this.move(-dy * this.slideSide, dx * this.slideSide, speed, dt, map)) {
        this.slideSide = -this.slideSide;
        this.move(-dy * this.slideSide, dx * this.slideSide, speed, dt, map);
      }
    } else {
      this.slideT = 0;
    }
    return false;
  }

  /** Walking bob: slight vertical squish. */
  animate() {
    const s = this.bob > 0 ? 1 + Math.sin(this.bob) * 0.05 : 1;
    this.sprite.setScale(1, s);
  }

  destroy() {
    this.sprite.destroy();
  }
}
