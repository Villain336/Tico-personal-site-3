"use client";

import { useState } from "react";
import { Modal, ModalButton } from "./modal";

const CONTROLS: [string, string][] = [
  ["WASD / arrows", "Move"],
  ["Space / click", "Sword swing"],
  ["E", "Enter a building · hold at altar to pray · tap to cast · at market to sell"],
  ["F", "Eat wheat, meat, olives or grapes"],
  ["B / 1–8 / ,", "Build menu / quick-build (sheepfold is ,)"],
  ["K", "Skills"],
  ["I", "Gear — blades, wraps, lamps"],
  ["L", "Books — ledger and the Book of souls"],
  ["G", "Civic — law, war, judgment"],
  ["Esc", "Pause"],
];

export function PauseMenu({
  onResume,
  onSave,
  onNewGame,
}: {
  onResume: () => void;
  onSave: () => void;
  onNewGame: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal title="Paused" onClose={onResume}>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs text-white/75">
        {CONTROLS.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>
              <kbd className="rounded border border-white/30 px-1 text-[10px] text-white">{k}</kbd>
            </dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-2">
        <ModalButton onClick={onResume}>Resume (Esc)</ModalButton>
        <ModalButton onClick={onSave} variant="ghost">
          Save now
        </ModalButton>
        {confirm ? (
          <div className="rounded-xl border border-brand-coral/40 p-3 text-xs text-white/80">
            <p>This wipes your valley and starts over. Sure?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ModalButton onClick={onNewGame} variant="danger">
                Yes, start over
              </ModalButton>
              <ModalButton onClick={() => setConfirm(false)} variant="ghost">
                Keep playing
              </ModalButton>
            </div>
          </div>
        ) : (
          <ModalButton onClick={() => setConfirm(true)} variant="danger">
            New game
          </ModalButton>
        )}
      </div>
    </Modal>
  );
}
