import type { WorldScene } from "../scenes/WorldScene";
import { ENEMIES, NIGHT_SECONDS, SIN, WAVES, type EnemyKind } from "../config";

const ORDER: EnemyKind[] = ["robber", "tempter", "deceiver", "spirit", "prophet"];
const WEIGHTS = [5, 3, 2, 2, 1];

/** Night spawner. Everything is gated on day, player level and altar level. */
export class Waves {
  pending = 0;
  timer = 0;
  active = false;
  interval = WAVES.spawnIntervalS;
  spawnedTonight = 0;

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
    // prophets show up at most once per night
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
    let count = WAVES.baseCount(st.day) + Math.floor(this.scene.villagers.population * WAVES.perPopulation);
    if (st.sin >= SIN.extraEnemiesAt) count += WAVES.sinBonus;
    count = Math.min(count, 22);
    this.pending = count;
    this.interval = Math.min(WAVES.spawnIntervalS, (NIGHT_SECONDS - 15) / Math.max(1, count));
    this.timer = 3;
    this.active = true;
    this.prophetTonight = false;
    this.spawnedTonight = 0;
    this.scene.toast(
      `Night falls. ${count} shadows stir at the edge of the valley${st.sin >= SIN.extraEnemiesAt ? " — sin draws more" : ""}.`,
      "bad",
    );
  }

  endNight() {
    this.active = false;
    this.pending = 0;
  }

  update(dt: number) {
    if (!this.active || this.pending <= 0) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.interval;
    this.pending--;
    const kind = this.pick();
    const pos = this.scene.darkness.randomEdgeSpawn();
    this.spawnedTonight++;
    this.scene.enemies.spawn(kind, pos.x, pos.y);
  }
}
