import type { CivicState, LawIntent, WrittenLaw } from "../types";

const RULES: { intent: LawIntent; words: string[] }[] = [
  { intent: "curfew", words: ["curfew", "stay home", "stay indoors", "after dusk", "after dark", "indoors at night", "no wandering at night"] },
  { intent: "openGates", words: ["open gate", "open the gate", "welcome stranger", "welcome the stranger", "let travelers in"] },
  { intent: "sanctuary", words: ["sanctuary", "refuge", "asylum", "holy ground", "sacred ground"] },
  { intent: "conscription", words: ["conscript", "militia", "must fight", "take up arms", "every man fight"] },
  { intent: "noIdols", words: ["no idol", "no idols", "no graven", "no image", "no baal", "no asherah", "smash idol"] },
  { intent: "protectWeak", words: ["protect the weak", "protect the fallen", "defend the weak", "no one left behind", "keep the weak"] },
  { intent: "keepSabbath", words: ["sabbath", "no sell at night", "no selling at night", "no night sale", "rest at night", "keep the night", "no trade after dark"] },
  { intent: "openHand", words: ["share the bread", "share bread", "open hand", "feed the hungry", "do not hoard", "don't hoard", "no hoarding"] },
  { intent: "noHunt", words: ["no hunt", "do not hunt", "don't hunt", "no hunting", "spare the wild", "let the wild live"] },
  { intent: "kindToBeasts", words: ["kind to beast", "kind to the flock", "tend the flock", "no harm sheep", "spare the flock", "shepherd the"] },
  { intent: "stayLit", words: ["stay in the light", "do not wander dark", "don't wander the dark", "keep to the light", "stay near the light"] },
  { intent: "tithe", words: ["tithe", "a tenth", "tenth to the altar", "give to the altar"] },
];

export const INTENT_COPY: Record<LawIntent, string> = {
  curfew: "Stay home after dusk",
  openGates: "Open the gates",
  sanctuary: "Sanctuary",
  conscription: "Conscription",
  noIdols: "No idols",
  protectWeak: "Protect the weak",
  keepSabbath: "No trade after dark",
  openHand: "Share the bread",
  noHunt: "Do not hunt",
  kindToBeasts: "Be kind to the flock",
  stayLit: "Stay in the light",
  tithe: "Give a tithe",
};

export function compileLaw(text: string): { intents: LawIntent[]; understood: boolean } {
  const raw = text.trim().replace(/\s+/g, " ");
  if (!raw) return { intents: [], understood: false };
  const hay = raw.toLowerCase();
  const intents: LawIntent[] = [];
  for (const rule of RULES) {
    if (rule.words.some((w) => hay.includes(w))) intents.push(rule.intent);
  }
  return { intents, understood: intents.length > 0 };
}

export function makeLaw(text: string, id: string): WrittenLaw {
  const { intents } = compileLaw(text);
  return { id, text: text.trim().replace(/\s+/g, " ").slice(0, 140), intents };
}

export function hasIntent(civic: CivicState | undefined, intent: LawIntent): boolean {
  if (!civic) return false;
  if (intent === "curfew" || intent === "openGates" || intent === "sanctuary" || intent === "conscription") {
    if (civic.edicts[intent]) return true;
  }
  if (intent === "noIdols" || intent === "protectWeak" || intent === "keepSabbath" || intent === "openHand") {
    if (civic.statutes[intent]) return true;
  }
  return (civic.laws ?? []).some((l) => l.intents.includes(intent));
}

export function lawLines(civic: CivicState | undefined): string[] {
  return (civic?.laws ?? []).map((l) => l.text).filter(Boolean);
}
