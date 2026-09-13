import type { WorldScene } from "../scenes/WorldScene";
import { FLOCK, MAP_H, MAP_W, TILE, XP } from "../config";
import type { BeastKind, SavedBeast } from "../types";
import { Actor, dist } from "./actor";
import { hasIntent } from "./laws";

export class Beast extends Actor {
  kind: BeastKind;
  tame: boolean;
  alive = true;
  hp: number;
  timer = 1 + Math.random() * 3;
  target = { x: 0, y: 0 };

  constructor(scene: WorldScene, kind: BeastKind, x: number, y: number, tame: boolean) {
    super(scene, x, y, `beast_${kind}`);
    this.kind = kind;
    this.tame = tame;
    this.hp = kind === "gazelle" ? 12 : 18;
    this.sprite.setDepth(y);
  }

  serialize(): SavedBeast {
    return { kind: this.kind, tame: this.tame, x: Math.round(this.x), y: Math.round(this.y) };
  }
}

export class Beasts {
  list: Beast[] = [];

  constructor(private scene: WorldScene) {}

  loadFrom(saved: SavedBeast[]) {
    for (const b of saved) this.add(b.kind, b.x, b.y, b.tame);
  }

  seedWild() {
    if (this.list.some((b) => !b.tame)) return;
    let n = 0;
    let tries = 0;
    while (n < FLOCK.gazelleCount && tries++ < 80) {
      const tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
      const ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
      if (!this.scene.map.isReachable(tx, ty)) continue;
      const d = Math.hypot(tx - MAP_W / 2, ty - MAP_H / 2);
      if (d < 12) continue;
      this.add("gazelle", tx * TILE + 8, ty * TILE + 12, false);
      n++;
    }
  }

  ensureFlock() {
    if (this.scene.buildings.count("fold") === 0) return;
    if (this.list.some((b) => b.tame && b.alive)) return;
    const fold = this.scene.buildings.list.find((b) => b.type === "fold");
    if (!fold) return;
    const c = this.scene.buildings.center(fold);
    for (let i = 0; i < FLOCK.startSheep; i++) {
      this.add(i === 0 ? "goat" : "sheep", c.x + (i - 0.5) * 14, c.y + 18, true);
    }
  }

  add(kind: BeastKind, x: number, y: number, tame: boolean) {
    const b = new Beast(this.scene, kind, x, y, tame);
    this.list.push(b);
    return b;
  }

  serialize() {
    return this.list.filter((b) => b.alive).map((b) => b.serialize());
  }

  nearest(x: number, y: number, r: number) {
    let best: Beast | null = null;
    let bd = r;
    for (const b of this.list) {
      if (!b.alive) continue;
      const d = dist(x, y, b.x, b.y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  hit(x: number, y: number, range: number, dmg: number) {
    const b = this.nearest(x, y, range);
    if (!b) return false;
    b.hp -= dmg;
    b.sprite.setTintFill(0xff5b4a);
    this.scene.time.delayedCall(80, () => {
      if (b.alive) b.sprite.clearTint();
    });
    if (b.hp <= 0) this.kill(b);
    return true;
  }

  private kill(b: Beast) {
    b.alive = false;
    const st = this.scene.state;
    st.meat += FLOCK.meatOnHunt;
    if (b.kind !== "gazelle") st.wool += FLOCK.woolOnHunt;
    this.scene.addXp(XP.kill);
    this.scene.fx.burst(b.x, b.y - 8, "px_gold", 5);
    const name = b.kind;
    this.scene.toast(`Took a ${name}. +${FLOCK.meatOnHunt} meat.`, "info");
    if (b.tame) this.scene.civic.maybeFileHunt(this.scene.playerName, `The flock lost a ${name}.`);
    else this.scene.civic.maybeFileHunt(this.scene.playerName, `A ${name} was hunted.`);
    if (hasIntent(st.civic, "kindToBeasts") && b.tame) this.scene.addSin(4);
    const i = this.list.indexOf(b);
    if (i >= 0) this.list.splice(i, 1);
    b.destroy();
  }

  onDawn() {
    const folds = this.scene.buildings.list.filter((b) => b.type === "fold");
    if (folds.length === 0) return 0;
    let wool = 0;
    for (const b of this.list) {
      if (!b.alive || !b.tame) continue;
      wool += FLOCK.woolPerSheep;
    }
    this.scene.state.wool += wool;
    this.ensureFlock();
    return wool;
  }

  update(dt: number) {
    if (this.scene.buildings.count("fold") > 0) this.ensureFlock();
    for (const b of this.list) {
      if (!b.alive) continue;
      b.timer -= dt;
      b.animate();
      b.sprite.setDepth(b.y);
      if (b.timer > 0) {
        b.moveToward(b.target.x, b.target.y, b.tame ? 22 : 36, dt, this.scene.map, 8);
        continue;
      }
      b.timer = 1.2 + Math.random() * 2.5;
      if (b.tame) {
        const fold = this.scene.buildings.list.find((x) => x.type === "fold");
        const c = fold ? this.scene.buildings.center(fold) : { x: b.x, y: b.y };
        b.target = { x: c.x + (Math.random() - 0.5) * TILE * 5, y: c.y + 10 + (Math.random() - 0.5) * TILE * 4 };
      } else {
        b.target = { x: b.x + (Math.random() - 0.5) * TILE * 8, y: b.y + (Math.random() - 0.5) * TILE * 8 };
      }
    }
  }
}
