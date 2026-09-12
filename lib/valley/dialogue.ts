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
