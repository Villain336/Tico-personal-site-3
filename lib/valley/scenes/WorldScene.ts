import Phaser from "phaser";
import type { Bridge } from "../bridge";
import type { BuildingType, GameCommand, HudState, SaveData } from "../types";
import {
  ALTAR,
  AUTOSAVE_MS,
  BUILDINGS,
  CROPS,
  CYCLE_SECONDS,
  DAY_SECONDS,
  IDOL_REWARD,
  SIN,
  SKILLS,
  TILE,
  VICTORY_LIT_RATIO,
  WORLD_H,
  WORLD_W,
  XP,
  ZOOM,
} from "../config";
import { line } from "../dialogue";
import { worldTime, writeSave } from "../save";
import { registerTextures } from "../textures";
import { Buildings, type Building } from "../world/building";
import { Darkness } from "../world/darkness";
import { Enemies } from "../world/enemy";
import { Fx } from "../world/fx";
import { WorldMap } from "../world/map";
import { Player } from "../world/player";
import { Speech } from "../world/speech";
import { Villagers } from "../world/villager";
import { Waves } from "../world/waves";

export class WorldScene extends Phaser.Scene {
  state: SaveData;
  bridge: Bridge;
  playerName: string;

  map!: WorldMap;
  darkness!: Darkness;
  speech!: Speech;
  fx!: Fx;
  buildings!: Buildings;
  villagers!: Villagers;
  enemies!: Enemies;
  waves!: Waves;
  player!: Player;

  paused = false;
  lightsDirty = true;
  buildMode: BuildingType | null = null;
  private ghost!: Phaser.GameObjects.Sprite;
  private hudAcc = 0;
  private autosaveAcc = 0;
  private wasNight = false;
  private offCommand: (() => void) | null = null;

  constructor(save: SaveData, bridge: Bridge) {
    super("World");
    this.state = save;
    this.bridge = bridge;
    this.playerName = save.character.name || "friend";
  }

  create() {
    registerTextures(this, this.state.character);

    this.map = new WorldMap(this);
    this.darkness = new Darkness(this);
    this.speech = new Speech(this);
    this.fx = new Fx(this);
    this.buildings = new Buildings(this);
    this.enemies = new Enemies(this);
    this.villagers = new Villagers(this);
    this.waves = new Waves(this);

    this.buildings.loadFrom(this.state.buildings);
    this.villagers.loadFrom(this.state.villagers);
    this.player = new Player(this, this.state.player.x, this.state.player.y);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setZoom(ZOOM);
    cam.setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setBackgroundColor("#07060d");

    this.ghost = this.add.sprite(0, 0, "farm_0").setOrigin(0, 1).setAlpha(0).setDepth(1600);

    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    this.offCommand = this.bridge.onCommand((c) => this.handleCommand(c));
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.saveNow, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.offCommand?.();
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.saveNow, this);
    });

    this.wasNight = this.isNight();
    if (this.wasNight) this.waves.startNight();
    this.emitHud();

    if (this.state.day === 1 && this.state.clock < 1) {
      this.toast(`Welcome to Shalom Valley, ${this.playerName}. Walk to the altar and hold E to pray.`, "info");
    }
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.speech.update(dt);
    this.updateGhost();

    if (this.paused) {
      this.hudAcc += dt;
      if (this.hudAcc > 0.5) {
        this.hudAcc = 0;
        this.emitHud();
      }
      return;
    }

    const st = this.state;
    st.clock += dt;
    if (st.clock >= CYCLE_SECONDS) this.dawn();

    const night = this.isNight();
    if (night && !this.wasNight) this.waves.startNight();
    this.wasNight = night;
    this.darkness.setNight(this.nightAmount());

    if (this.lightsDirty) {
      this.lightsDirty = false;
      this.darkness.recompute(this.buildings.lightSources());
      if (!st.won && this.darkness.litRatio >= VICTORY_LIT_RATIO) {
        st.won = true;
        this.bridge.emit({ type: "victory" });
        this.saveNow();
      }
    }

    this.player.update(dt);
    this.buildings.update(dt);
    this.villagers.update(dt);
    this.enemies.update(dt);
    this.waves.update(dt);

    this.hudAcc += dt;
    if (this.hudAcc >= 0.1) {
      this.hudAcc = 0;
      this.emitHud();
    }
    this.autosaveAcc += dt * 1000;
    if (this.autosaveAcc >= AUTOSAVE_MS) {
      this.autosaveAcc = 0;
      this.saveNow();
    }
  }

  // ---------------------------------------------------------------- time

  isNight() {
    return this.state.clock >= DAY_SECONDS;
  }

  worldTime() {
    return worldTime(this.state);
  }

  private nightAmount() {
    const c = this.state.clock;
    if (c >= DAY_SECONDS) {
      const into = c - DAY_SECONDS;
      const left = CYCLE_SECONDS - c;
      return Math.min(1, into / 12, left / 8);
    }
    const dusk = DAY_SECONDS - 25;
    return c > dusk ? ((c - dusk) / 25) * 0.45 : 0;
  }

  private dawn() {
    const st = this.state;
    st.clock -= CYCLE_SECONDS;
    st.day++;
    this.enemies.clearAll();
    this.waves.endNight();
    const r = this.villagers.onDawn();
    this.addCoins(r.rent);
    const sinBefore = st.sin;
    this.addSin(SIN.dawnDecay);
    if (st.tutorialStep === 5) this.advanceTutorial(6);
    this.bridge.emit({
      type: "dawn",
      report: {
        day: st.day,
        rent: r.rent,
        leveledUp: r.leveled,
        sinDelta: st.sin - sinBefore,
        fallen: r.fallen,
        saved: r.saved,
      },
    });
    this.saveNow();
  }

  // ------------------------------------------------------------- economy

  tileAt(x: number, y: number) {
    return WorldMap.tileOf(x, y);
  }

  toast(text: string, tone: "info" | "good" | "bad" = "info") {
    this.bridge.emit({ type: "toast", text, tone });
  }

  addCoins(n: number) {
    this.state.coins = Math.max(0, Math.round((this.state.coins + n) * 100) / 100);
  }

  addSin(n: number) {
    this.state.sin = Math.max(0, Math.min(100, this.state.sin + n));
  }

  addXp(n: number) {
    const st = this.state;
    st.xp += n;
    let need = XP.toNext(st.level);
    while (st.xp >= need) {
      st.xp -= need;
      st.level++;
      st.skillPoints++;
      st.health = Math.min(this.player.stats.maxHealth, st.health + this.player.stats.maxHealth * 0.2);
      this.toast(`Level ${st.level}! +1 skill point (press K).`, "good");
      this.speech.say(this.player.sprite, line("player", "levelUp"), "good", 0);
      this.fx.ring(this.player.x, this.player.y - 10, 30, 0xe0b53a);
      need = XP.toNext(st.level);
    }
  }

  advanceTutorial(step: number) {
    if (this.state.tutorialStep < step) this.state.tutorialStep = step;
  }

  harvest(b: Building, who: "player" | "villager") {
    const got = this.buildings.harvest(b);
    if (!got) return;
    const st = this.state;
    st[got.kind] += got.qty;
    this.addXp(XP.harvest);
    const c = this.buildings.center(b);
    this.fx.burst(c.x, c.y - 4, "px_gold", 4);
    if (st.tutorialStep === 2) this.advanceTutorial(3);
    if (st.autoSell && this.buildings.count("market") > 0) this.sell(got.kind, true);
    else if (who === "player" && st.tutorialStep <= 3 && this.buildings.count("market") === 0) {
      this.toast(`+${got.qty} ${got.kind}. Eat with F, or build a market to sell.`, "good");
    }
  }

  sell(what: "wheat" | "grapes" | "all", quiet = false) {
    const st = this.state;
    if (this.buildings.count("market") === 0) {
      this.toast("Build a market stall first (B → Market).", "bad");
      return;
    }
    let coins = 0;
    let units = 0;
    if (what === "wheat" || what === "all") {
      coins += st.wheat * CROPS.wheat.price;
      units += st.wheat;
      st.wheat = 0;
    }
    if (what === "grapes" || what === "all") {
      coins += st.grapes * CROPS.grapes.price;
      units += st.grapes;
      st.grapes = 0;
    }
    if (units === 0) return;
    this.addCoins(coins);
    this.addXp(XP.sale * units);
    if (st.tutorialStep === 3) this.advanceTutorial(4);
    if (!quiet) this.toast(`Sold ${units} for ${coins} coins.`, "good");
    this.fx.coins(this.player.x, this.player.y - 12, Math.min(6, units));
  }

  smashIdol(b: Building) {
    const c = this.buildings.center(b);
    this.fx.burst(c.x, c.y - 8, "px_gold", 3);
    if (!this.buildings.hitIdol(b)) return;
    this.addCoins(IDOL_REWARD);
    this.addSin(SIN.idolSmashed);
    this.addXp(XP.idol);
    this.state.stats.idolsSmashed++;
    this.speech.say(this.player.sprite, line("player", "idolSmashed"), "good", 0);
    for (const e of this.enemies.list) {
      if (e.kind === "prophet") this.speech.say(e.sprite, line("prophet", "idolSmashed"), "dark", 0);
    }
    this.fx.coins(c.x, c.y - 10, 6);
    this.toast(`Idol smashed! +${IDOL_REWARD} coins, sin ${SIN.idolSmashed}.`, "good");
  }

  // ------------------------------------------------------------ building

  private setBuildMode(type: BuildingType | null) {
    if (type && type !== "altar" && type !== "idol") {
      const def = BUILDINGS[type];
      if (this.buildings.altarLevel < def.altarLevel) {
        this.toast(`${def.name} unlocks at altar level ${def.altarLevel}.`, "bad");
        type = null;
      }
    }
    this.buildMode = type;
    if (type) this.ghost.setTexture(type === "house" ? "house" : type === "farm" ? "farm_0" : type === "vineyard" ? "vineyard_0" : type);
    this.ghost.setAlpha(type ? 0.6 : 0);
    this.emitHud();
  }

  private updateGhost() {
    if (!this.buildMode) return;
    const p = this.input.activePointer;
    const { tx, ty } = WorldMap.tileOf(p.worldX, p.worldY);
    const size = this.buildings.sizeOf(this.buildMode);
    this.ghost.setPosition(tx * TILE, (ty + size) * TILE);
    const def = BUILDINGS[this.buildMode as keyof typeof BUILDINGS];
    const ok = this.buildings.canPlace(this.buildMode, tx, ty) && this.state.coins >= (def?.cost ?? 0);
    this.ghost.setTint(ok ? 0xd7ff3e : 0xff5b4a);
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (this.paused) return;
    if (this.buildMode) {
      if (p.rightButtonDown()) {
        this.setBuildMode(null);
        return;
      }
      const { tx, ty } = WorldMap.tileOf(p.worldX, p.worldY);
      this.tryPlace(this.buildMode, tx, ty);
      return;
    }
    const dx = p.worldX - this.player.x;
    const dy = p.worldY - (this.player.y - 10);
    this.player.swing(dx, dy);
  }

  private tryPlace(type: BuildingType, tx: number, ty: number) {
    if (type === "altar" || type === "idol") return;
    const def = BUILDINGS[type];
    const st = this.state;
    if (st.coins < def.cost) {
      this.speech.say(this.player.sprite, line("player", "noCoins"), "bad", 1500);
      return;
    }
    if (!this.buildings.canPlace(type, tx, ty)) {
      this.toast("Can't build there.", "bad");
      return;
    }
    this.addCoins(-def.cost);
    const b = this.buildings.place(type, tx, ty);
    const c = this.buildings.center(b);
    this.fx.burst(c.x, c.y - 6, "px_lime", 6);
    if (type === "farm" && st.tutorialStep === 1) this.advanceTutorial(2);
    if (type === "house" && st.tutorialStep === 4) this.advanceTutorial(5);
    // walls and farms are placed in runs; everything else exits build mode
    if (type !== "wall" && type !== "farm" && type !== "lamp") this.setBuildMode(null);
    else if (st.coins < def.cost) this.setBuildMode(null);
  }

  // ------------------------------------------------------------ commands

  private handleCommand(c: GameCommand) {
    const st = this.state;
    switch (c.type) {
      case "setBuildMode":
        this.setBuildMode(c.building);
        break;
      case "upgradeAltar": {
        const lvl = this.buildings.altarLevel;
        if (lvl >= ALTAR.maxLevel) break;
        if (this.buildings.upgradeAltar()) {
          const c2 = this.buildings.center(this.buildings.altar);
          this.fx.ring(c2.x, c2.y, 60, 0xe0b53a);
          this.toast(`Altar raised to level ${this.buildings.altarLevel}. Light spreads, villagers grow faster.`, "good");
        } else {
          this.toast(`Altar upgrade costs ${ALTAR.upgradeCost[lvl]} coins.`, "bad");
        }
        break;
      }
      case "spendSkill": {
        const cur = st.skills[c.skill];
        if (st.skillPoints <= 0 || cur >= SKILLS[c.skill].max) break;
        st.skillPoints--;
        st.skills[c.skill] = cur + 1;
        this.toast(`${SKILLS[c.skill].name} rank ${cur + 1}.`, "good");
        break;
      }
      case "sell":
        this.sell(c.what);
        break;
      case "toggleAutoSell":
        st.autoSell = !st.autoSell;
        this.toast(st.autoSell ? "Auto-sell on: harvests go straight to market." : "Auto-sell off.", "info");
        break;
      case "pause":
        this.paused = true;
        this.player.praying = false;
        this.saveNow();
        break;
      case "resume":
        this.paused = false;
        break;
      case "save":
        this.saveNow();
        this.toast("Saved.", "info");
        break;
      case "advanceTutorial":
        this.advanceTutorial(st.tutorialStep + 1);
        break;
    }
    this.emitHud();
  }

  // ------------------------------------------------------------- persist

  snapshot(): SaveData {
    const st = this.state;
    st.buildings = this.buildings.serialize();
    st.villagers = this.villagers.serialize();
    st.player = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    return st;
  }

  saveNow() {
    writeSave(this.snapshot());
  }

  private emitHud() {
    const st = this.state;
    const p = this.player;
    const hud: HudState = {
      day: st.day,
      isNight: this.isNight(),
      phaseProgress: this.isNight() ? (st.clock - DAY_SECONDS) / (CYCLE_SECONDS - DAY_SECONDS) : st.clock / DAY_SECONDS,
      coins: Math.floor(st.coins),
      wheat: st.wheat,
      grapes: st.grapes,
      sin: Math.round(st.sin),
      health: Math.round(st.health),
      maxHealth: p.stats.maxHealth,
      hunger: Math.round(st.hunger),
      prayer: Math.round(st.prayer),
      maxPrayer: p.stats.maxPrayer,
      level: st.level,
      xp: Math.floor(st.xp),
      xpToNext: XP.toNext(st.level),
      skillPoints: st.skillPoints,
      skills: { ...st.skills },
      population: this.villagers.population,
      capacity: this.buildings.capacity(),
      altarLevel: this.buildings.altarLevel,
      darknessPushed: this.darkness.litRatio,
      autoSell: st.autoSell,
      buildMode: this.buildMode,
      enemiesAlive: this.enemies.count(),
      nearAltar: p.nearAltar,
      nearMarket: p.nearMarket,
      paused: this.paused,
      won: st.won,
      tutorialStep: st.tutorialStep,
    };
    this.bridge.emit({ type: "hud", state: hud });
  }
}
