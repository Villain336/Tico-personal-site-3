import type { WorldScene } from "../scenes/WorldScene";
import type { Gender, SavedVillager } from "../types";
import { ALTAR, HOUSE, SIN, TILE, VILLAGER, XP } from "../config";
import { line } from "../dialogue";
import { VILLAGER_VARIANTS } from "../textures";
import { Actor, dist, type Afflictable } from "./actor";
import type { Enemy } from "./enemy";

export type VillagerState =
  | "idle"
  | "wander"
  | "toAltar"
  | "praying"
  | "toHome"
  | "harvest"
  | "flee"
  | "fight"
  | "lured"
  | "fallen"
  | "hypno";

export class Villager extends Actor implements Afflictable {
  seed: number;
  gender: Gender;
  level: number;
  xp: number;
  hp = VILLAGER.hp;
  home: { x: number; y: number };
  state: VillagerState = "idle";
  target = { x: 0, y: 0 };
  timer = 1;
  lureBy: Enemy | null = null;
  lureT = 0;
  hypnoBy: Enemy | null = null;
  hypnoT = 0;
  fightTarget: Enemy | null = null;
  attackCd = 0;
  distressCd = 0;
  darkRetarget = 0;
  alive = true;
  variant: number;

  constructor(scene: WorldScene, saved: SavedVillager, home: { x: number; y: number }) {
    const variant = Math.abs(saved.seed) % VILLAGER_VARIANTS;
    super(scene, saved.tx * TILE + TILE / 2, saved.ty * TILE + TILE, `vil_${variant}`);
    this.variant = variant;
    this.seed = saved.seed;
    this.gender = saved.gender;
    this.level = saved.level;
    this.xp = saved.xp;
    this.home = home;
    this.refreshTexture();
  }

  refreshTexture() {
    this.sprite.setTexture(this.level >= VILLAGER.fightLevel ? `vil_${this.variant}_staff` : `vil_${this.variant}`);
  }

  get canFight() {
    return this.level >= VILLAGER.fightLevel;
  }

  get busy() {
    return this.state === "fallen" || this.state === "hypno" || this.state === "lured";
  }

  serialize(): SavedVillager {
    return {
      seed: this.seed,
      gender: this.gender,
      level: this.level,
      xp: this.xp,
      tx: Math.floor(this.x / TILE),
      ty: Math.floor((this.y - 1) / TILE),
    };
  }
}

export class Villagers {
  list: Villager[] = [];
  spawnTimer = 0;
  leveledToday = 0;
  fallenToday = 0;
  savedToday = 0;

  constructor(private scene: WorldScene) {}

  get population() {
    return this.list.length;
  }

  loadFrom(saved: SavedVillager[]) {
    for (const s of saved) this.add(s);
  }

  private add(saved: SavedVillager) {
    const home = this.homeFor(saved.seed);
    const v = new Villager(this.scene, saved, home);
    this.list.push(v);
    return v;
  }

  private homeFor(seed: number) {
    const houses = this.scene.buildings.houses();
    const altarC = this.scene.buildings.center(this.scene.buildings.altar);
    if (houses.length === 0) return { x: altarC.x, y: altarC.y + TILE * 3 };
    const h = houses[Math.abs(seed) % houses.length];
    const c = this.scene.buildings.center(h);
    return { x: c.x, y: c.y + TILE * 1.5 };
  }

  serialize(): SavedVillager[] {
    return this.list.filter((v) => v.alive && v.state !== "fallen").map((v) => v.serialize());
  }

  spawnFromHouse() {
    const houses = this.scene.buildings.houses();
    if (houses.length === 0) return;
    const seed = Math.floor(Math.random() * 1_000_000);
    const h = houses[seed % houses.length];
    const c = this.scene.buildings.center(h);
    const v = this.add({
      seed,
      gender: seed % 2 === 0 ? "man" : "woman",
      level: 1,
      xp: 0,
      tx: Math.floor(c.x / TILE),
      ty: Math.floor(c.y / TILE) + 1,
    });
    v.home = { x: c.x, y: c.y + TILE * 1.5 };
    this.scene.fx.burst(v.x, v.y - 12, "px_lime", 6);
    this.scene.speech.say(v.sprite, line("villager", "greet", this.scene.playerName), "good", 0);
    this.scene.toast("A new villager moved in.", "good");
  }

  nearest(x: number, y: number, maxD = Infinity, filter?: (v: Villager) => boolean): Villager | null {
    let best: Villager | null = null;
    let bd = maxD;
    for (const v of this.list) {
      if (!v.alive || (filter && !filter(v))) continue;
      const d = dist(x, y, v.x, v.y);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  }

  lowestLevel(filter?: (v: Villager) => boolean): Villager | null {
    let best: Villager | null = null;
    for (const v of this.list) {
      if (!v.alive || (filter && !filter(v))) continue;
      if (!best || v.level < best.level) best = v;
    }
    return best;
  }

  anyWithin(x: number, y: number, r: number) {
    return this.list.some((v) => v.alive && v.state !== "fallen" && dist(x, y, v.x, v.y) <= r);
  }

  remove(v: Villager) {
    v.alive = false;
    const i = this.list.indexOf(v);
    if (i >= 0) this.list.splice(i, 1);
    this.scene.speech.drop(v.sprite);
    v.destroy();
  }

  damage(v: Villager, amount: number, from: Enemy) {
    if (!v.alive || v.state === "fallen") return;
    v.hp -= amount;
    v.sprite.setTintFill(0xff5b4a);
    this.scene.time.delayedCall(80, () => {
      if (v.alive) v.sprite.clearTint();
    });
    if (from.kind === "robber") this.scene.speech.say(v.sprite, line("villager", "anger"), "bad", 5000);
    if (v.hp <= 0) this.fall(v, "wounds");
  }

  fall(v: Villager, reason: string) {
    if (v.state === "fallen") return;
    const tempter = v.lureBy;
    if (tempter && tempter.alive && tempter.kind === "tempter") {
      // job done — the tempter slips back into the dark instead of chain-luring
      tempter.state = "leave";
      tempter.target = null;
      this.scene.speech.say(tempter.sprite, line("tempter", "flee", this.scene.playerName), "dark", 0);
    }
    v.state = "fallen";
    v.timer = VILLAGER.fallDurationS;
    v.lureBy = null;
    v.lureT = 0;
    v.hypnoBy = null;
    v.hypnoT = 0;
    v.fightTarget = null;
    v.sprite.setTint(0x6b6b7a);
    v.sprite.setAlpha(0.75);
    this.scene.addSin(SIN.fall);
    this.fallenToday++;
    this.scene.toast(`A villager fell to ${reason}. Sin +${SIN.fall}. Cast out (E) near them to redeem.`, "bad");
    this.scene.speech.say(v.sprite, line("villager", "fallen"), "dark", 0);
    this.grieveNear(v, 2);
  }

  private grieveNear(v: Villager, count: number) {
    const others = this.list
      .filter((o) => o !== v && o.alive && !o.busy && dist(o.x, o.y, v.x, v.y) < 90)
      .slice(0, count);
    for (const o of others) this.scene.speech.say(o.sprite, line("villager", "grief"), "dark", 3000);
  }

  redeemAround(x: number, y: number, r: number) {
    let n = 0;
    for (const v of this.list) {
      if (!v.alive) continue;
      const d = dist(x, y, v.x, v.y - 8);
      if (d > r) continue;
      if (v.state === "fallen") {
        v.state = "idle";
        v.timer = 2;
        v.hp = Math.max(v.hp, 15);
        v.sprite.clearTint();
        v.sprite.setAlpha(1);
        this.scene.addSin(SIN.redeem);
        this.scene.addXp(XP.redeem);
        this.scene.state.stats.redeemed++;
        this.scene.quests.reportProgress("moses", 1);
        this.savedToday++;
        this.scene.speech.say(v.sprite, line("villager", "thanks", this.scene.playerName), "good", 0);
        this.scene.fx.burst(v.x, v.y - 12, "px_lime", 8);
        n++;
      } else if (v.state === "lured") {
        v.state = "flee";
        v.lureBy = null;
        v.lureT = 0;
        this.scene.speech.say(v.sprite, line("villager", "thanks", this.scene.playerName), "good", 0);
        n++;
      }
    }
    return n;
  }

  breakHypnoAround(x: number, y: number, r: number) {
    let n = 0;
    for (const v of this.list) {
      if (!v.alive || v.state !== "hypno") continue;
      if (dist(x, y, v.x, v.y - 8) > r) continue;
      this.releaseHypno(v);
      this.scene.speech.say(v.sprite, line("villager", "thanks", this.scene.playerName), "good", 0);
      n++;
    }
    return n;
  }

  releaseHypno(v: Villager) {
    v.state = "flee";
    v.hypnoBy = null;
    v.hypnoT = 0;
    v.sprite.clearTint();
  }

  private convert(v: Villager) {
    const { x, y } = v;
    this.scene.speech.say(v.sprite, line("deceiver", "converted"), "dark", 0);
    this.remove(v);
    const e = this.scene.enemies.spawn("deceiver", x, y);
    e.revealed = true;
    e.stun = 5; // freshly turned: dazed before they start preaching
    this.scene.addSin(SIN.converted);
    this.fallenToday++;
    this.scene.toast(`A villager was deceived and turned. Sin +${SIN.converted}.`, "bad");
    this.scene.fx.burst(x, y - 12, "px_violet", 10);
  }

  private altarSpot() {
    const c = this.scene.buildings.center(this.scene.buildings.altar);
    const a = Math.random() * Math.PI * 2;
    const r = TILE * (2.2 + Math.random() * 1.2);
    return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r + 6 };
  }

  onDawn() {
    const steward = 1 + this.scene.state.skills.steward * 0.15;
    let rent = 0;
    for (const v of this.list) {
      if (v.state === "fallen") continue;
      rent += v.level * HOUSE.rentPerVillagerLevel * steward;
      this.gainXp(v, 5);
      v.hp = Math.min(VILLAGER.hp, v.hp + 10);
      if (Math.random() < 0.5) this.scene.speech.say(v.sprite, line("villager", "happy"), "good", 0);
    }
    if (this.scene.state.sin > SIN.rentHalvedAt) rent *= 0.5;
    const report = {
      rent: Math.floor(rent),
      leveled: this.leveledToday,
      fallen: this.fallenToday,
      saved: this.savedToday,
    };
    this.leveledToday = 0;
    this.fallenToday = 0;
    this.savedToday = 0;
    return report;
  }

  gainXp(v: Villager, amount: number) {
    if (v.level >= VILLAGER.maxLevel) return;
    v.xp += amount;
    const need = VILLAGER.xpToNext(v.level);
    if (v.xp >= need) {
      v.xp -= need;
      v.level++;
      this.leveledToday++;
      v.refreshTexture();
      this.scene.speech.say(v.sprite, line("villager", "levelUp"), "good", 0);
      this.scene.fx.burst(v.x, v.y - 14, "px_gold", 8);
    }
  }

  update(dt: number) {
    const sc = this.scene;
    const st = sc.state;
    const isNight = sc.isNight();

    if (this.population < sc.buildings.capacity()) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= HOUSE.spawnDelayS) {
        this.spawnTimer = 0;
        this.spawnFromHouse();
      }
    } else {
      this.spawnTimer = 0;
    }

    const altarC = sc.buildings.center(sc.buildings.altar);
    const altarMult = ALTAR.villagerXpMult[sc.buildings.altarLevel] ?? 1;
    const player = sc.player;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const v = this.list[i];
      if (!v.alive) continue;
      v.attackCd -= dt;
      v.distressCd -= dt;
      v.animate();

      // --- afflicted states
      if (v.state === "fallen") {
        v.timer -= dt;
        v.darkRetarget -= dt;
        if (v.darkRetarget <= 0) {
          v.darkRetarget = 1;
          v.target = sc.darkness.nearestDark(v.x, v.y);
        }
        v.moveToward(v.target.x, v.target.y, VILLAGER.speed * 0.8, dt, sc.map);
        if (v.timer <= 0 || sc.darkness.isDark(v.x, v.y)) {
          st.stats.fallen++;
          sc.fx.burst(v.x, v.y - 10, "px_violet", 6);
          this.remove(v);
        }
        continue;
      }
      if (v.state === "hypno") {
        const by = v.hypnoBy;
        if (!by || !by.alive || dist(by.x, by.y, v.x, v.y) > 40) {
          this.releaseHypno(v);
        } else {
          v.sprite.setTint(0x9d7bd6);
          if (Math.random() < dt * 0.4) sc.speech.say(v.sprite, line("villager", "hypno"), "dark", 4000);
          if (v.hypnoT >= VILLAGER.hypnosisS + 2 * (v.level - 1)) {
            this.convert(v);
          }
        }
        continue;
      }
      if (v.state === "lured") {
        const by = v.lureBy;
        if (!by || !by.alive) {
          v.state = "flee";
          v.lureBy = null;
          v.lureT = 0;
        } else {
          v.moveToward(by.x, by.y, VILLAGER.speed * 1.15, dt, sc.map, 10);
          if (v.lureT >= VILLAGER.lureToFallS) this.fall(v, "temptation");
        }
        continue;
      }

      // --- threat awareness
      const threat = sc.enemies.nearestTo(v.x, v.y, 60, (e) => e.kind !== "deceiver" || e.revealed);
      if (threat) {
        if (v.canFight && !threat.def.swordImmune) {
          v.state = "fight";
          v.fightTarget = threat;
        } else if (v.level >= VILLAGER.banishLevel && sc.buildings.altarLevel >= ALTAR.maxLevel && threat.def.swordImmune) {
          if (dist(v.x, v.y, threat.x, threat.y) < 40) {
            sc.fx.ring(v.x, v.y - 10, 40, 0xd7ff3e);
            sc.enemies.castAround(v.x, v.y - 10, 40);
          }
        } else if (v.state !== "flee") {
          v.state = "flee";
          if (v.distressCd <= 0) {
            v.distressCd = 6;
            sc.speech.say(v.sprite, line("villager", "distress", sc.playerName), "bad", 0);
          }
        }
      }

      // --- regular behaviour
      switch (v.state) {
        case "idle": {
          v.timer -= dt;
          if (v.timer > 0) break;
          const roll = Math.random();
          if (isNight) {
            if (v.canFight) {
              v.state = "wander";
              v.target = this.altarSpot();
            } else {
              v.state = "toHome";
            }
          } else if (roll < 0.45) {
            v.state = "toAltar";
            v.target = this.altarSpot();
          } else if (roll < 0.65 && v.level >= 2 && sc.buildings.readyCrops().length > 0) {
            const crops = sc.buildings.readyCrops();
            const pick = crops[Math.floor(Math.random() * crops.length)];
            v.target = sc.buildings.center(pick);
            v.state = "harvest";
          } else {
            v.state = "wander";
            const around = isNight ? v.home : { x: v.home.x, y: v.home.y };
            v.target = {
              x: around.x + (Math.random() - 0.5) * TILE * 6,
              y: around.y + (Math.random() - 0.5) * TILE * 6,
            };
          }
          break;
        }
        case "wander":
        case "toHome": {
          const t = v.state === "toHome" ? v.home : v.target;
          v.timer -= dt;
          if (v.moveToward(t.x, t.y, VILLAGER.speed, dt, sc.map, 6) || v.timer < -8) {
            v.state = "idle";
            v.timer = 1.5 + Math.random() * 3;
          }
          break;
        }
        case "toAltar": {
          v.timer -= dt;
          if (v.moveToward(v.target.x, v.target.y, VILLAGER.speed, dt, sc.map, 6) || v.timer < -12) {
            v.state = "praying";
            v.timer = 8 + Math.random() * 6;
            v.sprite.setFlipX(v.x > altarC.x);
          }
          break;
        }
        case "praying": {
          v.timer -= dt;
          this.gainXp(v, VILLAGER.prayXpPerSecond * altarMult * dt);
          if (Math.random() < dt * 0.15) {
            sc.speech.say(v.sprite, line("villager", "pray"), "good", 10_000);
            sc.fx.burst(v.x, v.y - 18, "px_lime", 2);
          }
          if (v.timer <= 0) {
            v.state = "idle";
            v.timer = 1;
          }
          break;
        }
        case "harvest": {
          v.timer -= dt;
          if (v.moveToward(v.target.x, v.target.y, VILLAGER.speed, dt, sc.map, 8) || v.timer < -12) {
            const b = sc.buildings.readyCrops().find((c) => {
              const cc = sc.buildings.center(c);
              return dist(cc.x, cc.y, v.target.x, v.target.y) < 2;
            });
            if (b) {
              sc.harvest(b, "villager");
              sc.speech.say(v.sprite, line("villager", "happy"), "good", 6000);
            }
            v.state = "idle";
            v.timer = 1;
          }
          break;
        }
        case "flee": {
          const gone = !sc.enemies.nearestTo(v.x, v.y, 90, (e) => e.kind !== "deceiver" || e.revealed);
          const arrived = v.moveToward(altarC.x, altarC.y + TILE * 2, VILLAGER.speed * 1.2, dt, sc.map, 14);
          if (gone || arrived) {
            v.state = "idle";
            v.timer = 1;
          }
          break;
        }
        case "fight": {
          const t = v.fightTarget;
          if (!t || !t.alive || dist(v.x, v.y, t.x, t.y) > 110) {
            v.state = "idle";
            v.timer = 0.5;
            v.fightTarget = null;
            break;
          }
          if (v.moveToward(t.x, t.y, VILLAGER.speed * 1.3, dt, sc.map, 14) && v.attackCd <= 0) {
            v.attackCd = 0.8;
            sc.enemies.damage(t, VILLAGER.staffDamage, "staff");
            sc.speech.say(v.sprite, line("villager", "fight"), "bad", 5000);
          }
          break;
        }
      }

      // wells heal, slow natural regen
      if (v.hp < VILLAGER.hp) {
        const well = sc.buildings.nearest("well", v.x, v.y, TILE * 2);
        v.hp = Math.min(VILLAGER.hp, v.hp + (well ? 5 : 0.4) * dt);
      }

      // greet the player as they pass (daytime, relaxed)
      if (!isNight && v.state !== "flee" && v.state !== "fight" && dist(v.x, v.y, player.x, player.y) < 26) {
        sc.speech.say(v.sprite, line("villager", "greet", sc.playerName), "neutral", VILLAGER.greetCooldownMs);
      }
    }
  }
}
