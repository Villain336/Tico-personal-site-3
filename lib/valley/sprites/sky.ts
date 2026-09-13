import type { PixelMap } from "./pixel";

/** Roles: K outline · S sun · M moon · C cloud · c cloud shade · H hill · h hill dark · T star */

export const SUN: PixelMap = [
  "....KKKK....",
  "..KKyyyyKK..",
  ".KyyyyyyyyK.",
  ".KyyyyyyyyK.",
  "KyyyyyyyyyyK",
  "KyyyyyyyyyyK",
  "KyyyyyyyyyyK",
  "KyyyyyyyyyyK",
  ".KyyyyyyyyK.",
  ".KyyyyyyyyK.",
  "..KKyyyyKK..",
  "....KKKK....",
];

export const MOON: PixelMap = [
  "....KKKK....",
  "..KKmmmmKK..",
  ".KmmmmmmmmK.",
  ".KmmmKKmmmK.",
  "KmmmmKKmmmmK",
  "KmmmmmmmmmmK",
  "KmmmmmmmmmmK",
  "KmmmKKmmmmmK",
  ".KmmKKmmmmK.",
  ".KmmmmmmmmK.",
  "..KKmmmmKK..",
  "....KKKK....",
];

export const CLOUD_A: PixelMap = [
  "..........KKKKKK..............",
  "........KKccccccKK............",
  "......KKccccccccccKK..........",
  "....KKccccccccccccccKK........",
  "..KKccccccccccccccccccKK......",
  ".KccccccccccccccccccccccK.....",
  "KKccccccccccccccccccccccKK....",
  ".KKKKKKKKKKKKKKKKKKKKKKKK.....",
];

export const CLOUD_B: PixelMap = [
  "......KKKKKKKK........",
  "....KKccccccccKK......",
  "..KKccccccccccccKK....",
  ".KccccccccccccccccK...",
  "KKccccccccccccccccKK..",
  ".KKKKKKKKKKKKKKKKKK...",
];

export const HILL_FAR: PixelMap = [
  "......................KK......................",
  "....................KKhhKK....................",
  "..................KKhhhhhhKK..................",
  "................KKhhhhhhhhhhKK................",
  "..............KKhhhhhhhhhhhhhhKK..............",
  "............KKhhhhhhhhhhhhhhhhhhKK............",
  "..........KKhhhhhhhhhhhhhhhhhhhhhhKK..........",
  "........KKhhhhhhhhhhhhhhhhhhhhhhhhhhKK........",
  "......KKhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK......",
  "....KKhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK....",
  "..KKhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK..",
  "KKhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK",
];

export const HILL_NEAR: PixelMap = [
  "................KK................",
  "..............KKhhKK..............",
  "............KKhhhhhhKK............",
  "..........KKhhhhhhhhhhKK..........",
  "........KKhhhhhhhhhhhhhhKK........",
  "......KKhhhhhhhhhhhhhhhhhhKK......",
  "....KKhhhhhhhhhhhhhhhhhhhhhhKK....",
  "..KKhhhhhhhhhhhhhhhhhhhhhhhhhhKK..",
  "KKhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhKK",
];

export const STAR: PixelMap = [
  ".T.",
  "TTT",
  ".T.",
];
