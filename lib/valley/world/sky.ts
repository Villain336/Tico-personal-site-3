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
/** Above the fog so the horizon stays visible in the dark. */
const Z = 1108;

type Cloud = {
  img: Phaser.GameObjects.Image;
  speed: number;
  home: number;
  y: number;
  parallax: number;
};

/**
 * Horizon band pinned to the top of the current camera view.
 * Positions are in world space at `worldView` so zoom and look-ahead
 * still shift the hills and clouds as the player walks.
 */
export class Sky {
  private sun: Phaser.GameObjects.Image;
  private moon: Phaser.GameObjects.Image;
  private stars: Phaser.GameObjects.Image[] = [];
  private farHills: Phaser.GameObjects.Image[] = [];
  private nearHills: Phaser.GameObjects.Image[] = [];
  private clouds: Cloud[] = [];

  constructor(private scene: WorldScene) {
    for (let i = 0; i < 16; i++) {
      this.stars.push(scene.add.image(0, 0, "sky_star").setDepth(Z).setAlpha(0));
    }
    this.sun = scene.add.image(0, 0, "sky_sun").setDepth(Z + 2);
    this.moon = scene.add.image(0, 0, "sky_moon").setDepth(Z + 2).setAlpha(0);
    for (let i = 0; i < 8; i++) {
      this.farHills.push(scene.add.image(0, 0, "sky_hill_far").setOrigin(0.5, 1).setDepth(Z + 4).setAlpha(0.85));
    }
    for (let i = 0; i < 7; i++) {
      this.nearHills.push(scene.add.image(0, 0, "sky_hill_near").setOrigin(0.5, 1).setDepth(Z + 5).setAlpha(0.95));
    }
    const keys = ["sky_cloud_a", "sky_cloud_b", "sky_cloud_c"] as const;
    for (let i = 0; i < 9; i++) {
      const far = i < 5;
      const img = scene.add.image(0, 0, keys[i % 3]).setDepth(Z + (far ? 3 : 6)).setAlpha(0.7);
      this.clouds.push({
        img,
        speed: far ? 6 + i * 1.4 : 14 + (i - 5) * 3,
        home: i * 110,
        y: far ? 14 + (i % 3) * 4 : 22 + (i % 2) * 6,
        parallax: far ? 0.05 : 0.14,
      });
    }
  }

  update(dt: number) {
    const cam = this.scene.cameras.main;
    const v = cam.worldView;
    const z = cam.zoom;
    const sx = 1 / z;

    const clock = this.scene.state.clock;
    const night = clock >= DAY_SECONDS;
    const dusk = !night && clock >= DAY_SECONDS - 28;
    const dawn = night && clock > DAY_SECONDS + 110;

    const sign = this.scene.state.judgment?.activeSign ?? "none";
    const weigh = this.scene.state.judgment?.verdictNext;
    let color = DAY;
    if (sign === "drought" && !night) color = 0xc48a3a;
    else if (sign === "quietDawn" && !night) color = 0x8ec4e8;
    else if (weigh && !night) color = 0xd4b45a;
    if (dusk) {
      const t = (clock - (DAY_SECONDS - 28)) / 28;
      color = lerpColor(DAY, t < 0.55 ? DUSK : DUSK2, t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45);
    } else if (night && !dawn) {
      color = lerpColor(DUSK2, sign === "longNight" ? 0x0a0618 : NIGHT, Math.min(1, (clock - DAY_SECONDS) / 14));
    } else if (dawn) {
      color = lerpColor(NIGHT, DAY, Math.min(1, (clock - (DAY_SECONDS + 110)) / 10));
    }
    cam.setBackgroundColor(hex(color));

    const dayT = night ? (clock - DAY_SECONDS) / (CYCLE_SECONDS - DAY_SECONDS) : clock / DAY_SECONDS;
    const sunX = v.x + (VIEW_W * (0.16 + dayT * 0.68)) * sx;
    const sunY = v.y + (20 + Math.sin(dayT * Math.PI) * 8) * sx;
    this.sun.setPosition(sunX, sunY).setScale(sx).setAlpha(night ? 0 : 1);
    this.moon.setPosition(sunX, sunY + 4 * sx).setScale(sx).setAlpha(night ? 0.95 : 0);

    const starA = night ? Math.min(1, (clock - DAY_SECONDS) / 10) : 0;
    this.stars.forEach((s, i) => {
      s.setPosition(v.x + (24 + ((i * 89) % (VIEW_W - 40))) * sx, v.y + (8 + ((i * 47) % 28)) * sx)
        .setScale(sx)
        .setAlpha(starA * (0.4 + (i % 5) * 0.1));
    });

    const wrap = (n: number, span: number) => ((n % span) + span) % span;
    this.farHills.forEach((h, i) => {
      h.setPosition(v.x + wrap(i * 130 - cam.scrollX * 0.14, VIEW_W + 80) * sx, v.y + 52 * sx).setScale(sx);
    });
    this.nearHills.forEach((h, i) => {
      h.setPosition(v.x + wrap(i * 160 - cam.scrollX * 0.26, VIEW_W + 90) * sx, v.y + 64 * sx).setScale(sx);
    });

    const tint = dusk ? 0xe08a4a : night ? 0x6d3cf5 : 0xffffff;
    for (const c of this.clouds) {
      c.home += c.speed * dt;
      if (c.home > VIEW_W + 90) c.home = -80;
      c.img.setPosition(v.x + (c.home - cam.scrollX * c.parallax) * sx, v.y + c.y * sx).setScale(sx);
      c.img.setAlpha(night ? 0.16 : dusk ? 0.45 : 0.74);
      c.img.setTint(tint);
    }
  }
}
