import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import { CYCLE_SECONDS, DAY_SECONDS, VIEW_W } from "../config";

function lerpColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function hex(c: number) {
  return `#${c.toString(16).padStart(6, "0")}`;
}

const DAY = 0x6aa6d9;
const DUSK = 0xe08a4a;
const NIGHT = 0x12162c;
const DUSK2 = 0x6d3cf5;

/**
 * Parallax backdrop. A top-of-view horizon (hills, clouds, sun/moon) stays
 * locked to the camera and slides with scroll so walking changes the sky.
 * The camera clear color matches the hour so overscroll at the map edge
 * reads as the same sky.
 */
export class Sky {
  private sun: Phaser.GameObjects.Image;
  private moon: Phaser.GameObjects.Image;
  private stars: Phaser.GameObjects.Image[] = [];
  private farHills: Phaser.GameObjects.Image[] = [];
  private nearHills: Phaser.GameObjects.Image[] = [];
  private clouds: { img: Phaser.GameObjects.Image; speed: number; home: number }[] = [];

  constructor(private scene: WorldScene) {
    for (let i = 0; i < 16; i++) {
      this.stars.push(
        scene.add.image(30 + ((i * 89) % (VIEW_W - 40)), 10 + ((i * 47) % 36), "sky_star").setScrollFactor(0).setDepth(-90).setAlpha(0),
      );
    }

    this.sun = scene.add.image(0, 0, "sky_sun").setScrollFactor(0).setDepth(-88);
    this.moon = scene.add.image(0, 0, "sky_moon").setScrollFactor(0).setDepth(-88).setAlpha(0);

    for (let i = 0; i < 8; i++) {
      this.farHills.push(
        scene.add.image(i * 140, 58, "sky_hill_far").setOrigin(0.5, 1).setScrollFactor(0).setDepth(-86).setAlpha(0.8),
      );
    }
    for (let i = 0; i < 7; i++) {
      this.nearHills.push(
        scene.add.image(i * 170, 70, "sky_hill_near").setOrigin(0.5, 1).setScrollFactor(0).setDepth(-85).setAlpha(0.95),
      );
    }

    const keys = ["sky_cloud_a", "sky_cloud_b"] as const;
    for (let i = 0; i < 5; i++) {
      const img = scene.add
        .image(i * 220, 22 + (i % 3) * 10, keys[i % 2])
        .setScrollFactor(0)
        .setDepth(-87)
        .setAlpha(0.7);
      this.clouds.push({ img, speed: 6 + i * 2, home: img.x });
    }
  }

  update(dt: number) {
    const cam = this.scene.cameras.main;
    const clock = this.scene.state.clock;
    const night = clock >= DAY_SECONDS;
    const dusk = !night && clock >= DAY_SECONDS - 28;
    const dawn = night && clock > DAY_SECONDS + 110;

    let color = DAY;
    if (dusk) {
      const t = (clock - (DAY_SECONDS - 28)) / 28;
      color = lerpColor(DAY, t < 0.55 ? DUSK : DUSK2, t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45);
    } else if (night && !dawn) {
      color = lerpColor(DUSK2, NIGHT, Math.min(1, (clock - DAY_SECONDS) / 14));
    } else if (dawn) {
      color = lerpColor(NIGHT, DAY, Math.min(1, (clock - (DAY_SECONDS + 110)) / 10));
    }
    cam.setBackgroundColor(hex(color));

    const dayT = night ? (clock - DAY_SECONDS) / (CYCLE_SECONDS - DAY_SECONDS) : clock / DAY_SECONDS;
    this.sun.setPosition(VIEW_W * (0.14 + dayT * 0.72), 18 + Math.sin(dayT * Math.PI) * 10).setAlpha(night ? 0 : 1);
    this.moon.setPosition(VIEW_W * (0.14 + dayT * 0.72), 22).setAlpha(night ? 0.95 : 0);

    const starA = night ? Math.min(1, (clock - DAY_SECONDS) / 10) : 0;
    for (const s of this.stars) s.setAlpha(starA * (0.4 + (s.x % 7) * 0.07));

    const sx = cam.scrollX;
    const sy = cam.scrollY;
    const wrap = (v: number, span: number) => ((v % span) + span) % span;
    this.farHills.forEach((h, i) => h.setPosition(wrap(i * 140 - sx * 0.12, VIEW_W + 140) - 20, 56 - sy * 0.02));
    this.nearHills.forEach((h, i) => h.setPosition(wrap(i * 170 - sx * 0.22, VIEW_W + 170) - 20, 70 - sy * 0.035));

    for (const c of this.clouds) {
      c.home += c.speed * dt;
      if (c.home > VIEW_W + 80) c.home = -80;
      c.img.x = c.home - sx * 0.06;
      c.img.setAlpha(night ? 0.16 : dusk ? 0.42 : 0.7);
    }
  }
}
