import type { PixelMap } from "./pixel";
import type { Gender } from "../types";

export const CHAR_W = 16;
export const CHAR_H = 24;

export type CharLook = {
  gender: Gender;
  body: number; // 0 slim, 1 average, 2 broad
  face: number; // 0 calm, 1 bright, 2 stern
  hairStyle: number; // 0 short, 1 long, 2 wrapped
  /** extra decorations */
  mask?: boolean;
  beard?: boolean;
  staff?: boolean;
  outfitStyle?: number; // 0 shepherd, 1 merchant, 2 warrior
};

/**
 * Roles used by character maps:
 *  K outline · S skin · s skin shade · H hair · C head cloth · T trim
 *  O outfit primary · o outfit secondary · E eye · W eye white · M mouth
 *  R mask · w wood (staff)
 */
export function buildCharacter(look: CharLook): PixelMap {
  const g: string[][] = Array.from({ length: CHAR_H }, () => Array(CHAR_W).fill("."));
  const put = (x: number, y: number, ch: string) => {
    if (x >= 0 && x < CHAR_W && y >= 0 && y < CHAR_H) g[y][x] = ch;
  };
  const hline = (x0: number, x1: number, y: number, ch: string) => {
    for (let x = x0; x <= x1; x++) put(x, y, ch);
  };

  // --- head (x4..11, y2..9)
  hline(5, 10, 2, "K");
  for (let y = 3; y <= 7; y++) {
    put(4, y, "K");
    hline(5, 10, y, "S");
    put(11, y, "K");
  }
  put(5, 8, "K");
  hline(6, 9, 8, "S");
  put(10, 8, "K");
  put(6, 9, "K");
  hline(7, 8, 9, "S");
  put(9, 9, "K");
  // cheek shade
  put(5, 7, "s");
  put(10, 7, "s");

  // --- face
  put(6, 5, "E");
  put(9, 5, "E");
  if (look.face === 0) {
    hline(7, 8, 7, "M");
  } else if (look.face === 1) {
    put(6, 7, "M");
    put(9, 7, "M");
    hline(7, 8, 8, "M");
  } else {
    put(6, 4, "K");
    put(9, 4, "K");
    hline(6, 9, 7, "M");
  }
  if (look.beard) {
    hline(6, 9, 8, "H");
    hline(6, 9, 9, "H");
    hline(7, 8, 10, "H");
  }

  // --- hair
  if (look.hairStyle === 2) {
    hline(5, 10, 1, "C");
    hline(4, 11, 2, "C");
    hline(4, 11, 3, "T");
    for (let y = 4; y <= 8; y++) {
      put(3, y, "C");
      put(4, y, "C");
      put(11, y, "C");
      put(12, y, "C");
    }
  } else {
    hline(5, 10, 1, "H");
    hline(4, 11, 2, "H");
    hline(4, 5, 3, "H");
    hline(10, 11, 3, "H");
    put(4, 4, "H");
    put(11, 4, "H");
    if (look.hairStyle === 1) {
      for (let y = 4; y <= 9; y++) {
        put(3, y, "H");
        put(4, y, y > 6 ? "H" : g[y][4]);
        put(11, y, y > 6 ? "H" : g[y][11]);
        put(12, y, "H");
      }
    }
  }
  if (look.mask) {
    hline(5, 10, 5, "R");
    put(6, 5, "W");
    put(9, 5, "W");
    hline(5, 10, 6, "R");
  }

  // --- body
  const cx = 8;
  const half = [2, 3, 4][look.body] ?? 3;
  const left = cx - half;
  const right = cx + half - 1;
  const woman = look.gender === "woman";

  hline(left, right, 10, "K");
  for (let y = 11; y <= 15; y++) {
    put(left - 1, y, "K");
    hline(left, right, y, "O");
    put(right + 1, y, "K");
  }
  hline(cx - 1, cx, 11, "T"); // collar
  hline(left, right, 14, "o"); // belt
  // arms
  for (let y = 12; y <= 15; y++) {
    put(left - 2, y, y === 15 ? "S" : "O");
    put(left - 3, y, "K");
    put(right + 2, y, y === 15 ? "S" : "O");
    put(right + 3, y, "K");
  }
  put(left - 2, 11, "K");
  put(right + 2, 11, "K");
  put(left - 2, 16, "K");
  put(right + 2, 16, "K");

  const style = look.outfitStyle ?? 0;
  if (style === 3) {
    // linen tunic — longer hem, pale sash
    for (let y = 11; y <= 15; y++) put(cx, y, "T");
    hline(left, right, 11, "T");
  } else if (style === 2) {
    // shoulder pads
    hline(left, left + 1, 11, "T");
    hline(right - 1, right, 11, "T");
    hline(left, right, 13, "o");
  } else if (style === 1) {
    for (let y = 11; y <= 15; y++) put(cx, y, "T");
    put(cx - 1, 12, "T");
  } else {
    // shepherd sash
    for (let i = 0; i < 4; i++) put(left + i, 11 + i, "o");
  }

  if (woman) {
    for (let y = 16; y <= 21; y++) {
      const grow = y >= 18 ? 1 : 0;
      put(left - 1 - grow, y, "K");
      hline(left - grow, right + grow, y, "O");
      put(right + 1 + grow, y, "K");
    }
    hline(left - 1, right + 1, 21, style === 1 ? "T" : "o");
    hline(left - 2, right + 2, 22, "K");
    put(cx - 2, 22, "S");
    put(cx - 1, 22, "S");
    put(cx + 1, 22, "S");
    put(cx + 2, 22, "S");
    hline(cx - 2, cx - 1, 23, "o");
    hline(cx + 1, cx + 2, 23, "o");
  } else {
    for (let y = 16; y <= 18; y++) {
      put(left - 1, y, "K");
      hline(left, right, y, "O");
      put(right + 1, y, "K");
    }
    hline(left, right, 18, style === 1 ? "T" : "O");
    for (let y = 19; y <= 22; y++) {
      put(cx - 3, y, "K");
      hline(cx - 2, cx - 1, y, "S");
      put(cx, y, "K");
      hline(cx + 1, cx + 2, y, "S");
      put(cx + 3, y, "K");
    }
    hline(cx - 3, cx - 1, 23, "o");
    hline(cx + 1, cx + 3, 23, "o");
  }

  if (look.staff) {
    for (let y = 6; y <= 23; y++) put(right + 4, y, "w");
    put(right + 4, 5, "T");
  }

  return g.map((r) => r.join(""));
}

/** 16×20 spirit. P body, D darker inner, E eyes. */
export const SPIRIT: PixelMap = [
  "......KKKK......",
  "....KKPPPPKK....",
  "...KPPPPPPPPK...",
  "..KPPPPPPPPPPK..",
  "..KPPEPPPPEPPK..",
  "..KPPEPPPPEPPK..",
  "..KPPPPPPPPPPK..",
  "..KPPPPDDPPPPK..",
  "..KPPPDDDDPPPK..",
  "..KPPPPDDPPPPK..",
  "..KPPPPPPPPPPK..",
  "..KPPPPPPPPPPK..",
  "..KPPPPPPPPPPK..",
  "..KPPPPPPPPPPK..",
  "..KPPKPPPPKPPK..",
  "..KPK.KPPK.KPK..",
  "..KK...KK...KK..",
  "................",
  "................",
  "................",
];

/** 16×24 idol: golden calf on a stone pedestal. G gold, g gold dark, N stone, n stone dark. */
export const IDOL: PixelMap = [
  "................",
  "....K......K....",
  "....KG....GK....",
  ".....KGGGGK.....",
  "....KGGGGGGK....",
  "....KGEGGEGK....",
  "....KGGGGGGK....",
  ".....KGggGK.....",
  "...KKGGGGGGKK...",
  "..KGGGGGGGGGGK..",
  "..KGGGGGGGGGGK..",
  "..KGgGGGGGGgGK..",
  "..KGGGGGGGGGGK..",
  "...KGgKKKKgGK...",
  "...KGK....KGK...",
  "...KKK....KKK...",
  ".KNNNNNNNNNNNNK.",
  "KNnnnnnnnnnnnnNK",
  "KNNNNNNNNNNNNNNK",
  "KnnnnnnnnnnnnnnK",
  "KNNNNNNNNNNNNNNK",
  ".KKKKKKKKKKKKKK.",
  "................",
  "................",
];
