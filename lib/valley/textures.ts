import type Phaser from "phaser";
import type { BigRecruitId, Character, ScatteredRecruitId } from "./types";
import { C, HAIR_COLORS, OUTFITS, SKIN_SHADE, SKIN_TONES } from "./palette";
import { paint, size, type PixelMap, type Roles } from "./sprites/pixel";
import { buildCharacter, IDOL, SPIRIT, type CharLook } from "./sprites/chars";
import {
  ALTAR,
  FARM,
  FLAX,
  GROVE,
  HOUSE,
  LAMP,
  MARKET,
  TOWER,
  VINEYARD,
  WALL,
  WELL,
} from "./sprites/buildings";
import { CLOUD_A, CLOUD_B, HILL_FAR, HILL_NEAR, MOON, STAR, SUN } from "./sprites/sky";
import { DIRT, GRASS, SAND, WATER } from "./sprites/tiles";
import {
  BEACON,
  BRIDGE,
  CAVE,
  CISTERN,
  CLIFF_FACE,
  CLIFF_RIM,
  GRANARY,
  GRASS_HI,
  MARKER,
  MILESTONE,
  OLIVE,
  RAMP,
  ROCK,
  SHALLOW,
  STONES,
  TENT,
  TIMBER,
  TREES,
} from "./sprites/terrain";

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
  O: C.olive,
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

export const TERRAIN_ROLES: Roles = {
  ...TILE_ROLES,
  E: C.grassHi,
  e: C.grassHiDark,
  R: C.rock,
  r: C.rockDark,
  x: C.rockLight,
  k: C.rockOutline,
  S: C.shallow,
  s: C.foam,
  W: C.wood,
  w: C.woodDark,
  T: C.trunk,
  L: C.leaf,
  l: C.leafDark,
  C: C.canvas,
  c: C.canvasShade,
  N: C.stone,
  n: C.stoneDark,
  F: C.fire,
  f: C.fireBright,
  V: C.violet,
  Y: C.wheat1,
  K: C.outline,
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

/**
 * Distinct, art-free looks for the four walking Big Recruits and the first
 * scattered-NPC batch, built from the same procedural pipeline as villagers
 * and enemies (KTD10). The Holy Ghost has no entry — it never gets a
 * companion sprite (R9).
 */
export const BIG_RECRUIT_LOOKS: Record<Exclude<BigRecruitId, "holyGhost">, { look: CharLook; roles: Roles }> = {
  moses: {
    look: { gender: "man", body: 2, face: 0, hairStyle: 2, beard: true, staff: true, outfitStyle: 0 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[3],
      s: SKIN_SHADE[3],
      H: HAIR_COLORS[3],
      C: C.cloth,
      T: OUTFITS[0].trim,
      O: OUTFITS[0].primary,
      o: OUTFITS[0].secondary,
    },
  },
  david: {
    look: { gender: "man", body: 1, face: 1, hairStyle: 0, outfitStyle: 2 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[2],
      s: SKIN_SHADE[2],
      H: HAIR_COLORS[1],
      C: C.cloth,
      T: C.gold,
      O: OUTFITS[2].primary,
      o: OUTFITS[2].secondary,
    },
  },
  paul: {
    look: { gender: "man", body: 1, face: 2, hairStyle: 0, outfitStyle: 1 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[1],
      s: SKIN_SHADE[1],
      H: HAIR_COLORS[0],
      C: C.cloth,
      T: OUTFITS[1].trim,
      O: OUTFITS[1].primary,
      o: OUTFITS[1].secondary,
    },
  },
  noah: {
    look: { gender: "man", body: 2, face: 0, hairStyle: 1, beard: true, outfitStyle: 0 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[2],
      s: SKIN_SHADE[2],
      H: HAIR_COLORS[3],
      C: C.cloth,
      T: C.leaf,
      O: OUTFITS[0].primary,
      o: OUTFITS[0].secondary,
    },
  },
};

export const SCATTERED_RECRUIT_LOOKS: Record<ScatteredRecruitId, { look: CharLook; roles: Roles }> = {
  deborah: {
    look: { gender: "woman", body: 0, face: 1, hairStyle: 1, outfitStyle: 0 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[1],
      s: SKIN_SHADE[1],
      H: HAIR_COLORS[1],
      C: C.cloth,
      T: C.leaf,
      O: OUTFITS[0].primary,
      o: OUTFITS[0].secondary,
    },
  },
  gideon: {
    look: { gender: "man", body: 2, face: 2, hairStyle: 0, outfitStyle: 2 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[2],
      s: SKIN_SHADE[2],
      H: HAIR_COLORS[0],
      C: C.cloth,
      T: C.stone,
      O: OUTFITS[2].primary,
      o: OUTFITS[2].secondary,
    },
  },
  ruth: {
    look: { gender: "woman", body: 0, face: 0, hairStyle: 1, outfitStyle: 0 },
    roles: {
      ...BASE_CHAR_ROLES,
      S: SKIN_TONES[0],
      s: SKIN_SHADE[0],
      H: HAIR_COLORS[2],
      C: C.cloth,
      T: C.gold,
      O: OUTFITS[0].primary,
      o: OUTFITS[0].secondary,
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

  for (const [id, { look, roles }] of Object.entries(BIG_RECRUIT_LOOKS)) {
    addCanvas(scene, `recruit_${id}`, renderMap(buildCharacter(look), roles));
  }
  for (const [id, { look, roles }] of Object.entries(SCATTERED_RECRUIT_LOOKS)) {
    addCanvas(scene, `recruit_${id}`, renderMap(buildCharacter(look), roles));
  }

  FARM.forEach((m, i) => addCanvas(scene, `farm_${i}`, renderMap(m, BUILDING_ROLES)));
  VINEYARD.forEach((m, i) => addCanvas(scene, `vineyard_${i}`, renderMap(m, BUILDING_ROLES)));
  FLAX.forEach((m, i) => addCanvas(scene, `flax_${i}`, renderMap(m, BUILDING_ROLES)));
  GROVE.forEach((m, i) => addCanvas(scene, `grove_${i}`, renderMap(m, BUILDING_ROLES)));
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

  GRASS_HI.forEach((m, i) => addCanvas(scene, `grass_hi_${i}`, renderMap(m, TERRAIN_ROLES)));
  addCanvas(scene, "cliff_face", renderMap(CLIFF_FACE, TERRAIN_ROLES));
  addCanvas(scene, "cliff_rim", renderMap(CLIFF_RIM, TERRAIN_ROLES));
  addCanvas(scene, "ramp", renderMap(RAMP, TERRAIN_ROLES));
  addCanvas(scene, "shallow", renderMap(SHALLOW, TERRAIN_ROLES));
  addCanvas(scene, "bridge", renderMap(BRIDGE, TERRAIN_ROLES));
  TREES.forEach((m, i) => addCanvas(scene, `tree_${i}`, renderMap(m, TERRAIN_ROLES)));
  addCanvas(scene, "rock", renderMap(ROCK, TERRAIN_ROLES));
  addCanvas(scene, "lm_shepherdCamp", renderMap(TENT, TERRAIN_ROLES));
  addCanvas(scene, "lm_boatyard", renderMap(TIMBER, TERRAIN_ROLES));
  addCanvas(scene, "lm_standingStones", renderMap(STONES, TERRAIN_ROLES));
  addCanvas(scene, "lm_milestone", renderMap(MILESTONE, TERRAIN_ROLES));
  addCanvas(scene, "lm_cave", renderMap(CAVE, TERRAIN_ROLES));
  addCanvas(scene, "lm_ancientOlive", renderMap(OLIVE, TERRAIN_ROLES));
  addCanvas(scene, "lm_cistern", renderMap(CISTERN, TERRAIN_ROLES));
  addCanvas(scene, "granary", renderMap(GRANARY, TERRAIN_ROLES));
  addCanvas(scene, "beacon", renderMap(BEACON, TERRAIN_ROLES));
  addCanvas(scene, "marker", renderMap(MARKER, { K: C.outline, G: "#ffffff" }));

  const SKY_ROLES: Roles = {
    K: C.outline,
    y: C.sun,
    m: C.moon,
    c: "#e8f0f8",
    h: C.hillFar,
    T: "#ffffff",
  };
  addCanvas(scene, "sky_sun", renderMap(SUN, SKY_ROLES));
  addCanvas(scene, "sky_moon", renderMap(MOON, SKY_ROLES));
  addCanvas(scene, "sky_cloud_a", renderMap(CLOUD_A, SKY_ROLES));
  addCanvas(scene, "sky_cloud_b", renderMap(CLOUD_B, SKY_ROLES));
  addCanvas(scene, "sky_hill_far", renderMap(HILL_FAR, SKY_ROLES));
  addCanvas(scene, "sky_hill_near", renderMap(HILL_NEAR, { ...SKY_ROLES, h: C.hillNear }));
  addCanvas(scene, "sky_star", renderMap(STAR, SKY_ROLES));

  addCanvas(scene, "px_white", solid(2, 2, "#ffffff"));
  addCanvas(scene, "px_lime", solid(3, 3, C.lime));
  addCanvas(scene, "px_coral", solid(3, 3, C.coral));
  addCanvas(scene, "px_violet", solid(3, 3, "#c084fc"));
  addCanvas(scene, "px_gold", solid(3, 3, C.gold));
  addCanvas(scene, "arrow", solid(6, 2, "#efe6cc"));
  addCanvas(scene, "light_grad", radialGradient(256));
}

/** White disc fading to transparent; erased from the fog to carve out light. */
function radialGradient(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.85)");
  g.addColorStop(0.8, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}
