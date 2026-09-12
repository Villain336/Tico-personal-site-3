import Phaser from "phaser";

/** Small, cheap effects: particle bursts, rings, slashes, arrows, coin pops. */
export class Fx {
  constructor(private scene: Phaser.Scene) {}

  burst(x: number, y: number, texture: string, n: number) {
    for (let i = 0; i < n; i++) {
      const p = this.scene.add.image(x, y, texture).setDepth(1500);
      const a = Math.random() * Math.PI * 2;
      const d = 6 + Math.random() * 14;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d - 6,
        alpha: 0,
        duration: 350 + Math.random() * 250,
        ease: "Quad.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  ring(x: number, y: number, radius: number, color: number) {
    const g = this.scene.add.graphics().setDepth(1500);
    const state = { r: 4, a: 0.9 };
    this.scene.tweens.add({
      targets: state,
      r: radius,
      a: 0,
      duration: 380,
      ease: "Quad.easeOut",
      onUpdate: () => {
        g.clear();
        g.lineStyle(2, color, state.a);
        g.strokeCircle(x, y, state.r);
        g.fillStyle(color, state.a * 0.15);
        g.fillCircle(x, y, state.r);
      },
      onComplete: () => g.destroy(),
    });
  }

  slash(x: number, y: number, angle: number) {
    const g = this.scene.add.graphics().setDepth(1500);
    const state = { t: 0 };
    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: 140,
      onUpdate: () => {
        g.clear();
        g.lineStyle(2, 0xffffff, 1 - state.t);
        g.beginPath();
        g.arc(x, y, 16 + state.t * 6, angle - 0.9, angle + 0.9, false);
        g.strokePath();
      },
      onComplete: () => g.destroy(),
    });
  }

  arrow(x0: number, y0: number, x1: number, y1: number, onHit: () => void) {
    const a = this.scene.add.image(x0, y0, "arrow").setDepth(1500);
    a.setRotation(Math.atan2(y1 - y0, x1 - x0));
    this.scene.tweens.add({
      targets: a,
      x: x1,
      y: y1,
      duration: 220,
      onComplete: () => {
        a.destroy();
        onHit();
      },
    });
  }

  coins(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const c = this.scene.add.image(x + (Math.random() - 0.5) * 10, y, "px_gold").setDepth(1500);
      this.scene.tweens.add({
        targets: c,
        y: y - 18 - Math.random() * 10,
        alpha: 0,
        duration: 500 + i * 60,
        ease: "Quad.easeOut",
        onComplete: () => c.destroy(),
      });
    }
  }
}
