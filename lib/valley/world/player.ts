import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import { ALTAR, CIVIC, FLOCK, PLAYER, TILE, UNLOCK_FX, XP } from "../config";
import { hasIntent } from "./laws";
import { ENTERABLE } from "./interiors";
import { line } from "../dialogue";
import { Actor, dist } from "./actor";

type Keys = Record<"W" | "A" | "S" | "D" | "UP" | "DOWN" | "LEFT" | "RIGHT" | "SPACE" | "E" | "F", Phaser.Input.Keyboard.Key>;

export class Player extends Actor {
  keys: Keys;
  swordCd = 0;
  invuln = 0;
  sinceHurt = 10;
  praying = false;
  nearAltar = false;
  nearMarket = false;
  nearDrink = false;
  nearChanger = false;
  nearStore = false;
  nearHall = false;
  nearEnter: string | null = null;
  lastDir = { x: 1, y: 0 };
  private offerHold = 0;
  private hungryLineT = 0;
  private prayLineT = 0;
  private sparkleT = 0;

  constructor(private world: WorldScene, x: number, y: number) {
    super(world, x, y, "player");
    this.sprite.setDepth(y);
    const kb = world.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,F") as Keys;
    kb.on("keydown-E", () => this.onPrayKey());
    kb.on("keyup-E", () => {
      this.praying = false;
    });
    kb.on("keydown-F", () => this.eat());
    kb.on("keydown-SPACE", () => this.swing());
  }

  get stats() {
    const s = this.world.state.skills;
    const u = this.world.state.unlocks;
    const weak = this.world.state.hunger < PLAYER.hungerWeakBelow || this.world.state.thirst < PLAYER.thirstWeakBelow;
    const drain = 1 - s.fortitude * 0.2;
    return {
      speed: PLAYER.speed * (1 + s.fleet * 0.12) * (weak ? 0.6 : 1),
      maxHealth: PLAYER.maxHealth + s.fortitude * 30,
      maxPrayer: PLAYER.maxPrayer + s.faith * 30,
      swordDamage:
        PLAYER.swordDamage *
        (1 + s.sword * 0.35) *
        (u.weapon ? UNLOCK_FX.weaponDamageMult : 1) *
        (hasIntent(this.world.state.civic, "conscription") ? CIVIC.conscriptionDamage : 1),
      swordRange: PLAYER.swordRange + (u.weapon ? UNLOCK_FX.weaponRangeBonus : 0),
      castRadius: PLAYER.castRadius + s.faith * 12 + (hasIntent(this.world.state.civic, "sanctuary") ? CIVIC.sanctuaryCastBonus : 0),
      hungerRate: PLAYER.hungerPerSecond * drain,
      thirstRate: PLAYER.thirstPerSecond * drain,
      idleRegen: PLAYER.prayerRegenIdle * (u.blessing ? UNLOCK_FX.blessingIdleRegenMult : 1),
    };
  }

  hasAbility(id: "moses" | "paul") {
    return this.world.state.unlocks.abilities.includes(id);
  }

  update(dt: number) {
    if (this.world.paused) return;
    const st = this.world.state;
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k.A.isDown || k.LEFT.isDown) dx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) dx += 1;
    if (k.W.isDown || k.UP.isDown) dy -= 1;
    if (k.S.isDown || k.DOWN.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.lastDir = { x: dx / len, y: dy / len };
      this.praying = false;
      this.move(dx, dy, this.stats.speed, dt, this.world.map);
    } else {
      this.move(0, 0, 0, dt, this.world.map);
    }
    this.animate();

    this.swordCd -= dt * 1000;
    this.invuln -= dt * 1000;
    this.sinceHurt += dt;

    // proximity
    const altar = this.world.buildings.altar;
    const ac = this.world.buildings.center(altar);
    this.nearAltar = dist(this.x, this.y, ac.x, ac.y) < TILE * 3.2;
    if (this.nearAltar) this.world.jobs.complete("altar");
    const market = this.world.buildings.nearest("market", this.x, this.y, TILE * 2.2);
    this.nearMarket = !!market;
    this.nearChanger = !!this.world.buildings.nearest("changer", this.x, this.y, TILE * 2.2);
    this.nearStore = !!(
      this.world.buildings.nearest("store", this.x, this.y, TILE * 2.4) ||
      this.world.buildings.nearest("granary", this.x, this.y, TILE * 2.4)
    );
    this.nearHall = !!this.world.buildings.nearest("hall", this.x, this.y, TILE * 2.6);
    this.nearEnter = null;
    if (!this.world.interiors?.active) {
      for (const kind of ENTERABLE) {
        const b = this.world.buildings.nearest(kind, this.x, this.y, TILE * 2.4);
        if (b) {
          this.nearEnter = kind;
          break;
        }
      }
    }

    if (this.world.darkness.isDark(this.x, this.y)) this.world.jobs.complete("darkEdge");

    const rooms = this.world.interiors;
    if (rooms?.active === "temple" && this.keys.E.isDown && !rooms.atDoor(this.x, this.y)) {
      this.offerHold += dt;
      if (this.offerHold >= 0.75) {
        this.offerHold = 0;
        this.world.offerGift();
      }
    } else {
      this.offerHold = 0;
    }

    // hunger, thirst, regen
    st.hunger = Math.max(0, st.hunger - this.stats.hungerRate * dt);
    st.thirst = Math.max(0, st.thirst - this.stats.thirstRate * dt);
    const well = this.world.buildings.nearest("well", this.x, this.y, TILE * 2.2);
    const { tx, ty } = this.world.tileAt(this.x, this.y);
    const inShallow = this.world.map.isShallow(tx, ty);
    const atWater = (() => {
      const id = this.world.landmarks.at(this.x, this.y);
      return !!id && this.world.landmarks.isDrinkable(id);
    })();
    this.nearDrink = !!well || inShallow || atWater;
    if (inShallow && st.thirst < 100) {
      st.thirst = Math.min(100, st.thirst + PLAYER.shallowDrinkPerSecond * dt);
    }
    if (st.hunger > 50 && st.thirst > 40 && this.sinceHurt > 3 && st.health < this.stats.maxHealth) {
      st.health = Math.min(this.stats.maxHealth, st.health + 1.5 * dt);
    }
    if (st.thirst <= 0) st.health = Math.max(0, st.health - 2.2 * dt);
    if (st.hunger < PLAYER.hungerWeakBelow || st.thirst < PLAYER.thirstWeakBelow) {
      this.hungryLineT -= dt;
      if (this.hungryLineT <= 0) {
        this.hungryLineT = 12;
        this.world.speech.say(this.sprite, line("player", st.thirst < st.hunger ? "hungry" : "hungry"), "bad");
      }
    }

    // prayer
    if (this.praying && this.nearAltar) {
      const mult = ALTAR.prayerRegenMult[this.world.buildings.altarLevel] ?? 1;
      st.prayer = Math.min(this.stats.maxPrayer, st.prayer + PLAYER.prayerRegenAtAltar * mult * dt);
      this.world.addXp(XP.prayTick * dt);
      this.world.jobs.complete("pray");
      this.prayLineT -= dt;
      this.sparkleT -= dt;
      if (this.sparkleT <= 0) {
        this.sparkleT = 0.35;
        this.world.fx.burst(this.x + (Math.random() - 0.5) * 10, this.y - 16, "px_lime", 2);
      }
      if (this.prayLineT <= 0) {
        this.prayLineT = 6;
        this.world.speech.say(this.sprite, line("player", "pray"), "good", 0);
      }
      this.world.advanceTutorial(1);
    } else {
      this.praying = false;
      st.prayer = Math.min(this.stats.maxPrayer, st.prayer + this.stats.idleRegen * dt);
    }

    // auto-harvest ready crops underfoot
    for (const b of this.world.buildings.readyCrops()) {
      const c = this.world.buildings.center(b);
      if (dist(this.x, this.y - 4, c.x, c.y) < 12) {
        this.world.harvest(b, "player");
      }
    }

    if (st.health <= 0) this.die();
  }

  private onPrayKey() {
    if (this.world.paused) return;
    const rooms = this.world.interiors;
    if (rooms?.active) {
      if (rooms.atDoor(this.x, this.y)) rooms.leave();
      else if (rooms.active === "loom") this.world.useLoom();
      return;
    }
    // A quest-giver is a rare, fixed encounter — it takes priority over the
    // market's routine sell action when both happen to be in range.
    if (this.world.interactWithQuestGiver()) return;
    if (this.nearAltar) {
      this.praying = true;
      return;
    }
    if (this.nearEnter && rooms) {
      const door = this.world.buildings.nearest(this.nearEnter as (typeof ENTERABLE)[number], this.x, this.y, TILE * 2.6);
      if (door) {
        const c = this.world.buildings.center(door);
        rooms.enter(this.nearEnter as (typeof ENTERABLE)[number], c.x, c.y + TILE);
        return;
      }
    }
    if (this.nearMarket && (this.world.hasCrops() || this.world.state.wool > 0)) {
      this.world.sell("all");
      return;
    }
    if (this.nearChanger && this.world.state.coins >= 1) {
      const n = this.world.ledger.depositCoins(this.world.state.coins);
      if (n > 0) this.world.toast(`Deposited ${n} coins with the changer. Press L for the books.`, "good");
      return;
    }
    if (this.nearStore && this.world.hasCrops()) {
      const n = this.world.ledger.depositAllCrops();
      if (n > 0) this.world.toast(`Stored ${n} crops. Press L for the books.`, "good");
      return;
    }
    if (this.nearDrink) {
      this.drink();
      return;
    }
    this.cast();
  }

  drink() {
    const st = this.world.state;
    if (st.thirst >= 100) return;
    st.thirst = Math.min(100, st.thirst + PLAYER.drinkRestore);
    this.world.fx.burst(this.x, this.y - 16, "px_violet", 4);
  }

  /**
   * Space swings all the way around (so an enemy on your back still gets hit);
   * a click swings toward the pointer in a wide arc.
   */
  swing(dirX?: number, dirY?: number) {
    if (this.world.paused || this.swordCd > 0) return;
    this.swordCd = PLAYER.swordCooldownMs;
    const aimed = dirX !== undefined && dirY !== undefined;
    const ang = aimed ? Math.atan2(dirY, dirX) : Math.atan2(this.lastDir.y, this.lastDir.x);
    const range = this.stats.swordRange;
    if (aimed) this.world.fx.slash(this.x, this.y - 10, ang);
    else this.world.fx.ring(this.x, this.y - 10, range + 6, 0xffffff);
    if (aimed) {
      this.lastDir = { x: Math.cos(ang), y: Math.sin(ang) };
      this.facing = Math.cos(ang) >= 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing < 0);
    }
    let hit = false;
    for (const e of this.world.enemies.list) {
      if (!e.alive) continue;
      const d = dist(this.x, this.y - 8, e.x, e.y - 8);
      if (d > range + 10) continue;
      if (aimed) {
        const a = Math.atan2(e.y - 8 - (this.y - 8), e.x - this.x);
        let diff = Math.abs(a - ang);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff > PLAYER.swordArc / 2 && d > 12) continue;
      }
      hit = true;
      this.world.enemies.damage(e, this.stats.swordDamage, "sword");
    }
    for (const idol of this.world.buildings.idols()) {
      const c = this.world.buildings.center(idol);
      if (dist(this.x, this.y - 8, c.x, c.y) < range + 12) {
        hit = true;
        this.world.smashIdol(idol);
      }
    }
    if (this.world.beasts?.hit(this.x, this.y - 8, range + 10, this.stats.swordDamage)) hit = true;
    if (hit) this.world.cameras.main.shake(60, 0.002);
  }

  cast() {
    const st = this.world.state;
    if (st.prayer < PLAYER.castCost) {
      this.world.speech.say(this.sprite, line("player", "noPrayer"), "bad", 1500);
      return;
    }
    st.prayer -= PLAYER.castCost;
    const r = this.stats.castRadius;
    this.world.fx.ring(this.x, this.y - 10, r, 0xd7ff3e);
    this.world.speech.say(this.sprite, line("player", "cast"), "good", 1500);
    const banished = this.world.enemies.castAround(this.x, this.y - 10, r);
    const redeemed = this.world.villagers.redeemAround(this.x, this.y - 10, r);
    if (banished + redeemed === 0) this.world.villagers.breakHypnoAround(this.x, this.y - 10, r);
    if (this.hasAbility("moses")) {
      // Staff of Moses: the ring itself strikes every enemy standing in it.
      this.world.fx.ring(this.x, this.y - 10, r * 0.7, 0xe0b53a);
      for (const e of this.world.enemies.list) {
        if (e.alive && dist(this.x, this.y - 10, e.x, e.y - 8) <= r) this.world.enemies.damage(e, UNLOCK_FX.staffCastDamage, "staff");
      }
    }
    if (this.hasAbility("paul")) {
      // Clear Sight: deceivers can't hide anywhere near the ring.
      const rr = r * UNLOCK_FX.clearSightRadiusMult;
      for (const e of this.world.enemies.list) {
        if (e.alive && e.kind === "deceiver" && !e.revealed && dist(this.x, this.y, e.x, e.y) <= rr) {
          e.revealed = true;
          this.world.speech.say(e.sprite, line("deceiver", "revealed"), "dark", 0);
        }
      }
    }
  }

  eat() {
    if (this.world.paused) return;
    const st = this.world.state;
    if (st.wheat > 0) {
      st.wheat--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore);
    } else if (st.meat > 0) {
      st.meat--;
      st.hunger = Math.min(100, st.hunger + FLOCK.meatRestore);
    } else if (st.olives > 0) {
      st.olives--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore * 0.7);
      st.thirst = Math.min(100, st.thirst + 18);
    } else if (st.grapes > 0) {
      st.grapes--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore * 0.75);
      st.thirst = Math.min(100, st.thirst + 8);
    } else if (st.flax > 0) {
      st.flax--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore * 0.35);
    } else {
      this.world.speech.say(this.sprite, line("player", "noFood"), "bad", 1500);
      return;
    }
    this.world.fx.burst(this.x, this.y - 16, "px_gold", 5);
  }

  hurt(amount: number) {
    if (this.invuln > 0) return false;
    const st = this.world.state;
    st.health = Math.max(0, st.health - amount);
    this.invuln = PLAYER.invulnMs;
    this.sinceHurt = 0;
    this.sprite.setTintFill(0xff5b4a);
    this.world.time.delayedCall(90, () => this.sprite.clearTint());
    this.world.cameras.main.shake(80, 0.003);
    if (Math.random() < 0.4) this.world.speech.say(this.sprite, line("player", "hurt"), "bad", 3000);
    return true;
  }

  private die() {
    const st = this.world.state;
    const lost = Math.floor(st.coins * 0.25);
    st.coins -= lost;
    st.health = Math.floor(this.stats.maxHealth * 0.6);
    st.hunger = Math.max(st.hunger, 40);
    st.thirst = Math.max(st.thirst, 40);
    const ac = this.world.buildings.center(this.world.buildings.altar);
    this.setPosition(ac.x, ac.y + TILE * 2.5);
    this.invuln = 3000;
    this.world.enemies.repelAround(this.x, this.y, 110);
    this.world.toast(
      lost > 0 ? `You fell. The altar's light carried you back — but ${lost} coins are gone.` : "You fell. The altar's light carried you back.",
      "bad",
    );
    this.world.fx.ring(this.x, this.y - 10, 110, 0xffe27a);
  }
}
