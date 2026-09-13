import type { WorldScene } from "../scenes/WorldScene";
import { CROP_KINDS, CROPS, ECONOMY } from "../config";
import type { CropKind, SaveData } from "../types";
import { civicDawnMods } from "./civic";

const FOOD_ORDER: CropKind[] = ["wheat", "olives", "grapes", "flax"];

export type DawnBooks = {
  wages: number;
  wagesShort: number;
  titheHeld: number;
  interest: number;
  bankRun: number;
  rationsFed: number;
  rationsShort: number;
  rentPaid: number;
};

function foodOnHand(st: SaveData) {
  return CROP_KINDS.reduce((n, k) => n + st[k] + st.stores[k], 0);
}

function takeFood(st: SaveData, need: number) {
  let left = need;
  for (const k of FOOD_ORDER) {
    const n = Math.min(st.stores[k], left);
    st.stores[k] -= n;
    left -= n;
  }
  for (const k of FOOD_ORDER) {
    const n = Math.min(st[k], left);
    st[k] -= n;
    left -= n;
  }
  return need - left;
}

function pay(st: SaveData, amount: number) {
  let left = Math.max(0, Math.floor(amount));
  const fromPurse = Math.min(st.coins, left);
  st.coins -= fromPurse;
  left -= fromPurse;
  const fromBank = Math.min(st.bank, left);
  st.bank -= fromBank;
  left -= fromBank;
  return { paid: amount - left, short: left };
}

export function unitPrice(st: Pick<SaveData, "prices">, kind: CropKind) {
  return Math.max(1, Math.round(CROPS[kind].price * (st.prices[kind] ?? 1)));
}

/**
 * Dawn settlement that can run in the scene or on an offline save copy.
 * Order: rations → wages → rent in → interest → bank run → prices.
 */
export function settleDawnOn(st: SaveData, pop: number, rent: number, enemiesLastNight: number): DawnBooks {
  const mods = civicDawnMods(st.civic);
  const books: DawnBooks = {
    wages: 0,
    wagesShort: 0,
    titheHeld: 0,
    interest: 0,
    bankRun: 0,
    rationsFed: 0,
    rationsShort: 0,
    rentPaid: 0,
  };

  if (pop > 0) {
    if (st.shareOn) {
      books.rationsFed = takeFood(st, pop);
      books.rationsShort = pop - books.rationsFed;
      if (books.rationsShort === 0) st.sin = clampSin(st.sin + ECONOMY.shareSinRelief);
      else st.sin = clampSin(st.sin + ECONOMY.hungrySin);
    } else {
      books.rationsShort = pop;
      if (foodOnHand(st) >= pop) st.sin = clampSin(st.sin + ECONOMY.hoardSin);
      else st.sin = clampSin(st.sin + ECONOMY.hungrySin);
    }
  }

  if (pop > 0) {
    const due = pop * (ECONOMY.wagePerVillager + mods.wageExtra);
    const w = pay(st, due);
    books.wages = w.paid;
    books.wagesShort = w.short;
    if (w.short > 0) st.sin = clampSin(st.sin + ECONOMY.unpaidWageSin);
  }

  let rentPaid = Math.floor(rent + mods.rentDelta);
  if (pop > 0 && books.rationsShort > 0) rentPaid = Math.floor(rentPaid * 0.5);
  rentPaid = Math.max(0, rentPaid);
  st.coins += rentPaid;
  books.rentPaid = rentPaid;

  if (st.bank > 0) {
    const rate = (st.sin < 50 ? ECONOMY.interestGood : st.sin < 80 ? ECONOMY.interestMid : 0) + mods.interestBump;
    books.interest = Math.round(st.bank * rate);
    if (rate > 0 && st.bank >= 20 && books.interest < 1) books.interest = 1;
    st.bank += books.interest;
  }

  if (st.bank > 0 && st.sin >= ECONOMY.bankRunSin && enemiesLastNight >= ECONOMY.bankRunMinSpawns) {
    books.bankRun = Math.max(1, Math.floor(st.bank * ECONOMY.bankRunLoss));
    st.bank -= books.bankRun;
  }

  for (const k of CROP_KINDS) {
    const toward = 1 + (enemiesLastNight >= ECONOMY.bankRunMinSpawns ? ECONOMY.raidPriceBump : 0);
    const cur = st.prices[k] ?? 1;
    const next = cur + (toward - cur) * ECONOMY.priceRecover;
    st.prices[k] = Math.max(ECONOMY.priceFloor, Math.min(ECONOMY.priceCeil, next));
  }

  return books;
}

function clampSin(n: number) {
  return Math.max(0, Math.min(100, n));
}

export class Ledger {
  titheToday = 0;

  constructor(private scene: WorldScene) {}

  price(kind: CropKind) {
    return unitPrice(this.scene.state, kind);
  }

  recordSale(kind: CropKind, units: number) {
    if (units <= 0) return;
    const st = this.scene.state;
    st.prices[kind] = Math.max(ECONOMY.priceFloor, (st.prices[kind] ?? 1) * Math.pow(1 - ECONOMY.glutPerUnit, units));
  }

  takeTithe(gross: number) {
    const st = this.scene.state;
    const rate = st.civic.titheRate / 100;
    if (rate <= 0 || gross <= 0) return 0;
    const tithe = Math.floor(gross * rate);
    if (tithe <= 0) return 0;
    this.titheToday += tithe;
    this.scene.addSin(ECONOMY.titheSinRelief);
    return tithe;
  }

  depositCoins(n: number) {
    const st = this.scene.state;
    const amt = Math.min(Math.floor(st.coins), Math.max(0, Math.floor(n)));
    st.coins -= amt;
    st.bank += amt;
    return amt;
  }

  withdrawCoins(n: number) {
    const st = this.scene.state;
    const amt = Math.min(st.bank, Math.max(0, Math.floor(n)));
    st.bank -= amt;
    st.coins += amt;
    return amt;
  }

  depositCrop(kind: CropKind, n: number) {
    const st = this.scene.state;
    const amt = Math.min(st[kind], Math.max(0, Math.floor(n)));
    st[kind] -= amt;
    st.stores[kind] += amt;
    return amt;
  }

  withdrawCrop(kind: CropKind, n: number) {
    const st = this.scene.state;
    const amt = Math.min(st.stores[kind], Math.max(0, Math.floor(n)));
    st.stores[kind] -= amt;
    st[kind] += amt;
    return amt;
  }

  depositAllCrops() {
    let n = 0;
    for (const k of CROP_KINDS) n += this.depositCrop(k, this.scene.state[k]);
    return n;
  }

  settleDawn(pop: number, rent: number, enemiesLastNight: number) {
    const books = settleDawnOn(this.scene.state, pop, rent, enemiesLastNight);
    books.titheHeld = this.titheToday;
    this.titheToday = 0;
    return books;
  }
}
