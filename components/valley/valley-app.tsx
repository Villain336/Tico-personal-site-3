"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";
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
  try {
    const existing = loadSave();
    if (!existing) return { kind: "creator" };
    const { save, report } = applyOfflineProgress(existing);
    return { kind: "game", save, away: report, key: Date.now() };
  } catch (err) {
    console.error("Shalom Valley save failed to open", err);
    return { kind: "creator" };
  }
}

/** True only after the client has taken over — avoids a stuck SSR "Opening" frame. */
function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ValleyApp() {
  const mounted = useHasMounted();
  const [mode, setMode] = useState<Mode>({ kind: "loading" });

  // Client snapshot is known on the first mounted render — no effect, no hung timer.
  if (mounted && mode.kind === "loading") {
    setMode(resolveInitialMode());
  }

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
      <div className="flex aspect-[8/5] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-[#07060d] text-sm text-white/70">
        <p>Opening your save…</p>
        {mounted && (
          <button
            type="button"
            onClick={() => setMode(resolveInitialMode())}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-white/85 hover:border-white/50 hover:bg-white/5"
          >
            Open the valley
          </button>
        )}
      </div>
    );
  }
  if (mode.kind === "creator") return <CharacterCreator onCreate={onCreate} />;
  return <ValleyGame key={mode.key} save={mode.save} away={mode.away} onNewGame={onNewGame} />;
}
