import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import type { BuildingType, SavedBuilding } from "../types";
import {
  ALTAR,
  BUILDINGS,
  CROPS,
  HOUSE,
  MAP_H,
  MAP_W,
  TILE,
  TOWER_COOLDOWN_MS,
  TOWER_DAMAGE,
  TOWER_RANGE,
  WAVES,
} from "../config";
import type { LightSource } from "./darkness";
import { dist } from "./actor";

export type Building = {
  type: BuildingType;
  tx: number;
  ty: number;
  size: 1 | 2;
  sprite: Phaser.GameObjects.Sprite;
  /** crops: growth 0..3 · idol: hits remaining */
  stage: number;
  /** altar level */
  level: number;
  plantedAt: number;
  cooldown: number;
};

function textureFor(b: Pick<Building, "type" | "stage" | "level">) {
  switch (b.type) {
    case "farm":
      return `farm_${Math.min(3, b.stage)}`;
    case "vineyard":
      return `vineyard_${Math.min(3, b.stage)}`;
    case "altar":
      return `altar_${Math.max(1, Math.min(ALTAR.maxLevel, b.level))}`;
    default:
      return b.type;
  }
}

export class Buildings {
  list: Building[] = [];

  constructor(private scene: WorldScene) {}

  get altar(): Building {
    return this.list.find((b) => b.type === "altar")!;
  }

  get altarLevel() {
    return this.altar?.level ?? 1;
  }

  sizeOf(type: BuildingType): 1 | 2 {
    if (type === "altar" || type === "house") return 2;
    return BUILDINGS[type as keyof typeof BUILDINGS]?.size ?? 1;
  }

  blocks(type: BuildingType) {
    if (type === "altar" || type === "idol") return true;
    return BUILDINGS[type as keyof typeof BUILDINGS]?.blocks ?? false;
  }

  center(b: Building) {
    return { x: (b.tx + b.size / 2) * TILE, y: (b.ty + b.size / 2) * TILE };
  }

  occupant(tx: number, ty: number): Building | null {
    for (const b of this.list) {
      if (tx >= b.tx && tx < b.tx + b.size && ty >= b.ty && ty < b.ty + b.size) return b;
    }
    return null;
  }

  canPlace(type: BuildingType, tx: number, ty: number) {
    const size = this.sizeOf(type);
    const onWater = type !== "altar" && type !== "idol" && !!BUILDINGS[type].onWater;
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        if (x < 1 || y < 1 || x >= MAP_W - 1 || y >= MAP_H - 1) return false;
        if (onWater ? !this.scene.map.isWater(x, y) : !this.scene.map.isBuildable(x, y)) return false;
        // the sand around the altar is sacred ground — keeps a walkable ring
        if (type !== "altar" && this.scene.map.isSand(x, y)) return false;
        if (this.occupant(x, y)) return false;
      }
    }
    return true;
  }

  place(type: BuildingType, tx: number, ty: number, init: Partial<Pick<Building, "stage" | "level" | "plantedAt">> = {}) {
    const size = this.sizeOf(type);
    const b: Building = {
      type,
      tx,
      ty,
      size,
      stage: init.stage ?? (type === "idol" ? WAVES.idolHp : 0),
      level: init.level ?? 1,
      plantedAt: init.plantedAt ?? this.scene.worldTime(),
      cooldown: 0,
      sprite: this.scene.add.sprite(tx * TILE, (ty + size) * TILE, "px_white").setOrigin(0, 1),
    };
    b.sprite.setTexture(textureFor(b));
    const ground = type === "farm" || type === "vineyard" || type === "wall" || type === "bridge";
    b.sprite.setDepth(ground ? -50 : (ty + size) * TILE);
    if (type === "wall") b.sprite.setDepth((ty + size) * TILE - 8);
    if (this.blocks(type)) {
      for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) this.scene.map.setBlocked(tx + dx, ty + dy, true);
    } else if (type === "bridge") {
      // a bridge turns the water under it into a crossing
      for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) this.scene.map.setBlocked(tx + dx, ty + dy, false);
    }
    this.list.push(b);
    this.scene.lightsDirty = true;
    return b;
  }

  remove(b: Building) {
    const i = this.list.indexOf(b);
    if (i < 0) return;
    this.list.splice(i, 1);
    if (this.blocks(b.type)) {
      for (let dy = 0; dy < b.size; dy++) for (let dx = 0; dx < b.size; dx++) this.scene.map.setBlocked(b.tx + dx, b.ty + dy, false);
    }
    b.sprite.destroy();
    this.scene.lightsDirty = true;
  }

  loadFrom(saved: SavedBuilding[]) {
    for (const s of saved) {
      this.place(s.type, s.tx, s.ty, { stage: s.stage, level: s.level, plantedAt: s.plantedAt });
    }
    if (!this.altar) {
      this.place("altar", Math.floor(MAP_W / 2) - 1, Math.floor(MAP_H / 2) - 1, { level: 1 });
    }
  }

  serialize(): SavedBuilding[] {
    return this.list.map((b) => ({
      type: b.type,
      tx: b.tx,
      ty: b.ty,
      stage: b.stage,
      level: b.level,
      plantedAt: b.plantedAt,
    }));
  }

  lightSources(): LightSource[] {
    const out: LightSource[] = [];
    for (const b of this.list) {
      let radius = 0;
      if (b.type === "altar") radius = ALTAR.light[b.level] ?? ALTAR.light[1];
      else if (b.type !== "idol") radius = BUILDINGS[b.type as keyof typeof BUILDINGS]?.light ?? 0;
      if (radius <= 0) continue;
      out.push({ tx: b.tx + b.size / 2 - 0.5, ty: b.ty + b.size / 2 - 0.5, radius });
    }
    return out;
  }

  count(type: BuildingType) {
    let n = 0;
    for (const b of this.list) if (b.type === type) n++;
    return n;
  }

  capacity() {
    return this.count("house") * HOUSE.capacity;
  }

  houses() {
    return this.list.filter((b) => b.type === "house");
  }

  idols() {
    return this.list.filter((b) => b.type === "idol");
  }

  nearest(type: BuildingType, x: number, y: number, maxDist = Infinity): Building | null {
    let best: Building | null = null;
    let bd = maxDist;
    for (const b of this.list) {
      if (b.type !== type) continue;
      const c = this.center(b);
      const d = dist(c.x, c.y, x, y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  readyCrops() {
    return this.list.filter((b) => (b.type === "farm" || b.type === "vineyard") && b.stage >= 3);
  }

  upgradeAltar(): boolean {
    const a = this.altar;
    if (!a || a.level >= ALTAR.maxLevel) return false;
    const cost = ALTAR.upgradeCost[a.level];
    if (this.scene.state.coins < cost) return false;
    this.scene.addCoins(-cost);
    a.level++;
    a.sprite.setTexture(textureFor(a));
    this.scene.lightsDirty = true;
    return true;
  }

  /** Harvest a ready crop; returns what was gathered. */
  harvest(b: Building): { kind: "wheat" | "grapes"; qty: number } | null {
    if (b.stage < 3) return null;
    const steward = 1 + this.scene.state.skills.steward * 0.15;
    const kind = b.type === "farm" ? "wheat" : "grapes";
    const base = kind === "wheat" ? CROPS.wheat.yield : CROPS.grapes.yield;
    const qty = Math.max(1, Math.round(base * steward));
    b.stage = 0;
    b.plantedAt = this.scene.worldTime();
    b.sprite.setTexture(textureFor(b));
    return { kind, qty };
  }

  /** Returns true when the idol is destroyed. */
  hitIdol(b: Building): boolean {
    b.stage -= 1;
    this.scene.tweens.add({ targets: b.sprite, x: b.sprite.x + 2, duration: 40, yoyo: true, repeat: 1 });
    if (b.stage <= 0) {
      this.remove(b);
      return true;
    }
    return false;
  }

  update(dt: number) {
    const t = this.scene.worldTime();
    for (const b of this.list) {
      if (b.type === "farm" || b.type === "vineyard") {
        const grow = b.type === "farm" ? CROPS.wheat.growSeconds : CROPS.grapes.growSeconds;
        const stage = Math.min(3, Math.floor(((t - b.plantedAt) / grow) * 3));
        if (stage !== b.stage) {
          b.stage = stage;
          b.sprite.setTexture(textureFor(b));
        }
      } else if (b.type === "tower") {
        b.cooldown -= dt * 1000;
        if (b.cooldown <= 0) {
          const c = this.center(b);
          const target = this.scene.enemies.nearestTo(c.x, c.y, TOWER_RANGE, (e) => !e.def.swordImmune);
          if (target) {
            b.cooldown = TOWER_COOLDOWN_MS;
            this.scene.fx.arrow(c.x, c.y - 24, target.x, target.y - 10, () => {
              if (target.alive) this.scene.enemies.damage(target, TOWER_DAMAGE, "tower");
            });
          }
        }
      } else if (b.type === "idol") {
        b.cooldown += dt;
        if (b.cooldown >= WAVES.idolSpawnEveryS && this.scene.enemies.count() < 24) {
          b.cooldown = 0;
          const c = this.center(b);
          this.scene.enemies.spawn("tempter", c.x + (Math.random() - 0.5) * 20, c.y + 12);
        }
      }
    }
  }
}
