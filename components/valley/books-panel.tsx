"use client";

import type { CropKind, HudState } from "@/lib/valley/types";
import { CROP_KINDS, ECONOMY } from "@/lib/valley/config";

const LABEL: Record<CropKind, string> = {
  wheat: "Wheat",
  grapes: "Grapes",
  olives: "Olives",
  flax: "Flax",
};

export function BooksPanel({
  hud,
  onBank,
  onStore,
  onToggleTithe,
  onToggleShare,
  onClose,
}: {
  hud: HudState;
  onBank: (op: "deposit" | "withdraw", amount: number) => void;
  onStore: (op: "deposit" | "withdraw", kind: CropKind | "all", amount?: number) => void;
  onToggleTithe: () => void;
  onToggleShare: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 font-mono text-[11px] text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#14121f]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-amber-200">The books</h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            close (Esc)
          </button>
        </div>
        <p className="mt-1 text-white/55">
          Purse is what you carry. The changer holds the rest and pays at dawn. The Book keeps named souls. Letters quote it.
        </p>

        <section className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-amber-300/25 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-200">The Book</span>
            <span className="text-white/50">{hud.judgment.souls.length} written</span>
          </div>
          {hud.judgment.souls.length === 0 ? (
            <p className="mt-1.5 text-white/40">No names yet. Villagers who arrive, fall, or are judged are written here.</p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-white/75">
              {[...hud.judgment.souls].reverse().slice(0, 8).map((s, i) => (
                <li key={`${s.seed}-${s.kind}-${s.day}-${i}`}>
                  <span className="text-amber-200">{s.name}</span>
                  <span className="text-white/40"> · day {s.day} · {s.kind}</span>
                  <span className="text-white/55"> — {s.note}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Coins</span>
            <span>
              purse <span className="text-brand-lime">{hud.coins}</span>
              <span className="text-white/40"> · </span>
              bank <span className="text-amber-200">{hud.bank}</span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Mini onClick={() => onBank("deposit", 10)} disabled={!hud.hasChanger || hud.coins < 1}>
              Deposit 10
            </Mini>
            <Mini onClick={() => onBank("deposit", hud.coins)} disabled={!hud.hasChanger || hud.coins < 1}>
              Deposit all
            </Mini>
            <Mini onClick={() => onBank("withdraw", 10)} disabled={!hud.hasChanger || hud.bank < 1}>
              Withdraw 10
            </Mini>
            <Mini onClick={() => onBank("withdraw", hud.bank)} disabled={!hud.hasChanger || hud.bank < 1}>
              Withdraw all
            </Mini>
          </div>
          {!hud.hasChanger && <p className="mt-1.5 text-white/40">Build a money changer (]) to bank coins. Dawn pays {Math.round(ECONOMY.interestGood * 100)}% if sin is low.</p>}
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Stores</span>
            <span className="text-white/50">pack / barn · sell price</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {CROP_KINDS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-14 text-white/80">{LABEL[k]}</span>
                <span className="w-20 text-white">
                  {hud[k]} / {hud.stores[k]}
                </span>
                <span className="w-12 text-brand-lime">{hud.prices[k]}c</span>
                <Mini onClick={() => onStore("deposit", k)} disabled={!hud.hasStore || hud[k] < 1}>
                  store
                </Mini>
                <Mini onClick={() => onStore("withdraw", k)} disabled={!hud.hasStore || hud.stores[k] < 1}>
                  take
                </Mini>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            <Mini onClick={() => onStore("deposit", "all")} disabled={!hud.hasStore}>
              Store all
            </Mini>
            <Mini onClick={() => onStore("withdraw", "all")} disabled={!hud.hasStore}>
              Take all
            </Mini>
          </div>
          {!hud.hasStore && <p className="mt-1.5 text-white/40">Build a storehouse (;) or Noah&apos;s granary to keep a barn.</p>}
        </section>

        <section className="mt-3 flex flex-wrap gap-2">
          <Toggle
            on={hud.civic.titheRate > 0}
            onClick={onToggleTithe}
            label="Tithe"
            hint={
              hud.civic.titheRate > 0
                ? `${hud.civic.titheRate}% of each sale goes to the altar. Set 0 / 10 / 20 in Civic (G).`
                : "Off. Set a rate in Civic (G) or toggle back on for a tenth."
            }
          />
          <Toggle on={hud.shareOn} onClick={onToggleShare} label="Share the bread" hint="At dawn the village eats from the barn, then your pack." />
        </section>
      </div>
    </div>
  );
}

function Mini({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-2 py-1 ${
        disabled ? "cursor-not-allowed border-white/10 text-white/30" : "border-white/20 hover:border-white/50 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      title={hint}
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2 text-left ${
        on ? "border-brand-lime/50 bg-brand-lime/10" : "border-white/15 bg-white/5"
      }`}
    >
      <div className="font-semibold">
        {label} <span className={on ? "text-brand-lime" : "text-white/40"}>{on ? "on" : "off"}</span>
      </div>
      <p className="mt-0.5 text-white/50">{hint}</p>
    </button>
  );
}
