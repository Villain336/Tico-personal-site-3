"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { AwayReport, Character, SaveData } from "@/lib/valley/types";
import { applyOfflineProgress, clearSave, loadSave, newSave, writeSave } from "@/lib/valley/save";
import { CharacterCreator } from "./character-creator";

const ValleyGame = dynamic(() => import("./valley-game").then((m) => m.ValleyGame), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[8/5] w-full items-center justify-center rounded-3xl border border-border bg-[#07060d] text-sm text-white/70">
      Loading the valley…
    </div>
  ),
});

type Mode = { kind: "loading" } | { kind: "creator" } | { kind: "game"; save: SaveData; away: AwayReport | null; key: number };

function resolveInitialMode(): Mode {
  const existing = loadSave();
  if (!existing) return { kind: "creator" };
  const { save, report } = applyOfflineProgress(existing);
  return { kind: "game", save, away: report, key: Date.now() };
}

export function ValleyApp() {
  const [mode, setMode] = useState<Mode>({ kind: "loading" });

  // Saves live in localStorage, which the server can't read, so the initial
  // mode is resolved after mount (deferred a tick to keep the first paint stable).
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setMode(resolveInitialMode());
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  const onCreate = useCallback((character: Character) => {
    const save = newSave(character);
    writeSave(save);
    setMode({ kind: "game", save, away: null, key: Date.now() });
  }, []);

  const onNewGame = useCallback(() => {
    clearSave();
    setMode({ kind: "creator" });
  }, []);

  if (mode.kind === "loading") {
    return (
      <div className="flex aspect-[8/5] w-full items-center justify-center rounded-3xl border border-border bg-[#07060d] text-sm text-white/70">
        Opening your save…
      </div>
    );
  }
  if (mode.kind === "creator") return <CharacterCreator onCreate={onCreate} />;
  return <ValleyGame key={mode.key} save={mode.save} away={mode.away} onNewGame={onNewGame} />;
}
