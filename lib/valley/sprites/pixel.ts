/**
 * Pixel maps are arrays of equal-length strings. Each character is a palette
 * role; "." is transparent. `paint` resolves roles → colors and draws to any
 * 2D canvas context, so the same maps power Phaser textures and the React
 * character-creator preview.
 */
export type PixelMap = string[];
export type Roles = Record<string, string | undefined>;

export function paint(
  ctx: CanvasRenderingContext2D,
  map: PixelMap,
  roles: Roles,
  ox = 0,
  oy = 0,
  scale = 1,
) {
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const color = roles[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}

export function size(map: PixelMap) {
  return { w: map[0]?.length ?? 0, h: map.length };
}

/** Overlay `top` onto a copy of `base` (same dimensions); "." in top keeps base. */
export function layer(base: PixelMap, ...tops: PixelMap[]): PixelMap {
  const out = base.map((r) => r.split(""));
  for (const top of tops) {
    for (let y = 0; y < top.length && y < out.length; y++) {
      for (let x = 0; x < top[y].length && x < out[y].length; x++) {
        if (top[y][x] !== ".") out[y][x] = top[y][x];
      }
    }
  }
  return out.map((r) => r.join(""));
}

export function blank(w: number, h: number): PixelMap {
  return Array.from({ length: h }, () => ".".repeat(w));
}

/** Mirror horizontally (for left/right facing). */
export function flip(map: PixelMap): PixelMap {
  return map.map((r) => r.split("").reverse().join(""));
}
