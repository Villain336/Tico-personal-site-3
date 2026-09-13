import type { WorldScene } from "../scenes/WorldScene";
import { ENEMIES, NIGHT_SECONDS, SIN, TILE, WAVES, isNamedBoss, type EnemyKind } from "../config";
import { civicDawnMods } from "./civic";
import { nextNamedBoss, nightCount, pickNightKind, type NightKind } from "./war";
import { signSpawnDelta } from "./judgment";

const ORDER: EnemyKind[] = ["robber", "tempter", "deceiver", "spirit", "prophet"];
const WEIGHTS = [5, 3, 2, 2, 1];

/** Night spawner. Everything is gated on day, player level and altar level. */
export class Waves {
  pending = 0;
  timer = 0;
  active = false;
  interval = WAVES.spawnIntervalS;
  spawnedTonight = 0;
  nightKind: NightKind = "night";
  captainKilledTonight = false;

  constructor(private scene: WorldScene) {}

  unlocked(): EnemyKind[] {
    const st = this.scene.state;
    const altar = this.scene.buildings.altarLevel;
    return ORDER.filter((k) => {
      const d = ENEMIES[k];
      return st.day >= d.minDay && st.level >= d.minLevel && altar >= d.minAltar;
    });
  }

  pick(): EnemyKind {
    const pool = this.unlocked();
    if (pool.length === 0) return "robber";
    const filtered = pool.filter((k) => k !== "prophet" || !this.prophetTonight);
    const weights = filtered.map((k) => WEIGHTS[ORDER.indexOf(k)]);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < filtered.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        if (filtered[i] === "prophet") this.prophetTonight = true;
        return filtered[i];
      }
    }
    return filtered[filtered.length - 1];
  }

  private prophetTonight = false;

  startNight() {
    const st = this.scene.state;
    const war = st.war;
    this.nightKind = pickNightKind({
      goliathDefeated: st.unlocks.goliathDefeated,
      siegeNext: war.siegeNext,
      forceKind: war.forceKind,
      lastNight: war.lastNight,
      raidsCleared: war.raidsCleared,
      day: st.day,
      rng: Math.random,
    });
    war.forceKind = null;
    if (this.nightKind === "siege") {
      war.siegeNext = false;
      war.mustered = false;
    }
    war.lastNight = this.nightKind;
    this.captainKilledTonight = false;

    let count = WAVES.baseCount(st.day) + Math.floor(this.scene.villagers.population * WAVES.perPopulation);
    if (st.sin >= SIN.extraEnemiesAt) count += WAVES.sinBonus;
    count += civicDawnMods(st.civic).spawnDelta;
    count += signSpawnDelta(st.judgment?.activeSign ?? "none");
    count = nightCount(count, this.nightKind);
    this.pending = count;
    this.interval = Math.min(WAVES.spawnIntervalS, (NIGHT_SECONDS - 15) / Math.max(1, count));
    this.timer = 3;
    this.active = true;
    this.prophetTonight = false;
    this.spawnedTonight = 0;

    if (this.nightKind === "siege") {
      this.scene.toast(`Siege night. A host from the idol city presses the altar — ${count} in the dark.`, "bad");
    } else if (this.nightKind === "raid") {
      this.scene.toast(`A raid from the hills. Banners in the fog — ${count} shadows, and a captain.`, "bad");
    } else {
      const long = st.judgment?.activeSign === "longNight";
      this.scene.toast(
        long
          ? `A long night. ${count} shadows press the valley.`
          : `Night falls. ${count} shadows stir at the edge of the valley${st.sin >= SIN.extraEnemiesAt ? " — sin draws more" : ""}.`,
        "bad",
      );
    }

    if (this.nightKind === "raid" || this.nightKind === "siege") {
      const pos = this.nightKind === "siege" ? this.nearAltar(7) : this.scene.darkness.randomEdgeSpawn();
      this.scene.enemies.spawn("raidLeader", pos.x, pos.y);
    }
    this.trySpawnNamedBoss();
  }

  trySpawnGoliath() {
    this.trySpawnNamedBoss();
  }

  trySpawnNamedBoss() {
    if (this.scene.enemies.livingBoss()) return;
    const kind = nextNamedBoss(this.scene.state.unlocks);
    if (!kind) return;
    const pos = this.nearAltar(8);
    this.scene.enemies.spawn(kind, pos.x, pos.y);
  }

  spawnNamed(kind: EnemyKind) {
    if (!isNamedBoss(kind) && kind !== "raidLeader") return;
    if (isNamedBoss(kind) && this.scene.enemies.livingBoss()) return;
    const pos = this.nearAltar(8);
    this.scene.enemies.spawn(kind, pos.x, pos.y);
  }

  nearAltar(tiles: number) {
    const c = this.scene.buildings.center(this.scene.buildings.altar);
    let pos = { x: c.x, y: c.y + TILE * tiles };
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * 0.5 + (Math.random() - 0.5);
      const r = TILE * (tiles - 1 + Math.random() * 3);
      const x = c.x + Math.cos(a) * r;
      const y = c.y + Math.sin(a) * r;
      if (this.scene.map.isWalkablePoint(x, y, false)) {
        pos = { x, y };
        break;
      }
    }
    return pos;
  }

  endNight() {
    this.active = false;
    this.pending = 0;
  }

  spawnPoint() {
    if (this.nightKind === "siege") return this.nearAltar(6 + Math.random() * 3);
    return this.scene.darkness.randomEdgeSpawn();
  }

  update(dt: number) {
    if (!this.active || this.pending <= 0) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.interval;
    this.pending--;
    const kind = this.pick();
    const pos = this.spawnPoint();
    this.spawnedTonight++;
    this.scene.enemies.spawn(kind, pos.x, pos.y);
  }
}
