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

declare global {
  interface Window {
    __valley?: import("phaser").Game;
  }
}

type Panel = "build" | "skills" | "pause" | "away" | "victory" | null;
const PAUSING: Panel[] = ["skills", "pause", "away", "victory"];

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
  const [panel, setPanel] = useState<Panel>(away ? "away" : null);
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
        scene: [new WorldScene(save, bridge)],
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
  }, [save, bridge]);

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
        case "victory":
          setPanel("victory");
          break;
        default:
          break;
      }
    });
  }, [bridge]);

  // Pause the world whenever a blocking panel is open.
  useEffect(() => {
    if (!ready) return;
    bridge.send({ type: PAUSING.includes(panel) ? "pause" : "resume" });
  }, [panel, ready, bridge]);

  const togglePanel = useCallback((p: Panel) => setPanel((cur) => (cur === p ? null : p)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
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
      } else if (HOTKEYS[e.key]) {
        bridge.send({ type: "setBuildMode", building: HOTKEYS[e.key] });
        setPanel("build");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bridge, togglePanel]);

  const closeBuild = useCallback(() => {
    bridge.send({ type: "setBuildMode", building: null });
    setPanel(null);
  }, [bridge]);

  return (
    <div className="relative w-full select-none overflow-hidden rounded-3xl border border-border bg-[#07060d] shadow-2xl">
      <div ref={parentRef} className="aspect-[8/5] w-full" />

      {hud && (
        <Hud
          hud={hud}
          toasts={toasts}
          onBuild={() => togglePanel("build")}
          onSkills={() => togglePanel("skills")}
          onPause={() => togglePanel("pause")}
          onSell={() => bridge.send({ type: "sell", what: "all" })}
          onAutoSell={() => bridge.send({ type: "toggleAutoSell" })}
          onSkipTutorial={() => bridge.send({ type: "advanceTutorial" })}
        />
      )}

      {dawn && <DawnSummary report={dawn} onClose={() => setDawn(null)} />}

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

      {panel === "pause" && (
        <PauseMenu
          onResume={() => setPanel(null)}
          onSave={() => bridge.send({ type: "save" })}
          onNewGame={onNewGame}
        />
      )}

      {panel === "away" && away && (
        <Modal title="While you were away" onClose={() => setPanel(null)}>
          <p className="text-sm text-white/80">
            You were gone about <b>{away.hours}h</b>. The valley kept working at half pace: <b>{away.cropsGrown}</b>{" "}
            {away.cropsGrown === 1 ? "crop" : "crops"} ripened and villagers paid <b>{away.rent}</b> coins in rent. No raids
            happen while you&apos;re away.
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
