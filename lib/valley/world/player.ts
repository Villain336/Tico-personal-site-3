import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import { ALTAR, PLAYER, TILE, XP } from "../config";
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
  lastDir = { x: 1, y: 0 };
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
    const weak = this.world.state.hunger < PLAYER.hungerWeakBelow;
    return {
      speed: PLAYER.speed * (1 + s.fleet * 0.12) * (weak ? 0.6 : 1),
      maxHealth: PLAYER.maxHealth + s.fortitude * 30,
      maxPrayer: PLAYER.maxPrayer + s.faith * 30,
      swordDamage: PLAYER.swordDamage * (1 + s.sword * 0.35),
      castRadius: PLAYER.castRadius + s.faith * 12,
      hungerRate: PLAYER.hungerPerSecond * (1 - s.fortitude * 0.2),
    };
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

    if (this.world.darkness.isDark(this.x, this.y)) this.world.jobs.complete("darkEdge");

    // hunger + regen
    st.hunger = Math.max(0, st.hunger - this.stats.hungerRate * dt);
    if (st.hunger > 50 && this.sinceHurt > 3 && st.health < this.stats.maxHealth) {
      st.health = Math.min(this.stats.maxHealth, st.health + 1.5 * dt);
    }
    if (st.hunger < PLAYER.hungerWeakBelow) {
      this.hungryLineT -= dt;
      if (this.hungryLineT <= 0) {
        this.hungryLineT = 12;
        this.world.speech.say(this.sprite, line("player", "hungry"), "bad");
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
      st.prayer = Math.min(this.stats.maxPrayer, st.prayer + PLAYER.prayerRegenIdle * dt);
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
    // A quest-giver is a rare, fixed encounter — it takes priority over the
    // market's routine sell action when both happen to be in range.
    if (this.world.interactWithQuestGiver()) return;
    if (this.nearAltar) {
      this.praying = true;
      return;
    }
    if (this.nearMarket && (this.world.state.wheat > 0 || this.world.state.grapes > 0)) {
      this.world.sell("all");
      return;
    }
    this.cast();
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
    if (aimed) this.world.fx.slash(this.x, this.y - 10, ang);
    else this.world.fx.ring(this.x, this.y - 10, PLAYER.swordRange + 6, 0xffffff);
    if (aimed) {
      this.lastDir = { x: Math.cos(ang), y: Math.sin(ang) };
      this.facing = Math.cos(ang) >= 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing < 0);
    }
    const range = PLAYER.swordRange;
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
  }

  eat() {
    if (this.world.paused) return;
    const st = this.world.state;
    if (st.wheat > 0) {
      st.wheat--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore);
    } else if (st.grapes > 0) {
      st.grapes--;
      st.hunger = Math.min(100, st.hunger + PLAYER.eatRestore * 0.75);
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
