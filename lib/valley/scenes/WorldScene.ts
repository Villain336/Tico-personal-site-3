import Phaser from "phaser";
import type { Bridge } from "../bridge";
import type { AwayReport, BigRecruitId, BuildingType, GameCommand, HudState, SaveData } from "../types";
import {
  ALTAR,
  AUTOSAVE_MS,
  BUILDINGS,
  CROPS,
  CYCLE_SECONDS,
  DAY_SECONDS,
  DUSK_WARN_S,
  GRANARY_BONUS,
  GRANARY_RADIUS_TILES,
  IDOL_REWARD,
  MAP_H,
  MAP_W,
  SIN,
  SKILLS,
  TILE,
  UNLOCK_FX,
  VICTORY_LIT_RATIO,
  XP,
} from "../config";
import type { CropKind } from "../types";
import { line } from "../dialogue";
import { BIG_RECRUITS, SCATTERED_RECRUITS } from "../quests/content";
import { worldTime, writeSave } from "../save";
import { registerTextures } from "../textures";
import { dist } from "../world/actor";
import { Buildings, type Building } from "../world/building";
import { Darkness } from "../world/darkness";
import { Enemies } from "../world/enemy";
import { Fx } from "../world/fx";
import { Jobs } from "../world/jobs";
import { LANDMARKS, Landmarks } from "../world/landmarks";
import { WorldMap } from "../world/map";
import { Player } from "../world/player";
import { Quests } from "../world/quests";
import { RecruitManager } from "../world/recruit";
import { Speech } from "../world/speech";
import { Villagers } from "../world/villager";
import { CameraDirector } from "../world/camera";
import { Sky } from "../world/sky";
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
  jobs!: Jobs;
  recruitManager!: RecruitManager;
  quests!: Quests;
  landmarks!: Landmarks;
  cameraDirector!: CameraDirector;
  sky!: Sky;

  paused = false;
  lightsDirty = true;
  buildMode: BuildingType | null = null;
  private ghost!: Phaser.GameObjects.Sprite;
  private hudAcc = 0;
  private autosaveAcc = 0;
  private wasNight = false;
  private duskWarned = false;
  private offCommand: (() => void) | null = null;
  private awayReport: AwayReport | null;

  constructor(save: SaveData, bridge: Bridge, awayReport: AwayReport | null = null) {
    super("World");
    this.state = save;
    this.bridge = bridge;
    this.playerName = save.character.name || "friend";
    this.awayReport = awayReport;
  }

  create() {
    registerTextures(this, this.state.character);

    this.map = new WorldMap(this);
    this.darkness = new Darkness(this);
    this.darkness.setTerrain(
      (tx, ty) => this.map.isLand(tx, ty),
      (tx, ty) => this.map.isReachable(tx, ty),
    );
    this.speech = new Speech(this);
    this.fx = new Fx(this);
    this.buildings = new Buildings(this);
    this.enemies = new Enemies(this);
    this.villagers = new Villagers(this);
    this.waves = new Waves(this);
    this.jobs = new Jobs(this);
    this.recruitManager = new RecruitManager(this);
    this.quests = new Quests(this);
    this.landmarks = new Landmarks(this);

    this.buildings.loadFrom(this.state.buildings);
    this.villagers.loadFrom(this.state.villagers);
    this.player = new Player(this, this.state.player.x, this.state.player.y);
    if (!this.map.isWalkablePoint(this.player.x, this.player.y - 3, false)) {
      const ac = this.buildings.center(this.buildings.altar);
      this.player.setPosition(ac.x, ac.y + TILE * 2.5);
    }
    this.quests.loadFrom(this.state.quests);
    this.recruitManager.loadFrom(this.state.recruits);
    this.placeArrivedStrangers();

    this.sky = new Sky(this);
    this.cameraDirector = new CameraDirector(this);

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

    // The day ribbon only exists on a qualifying return; dusk always takes
    // the same ribbon regardless of a letter, so a return already past dusk
    // lands straight in the dusk state instead of a stale day list.
    if (this.awayReport) {
      if (this.isNight() || this.state.clock >= DAY_SECONDS - DUSK_WARN_S) {
        this.jobs.enterDusk();
        this.duskWarned = true;
      } else {
        this.jobs.startFromLetter(this.awayReport);
      }
    }
    this.emitHud();

    if (this.state.day === 1 && this.state.clock < 1 && this.state.introSeen) {
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
    if (!night && !this.duskWarned && st.clock >= DAY_SECONDS - DUSK_WARN_S) {
      this.duskWarned = true;
      this.jobs.enterDusk();
    }
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
    this.cameraDirector.update(dt);
    this.sky.update(dt);
    this.darkness.updateLantern(this.player.x, this.player.y - 8);
    this.buildings.update(dt);
    this.villagers.update(dt);
    this.recruitManager.update(dt);
    this.enemies.update(dt);
    this.waves.update(dt);
    this.quests.updateHolyGhost();
    this.landmarks.update(dt);

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
    this.addSin(SIN.dawnDecay * (st.unlocks.blessing ? UNLOCK_FX.blessingDawnDecayMult : 1));
    this.advanceTutorial(6);
    this.duskWarned = false;
    this.jobs.clearForDawn();
    const arrivals = this.arriveStrangers();
    this.cameraDirector.pulseDawn();
    this.bridge.emit({
      type: "dawn",
      report: {
        day: st.day,
        rent: r.rent,
        leveledUp: r.leveled,
        sinDelta: st.sin - sinBefore,
        fallen: r.fallen,
        saved: r.saved,
        arrivals,
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
    const c = this.buildings.center(b);
    if (this.buildings.nearest("granary", c.x, c.y, GRANARY_RADIUS_TILES * TILE)) got.qty += GRANARY_BONUS;
    st[got.kind] += got.qty;
    this.addXp(XP.harvest);
    this.fx.burst(c.x, c.y - 4, "px_gold", 4);
    this.advanceTutorial(3);
    if (who === "player") this.jobs.complete("harvest");
    this.quests.reportProgress("noah", 1);
    if (st.autoSell && this.buildings.count("market") > 0) this.sell(got.kind, true);
    else if (who === "player" && st.tutorialStep <= 3 && this.buildings.count("market") === 0) {
      this.toast(`+${got.qty} ${got.kind}. Eat with F, or build a market to sell.`, "good");
    }
  }

  hasCrops() {
    const st = this.state;
    return st.wheat + st.grapes + st.olives + st.flax > 0;
  }

  sell(what: CropKind | "all", quiet = false) {
    const st = this.state;
    if (this.buildings.count("market") === 0) {
      this.toast("Build a market stall first (B → Market).", "bad");
      return;
    }
    let coins = 0;
    let units = 0;
    const take = (kind: CropKind) => {
      coins += st[kind] * CROPS[kind].price;
      units += st[kind];
      st[kind] = 0;
    };
    if (what === "all") {
      take("wheat");
      take("grapes");
      take("olives");
      take("flax");
    } else {
      take(what);
    }
    if (units === 0) return;
    this.addCoins(coins);
    this.addXp(XP.sale * units);
    this.advanceTutorial(4);
    if (!quiet) this.toast(`Sold ${units} for ${coins} coins.`, "good");
    this.fx.coins(this.player.x, this.player.y - 12, Math.min(6, units));
  }

  // -------------------------------------------------------------- recruits

  /** Big Recruits not yet on the roster, whose arrival day has passed or is today. The Holy Ghost never walks (R9). */
  private pendingStrangers(): BigRecruitId[] {
    return (Object.keys(BIG_RECRUITS) as BigRecruitId[]).filter((id) => {
      const def = BIG_RECRUITS[id];
      if (def.arrivesDay === null || !def.landmark) return false;
      if (this.recruitManager.byId(id)) return false;
      if (this.quests.list.find((q) => q.id === id)?.state === "completed") return false;
      return this.state.day >= def.arrivesDay;
    });
  }

  /** On load: anyone who should already be here stands at their landmark — no replayed walk-in. */
  private placeArrivedStrangers() {
    for (const id of this.pendingStrangers()) {
      this.recruitManager.placeQuestGiver(id, this.landmarks.spot(BIG_RECRUITS[id].landmark!));
    }
  }

  /** At dawn: today's newcomer walks in from the nearest open map edge toward their landmark. */
  private arriveStrangers() {
    const arrivals: { name: string; line: string }[] = [];
    for (const id of this.pendingStrangers()) {
      const def = BIG_RECRUITS[id];
      const to = this.landmarks.spot(def.landmark!);
      const from = this.nearestOpenEdge(to.x, to.y);
      this.recruitManager.startArrival(id, from, to);
      arrivals.push({ name: def.name, line: def.lines.arrival });
      this.toast(`A stranger has come: ${def.name}, ${def.title}. Look for the "!" — press J for where.`, "info");
    }
    return arrivals;
  }

  /** The reachable edge tile closest to a point — where a traveler would enter the valley from. */
  private nearestOpenEdge(x: number, y: number) {
    let best = { x: 8, y: 8 };
    let bd = Infinity;
    const consider = (tx: number, ty: number) => {
      if (!this.map.isReachable(tx, ty)) return;
      const c = WorldMap.center(tx, ty);
      const d = dist(c.x, c.y, x, y);
      if (d < bd) {
        bd = d;
        best = c;
      }
    };
    for (let tx = 0; tx < MAP_W; tx++) {
      consider(tx, 0);
      consider(tx, MAP_H - 1);
    }
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      consider(0, ty);
      consider(MAP_W - 1, ty);
    }
    return best;
  }

  /** E near a quest-giver: offer, progress nudge, or turn-in, whichever the questline's state calls for (R2, R3). */
  interactWithQuestGiver(): boolean {
    const p = this.player;
    const giver = this.recruitManager.list.find((r) => r.state === "questgiver" && dist(r.x, r.y, p.x, p.y) < 26);
    if (!giver) return false;
    const id = giver.id as BigRecruitId;
    const def = BIG_RECRUITS[id];
    const q = this.quests.list.find((x) => x.id === id);
    if (!q) return false;
    if (q.state === "available") {
      this.quests.accept(id);
      this.speech.say(giver.sprite, def.lines.offer, "good", 0);
      this.toast(`Quest accepted: ${def.name}.`, "good");
    } else if (q.state === "active") {
      this.speech.say(giver.sprite, def.lines.progress, "neutral", 3500);
    } else if (q.state === "ready") {
      this.quests.turnIn(id);
      this.speech.say(giver.sprite, def.lines.turnIn, "good", 0);
    }
    this.cameraDirector.frameNpc(giver.x, giver.y);
    return true;
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
      if (def.requiresQuest && !this.quests.completedIds().includes(def.requiresQuest)) {
        this.toast(`${def.name} is ${BIG_RECRUITS[def.requiresQuest].name}'s to teach — finish their quest first.`, "bad");
        type = null;
      } else if (this.buildings.altarLevel < def.altarLevel) {
        this.toast(`${def.name} unlocks at altar level ${def.altarLevel}.`, "bad");
        type = null;
      }
    }
    this.buildMode = type;
    if (type) {
      const ghostKey =
        type === "farm" || type === "vineyard" || type === "flax" || type === "grove" ? `${type}_0` : type;
      this.ghost.setTexture(ghostKey);
    }
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
      this.toast(def.onWater ? "A bridge needs open water under it." : "Can't build there.", "bad");
      return;
    }
    this.addCoins(-def.cost);
    const b = this.buildings.place(type, tx, ty);
    const c = this.buildings.center(b);
    this.fx.burst(c.x, c.y - 6, "px_lime", 6);
    if (type === "farm") this.advanceTutorial(2);
    if (type === "market") this.advanceTutorial(4);
    if (type === "house") this.advanceTutorial(5);
    // walls, farms, lamps and bridges are placed in runs; everything else exits build mode
    if (type !== "wall" && type !== "farm" && type !== "flax" && type !== "lamp" && type !== "bridge") this.setBuildMode(null);
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
      case "introSeen":
        if (!st.introSeen) {
          st.introSeen = true;
          this.toast(`Welcome to Shalom Valley, ${this.playerName}. Walk to the altar and hold E to pray.`, "info");
          this.saveNow();
        }
        break;
      case "acceptQuest":
        this.quests.accept(c.id);
        break;
      case "turnInQuest":
        this.quests.turnIn(c.id);
        break;
      case "setDeployment":
        this.recruitManager.setMode(c.id, c.mode, c.mode === "station" ? { x: this.player.x, y: this.player.y } : undefined);
        break;
      case "recruitScattered": {
        const def = SCATTERED_RECRUITS[c.id];
        if (!def) break;
        if (this.recruitManager.byId(c.id)) break;
        if (st.level < def.unlockLevel) {
          this.toast(`${def.name} isn't available until level ${def.unlockLevel}.`, "bad");
          break;
        }
        if (st.coins < def.cost) {
          this.toast(`${def.name} costs ${def.cost} coins.`, "bad");
          break;
        }
        this.addCoins(-def.cost);
        this.recruitManager.add(c.id, false, this.player.x + 16, this.player.y);
        this.toast(`${def.name} joins the roster.`, "good");
        break;
      }
    }
    this.emitHud();
  }

  // ------------------------------------------------------------- persist

  snapshot(): SaveData {
    const st = this.state;
    st.buildings = this.buildings.serialize();
    st.villagers = this.villagers.serialize();
    st.recruits = this.recruitManager.serialize();
    st.quests = this.quests.serialize();
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
      olives: st.olives,
      flax: st.flax,
      sin: Math.round(st.sin),
      health: Math.round(st.health),
      maxHealth: p.stats.maxHealth,
      hunger: Math.round(st.hunger),
      thirst: Math.round(st.thirst),
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
      nearDrink: p.nearDrink,
      paused: this.paused,
      won: st.won,
      tutorialStep: st.tutorialStep,
      jobs: this.jobs.list,
      ribbonMode: this.jobs.mode,
      recruits: this.recruitManager.list
        .filter((r) => !r.preRecruit)
        .map((r) => ({
          id: r.id,
          name: r.big ? BIG_RECRUITS[r.id as BigRecruitId].name : SCATTERED_RECRUITS[r.id as keyof typeof SCATTERED_RECRUITS].name,
          big: r.big,
          mode: r.mode,
          role: r.role,
        })),
      quests: this.quests.toHud(),
      scatteredOffers: (Object.keys(SCATTERED_RECRUITS) as (keyof typeof SCATTERED_RECRUITS)[]).map((id) => {
        const def = SCATTERED_RECRUITS[id];
        return {
          id,
          name: def.name,
          unlockLevel: def.unlockLevel,
          cost: def.cost,
          role: def.role,
          unlocked: st.level >= def.unlockLevel,
          recruited: !!this.recruitManager.byId(id),
        };
      }),
      discovered: this.landmarks.discoveredCount,
      landmarks: this.landmarks.total,
      completedQuests: this.quests.completedIds(),
      atLandmark: (() => {
        const id = this.landmarks.at(p.x, p.y);
        return id ? LANDMARKS[id].name : null;
      })(),
    };
    this.bridge.emit({ type: "hud", state: hud });
  }
}
