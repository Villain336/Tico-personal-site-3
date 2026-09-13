import type { WorldScene } from "../scenes/WorldScene";
import { CIVIC } from "../config";
import { pickVisitName } from "../dialogue";
import type {
  CivicCase,
  CivicState,
  CaseKind,
  EdictId,
  OfficeId,
  RecruitId,
  StatuteId,
  TitheRate,
  Verdict,
} from "../types";

export const EDICT_IDS: EdictId[] = ["curfew", "openGates", "sanctuary", "conscription"];
export const STATUTE_IDS: StatuteId[] = ["noIdols", "protectWeak", "keepSabbath", "openHand"];
export const OFFICE_IDS: OfficeId[] = ["watchman", "scribe", "treasurer"];
export const TITHE_RATES: TitheRate[] = [0, 10, 20];

export const EDICT_COPY: Record<EdictId, { name: string; hint: string }> = {
  curfew: { name: "Curfew", hint: "Villagers stay home after dusk. Fewer night shadows." },
  openGates: { name: "Open gates", hint: "More travelers and rent — and more enemies at the edge." },
  sanctuary: { name: "Sanctuary", hint: "Casts reach farther. Lies take longer to take hold." },
  conscription: { name: "Conscription", hint: "Villagers fight sooner. Wages rise. Loyalty slips." },
};

export const STATUTE_COPY: Record<StatuteId, { name: string; hint: string }> = {
  noIdols: { name: "No idols", hint: "An idol left standing is a case at dawn." },
  protectWeak: { name: "Protect the weak", hint: "A villager who falls is brought before the court." },
  keepSabbath: { name: "Keep the night", hint: "Selling after dark is an offense." },
  openHand: { name: "Open hand", hint: "Hoarding a full barn while Share is off is judged." },
};

export const OFFICE_COPY: Record<OfficeId, { name: string; hint: string }> = {
  watchman: { name: "Watchman", hint: "One fewer shadow spawns at night." },
  scribe: { name: "Scribe", hint: "Judgments land cleaner. Loyalty recovers faster." },
  treasurer: { name: "Treasurer", hint: "The changer pays a little more at dawn." },
};

export function defaultCivic(): CivicState {
  return {
    loyalty: CIVIC.startLoyalty,
    steward: null,
    edicts: { curfew: false, openGates: false, sanctuary: false, conscription: false },
    statutes: { noIdols: false, protectWeak: false, keepSabbath: false, openHand: false },
    titheRate: 10,
    offices: {},
    docket: [],
    nextCaseId: 1,
  };
}

export function clampLoyalty(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function civicDawnMods(civic: CivicState) {
  let rentDelta = 0;
  if (civic.loyalty >= CIVIC.highLoyalty) rentDelta += CIVIC.highLoyaltyRent;
  if (civic.loyalty < CIVIC.lowLoyalty) rentDelta += CIVIC.lowLoyaltyRent;
  if (civic.edicts.openGates) rentDelta += CIVIC.openGatesRent;
  if (civic.steward && civic.steward !== "self") rentDelta += 1;
  let spawnDelta = 0;
  if (civic.edicts.openGates) spawnDelta += CIVIC.openGatesSpawn;
  if (civic.edicts.curfew) spawnDelta += CIVIC.curfewSpawn;
  if (civic.offices.watchman != null) spawnDelta += CIVIC.watchmanSpawn;
  return {
    wageExtra: civic.edicts.conscription ? CIVIC.conscriptionWage : 0,
    rentDelta,
    interestBump: civic.offices.treasurer != null ? CIVIC.treasurerInterest : 0,
    spawnDelta,
  };
}

export function applyIgnoredCases(civic: CivicState): { ignored: number; loyaltyHit: number } {
  const pending = civic.docket.length;
  if (pending === 0) return { ignored: 0, loyaltyHit: 0 };
  const hit = pending * CIVIC.ignoreLoyalty;
  civic.loyalty = clampLoyalty(civic.loyalty + hit);
  civic.docket = [];
  return { ignored: pending, loyaltyHit: hit };
}

export function fileCaseOn(
  civic: CivicState,
  kind: CaseKind,
  day: number,
  accused: string,
  note: string,
  accusedSeed?: number,
): CivicCase | null {
  const dup = civic.docket.some((c) => c.kind === kind && c.day === day && c.accusedSeed === accusedSeed && c.accused === accused);
  if (dup) return null;
  const filed: CivicCase = {
    id: `c${civic.nextCaseId++}`,
    kind,
    day,
    accused,
    accusedSeed,
    note,
  };
  civic.docket.push(filed);
  return filed;
}

export type JudgeResult = {
  ok: boolean;
  toast: string;
  tone: "good" | "bad" | "info";
  coinsTaken: number;
  exiledSeed?: number;
};

export function judgeOn(
  civic: CivicState,
  id: string,
  verdict: Verdict,
  purseAndBank: { coins: number; bank: number },
  moses: boolean,
): JudgeResult {
  const i = civic.docket.findIndex((c) => c.id === id);
  if (i < 0) return { ok: false, toast: "That case is already closed.", tone: "info", coinsTaken: 0 };
  const filed = civic.docket[i];
  civic.docket.splice(i, 1);
  const scribe = civic.offices.scribe != null ? CIVIC.scribeLoyalty : 0;
  if (verdict === "mercy") {
    civic.loyalty = clampLoyalty(civic.loyalty + CIVIC.mercyLoyalty + scribe + (moses ? CIVIC.mosesMercy : 0));
    return { ok: true, toast: `Mercy for ${filed.accused}. The valley remembers kindness.`, tone: "good", coinsTaken: 0 };
  }
  if (verdict === "fine") {
    const due = CIVIC.fineCoins;
    let left = due;
    const fromPurse = Math.min(purseAndBank.coins, left);
    purseAndBank.coins -= fromPurse;
    left -= fromPurse;
    const fromBank = Math.min(purseAndBank.bank, left);
    purseAndBank.bank -= fromBank;
    left -= fromBank;
    const taken = due - left;
    civic.loyalty = clampLoyalty(civic.loyalty + CIVIC.fineLoyalty + scribe);
    if (taken < due) {
      civic.loyalty = clampLoyalty(civic.loyalty - 2);
      return {
        ok: true,
        toast: `${filed.accused} was fined, but the purse was short.`,
        tone: "bad",
        coinsTaken: taken,
      };
    }
    return { ok: true, toast: `${filed.accused} fined ${taken} coins.`, tone: "info", coinsTaken: taken };
  }
  // exile
  civic.loyalty = clampLoyalty(civic.loyalty + CIVIC.exileLoyalty + scribe + (moses ? CIVIC.mosesExile : 0));
  return {
    ok: true,
    toast: `${filed.accused} is sent from the valley.`,
    tone: "bad",
    coinsTaken: 0,
    exiledSeed: filed.accusedSeed,
  };
}

export class Civic {
  constructor(private scene: WorldScene) {}

  get data(): CivicState {
    return this.scene.state.civic;
  }

  hasHall() {
    return this.scene.buildings.count("hall") > 0;
  }

  ensureSteward() {
    if (this.hasHall() && this.data.steward === null) this.data.steward = "self";
  }

  setEdict(id: EdictId, on: boolean) {
    if (!this.hasHall()) return false;
    this.data.edicts[id] = on;
    return true;
  }

  setStatute(id: StatuteId, on: boolean) {
    if (!this.hasHall()) return false;
    this.data.statutes[id] = on;
    return true;
  }

  setTitheRate(rate: TitheRate) {
    if (!this.hasHall()) return false;
    this.data.titheRate = rate;
    this.scene.state.titheOn = rate > 0;
    return true;
  }

  setSteward(who: RecruitId | "self") {
    if (!this.hasHall()) return false;
    if (who !== "self" && !this.scene.recruitManager.byId(who)) return false;
    this.data.steward = who;
    return true;
  }

  setOffice(office: OfficeId, seed: number | null) {
    if (!this.hasHall()) return false;
    if (seed == null) {
      delete this.data.offices[office];
      return true;
    }
    const living = this.scene.villagers.list.some((v) => v.alive && v.seed === seed);
    if (!living) return false;
    for (const k of OFFICE_IDS) {
      if (this.data.offices[k] === seed) delete this.data.offices[k];
    }
    this.data.offices[office] = seed;
    return true;
  }

  file(kind: CaseKind, accused: string, note: string, accusedSeed?: number) {
    return fileCaseOn(this.data, kind, this.scene.state.day, accused, note, accusedSeed);
  }

  maybeFileFall(seed: number) {
    if (!this.data.statutes.protectWeak) return;
    const name = pickVisitName(seed);
    const filed = this.file("fall", name, `${name} fell in the dark.`, seed);
    if (filed) this.scene.toast(`${name} is on the docket — protect the weak.`, "info");
  }

  maybeFileNightSale() {
    if (!this.data.statutes.keepSabbath || !this.scene.isNight()) return;
    const v = this.scene.villagers.list.find((x) => x.alive);
    const name = v ? pickVisitName(v.seed) : "a merchant";
    const filed = this.file("nightSale", name, "Crops were sold after dusk.", v?.seed);
    if (filed) this.scene.toast("Night sale — the statute is broken. Open Civic (G).", "bad");
  }

  judge(id: string, verdict: Verdict) {
    const st = this.scene.state;
    const wallet = { coins: st.coins, bank: st.bank };
    const moses = st.unlocks.abilities.includes("moses");
    const result = judgeOn(this.data, id, verdict, wallet, moses);
    st.coins = wallet.coins;
    st.bank = wallet.bank;
    if (result.coinsTaken > 0) {
      /* already taken from wallet */
    }
    if (verdict === "fine" && result.ok) this.scene.addSin(CIVIC.fineSin);
    if (verdict === "exile" && result.ok) this.scene.addSin(CIVIC.exileSin);
    if (result.exiledSeed != null) {
      const v = this.scene.villagers.list.find((x) => x.seed === result.exiledSeed);
      if (v) this.scene.villagers.remove(v);
      for (const k of OFFICE_IDS) {
        if (this.data.offices[k] === result.exiledSeed) delete this.data.offices[k];
      }
    }
    return result;
  }

  /** Dawn: close ignored cases, then file idol/hoard offenses for the new day. */
  settleDawn() {
    const civic = this.data;
    const ignored = applyIgnoredCases(civic);
    if (ignored.ignored > 0) {
      this.scene.addSin(ignored.ignored * CIVIC.ignoreSin);
    }
    if (civic.edicts.conscription) civic.loyalty = clampLoyalty(civic.loyalty + CIVIC.conscriptionLoyalty);
    if (civic.loyalty < CIVIC.lowLoyalty) this.scene.addSin(CIVIC.lowLoyaltySin);

    if (civic.statutes.noIdols && this.scene.buildings.idols().length > 0) {
      this.file("idol", "the valley", "An idol still stands in the light.");
    }
    const stores = Object.values(this.scene.state.stores).reduce((a, b) => a + b, 0);
    if (civic.statutes.openHand && !this.scene.state.shareOn && stores >= CIVIC.hoardStores) {
      this.file("hoard", this.scene.playerName, "The barn is full and the bread is not shared.");
    }

    this.ensureSteward();
    return { ignored: ignored.ignored, pending: civic.docket.length, loyalty: civic.loyalty };
  }

  titheFraction() {
    return this.data.titheRate / 100;
  }
}
