import Phaser from "phaser";
import type { WorldScene } from "../scenes/WorldScene";
import {
  DAY_SECONDS,
  DUSK_WARN_S,
  LOOK_AHEAD,
  WORLD_H,
  WORLD_W,
  ZOOM,
  ZOOM_MODES,
  ZOOM_WHEEL_MAX,
  ZOOM_WHEEL_MIN,
} from "../config";
import { WorldMap } from "./map";

/**
 * Cinematic camera for a top-down pixel world.
 * Follows a hidden focus (player + look-ahead), lerps zoom by situation,
 * and lets the wheel scale the shot for the session.
 */
export class CameraDirector {
  private focus: Phaser.GameObjects.Image;
  private lookX = 0;
  private lookY = 0;
  private zoom = ZOOM;
  private userScale = 1;
  private talkT = 0;
  private talkX = 0;
  private talkY = 0;
  private dawnT = 0;

  constructor(private scene: WorldScene) {
    const cam = scene.cameras.main;
    this.focus = scene.add.image(scene.player.x, scene.player.y, "px_white").setVisible(false);
    cam.setRoundPixels(true);
    cam.setBackgroundColor("#07060d");
    cam.setBounds(-48, -80, WORLD_W + 96, WORLD_H + 112);
    cam.startFollow(this.focus, true, 0.14, 0.14);
    cam.setZoom(ZOOM);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? 0.9 : 1.1;
      this.userScale = Phaser.Math.Clamp(this.userScale * step, 0.62, 1.6);
    };
    scene.game.canvas.addEventListener("wheel", onWheel, { passive: false });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.canvas.removeEventListener("wheel", onWheel);
    });
  }

  /** Pull the shot toward an NPC for a few seconds (quest talk). */
  frameNpc(x: number, y: number) {
    this.talkX = x;
    this.talkY = y;
    this.talkT = 4.2;
  }

  /** Brief pull-back at dawn so the new day reads as a new shot. */
  pulseDawn() {
    this.dawnT = 2.4;
  }

  update(dt: number) {
    const p = this.scene.player;
    const moving = p.lastDir.x !== 0 || p.lastDir.y !== 0;
    const walking = this.scene.input.keyboard ? this.isWalking() : moving;

    const wantLookX = walking ? p.lastDir.x * LOOK_AHEAD : 0;
    const wantLookY = walking ? p.lastDir.y * LOOK_AHEAD * 0.85 : 0;
    const k = 1 - Math.exp(-3.2 * dt);
    this.lookX += (wantLookX - this.lookX) * k;
    this.lookY += (wantLookY - this.lookY) * k;

    this.talkT = Math.max(0, this.talkT - dt);
    this.dawnT = Math.max(0, this.dawnT - dt);

    let fx = p.x + this.lookX;
    let fy = p.y + this.lookY;
    if (this.talkT > 0) {
      const u = Math.min(1, this.talkT / 1.2);
      fx = fx * (1 - 0.45 * u) + this.talkX * 0.45 * u;
      fy = fy * (1 - 0.45 * u) + this.talkY * 0.45 * u;
    }
    this.focus.setPosition(fx, fy);

    const target = Phaser.Math.Clamp(this.baseZoom() * this.userScale, ZOOM_WHEEL_MIN, ZOOM_WHEEL_MAX);
    this.zoom += (target - this.zoom) * (1 - Math.exp(-2.4 * dt));
    this.scene.cameras.main.setZoom(this.zoom);
  }

  private isWalking() {
    const k = this.scene.player.keys;
    return k.A.isDown || k.D.isDown || k.W.isDown || k.S.isDown || k.LEFT.isDown || k.RIGHT.isDown || k.UP.isDown || k.DOWN.isDown;
  }

  private baseZoom() {
    if (this.dawnT > 0) return ZOOM_MODES.dawn;
    const st = this.scene.state;
    if (st.clock >= DAY_SECONDS) return ZOOM_MODES.night;
    if (st.clock >= DAY_SECONDS - DUSK_WARN_S) return ZOOM_MODES.dusk;
    if (this.talkT > 0) return ZOOM_MODES.talk;
    if (this.scene.player.praying && this.scene.player.nearAltar) return ZOOM_MODES.pray;
    if (this.scene.landmarks.at(this.scene.player.x, this.scene.player.y)) return ZOOM_MODES.landmark;
    const { tx, ty } = WorldMap.tileOf(this.scene.player.x, this.scene.player.y);
    if (this.scene.map.isHigh(tx, ty)) return ZOOM_MODES.highland;
    return ZOOM_MODES.explore;
  }
}
