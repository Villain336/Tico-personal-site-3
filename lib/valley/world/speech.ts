import Phaser from "phaser";

export type Tone = "neutral" | "good" | "bad" | "dark";

type Bubble = {
  target: { x: number; y: number };
  height: number;
  container: Phaser.GameObjects.Container;
  ttl: number;
};

type Speaker = { x: number; y: number };

const TONE_COLORS: Record<Tone, { bg: number; fg: string }> = {
  neutral: { bg: 0xfffdf5, fg: "#1a1420" },
  good: { bg: 0xd7ff3e, fg: "#1a1420" },
  bad: { bg: 0xff5b4a, fg: "#ffffff" },
  dark: { bg: 0x2a1f3d, fg: "#e9d8ff" },
};

/** In-world speech bubbles that follow their speaker and fade out. */
export class Speech {
  private bubbles: Bubble[] = [];
  private cooldowns = new WeakMap<object, number>();
  private now = 0;

  constructor(private scene: Phaser.Scene) {}

  /** Say `text` above `target` unless the speaker spoke within `cooldownMs`. */
  say(target: Speaker, text: string, tone: Tone = "neutral", cooldownMs = 4000, height = 26) {
    if (!text) return;
    const last = this.cooldowns.get(target) ?? -Infinity;
    if (this.now - last < cooldownMs) return;
    this.cooldowns.set(target, this.now);

    for (const b of this.bubbles) {
      if (b.target === target) b.ttl = Math.min(b.ttl, 0.15);
    }

    const { bg, fg } = TONE_COLORS[tone];
    const label = this.scene.add
      .text(0, 0, text, {
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: "6px",
        color: fg,
        resolution: 4,
      })
      .setOrigin(0.5, 1);
    const w = label.width + 6;
    const h = label.height + 4;
    const g = this.scene.add.graphics();
    g.fillStyle(bg, 0.96);
    g.fillRoundedRect(-w / 2, -h - 3, w, h, 2);
    g.fillTriangle(-2, -3, 2, -3, 0, 0);
    g.lineStyle(1, 0x1a1420, 0.9);
    g.strokeRoundedRect(-w / 2, -h - 3, w, h, 2);
    label.setY(-5);

    const container = this.scene.add
      .container(target.x, target.y - height, [g, label])
      .setDepth(2000);
    this.bubbles.push({ target, height, container, ttl: 2.5 });
  }

  update(dt: number) {
    this.now += dt * 1000;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.ttl -= dt;
      if (b.ttl <= 0) {
        b.container.destroy();
        this.bubbles.splice(i, 1);
        continue;
      }
      b.container.setPosition(Math.round(b.target.x), Math.round(b.target.y - b.height));
      b.container.setAlpha(Math.min(1, b.ttl / 0.3));
    }
  }

  /** Remove bubbles whose speaker is gone. */
  drop(target: Speaker) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      if (this.bubbles[i].target === target) {
        this.bubbles[i].container.destroy();
        this.bubbles.splice(i, 1);
      }
    }
  }
}
