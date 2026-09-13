export type SignKind = "none" | "drought" | "longNight" | "quietDawn";
export type DivineVerdict = "none" | "blessing" | "exile" | "darkReset";
export type SoulKind = "arrived" | "fallen" | "redeemed" | "mercy" | "fine" | "exile" | "lost";

export type SoulEntry = {
  name: string;
  seed: number;
  kind: SoulKind;
  day: number;
  note: string;
};

export type JudgmentState = {
  lastSign: SignKind;
  activeSign: SignKind;
  signsSeen: number;
  mercyGiven: number;
  exileGiven: number;
  forceSign: SignKind | null;
  verdictNext: boolean;
  verdict: DivineVerdict;
  souls: SoulEntry[];
};

export const SIGN_COPY: Record<Exclude<SignKind, "none">, { name: string; line: string }> = {
  drought: { name: "Drought", line: "The ground hardens. Crops slow. Thirst comes sooner." },
  longNight: { name: "Long night", line: "The dark stays. More shadows will come." },
  quietDawn: { name: "Quiet dawn", line: "The valley holds its breath. Fewer walk the edge." },
};

export const VERDICT_COPY: Record<Exclude<DivineVerdict, "none">, { name: string; line: string }> = {
  blessing: { name: "Blessing", line: "A voice over the valley: you are remembered for good." },
  exile: { name: "Exile", line: "A voice over the valley: the wicked are sent out." },
  darkReset: { name: "The outer dark", line: "A voice over the valley: the outer dark is torn back. The debt remains." },
};

const BOOK_CAP = 40;

export function emptyJudgment(): JudgmentState {
  return {
    lastSign: "none",
    activeSign: "none",
    signsSeen: 0,
    mercyGiven: 0,
    exileGiven: 0,
    forceSign: null,
    verdictNext: false,
    verdict: "none",
    souls: [],
  };
}

export function pickSign(input: {
  day: number;
  population: number;
  sin: number;
  loyalty: number;
  idols: number;
  mercyGiven: number;
  lastSign: SignKind;
  forceSign: SignKind | null;
  alreadyJudged: boolean;
  rng: () => number;
}): SignKind {
  if (input.alreadyJudged) return "none";
  if (input.forceSign && input.forceSign !== "none") return input.forceSign;
  if (input.day < 4) return "none";
  if (input.population < 1 && input.idols < 1) return "none";
  if (input.lastSign !== "none") return "none";

  const dry = input.sin >= 45 || input.idols > 0;
  const hush = input.mercyGiven >= 1 && input.sin < 35 && input.loyalty >= 50;
  if (input.idols > 0 && input.rng() < 0.7) return "longNight";
  if (hush && input.rng() < 0.55) return "quietDawn";
  if (dry && input.rng() < 0.5) return "drought";
  if (input.sin >= 30 && input.rng() < 0.25) return "drought";
  return "none";
}

export function growScale(sign: SignKind) {
  return sign === "drought" ? 1.55 : 1;
}

export function thirstScale(sign: SignKind) {
  return sign === "drought" ? 1.35 : 1;
}

export function signSpawnDelta(sign: SignKind) {
  if (sign === "longNight") return 6;
  if (sign === "quietDawn") return -4;
  return 0;
}

export function weighValley(input: {
  sin: number;
  loyalty: number;
  mercyGiven: number;
  exileGiven: number;
  idols: number;
  blessing: boolean;
  jesus: boolean;
}): Exclude<DivineVerdict, "none"> {
  let score = 50 - input.sin;
  score += input.loyalty - 50;
  score += input.mercyGiven * 8;
  score -= input.exileGiven * 4;
  score -= input.idols * 12;
  if (input.blessing) score += 15;
  if (input.jesus) score += 20;
  if (score >= 40) return "blessing";
  if (score >= 0) return "exile";
  return "darkReset";
}

export function verdictEffects(kind: Exclude<DivineVerdict, "none">) {
  if (kind === "blessing") {
    return { sin: -40, loyalty: 15, smashIdols: true, exileFallen: false, clearDark: true, bless: true };
  }
  if (kind === "exile") {
    return { sin: -20, loyalty: 5, smashIdols: true, exileFallen: true, clearDark: false, bless: false };
  }
  return { sin: -10, loyalty: -5, smashIdols: false, exileFallen: false, clearDark: true, bless: false };
}

export function canCallJudgment(input: { jesusDone: boolean; verdict: DivineVerdict; verdictNext: boolean }) {
  if (!input.jesusDone) return { ok: false as const, reason: "The valley is not yet ready to be weighed." };
  if (input.verdict !== "none") return { ok: false as const, reason: "The valley has already been weighed." };
  if (input.verdictNext) return { ok: false as const, reason: "The valley will be weighed at dawn." };
  return { ok: true as const };
}

export function recordSoul(book: JudgmentState, entry: SoulEntry) {
  book.souls = [...book.souls, entry].slice(-BOOK_CAP);
  return entry;
}

export function applySign(book: JudgmentState, sign: SignKind) {
  book.lastSign = book.activeSign;
  book.activeSign = sign;
  book.forceSign = null;
  if (sign !== "none") book.signsSeen += 1;
  return sign;
}

export function quoteBook(souls: SoulEntry[]): { name: string; line: string } | null {
  if (souls.length === 0) return null;
  const last = souls[souls.length - 1];
  const line =
    last.kind === "fallen"
      ? `The Book remembers ${last.name}, who fell.`
      : last.kind === "redeemed"
        ? `The Book remembers ${last.name}, who was brought back.`
        : last.kind === "mercy"
          ? `The Book remembers mercy shown to ${last.name}.`
          : last.kind === "exile"
            ? `The Book remembers ${last.name}, sent out.`
            : `${last.name} is written in the Book.`;
  return { name: last.name, line };
}
