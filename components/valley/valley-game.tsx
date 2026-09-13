"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AwayReport, BuildingType, DawnReport, GameEvent, HudState, SaveData } from "@/lib/valley/types";
import { BUILDINGS, VIEW_H, VIEW_W } from "@/lib/valley/config";
import { createBridge } from "@/lib/valley/bridge";
import { Hud, type Toast } from "./hud";
import { BuildMenu } from "./build-menu";
import { SkillsPanel } from "./skills-panel";
import { DawnSummary } from "./dawn-summary";
import { PauseMenu } from "./pause-menu";
import { Modal, ModalButton } from "./modal";
import { Ribbon } from "./ribbon";
import { RosterPanel } from "./roster-panel";
import { QuestJournal } from "./quest-journal";
import { BooksPanel } from "./books-panel";
import { CivicPanel } from "./civic-panel";
import { Prologue } from "./prologue";

declare global {
  interface Window {
    __valley?: import("phaser").Game;
  }
}

type Panel = "intro" | "build" | "skills" | "roster" | "journal" | "books" | "civic" | "pause" | "away" | "victory" | null;
const PAUSING: Panel[] = ["intro", "skills", "roster", "journal", "books", "civic", "pause", "away", "victory"];

const HOTKEYS: Record<string, BuildingType> = Object.fromEntries(
  (Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]).map((k) => [BUILDINGS[k].hotkey, k]),
);

export function ValleyGame({
  save,
  away,
  onNewGame,
}: {
  save: SaveData;
  away: AwayReport | null;
  onNewGame: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const bridge = useMemo(() => createBridge(), []);
  const [hud, setHud] = useState<HudState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dawn, setDawn] = useState<DawnReport | null>(null);
  const [panel, setPanel] = useState<Panel>(!save.introSeen ? "intro" : away ? "away" : null);
  const [ready, setReady] = useState(false);
  const toastId = useRef(0);

  // Mount Phaser once. Everything game-side is dynamically imported so the
  // engine never touches the server bundle or other pages.
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    let destroyed = false;
    let game: import("phaser").Game | null = null;
    (async () => {
      const Phaser = (await import("phaser")).default;
      const { WorldScene } = await import("@/lib/valley/scenes/WorldScene");
      if (destroyed) return;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: el,
        width: VIEW_W,
        height: VIEW_H,
        pixelArt: true,
        backgroundColor: "#07060d",
        disableContextMenu: true,
        scene: [new WorldScene(save, bridge, away)],
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        audio: { noAudio: true },
      });
      // `?dev` exposes the engine for playtesting/balancing from the console.
      if (window.location.search.includes("dev")) window.__valley = game;
      setReady(true);
    })();
    return () => {
      destroyed = true;
      game?.destroy(true);
    };
  }, [save, bridge, away]);

  useEffect(() => {
    return bridge.subscribe((e: GameEvent) => {
      switch (e.type) {
        case "hud":
          setHud(e.state);
          break;
        case "toast": {
          const id = ++toastId.current;
          setToasts((t) => [...t.slice(-3), { id, text: e.text, tone: e.tone ?? "info" }]);
          window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
          break;
        }
        case "dawn":
          setDawn(e.report);
          window.setTimeout(() => setDawn((d) => (d?.day === e.report.day ? null : d)), 9000);
          break;
        case "openCivic":
          setPanel("civic");
          break;
        case "victory":
          setPanel("victory");
          break;
        default:
          break;
      }
    });
  }, [bridge]);

  // Pause the world whenever a blocking panel is open. The first HUD frame is
  // the signal that the scene's create() has run and it's listening for commands.
  const sceneReady = hud !== null;
  useEffect(() => {
    if (!ready || !sceneReady) return;
    bridge.send({ type: PAUSING.includes(panel) ? "pause" : "resume" });
  }, [panel, ready, sceneReady, bridge]);

  const togglePanel = useCallback((p: Panel) => setPanel((cur) => (cur === p ? null : p)), []);

  const finishIntro = useCallback(() => {
    bridge.send({ type: "introSeen" });
    setPanel(away ? "away" : null);
  }, [bridge, away]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const k = e.key.toLowerCase();
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (panel && panel !== "build" && k !== "escape") return;
      if (panel === "intro") return; // the prologue owns the keyboard until it's dismissed
      if (k === "escape") {
        e.preventDefault();
        setPanel((cur) => {
          if (cur === "build") {
            bridge.send({ type: "setBuildMode", building: null });
            return null;
          }
          if (cur === "away" || cur === "victory") return null;
          return cur ? null : "pause";
        });
      } else if (k === "b") {
        togglePanel("build");
      } else if (k === "k") {
        togglePanel("skills");
      } else if (k === "r") {
        togglePanel("roster");
      } else if (k === "j") {
        togglePanel("journal");
      } else if (k === "l") {
        togglePanel("books");
      } else if (k === "g") {
        togglePanel("civic");
      } else if (HOTKEYS[e.key]) {
        bridge.send({ type: "setBuildMode", building: HOTKEYS[e.key] });
        setPanel("build");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bridge, togglePanel, panel]);

  const closeBuild = useCallback(() => {
    bridge.send({ type: "setBuildMode", building: null });
    setPanel(null);
  }, [bridge]);

  const showRibbon = !!(hud?.jobs && hud.ribbonMode && panel !== "away" && panel !== "victory" && panel !== "intro");

  return (
    <div className="relative w-full select-none overflow-hidden rounded-3xl border border-border bg-[#07060d] shadow-2xl">
      <div ref={parentRef} className="aspect-[8/5] w-full" />

      {showRibbon && hud?.jobs && hud.ribbonMode && <Ribbon jobs={hud.jobs} mode={hud.ribbonMode} />}

      {hud && (
        <Hud
          hud={hud}
          toasts={toasts}
          topOffset={showRibbon ? 46 : 12}
          onBuild={() => togglePanel("build")}
          onSkills={() => togglePanel("skills")}
          onRoster={() => togglePanel("roster")}
          onJournal={() => togglePanel("journal")}
          onBooks={() => togglePanel("books")}
          onCivic={() => togglePanel("civic")}
          onPause={() => togglePanel("pause")}
          onSell={() => bridge.send({ type: "sell", what: "all" })}
          onAutoSell={() => bridge.send({ type: "toggleAutoSell" })}
          onSkipTutorial={() => bridge.send({ type: "advanceTutorial" })}
        />
      )}

      {dawn && panel !== "intro" && <DawnSummary report={dawn} onClose={() => setDawn(null)} />}

      {panel === "intro" && <Prologue name={save.character.name || "friend"} onDone={finishIntro} />}

      {hud && panel === "build" && (
        <BuildMenu
          hud={hud}
          onPick={(b) => bridge.send({ type: "setBuildMode", building: b })}
          onUpgradeAltar={() => bridge.send({ type: "upgradeAltar" })}
          onClose={closeBuild}
        />
      )}

      {hud && panel === "skills" && (
        <SkillsPanel hud={hud} onSpend={(s) => bridge.send({ type: "spendSkill", skill: s })} onClose={() => setPanel(null)} />
      )}

      {hud && panel === "roster" && (
        <RosterPanel
          hud={hud}
          onSetDeployment={(id, mode) => bridge.send({ type: "setDeployment", id, mode })}
          onRecruitScattered={(id) => bridge.send({ type: "recruitScattered", id })}
          onClose={() => setPanel(null)}
        />
      )}

      {hud && panel === "journal" && <QuestJournal hud={hud} onClose={() => setPanel(null)} />}

      {hud && panel === "civic" && (
        <CivicPanel
          hud={hud}
          onEdict={(id, on) => bridge.send({ type: "setEdict", id, on })}
          onStatute={(id, on) => bridge.send({ type: "setStatute", id, on })}
          onTithe={(rate) => bridge.send({ type: "setTitheRate", rate })}
          onSteward={(who) => bridge.send({ type: "setSteward", who })}
          onOffice={(office, seed) => bridge.send({ type: "setOffice", office, seed })}
          onJudge={(id, verdict) => bridge.send({ type: "judge", id, verdict })}
          onWriteLaw={(text) => bridge.send({ type: "writeLaw", text })}
          onRepealLaw={(id) => bridge.send({ type: "repealLaw", id })}
          onClose={() => setPanel(null)}
        />
      )}

      {hud && panel === "books" && (
        <BooksPanel
          hud={hud}
          onBank={(op, amount) => bridge.send({ type: "bank", op, amount })}
          onStore={(op, kind, amount) => bridge.send({ type: "store", op, kind, amount })}
          onToggleTithe={() => bridge.send({ type: "toggleTithe" })}
          onToggleShare={() => bridge.send({ type: "toggleShare" })}
          onClose={() => setPanel(null)}
        />
      )}

      {panel === "pause" && (
        <PauseMenu
          onResume={() => setPanel(null)}
          onSave={() => bridge.send({ type: "save" })}
          onNewGame={onNewGame}
        />
      )}

      {panel === "away" && away && (
        <Modal title="A letter from the valley" onClose={() => setPanel(null)}>
          <p className="text-sm text-white/90">{away.storyLine}</p>
          <p className="mt-2 text-sm italic text-brand-lime">&ldquo;{away.voiceLine}&rdquo;</p>
          <p className="mt-3 text-xs text-white/60">
            Gone about {away.hours}h · {away.cropsGrown} {away.cropsGrown === 1 ? "crop" : "crops"} ripened · {away.rent}{" "}
            coins in rent. No raids happen while you&apos;re away.
          </p>
          <ModalButton onClick={() => setPanel(null)}>Back to work</ModalButton>
        </Modal>
      )}

      {panel === "victory" && (
        <Modal title="Shalom. The valley is at peace." onClose={() => setPanel(null)}>
          <p className="text-sm text-white/80">
            Light covers the valley and the outer darkness has been pushed off the map. You built, multiplied, and stood
            firm. The nights don&apos;t stop — but neither do you. Keep building.
          </p>
          <ModalButton onClick={() => setPanel(null)}>Keep going</ModalButton>
        </Modal>
      )}
    </div>
  );
}
