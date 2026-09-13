import type { WorldScene } from "../scenes/WorldScene";
import { CIVIC, ENEMIES, SIN, TILE, UNLOCK_FX, WAVES, XP, type EnemyDef, type EnemyKind } from "../config";
import { applyDrop, bountyCoins, emptyGear, GEAR, rollEnemyDrop } from "./gear";
import { hasIntent } from "./laws";
import { line } from "../dialogue";
import { Actor, dist, type Afflictable } from "./actor";
import { Recruit } from "./recruit";
import type { Villager } from "./villager";

export type DamageSource = "sword" | "tower" | "staff" | "cast";

export class Enemy extends Actor {
  kind: EnemyKind;
  def: EnemyDef;
  hp: number;
  alive = true;
  state = "hunt";
  timer = 0;
  attackCd = 0;
  stun = 0;
  retarget = 0;
  /** A villager or a vulnerable scattered-NPC recruit — anything `Afflictable`. */
  target: Afflictable | null = null;
  goal: { x: number; y: number } | null = null;
  revealed = false;
  dashT = 0;
  dashDir = { x: 0, y: 0 };
  age = 0;

  constructor(scene: WorldScene, kind: EnemyKind, x: number, y: number) {
    super(scene, x, y, kind);
    this.kind = kind;
    this.def = ENEMIES[kind];
    this.hp = this.def.hp;
    if (kind === "spirit") {
      this.ghost = true;
      this.sprite.setAlpha(0.6);
    }
    if (kind === "goliath") {
      this.sprite.setScale(1.85);
      this.sprite.setTint(0xd4b483);
    }
  }
}

export class Enemies {
  list: Enemy[] = [];

  constructor(private scene: WorldScene) {}

  count(filter?: (e: Enemy) => boolean) {
    let n = 0;
    for (const e of this.list) if (e.alive && (!filter || filter(e))) n++;
    return n;
  }

  spawn(kind: EnemyKind, x: number, y: number) {
    const e = new Enemy(this.scene, kind, x, y);
    this.list.push(e);
    if (kind === "prophet") {
      e.goal = this.prophetGoal();
      e.timer = WAVES.idolSpawnEveryS - 8;
      this.scene.toast("A false prophet approaches the valley!", "bad");
    }
    if (kind === "goliath") {
      this.scene.toast("Goliath has come down to the valley. Stand with David.", "bad");
      this.scene.speech.say(e.sprite, line("goliath", "arrive"), "dark", 0);
    }
    if (kind === "robber" && Math.random() < 0.5) {
      this.scene.speech.say(e.sprite, line("robber", "taunt"), "dark", 0);
    }
    return e;
  }

  private prophetGoal() {
    const c = this.scene.buildings.center(this.scene.buildings.altar);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = TILE * (6 + Math.random() * 3);
      const x = c.x + Math.cos(a) * r;
      const y = c.y + Math.sin(a) * r;
      if (this.scene.map.isWalkablePoint(x, y, false)) return { x, y };
    }
    return { x: c.x + TILE * 7, y: c.y };
  }

  nearestTo(x: number, y: number, maxD = Infinity, filter?: (e: Enemy) => boolean): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD;
    for (const e of this.list) {
      if (!e.alive || (filter && !filter(e))) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  /** Villagers plus vulnerable scattered-NPC recruits — anything a tempter/deceiver may target (R12). */
  private afflictablePools(): Afflictable[][] {
    return [this.scene.villagers.list, this.scene.recruitManager.vulnerableList];
  }

  /** `Afflictable` has exactly two implementors, `Villager` and `Recruit` — the cast below reflects that. */
  private releaseHypnoTarget(v: Afflictable) {
    if (v instanceof Recruit) this.scene.recruitManager.releaseHypno(v);
    else this.scene.villagers.releaseHypno(v as Villager);
  }

  private lowestLevelTarget(filter: (v: Afflictable) => boolean): Afflictable | null {
    let best: Afflictable | null = null;
    for (const pool of this.afflictablePools()) {
      for (const v of pool) {
        if (!v.alive || !filter(v)) continue;
        if (!best || v.level < best.level) best = v;
      }
    }
    return best;
  }

  private nearestTarget(x: number, y: number, maxD: number, filter: (v: Afflictable) => boolean): Afflictable | null {
    let best: Afflictable | null = null;
    let bd = maxD;
    for (const pool of this.afflictablePools()) {
      for (const v of pool) {
        if (!v.alive || !filter(v)) continue;
        const d = dist(x, y, v.x, v.y);
        if (d < bd) {
          bd = d;
          best = v;
        }
      }
    }
    return best;
  }

  remove(e: Enemy) {
    e.alive = false;
    const i = this.list.indexOf(e);
    if (i >= 0) this.list.splice(i, 1);
    this.scene.speech.drop(e.sprite);
    for (const v of this.scene.villagers.list) {
      if (v.lureBy === e) {
        v.lureBy = null;
        v.lureT = 0;
        if (v.state === "lured") v.state = "flee";
      }
      if (v.hypnoBy === e) this.scene.villagers.releaseHypno(v);
    }
    for (const r of this.scene.recruitManager.vulnerableList) {
      if (r.lureBy === e) {
        r.lureBy = null;
        r.lureT = 0;
        if (r.state === "lured") r.state = "flee";
      }
      if (r.hypnoBy === e) this.scene.recruitManager.releaseHypno(r);
    }
    e.destroy();
  }

  damage(e: Enemy, amount: number, source: DamageSource) {
    if (!e.alive) return;
    if (e.def.swordImmune && source !== "cast") {
      this.scene.fx.burst(e.x, e.y - 10, "px_violet", 3);
      this.scene.speech.say(e.sprite, line("spirit", "immune"), "dark", 3000);
      return;
    }
    e.hp -= amount;
    e.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!e.alive) return;
      e.sprite.clearTint();
      if (e.kind === "goliath") e.sprite.setTint(0xd4b483);
    });
    if (e.kind === "robber") this.scene.speech.say(e.sprite, line("robber", "hit"), "dark", 2500);
    else if (e.kind === "tempter") this.scene.speech.say(e.sprite, line("tempter", "hit"), "dark", 2500);
    else if (e.kind === "deceiver") this.scene.speech.say(e.sprite, line("deceiver", "hit"), "dark", 2500);
    else if (e.kind === "prophet") this.scene.speech.say(e.sprite, line("prophet", "anger"), "dark", 2500);
    else if (e.kind === "goliath") this.scene.speech.say(e.sprite, line("goliath", "hit"), "dark", 2500);
    if (e.kind === "deceiver") e.revealed = true;
    if (e.hp <= 0) this.kill(e, true);
  }

  kill(e: Enemy, bounty: boolean) {
    if (!e.alive) return;
    const { x, y } = e;
    if (bounty) {
      const st = this.scene.state;
      const hunter = st.skills.hunter ?? 0;
      let coins = bountyCoins(e.def.bounty, hunter);
      const protectedSomeone = this.scene.villagers.anyWithin(x, y, WAVES.protectionRadius);
      if (protectedSomeone) {
        coins += bountyCoins(e.def.bounty, hunter);
        this.scene.toast(`Protection bounty +${e.def.bounty}`, "good");
      }
      this.scene.addCoins(coins);
      this.scene.addXp(e.kind === "goliath" ? XP.goliath : e.kind === "prophet" ? XP.prophet : XP.kill);
      st.stats.kills++;
      if (e.kind === "robber") this.scene.quests.reportProgress("david", 1);
      else if (e.kind === "deceiver") this.scene.quests.reportProgress("paul", 1);
      const roll = rollEnemyDrop(e.kind, hunter, Math.random);
      const dropped = applyDrop(st.gear ?? emptyGear(), roll);
      st.gear = dropped.gear;
      if (roll.relic) st.relics = (st.relics ?? 0) + 1;
      if (roll.scraps > 0) this.scene.toast(`Scraps +${roll.scraps}.`, "info");
      if (dropped.gained) {
        const def = GEAR[dropped.gained];
        this.scene.toast(dropped.gear[def.slot] === dropped.gained ? `${def.name} is yours.` : `${def.name} goes in the bag. Press I.`, "good");
      } else if (dropped.extraScraps > 0) {
        this.scene.toast(`Already owned — scraps +${dropped.extraScraps}.`, "info");
      }
      if (e.kind === "goliath") {
        st.unlocks.goliathDefeated = true;
        this.scene.toast("Goliath falls. His mail is yours.", "good");
      }
      this.scene.fx.coins(x, y - 10, Math.min(6, Math.ceil(coins / 5)));
    }
    this.scene.fx.burst(x, y - 10, e.kind === "spirit" ? "px_violet" : "px_coral", 8);
    this.remove(e);
  }

  /** Cast out: banish spirits, reveal + stun deceivers. Returns banished count. */
  castAround(x: number, y: number, r: number) {
    let n = 0;
    for (const e of [...this.list]) {
      if (!e.alive || dist(x, y, e.x, e.y - 8) > r) continue;
      if (e.kind === "spirit") {
        this.scene.speech.say(e.sprite, line("spirit", "banished"), "dark", 0);
        this.kill(e, true);
        n++;
      } else if (e.kind === "deceiver") {
        e.revealed = true;
        e.stun = 2.5;
        if (e.target?.state === "hypno") this.releaseHypnoTarget(e.target);
        this.scene.speech.say(e.sprite, line("deceiver", "revealed"), "dark", 0);
      } else if (e.kind === "tempter") {
        e.stun = 1.2;
        if (e.target) {
          e.target.lureBy = null;
          e.target.lureT = 0;
        }
      }
    }
    return n;
  }

  /** The altar flares: stun and shove everything nearby (used when the player falls). */
  repelAround(x: number, y: number, r: number) {
    for (const e of this.list) {
      if (!e.alive || dist(x, y, e.x, e.y) > r) continue;
      e.stun = 3;
      const ang = Math.atan2(e.y - y, e.x - x);
      const nx = e.x + Math.cos(ang) * 40;
      const ny = e.y + Math.sin(ang) * 40;
      if (this.scene.map.isWalkablePoint(nx, ny - 3, e.ghost)) e.setPosition(nx, ny);
    }
  }

  /** Dawn: night shadows retreat without bounty. Goliath stays. */
  clearAll() {
    for (const e of [...this.list]) {
      if (e.kind === "goliath") continue;
      this.scene.fx.burst(e.x, e.y - 10, "px_violet", 4);
      this.remove(e);
    }
  }

  livingBoss(): Enemy | null {
    return this.list.find((e) => e.alive && e.kind === "goliath") ?? null;
  }

  update(dt: number) {
    const sc = this.scene;
    const player = sc.player;
    const st = sc.state;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (!e.alive) continue;
      e.age += dt;
      e.attackCd -= dt;
      e.retarget -= dt;
      e.animate();

      if (e.stun > 0) {
        e.stun -= dt;
        e.sprite.setAlpha(0.5 + Math.sin(e.age * 20) * 0.2);
        continue;
      }
      if (e.kind !== "spirit") e.sprite.setAlpha(1);

      switch (e.kind) {
        case "robber": {
          if (e.hp < e.def.hp * 0.3) {
            if (e.state !== "flee") {
              e.state = "flee";
              sc.speech.say(e.sprite, line("robber", "flee"), "dark", 0);
            }
            if (e.retarget <= 0) {
              e.retarget = 1;
              e.goal = sc.darkness.nearestDark(e.x, e.y);
            }
            if (e.goal) e.moveToward(e.goal.x, e.goal.y, e.def.speed * 1.2, dt, sc.map);
            if (sc.darkness.isDark(e.x, e.y) && e.age > 3) this.remove(e);
            break;
          }
          if (e.retarget <= 0) {
            e.retarget = 1;
            const v = sc.villagers.nearest(e.x, e.y, 220, (o) => o.state !== "fallen");
            const dp = dist(e.x, e.y, player.x, player.y);
            e.target = v && dist(e.x, e.y, v.x, v.y) < dp * 1.2 ? v : null;
          }
          const tx = e.target?.alive ? e.target.x : player.x;
          const ty = e.target?.alive ? e.target.y : player.y;
          if (e.moveToward(tx, ty, e.def.speed, dt, sc.map, 13) && e.attackCd <= 0) {
            e.attackCd = 1.4;
            if (e.target?.alive) {
              // robbers only ever target villagers (assigned above) — never scattered-NPC recruits
              sc.villagers.damage(e.target as Villager, e.def.damage, e);
            } else if (player.hurt(e.def.damage)) {
              const stolen = Math.min(Math.floor(st.coins), 2);
              if (stolen > 0) {
                sc.addCoins(-stolen);
                sc.speech.say(e.sprite, line("robber", "steal"), "dark", 2000);
              }
            }
          } else if (Math.random() < dt * 0.1 && dist(e.x, e.y, player.x, player.y) < 90) {
            sc.speech.say(e.sprite, line("robber", "taunt"), "dark", 8000);
          }
          break;
        }

        case "tempter": {
          if (e.state === "leave") {
            if (e.retarget <= 0) {
              e.retarget = 1;
              e.goal = sc.darkness.nearestDark(e.x, e.y);
            }
            if (e.goal) e.moveToward(e.goal.x, e.goal.y, e.def.speed, dt, sc.map);
            if (sc.darkness.isDark(e.x, e.y)) this.remove(e);
            break;
          }
          const dp = dist(e.x, e.y, player.x, player.y);
          if (e.dashT > 0) {
            e.dashT -= dt;
            e.move(e.dashDir.x, e.dashDir.y, e.def.speed, dt, sc.map);
            break;
          }
          if (dp < 34) {
            e.dashT = 0.7;
            const ang = Math.atan2(e.y - player.y, e.x - player.x) + (Math.random() - 0.5);
            e.dashDir = { x: Math.cos(ang), y: Math.sin(ang) };
            sc.speech.say(e.sprite, line("tempter", "flee", sc.playerName), "dark", 4000);
            if (e.target) {
              e.target.lureT = Math.max(0, e.target.lureT - 1);
            }
            break;
          }
          if (!e.target || !e.target.alive || e.target.state === "fallen" || e.target.state === "hypno") {
            if (e.retarget <= 0) {
              e.retarget = 2;
              e.target = this.lowestLevelTarget((t) => t.state !== "fallen" && t.state !== "hypno" && !t.lureBy);
            }
          }
          const v = e.target;
          if (!v) {
            // no one to tempt: pester the player, then leave
            if (e.age > 25) {
              if (e.retarget <= 0) {
                e.retarget = 1;
                e.goal = sc.darkness.nearestDark(e.x, e.y);
              }
              if (e.goal) e.moveToward(e.goal.x, e.goal.y, e.def.speed, dt, sc.map);
              if (sc.darkness.isDark(e.x, e.y)) this.remove(e);
            } else {
              e.moveToward(player.x + 50, player.y, e.def.speed * 0.6, dt, sc.map, 20);
            }
            break;
          }
          const close = dist(e.x, e.y, v.x, v.y) < 16;
          if (!close) {
            e.moveToward(v.x, v.y, e.def.speed, dt, sc.map, 12);
          } else {
            v.lureBy = e;
            if (v.state !== "lured") v.state = "lured";
            v.lureT += dt;
            sc.speech.say(e.sprite, line("tempter", "lure"), "dark", 3500);
            if (e.retarget <= 0) {
              e.retarget = 1;
              e.goal = sc.darkness.nearestDark(e.x, e.y);
            }
            if (e.goal) e.moveToward(e.goal.x, e.goal.y, 26, dt, sc.map);
          }
          break;
        }

        case "deceiver": {
          const lit = sc.darkness.lightAt(e.x, e.y) > 0.45;
          if (lit) e.revealed = true;
          if (e.revealed) e.sprite.setTint(0xc084fc);
          else e.sprite.clearTint();

          if (!e.target || !e.target.alive || e.target.state === "fallen") {
            if (e.retarget <= 0) {
              e.retarget = 1.5;
              e.target = this.nearestTarget(e.x, e.y, 400, (t) => t.state !== "fallen" && t.state !== "hypno" && t.state !== "lured");
            }
          }
          const v = e.target;
          if (!v) {
            const c = sc.buildings.center(sc.buildings.altar);
            e.moveToward(c.x + TILE * 4, c.y, e.def.speed, dt, sc.map, 10);
            if (Math.random() < dt * 0.1) sc.speech.say(e.sprite, line("deceiver", "deceive"), "dark", 6000);
            break;
          }
          if (e.moveToward(v.x, v.y, e.def.speed, dt, sc.map, 18)) {
            v.hypnoBy = e;
            if (v.state !== "hypno") v.state = "hypno";
            // the lie works slower once the light has exposed the liar
            v.hypnoT +=
              dt *
              (e.revealed ? 0.5 : 1) *
              (player.hasAbility("paul") ? UNLOCK_FX.clearSightHypnoMult : 1) *
              (hasIntent(sc.state.civic, "sanctuary") ? CIVIC.sanctuaryHypnoMult : 1);
            sc.speech.say(e.sprite, line("deceiver", "deceive"), "dark", 3000);
            if (Math.random() < dt * 2) sc.fx.burst(v.x, v.y - 20, "px_violet", 1);
          }
          break;
        }

        case "spirit": {
          e.sprite.setAlpha(0.5 + Math.sin(e.age * 4) * 0.15);
          if (e.retarget <= 0) {
            e.retarget = 1;
            e.target = sc.villagers.nearest(e.x, e.y, 400, (v) => v.state !== "fallen");
          }
          // spirits only ever target villagers (assigned above) — never scattered-NPC recruits
          const v = e.target?.alive ? (e.target as Villager) : null;
          const tx = v ? v.x : player.x;
          const ty = v ? v.y : player.y;
          const wob = Math.sin(e.age * 3) * 10;
          if (e.moveToward(tx + wob, ty, e.def.speed, dt, sc.map, 10)) {
            if (v) {
              v.xp = Math.max(0, v.xp - 4 * dt);
              if (Math.random() < dt * 0.5) sc.fx.burst(v.x, v.y - 12, "px_violet", 1);
            } else if (e.attackCd <= 0) {
              e.attackCd = 1;
              player.hurt(e.def.damage);
            }
          }
          if (dist(e.x, e.y, player.x, player.y) < 14 && e.attackCd <= 0) {
            e.attackCd = 1;
            player.hurt(e.def.damage);
          }
          if (Math.random() < dt * 0.12) sc.speech.say(e.sprite, line("spirit", "whisper"), "dark", 6000);
          break;
        }

        case "goliath": {
          const dp = dist(e.x, e.y, player.x, player.y);
          if (e.state === "windup") {
            e.timer -= dt;
            e.sprite.setTintFill(e.timer * 8 % 2 < 1 ? 0xffe27a : 0xc45c3e);
            if (e.timer <= 0) {
              e.sprite.clearTint();
              e.sprite.setTint(0xd4b483);
              this.scene.fx.ring(e.x, e.y - 12, 44, 0xc45c3e);
              this.scene.cameras.main.shake(140, 0.006);
              this.scene.speech.say(e.sprite, line("goliath", "slam"), "dark", 0);
              if (dp < 44) player.hurt(e.def.damage);
              for (const v of sc.villagers.list) {
                if (v.alive && dist(e.x, e.y, v.x, v.y) < 44) sc.villagers.damage(v, e.def.damage, e);
              }
              e.state = "recover";
              e.timer = 1.1;
              e.attackCd = 2.2;
            }
            break;
          }
          if (e.state === "recover") {
            e.timer -= dt;
            e.moveToward(player.x, player.y, e.def.speed * 0.35, dt, sc.map, 18);
            if (e.timer <= 0) e.state = "hunt";
            break;
          }
          if (e.moveToward(player.x, player.y, e.def.speed, dt, sc.map, 20) && e.attackCd <= 0) {
            e.state = "windup";
            e.timer = 0.85;
            this.scene.speech.say(e.sprite, line("goliath", "windup"), "dark", 2000);
          } else if (Math.random() < dt * 0.08 && dp < 120) {
            this.scene.speech.say(e.sprite, line("goliath", "taunt"), "dark", 6000);
          }
          break;
        }

        case "prophet": {
          if (e.goal && !e.moveToward(e.goal.x, e.goal.y, e.def.speed, dt, sc.map, 6)) break;
          e.timer += dt;
          if (Math.random() < dt * 0.15) sc.speech.say(e.sprite, line("prophet", "preach"), "dark", 7000);
          if (e.timer >= WAVES.idolSpawnEveryS && sc.buildings.idols().length < 3) {
            e.timer = 0;
            const { tx, ty } = sc.tileAt(e.x + (e.facing > 0 ? TILE : -TILE), e.y - 1);
            if (sc.buildings.canPlace("idol", tx, ty)) {
              sc.buildings.place("idol", tx, ty);
              sc.addSin(SIN.idolPlanted);
              sc.speech.say(e.sprite, line("prophet", "plant"), "dark", 0);
              sc.toast(`A false prophet planted an idol! Sin +${SIN.idolPlanted}. Smash it with your sword.`, "bad");
            }
          }
          if (dist(e.x, e.y, player.x, player.y) < 18 && e.attackCd <= 0) {
            e.attackCd = 1.5;
            player.hurt(e.def.damage);
          }
          break;
        }
      }
    }
  }
}
