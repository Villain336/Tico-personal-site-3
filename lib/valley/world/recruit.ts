import type Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import { TILE, VILLAGER } from "../config";
import { SCATTERED_RECRUITS } from "../quests/content";
import type { BigRecruitId, DeploymentMode, RecruitId, RecruitRole, SavedRecruit } from "../types";
import { Actor, dist, type Afflictable } from "./actor";
import type { Enemy } from "./enemy";

/**
 * A roster member's own movement/affliction state, distinct from `mode`
 * (Follow/Station). "idle" covers both "no mode yet" and "running its mode's
 * behavior normally" — affliction states pre-empt mode behavior exactly like
 * they pre-empt a `Villager`'s regular behavior. "arriving" is a Big Recruit
 * walking in from the map edge to their landmark on the dawn they appear.
 */
export type RecruitState = "idle" | "arriving" | "questgiver" | "lured" | "fallen" | "hypno" | "flee";

const MARKER_TINT = { available: 0xe0b53a, active: 0x8d8d94, ready: 0xd7ff3e } as const;

/**
 * Parallel to `Villager`, not a subtype (see KTD2): a Big Recruit is
 * permanently exempt from affliction (R6) and a scattered NPC stays
 * vulnerable (R12) — opposite defaults on the same shape.
 */
export class Recruit extends Actor implements Afflictable {
  id: RecruitId;
  big: boolean;
  role: RecruitRole;
  mode: DeploymentMode | null = null;
  station: { x: number; y: number } | null = null;
  state: RecruitState = "idle";
  level = 3;
  hp = VILLAGER.hp;

  // Afflictable — inert for Big Recruits; only ever mutated when !big (U3/enemy.ts).
  alive = true;
  lureBy: Enemy | null = null;
  lureT = 0;
  hypnoBy: Enemy | null = null;
  hypnoT = 0;

  fightTarget: Enemy | null = null;
  attackCd = 0;
  timer = 0;
  /** Where an arriving Big Recruit is walking to; where a quest-giver waits. */
  goal: { x: number; y: number } | null = null;
  marker: Phaser.GameObjects.Image | null = null;

  constructor(scene: WorldScene, id: RecruitId, big: boolean, x: number, y: number) {
    super(scene, x, y, `recruit_${id}`);
    this.id = id;
    this.big = big;
    this.role = big ? null : SCATTERED_RECRUITS[id as keyof typeof SCATTERED_RECRUITS]?.role ?? null;
  }

  get busy() {
    return this.state === "fallen" || this.state === "hypno" || this.state === "lured";
  }

  /** Not yet on the roster — still a stranger in the world. */
  get preRecruit() {
    return this.state === "questgiver" || this.state === "arriving";
  }

  serialize(): SavedRecruit {
    return { id: this.id, mode: this.mode, station: this.station ?? undefined };
  }

  destroy() {
    this.marker?.destroy();
    this.marker = null;
    super.destroy();
  }
}

/**
 * Tracks every roster member (Big Recruit or scattered NPC) that has joined.
 * The Holy Ghost never appears here — no companion form, per R9.
 */
export class RecruitManager {
  list: Recruit[] = [];

  constructor(private scene: WorldScene) {}

  /** Scattered NPCs only — the pool a tempter/deceiver may target (R12). Big Recruits are exempt (R6). */
  get vulnerableList(): Recruit[] {
    return this.list.filter((r) => !r.big && r.alive);
  }

  byId(id: RecruitId) {
    return this.list.find((r) => r.id === id) ?? null;
  }

  add(id: RecruitId, big: boolean, x?: number, y?: number) {
    const existing = this.byId(id);
    if (existing) return existing;
    const spot = x !== undefined && y !== undefined ? { x, y } : this.spawnNear();
    const r = new Recruit(this.scene, id, big, spot.x, spot.y);
    this.list.push(r);
    return r;
  }

  remove(id: RecruitId) {
    const r = this.byId(id);
    if (!r) return;
    const i = this.list.indexOf(r);
    if (i >= 0) this.list.splice(i, 1);
    r.destroy();
  }

  private spawnNear() {
    const c = this.scene.buildings.center(this.scene.buildings.altar);
    return { x: c.x, y: c.y + TILE * 2 };
  }

  setMode(id: RecruitId, mode: DeploymentMode, station?: { x: number; y: number }) {
    const r = this.byId(id);
    if (!r) return;
    r.mode = mode;
    r.station = mode === "station" ? station ?? { x: r.x, y: r.y } : null;
  }

  /** Only joined members persist; strangers are re-derived from day + quest state on load. */
  serialize(): SavedRecruit[] {
    return this.list.filter((r) => !r.preRecruit).map((r) => r.serialize());
  }

  loadFrom(saved: SavedRecruit[]) {
    for (const s of saved) {
      const big = !(s.id in SCATTERED_RECRUITS);
      const spot = s.station ?? this.spawnNear();
      const r = this.add(s.id, big, spot.x, spot.y);
      r.mode = s.mode;
      r.station = s.station ?? null;
    }
  }

  /** A Big Recruit already in the valley on load: stands at their landmark, no walk-in. */
  placeQuestGiver(id: BigRecruitId, at: { x: number; y: number }) {
    const r = this.add(id, true, at.x, at.y);
    r.state = "questgiver";
    r.goal = at;
    return r;
  }

  /** A Big Recruit walking in from the map edge at dawn toward their landmark. */
  startArrival(id: BigRecruitId, from: { x: number; y: number }, to: { x: number; y: number }) {
    const r = this.add(id, true, from.x, from.y);
    r.state = "arriving";
    r.goal = to;
    r.timer = 90; // give up walking and just appear if the route is bad
    return r;
  }

  private updateArriving(r: Recruit, dt: number) {
    const g = r.goal!;
    r.timer -= dt;
    if (r.moveToward(g.x, g.y, VILLAGER.speed * 1.2, dt, this.scene.map, 4) || r.timer <= 0) {
      r.setPosition(g.x, g.y);
      r.state = "questgiver";
    }
  }

  /** Bobbing "!" above a stranger's head, colored by what talking to them will do. */
  private updateMarker(r: Recruit, dt: number) {
    if (r.state !== "questgiver") {
      if (r.marker) {
        r.marker.destroy();
        r.marker = null;
      }
      return;
    }
    const q = this.scene.quests.list.find((x) => x.id === r.id);
    const state = q?.state ?? "available";
    if (state === "completed") {
      r.marker?.destroy();
      r.marker = null;
      return;
    }
    if (!r.marker) r.marker = this.scene.add.image(r.x, r.y, "marker").setOrigin(0.5, 1).setDepth(900);
    r.timer += dt;
    r.marker.setPosition(Math.round(r.x), Math.round(r.y - 26 + Math.sin(r.timer * 3) * 2));
    r.marker.setTint(MARKER_TINT[state]);
    r.marker.setAlpha(state === "active" ? 0.6 : 1);
    // Face the player when they're close — a small "I see you" beat.
    const p = this.scene.player;
    if (dist(p.x, p.y, r.x, r.y) < 60) {
      r.facing = p.x >= r.x ? 1 : -1;
      r.sprite.setFlipX(r.facing < 0);
    }
  }

  /** Fall a vulnerable recruit — mirrors `Villagers.fall`, scoped to scattered NPCs. */
  fall(r: Recruit, reason: string) {
    if (r.big || r.state === "fallen") return;
    const tempter = r.lureBy;
    if (tempter && tempter.alive && tempter.kind === "tempter") {
      tempter.state = "leave";
      tempter.target = null;
    }
    r.state = "fallen";
    r.timer = VILLAGER.fallDurationS;
    r.lureBy = null;
    r.lureT = 0;
    r.hypnoBy = null;
    r.hypnoT = 0;
    this.scene.toast(`${this.nameOf(r.id)} fell to ${reason}. Cast out (E) near them to redeem.`, "bad");
  }

  releaseHypno(r: Recruit) {
    r.state = "flee";
    r.hypnoBy = null;
    r.hypnoT = 0;
  }

  /** Mirrors `Villagers.redeemAround`/`breakHypnoAround`, scoped to scattered NPCs. */
  redeemAround(x: number, y: number, r: number) {
    let n = 0;
    for (const rec of this.vulnerableList) {
      const d = dist(x, y, rec.x, rec.y - 8);
      if (d > r) continue;
      if (rec.state === "fallen") {
        rec.state = "idle";
        rec.hp = Math.max(rec.hp, 15);
        this.scene.toast(`${this.nameOf(rec.id)} was redeemed.`, "good");
        n++;
      } else if (rec.state === "lured") {
        rec.state = "flee";
        rec.lureBy = null;
        rec.lureT = 0;
        n++;
      } else if (rec.state === "hypno") {
        this.releaseHypno(rec);
        n++;
      }
    }
    return n;
  }

  private nameOf(id: RecruitId) {
    return SCATTERED_RECRUITS[id as keyof typeof SCATTERED_RECRUITS]?.name ?? id;
  }

  update(dt: number) {
    const sc = this.scene;
    const player = sc.player;
    for (const r of this.list) {
      r.attackCd -= dt;
      r.animate();

      if (r.state === "arriving") {
        this.updateArriving(r, dt);
        continue;
      }
      this.updateMarker(r, dt);
      if (r.state === "questgiver") continue; // WorldScene.interactWithQuestGiver owns pre-recruit behavior

      // --- afflicted states (scattered NPCs only — Big Recruits never enter these)
      if (r.state === "fallen") {
        r.timer -= dt;
        r.moveToward(player.x, player.y, VILLAGER.speed * 0.5, dt, sc.map);
        if (r.timer <= 0) {
          this.remove(r.id);
          this.scene.toast(`${this.nameOf(r.id)} was lost to the dark.`, "bad");
        }
        continue;
      }
      if (r.state === "hypno") {
        const by = r.hypnoBy;
        if (!by || !by.alive || dist(by.x, by.y, r.x, r.y) > 40) this.releaseHypno(r);
        continue;
      }
      if (r.state === "lured") {
        const by = r.lureBy;
        if (!by || !by.alive) {
          r.state = "flee";
          r.lureBy = null;
          r.lureT = 0;
        } else {
          r.moveToward(by.x, by.y, VILLAGER.speed * 1.15, dt, sc.map, 10);
          if (r.lureT >= VILLAGER.lureToFallS) this.fall(r, "temptation");
        }
        continue;
      }
      if (r.state === "flee") {
        const gone = !sc.enemies.nearestTo(r.x, r.y, 90, (e) => e.kind !== "deceiver" || e.revealed);
        if (gone) r.state = "idle";
      }

      // --- deployment behavior (only once not afflicted)
      if (r.mode === "follow") {
        this.updateFollow(r, dt);
      } else if (r.mode === "station" && r.station) {
        this.updateStation(r, dt);
      }
    }
  }

  private updateFollow(r: Recruit, dt: number) {
    const sc = this.scene;
    const player = sc.player;
    const threat = r.role === "guard" ? sc.enemies.nearestTo(r.x, r.y, 90, (e) => !e.def.swordImmune) : null;
    if (threat) {
      if (r.moveToward(threat.x, threat.y, VILLAGER.speed * 1.3, dt, sc.map, 14) && r.attackCd <= 0) {
        r.attackCd = 0.8;
        sc.enemies.damage(threat, VILLAGER.staffDamage, "staff");
      }
      return;
    }
    r.moveToward(player.x - 18 * r.facing, player.y + 6, VILLAGER.speed * 1.05, dt, sc.map, 10);
  }

  private updateStation(r: Recruit, dt: number) {
    const sc = this.scene;
    const s = r.station!;
    switch (r.role) {
      case "guard": {
        const threat = sc.enemies.nearestTo(s.x, s.y, 70, (e) => !e.def.swordImmune);
        if (threat) {
          if (r.moveToward(threat.x, threat.y, VILLAGER.speed * 1.3, dt, sc.map, 14) && r.attackCd <= 0) {
            r.attackCd = 0.8;
            sc.enemies.damage(threat, VILLAGER.staffDamage, "staff");
          }
          return;
        }
        r.moveToward(s.x, s.y, VILLAGER.speed, dt, sc.map, 6);
        return;
      }
      case "harvester": {
        const crop = sc.buildings
          .readyCrops()
          .find((b) => dist(sc.buildings.center(b).x, sc.buildings.center(b).y, s.x, s.y) < TILE * 3);
        if (crop) {
          const c = sc.buildings.center(crop);
          if (r.moveToward(c.x, c.y, VILLAGER.speed, dt, sc.map, 8)) {
            sc.harvest(crop, "villager");
          }
          return;
        }
        r.moveToward(s.x, s.y, VILLAGER.speed, dt, sc.map, 6);
        return;
      }
      case "healer": {
        r.moveToward(s.x, s.y, VILLAGER.speed, dt, sc.map, 6);
        r.timer -= dt;
        if (r.timer <= 0) {
          r.timer = 1;
          for (const v of sc.villagers.list) {
            if (v.alive && v.hp < VILLAGER.hp && dist(v.x, v.y, s.x, s.y) < TILE * 3) v.hp = Math.min(VILLAGER.hp, v.hp + 2);
          }
          for (const other of this.list) {
            if (other !== r && !other.big && other.hp < VILLAGER.hp && dist(other.x, other.y, s.x, s.y) < TILE * 3) {
              other.hp = Math.min(VILLAGER.hp, other.hp + 2);
            }
          }
        }
        return;
      }
      default:
        r.moveToward(s.x, s.y, VILLAGER.speed, dt, sc.map, 6);
    }
  }
}
