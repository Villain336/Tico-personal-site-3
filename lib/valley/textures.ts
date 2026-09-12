import type Phaser from "phaser";
import type { Character } from "./types";
import { C, HAIR_COLORS, OUTFITS, SKIN_SHADE, SKIN_TONES } from "./palette";
import { paint, size, type PixelMap, type Roles } from "./sprites/pixel";
import { buildCharacter, IDOL, SPIRIT, type CharLook } from "./sprites/chars";
import {
  ALTAR,
  FARM,
  HOUSE,
  LAMP,
  MARKET,
  TOWER,
  VINEYARD,
  WALL,
  WELL,
} from "./sprites/buildings";
import { DIRT, GRASS, SAND, WATER } from "./sprites/tiles";

/** Draw a pixel map to a fresh canvas at `scale` px per pixel. */
export function renderMap(map: PixelMap, roles: Roles, scale = 1): HTMLCanvasElement {
  const { w, h } = size(map);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w * scale);
  canvas.height = Math.max(1, h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  paint(ctx, map, roles, 0, 0, scale);
  return canvas;
}

const BASE_CHAR_ROLES: Roles = {
  K: C.outline,
  E: C.eye,
  W: C.eyeWhite,
  M: C.mouth,
  R: C.robberMask,
  w: C.wood,
};

export function characterRoles(c: Pick<Character, "skin" | "hairColor" | "outfit">): Roles {
  const outfit = OUTFITS[c.outfit] ?? OUTFITS[0];
  return {
    ...BASE_CHAR_ROLES,
    S: SKIN_TONES[c.skin] ?? SKIN_TONES[2],
    s: SKIN_SHADE[c.skin] ?? SKIN_SHADE[2],
    H: HAIR_COLORS[c.hairColor] ?? HAIR_COLORS[0],
    C: C.cloth,
    T: outfit.trim,
    O: outfit.primary,
    o: outfit.secondary,
  };
}

export function characterLook(c: Character): CharLook {
  return {
    gender: c.gender,
    body: c.body,
    face: c.face,
    hairStyle: c.hairStyle,
    outfitStyle: c.outfit,
  };
}

export const VILLAGER_VARIANTS = 6;

/** Deterministic villager appearance from a seed. */
export function villagerLook(seed: number): { look: CharLook; roles: Roles } {
  const v = Math.abs(seed | 0);
  const gender = v % 2 === 0 ? "man" : "woman";
  const skin = v % SKIN_TONES.length;
  const hairColor = (v >> 2) % HAIR_COLORS.length;
  const palette: { primary: string; secondary: string; trim: string }[] = [
    { primary: "#d9c9a3", secondary: "#8a6d43", trim: "#6d3cf5" },
    { primary: "#a8c4d9", secondary: "#4f6f8a", trim: "#e0b53a" },
    { primary: "#d9a3a3", secondary: "#8a4f4f", trim: "#3f8a3a" },
  ];
  const cloth = palette[(v >> 1) % palette.length];
  return {
    look: {
      gender,
      body: (v >> 3) % 3,
      face: (v >> 4) % 3,
      hairStyle: (v >> 5) % 3,
      outfitStyle: 0,
    },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[skin],
      s: SKIN_SHADE[skin],
      H: HAIR_COLORS[hairColor],
      C: C.cloth,
      T: cloth.trim,
      O: cloth.primary,
      o: cloth.secondary,
    },
  };
}

export const BUILDING_ROLES: Roles = {
  K: C.outline,
  W: C.wood,
  w: C.woodDark,
  N: C.stone,
  n: C.stoneDark,
  R: C.roof,
  r: C.roofDark,
  C: C.cloth,
  G: C.gold,
  g: C.goldDark,
  F: C.fire,
  f: C.fireBright,
  L: C.leaf,
  l: C.leafDark,
  D: C.dirt1,
  d: C.dirt2,
  Y: C.wheat1,
  y: C.wheat2,
  P: C.grape,
  T: C.violet,
  S: C.sand1,
  E: C.eye,
};

export const TILE_ROLES: Roles = {
  G: C.grass1,
  g: C.grass2,
  h: C.grass3,
  A: C.sand1,
  a: C.sand2,
  D: C.dirt1,
  d: C.dirt2,
  B: C.water1,
  b: C.water2,
};

const SPIRIT_ROLES: Roles = { K: C.spiritDark, P: C.spirit, D: C.spiritDark, E: C.outline };
const IDOL_ROLES: Roles = { K: C.outline, G: C.idol, g: C.idolDark, N: C.stone, n: C.stoneDark, E: C.outline };

export const ENEMY_LOOKS: Record<string, { look: CharLook; roles: Roles }> = {
  robber: {
    look: { gender: "man", body: 1, face: 2, hairStyle: 0, mask: true, outfitStyle: 2 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[2],
      s: SKIN_SHADE[2],
      H: "#111118",
      C: C.robber,
      T: "#5a5a66",
      O: C.robber,
      o: "#25252d",
    },
  },
  tempter: {
    look: { gender: "man", body: 0, face: 1, hairStyle: 1, outfitStyle: 1 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[1],
      s: SKIN_SHADE[1],
      H: C.gold,
      C: C.tempterGlow,
      T: C.tempterGlow,
      O: C.tempter,
      o: "#a8325a",
    },
  },
  deceiver: {
    look: { gender: "woman", body: 1, face: 0, hairStyle: 1, outfitStyle: 0 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[3],
      s: SKIN_SHADE[3],
      H: HAIR_COLORS[1],
      C: C.cloth,
      T: "#6d3cf5",
      O: "#d9c9a3",
      o: "#8a6d43",
    },
  },
  prophet: {
    look: { gender: "man", body: 2, face: 2, hairStyle: 2, beard: true, staff: true, outfitStyle: 1 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[2],
      s: SKIN_SHADE[2],
      H: "#8d8d94",
      C: C.prophet,
      T: C.prophetTrim,
      O: C.prophet,
      o: C.prophetTrim,
    },
  },
};

function addCanvas(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

function solid(w: number, h: number, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

/** Generate every texture the world needs. Called once from the scene's create(). */
export function registerTextures(scene: Phaser.Scene, character: Character) {
  addCanvas(scene, "player", renderMap(buildCharacter(characterLook(character)), characterRoles(character)));

  for (let i = 0; i < VILLAGER_VARIANTS; i++) {
    const { look, roles } = villagerLook(i * 7 + 3);
    addCanvas(scene, `vil_${i}`, renderMap(buildCharacter(look), roles));
    addCanvas(scene, `vil_${i}_staff`, renderMap(buildCharacter({ ...look, staff: true }), roles));
  }

  for (const [key, { look, roles }] of Object.entries(ENEMY_LOOKS)) {
    addCanvas(scene, key, renderMap(buildCharacter(look), roles));
  }
  addCanvas(scene, "spirit", renderMap(SPIRIT, SPIRIT_ROLES));
  addCanvas(scene, "idol", renderMap(IDOL, IDOL_ROLES));

  FARM.forEach((m, i) => addCanvas(scene, `farm_${i}`, renderMap(m, BUILDING_ROLES)));
  VINEYARD.forEach((m, i) => addCanvas(scene, `vineyard_${i}`, renderMap(m, BUILDING_ROLES)));
  ALTAR.forEach((m, i) => addCanvas(scene, `altar_${i}`, renderMap(m, BUILDING_ROLES)));
  addCanvas(scene, "house", renderMap(HOUSE, BUILDING_ROLES));
  addCanvas(scene, "well", renderMap(WELL, BUILDING_ROLES));
  addCanvas(scene, "wall", renderMap(WALL, BUILDING_ROLES));
  addCanvas(scene, "tower", renderMap(TOWER, BUILDING_ROLES));
  addCanvas(scene, "market", renderMap(MARKET, BUILDING_ROLES));
  addCanvas(scene, "lamp", renderMap(LAMP, BUILDING_ROLES));

  GRASS.forEach((m, i) => addCanvas(scene, `grass_${i}`, renderMap(m, TILE_ROLES)));
  addCanvas(scene, "sand", renderMap(SAND, TILE_ROLES));
  addCanvas(scene, "dirt", renderMap(DIRT, TILE_ROLES));
  addCanvas(scene, "water", renderMap(WATER, TILE_ROLES));

  addCanvas(scene, "px_white", solid(2, 2, "#ffffff"));
  addCanvas(scene, "px_lime", solid(3, 3, C.lime));
  addCanvas(scene, "px_coral", solid(3, 3, C.coral));
  addCanvas(scene, "px_violet", solid(3, 3, "#c084fc"));
  addCanvas(scene, "px_gold", solid(3, 3, C.gold));
  addCanvas(scene, "arrow", solid(6, 2, "#efe6cc"));
}
