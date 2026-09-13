import type { JobId } from "./types";

/**
 * Every line a character can say, keyed by speaker × mood. Lines use `{name}`
 * for the player's name. Keep them short — bubbles are 16px-tall pixel land.
 */

export const LINES = {
  villager: {
    greet: [
      "Shalom, {name}!",
      "Peace be with you.",
      "Good to see you, {name}.",
      "The Lord keep you.",
      "Blessed morning!",
      "Well met, neighbor.",
    ],
    happy: [
      "What a harvest!",
      "The valley grows!",
      "My children sleep safe.",
      "Look at the light!",
      "Praise Him!",
      "Our cup runs over.",
    ],
    distress: [
      "Help! They're here!",
      "Robbers! Robbers!",
      "Protect us, {name}!",
      "I can't fight them!",
      "Something's in the dark...",
      "Please, hurry!",
    ],
    anger: [
      "Get away from my home!",
      "You'll take nothing here!",
      "Not my grain, thief!",
      "Begone, snake!",
      "We are not afraid of you!",
    ],
    thanks: [
      "You saved me!",
      "Bless you, {name}.",
      "I owe you my life.",
      "I was lost... thank you.",
      "The light found me.",
    ],
    grief: [
      "No... not them.",
      "We lost one of ours.",
      "Why didn't we see it?",
      "Pray for them.",
      "The dark took them.",
    ],
    pray: [
      "Hear us, O Lord.",
      "Guard this valley.",
      "Give us strength.",
      "Deliver us from evil.",
      "Make our light shine.",
    ],
    fallen: [
      "Leave me be...",
      "It's easier in the dark.",
      "Why should I stay?",
      "Nobody came for me.",
    ],
    hypno: [
      "His words... so sweet.",
      "Maybe he's right...",
      "I can't look away.",
      "What was I saying?",
    ],
    levelUp: [
      "I feel stronger!",
      "My faith grows.",
      "I can help defend now!",
      "Give me a staff!",
    ],
    fight: [
      "Back, thief!",
      "For the valley!",
      "You shall not pass!",
      "Taste the staff!",
    ],
  },
  robber: {
    taunt: [
      "Your coins or your teeth!",
      "Nice village. Mine now.",
      "Hand it over, shepherd.",
      "Nobody's watching...",
      "Easy pickings.",
    ],
    steal: ["Ha! Thanks for the coins!", "Too slow!", "Mine!", "Jingle jingle!"],
    hit: ["Argh!", "That hurt!", "You'll pay!", "Ow, my ribs!"],
    flee: ["Retreat! Retreat!", "This isn't worth it!", "I'll be back!", "Mercy!"],
  },
  tempter: {
    lure: [
      "Come, it's fun out here.",
      "Nobody will know.",
      "Just one step...",
      "Why pray when you can play?",
      "The valley is so boring.",
      "Follow me, quickly!",
    ],
    flee: ["Can't catch me!", "Too slow, {name}!", "Whee!"],
    hit: ["Eek!", "Rude!", "You hit hard!"],
  },
  deceiver: {
    deceive: [
      "The altar is a lie.",
      "I know a better way.",
      "Your leader is using you.",
      "Trust me, not them.",
      "Look into my eyes.",
      "Everyone is leaving. Come.",
    ],
    converted: ["I see clearly now.", "Join us.", "There is no light.", "We were fools."],
    revealed: ["You... you can see me?", "Curse this light!", "Get that light away!"],
    hit: ["Liar! Brute!", "You don't understand!", "Fool!"],
  },
  spirit: {
    whisper: ["...give up...", "...alone...", "...nobody hears...", "...cold...", "...sleep..."],
    immune: ["...steel cannot touch me...", "...swing again, little one...", "...heh..."],
    banished: ["NOOO—", "...the light...", "...burns..."],
  },
  goliath: {
    arrive: ["A champion of Gath stands in the valley.", "Send me a man, that we may fight.", "Your light is a child's lamp."],
    taunt: ["Am I a dog?", "Come closer, shepherd.", "Your village will kneel.", "Where is your giant?"],
    windup: ["I will strike you down!", "The earth will shake!"],
    slam: ["Fall!", "Dust!"],
    hit: ["Hnh.", "That sting...", "Again!"],
  },
  raidLeader: {
    arrive: ["The city sent me.", "Banners up. Burn their light.", "A valley of shepherds. Easy."],
    taunt: ["The idol city remembers you.", "Your walls are sticks.", "Muster. It will not save you."],
    hit: ["Hold the line!", "The banner still stands!", "Again!"],
    flee: ["Back to the hills!", "The city will send more!"],
  },
  baal: {
    arrive: ["Kneel to Baal.", "Your altar is a cold stone.", "I am the storm they wanted."],
    taunt: ["Bow.", "Gold answers.", "Your light is a lie."],
    plant: ["A calf for the valley.", "Worship here."],
    pulse: ["Burn.", "Mine."],
    hit: ["Heretic!", "You dare?"],
  },
  moloch: {
    arrive: ["Feed the fire.", "The furnace is hungry.", "A child of flame walks."],
    taunt: ["Step closer.", "Ash is mercy.", "Your flesh is fuel."],
    windup: ["The grate opens!", "Heat!"],
    slam: ["Cinders!", "Burn!"],
    hit: ["Hnh.", "The iron holds."],
  },
  dragon: {
    arrive: ["The outer dark sent a beast — not a god.", "Wings over the ridge.", "I am hunger with scales."],
    taunt: ["Little lamp.", "Your valley is a nest.", "Run, shepherd."],
    dash: ["I come.", "Down."],
    windup: ["Breath."],
    breath: ["Fire.", "Ash."],
    hit: ["A scratch.", "Again, then."],
  },
  prophet: {
    preach: [
      "Bow to the golden calf!",
      "Your altar has failed you!",
      "Gold answers prayers, not fire!",
      "Hate your neighbor, love your idol!",
      "Give your grain to me!",
      "The valley belongs to the calf!",
    ],
    plant: ["Behold, a new god!", "Kneel to this!", "Worship here now!"],
    anger: ["Heretic!", "You dare strike a prophet?", "You'll regret that!", "Blasphemer!"],
    idolSmashed: ["My idol! NO!", "You'll burn for this!", "Vandal!"],
  },
  jesus: {
    greet: ["Peace to this valley.", "The Book is open.", "I am not here to fight."],
    offer: ["Show mercy.", "Stand through the signs.", "Dawn will weigh what you built."],
  },
  player: {
    levelUp: ["I feel stronger.", "Strength renewed.", "Skill point earned!"],
    hungry: ["I need to eat...", "So hungry.", "Press F to eat."],
    idolSmashed: ["Down goes the idol!", "No more false gods.", "Melt it down."],
    cast: ["Be gone!", "In His name, out!", "Light, not darkness!"],
    hurt: ["Ugh!", "That stings!", "Stand firm."],
    pray: ["Give me strength.", "Guard this valley.", "Let the light spread."],
    noFood: ["Nothing to eat.", "I need wheat or grapes."],
    noCoins: ["Not enough coins.", "I can't afford that."],
    noPrayer: ["I need to pray first.", "My spirit is dry."],
  },
} as const;

export type Speaker = keyof typeof LINES;
export type Mood<S extends Speaker> = keyof (typeof LINES)[S];

export function line<S extends Speaker>(speaker: S, mood: Mood<S>, name = "friend"): string {
  const list = (LINES[speaker] as Record<string, readonly string[]>)[mood as string] ?? [];
  if (list.length === 0) return "";
  const pick = list[Math.floor(Math.random() * list.length)];
  return pick.replace("{name}", name);
}

/** Persistent first names for the Book. Visit letters used to invent these; the Book now keeps them. */
const SOUL_NAMES = [
  "Miriam", "Boaz", "Talitha", "Ezra", "Naomi", "Asa",
  "Rivka", "Caleb", "Tabitha", "Josiah", "Leah", "Amos",
  "Zilpah", "Reuben", "Hana", "Simeon",
  "Tamar", "Judah", "Dinah", "Issachar", "Orpah", "Elimelech",
  "Shiphrah", "Puah", "Bezalel", "Oholiab", "Abigail", "Nabal",
];

export function pickVisitName(seed: number): string {
  return SOUL_NAMES[Math.abs(seed) % SOUL_NAMES.length];
}

export function pickSoulName(seed: number, taken: string[]): string {
  const start = Math.abs(seed) % SOUL_NAMES.length;
  for (let i = 0; i < SOUL_NAMES.length; i++) {
    const n = SOUL_NAMES[(start + i) % SOUL_NAMES.length];
    if (!taken.includes(n)) return n;
  }
  return `${SOUL_NAMES[start]} ${taken.length + 1}`;
}

export function nameOfSoul(who: { name?: string; seed: number }): string {
  return who.name || pickVisitName(who.seed);
}

/** Dawn-letter copy: a story beat plus a voice line, layered onto the away numbers. */
export const LETTER = {
  storyCrops: [
    "The wheat came in golden while you were gone.",
    "Grapevines grew heavy on the far row.",
    "The fields kept growing without you.",
  ],
  storyNamed: [
    "{name} kept watch at the well the whole time.",
    "{name} prayed at the altar every dawn you missed.",
    "{name} watched the road, waiting for you.",
  ],
  storyQuiet: [
    "The valley stayed quiet and safe.",
    "No shadow crossed the light while you were away.",
    "The altar's glow held steady through the dark hours.",
  ],
  voiceNamed: [
    "Shalom — {name} sends thanks for the wheat.",
    '"We kept the light lit," {name} says.',
    "{name} says the valley missed you.",
  ],
  voiceValley: [
    "Shalom. The valley kept watch.",
    "The altar's light never dimmed.",
    "Peace held here while you were gone.",
  ],
  storyBook: [
    "The Book kept {name} while you were gone.",
    "{name} is still written in the Book.",
    "The letter quotes the Book: {name} kept the watch.",
  ],
  voiceBook: [
    '"We are written," {name} says.',
    "The Book sends word: {name} is still here.",
    "{name} says the Book did not forget you.",
  ],
} as const;

export function letterLine(list: readonly string[], name?: string): string {
  const pick = list[Math.floor(Math.random() * list.length)];
  return name ? pick.replace("{name}", name) : pick;
}

/** Fills a day ribbon out to 2-3 jobs when the letter's own beats aren't enough. */
export const FALLBACK_JOBS: { id: JobId; label: string }[] = [
  { id: "pray", label: "Pray at the altar" },
  { id: "darkEdge", label: "Walk the dark edge" },
  { id: "altar", label: "Stand at the altar" },
];

/** What the ribbon shows once it flips to dusk. */
export const DUSK_JOBS: { id: JobId; label: string }[] = [
  { id: "duskWall", label: "Hold the wall" },
  { id: "duskProtect", label: "Protect the weakest villager" },
  { id: "duskLight", label: "Keep the light burning" },
];
