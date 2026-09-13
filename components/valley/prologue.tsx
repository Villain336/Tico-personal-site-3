"use client";

import { useState } from "react";
import { ModalButton } from "./modal";

type Page = { title: string; body: string[]; note?: string };

function pages(name: string): Page[] {
  return [
    {
      title: "Shalom Valley",
      body: [
        `At the edge of the dark there is a valley, and in the valley one altar still burns.`,
        `You are ${name}. The light is yours to keep.`,
      ],
    },
    {
      title: "By day, by night",
      body: [
        "By day, plant and build. Pray at the altar to fill your spirit — prayer is what drives the shadows back.",
        "By night, they come from the edges: robbers after your coins, tempters and deceivers after your people. Walls slow them. Light stops them.",
      ],
      note: "WASD move · E pray / talk · Space or click swing · B build · F eat",
    },
    {
      title: "More than the light",
      body: [
        "The valley is bigger than the light reaches. A river runs to the west with fords you can wade; high ground rises to the north-east behind cliffs; the south is deep woods.",
        "There are places worth finding out there — and strangers will walk in at dawn over the coming days. Each has a story. Each needs something from you first.",
      ],
      note: "J opens the journal · R the roster · 📍 counts places found",
    },
  ];
}

/** First-run opening. The world sits paused behind it until the player steps in. */
export function Prologue({ name, onDone }: { name: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const all = pages(name);
  const p = all[i];
  const last = i === all.length - 1;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#07060d]/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-[#14121f] p-7 text-white shadow-2xl" role="dialog" aria-modal="true">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
          {i + 1} / {all.length}
        </p>
        <h3 className="font-display mt-1 text-2xl font-bold text-amber-100">{p.title}</h3>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
          {p.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {p.note && <p className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-white/60">{p.note}</p>}
        <div className="mt-6 flex gap-2">
          {i > 0 && (
            <ModalButton onClick={() => setI(i - 1)} variant="ghost">
              Back
            </ModalButton>
          )}
          <ModalButton onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "Enter the valley" : "Next"}</ModalButton>
        </div>
        {!last && (
          <button type="button" onClick={onDone} className="mt-3 w-full text-center font-mono text-[10px] text-white/40 hover:text-white/70">
            skip
          </button>
        )}
      </div>
    </div>
  );
}
