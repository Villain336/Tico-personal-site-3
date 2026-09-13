"use client";

import type { HudState } from "@/lib/valley/types";

export type Toast = { id: number; text: string; tone: "info" | "good" | "bad" };

const TUTORIAL: string[] = [
  "Walk to the altar (WASD) and hold E to pray. Prayer is your weapon against spirits.",
  "Press B (or 1) and click the ground to plant a farm plot. Wheat grows in 3 stages.",
  "Walk over a ripe farm to harvest. Press F to eat when hungry.",
  "Build a market stall (B → 4). Walk up to it and press E to sell, or leave auto-sell on.",
  "Build a house (B → 2). Villagers move in, pray at the altar, and pay rent at dawn.",
  "Night is coming. Swing your sword (Space / click) at robbers. Keep low-level villagers close to the light.",
];

export function Hud({
  hud,
  toasts,
  topOffset = 12,
  onBuild,
  onSkills,
  onRoster,
  onJournal,
  onPause,
  onSell,
  onAutoSell,
  onSkipTutorial,
}: {
  hud: HudState;
  toasts: Toast[];
  /** Pixels from the top; raised when the ribbon is visible so they don't overlap. */
  topOffset?: number;
  onBuild: () => void;
  onSkills: () => void;
  onRoster: () => void;
  onJournal: () => void;
  onPause: () => void;
  onSell: () => void;
  onAutoSell: () => void;
  onSkipTutorial: () => void;
}) {
  const hint = hud.tutorialStep < TUTORIAL.length ? TUTORIAL[hud.tutorialStep] : null;
  const hasCrops = hud.wheat + hud.grapes > 0;
  const readyQuests = hud.quests.filter((q) => q.state === "ready").length;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 font-mono text-[11px] text-white">
      {/* top-left: day + inventory */}
      <div className="absolute left-3 space-y-2" style={{ top: topOffset }}>
        <Card>
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{hud.isNight ? "🌙" : "☀️"}</span>
            <span className="font-semibold">Day {hud.day}</span>
            <span className="text-white/60">{hud.isNight ? "Night" : "Day"}</span>
          </div>
          <Bar value={hud.phaseProgress} color={hud.isNight ? "bg-indigo-400" : "bg-amber-300"} className="mt-1.5" />
        </Card>
        <Card>
          <div className="flex gap-3">
            <Stat icon="🪙" label="coins" value={hud.coins} />
            <Stat icon="🌾" label="wheat" value={hud.wheat} />
            <Stat icon="🍇" label="grapes" value={hud.grapes} />
          </div>
        </Card>
      </div>

      {/* top-right: village */}
      <div className="absolute right-3 w-[190px] space-y-2" style={{ top: topOffset }}>
        <Card>
          <Row label="Sin" value={`${hud.sin}/100`} />
          <Bar value={hud.sin / 100} color="bg-brand-coral" />
          <Row label="Light" value={`${Math.round(hud.darknessPushed * 100)}%`} className="mt-1.5" />
          <Bar value={hud.darknessPushed} color="bg-brand-lime" />
        </Card>
        <Card>
          <div className="flex justify-between text-white/80">
            <span>👥 {hud.population}/{hud.capacity}</span>
            <span>🔥 Altar {hud.altarLevel}</span>
            {hud.isNight && <span className="text-brand-coral">☠ {hud.enemiesAlive}</span>}
          </div>
        </Card>
      </div>

      {/* top-center: hint / prompt */}
      <div className="absolute inset-x-0 flex justify-center px-[210px]" style={{ top: topOffset }}>
        {hud.nearAltar && !hud.isNight && hud.tutorialStep > 0 ? (
          <Pill>Hold E to pray · refills prayer, earns XP</Pill>
        ) : hud.nearMarket && hasCrops ? (
          <Pill>Press E to sell your crops</Pill>
        ) : hint ? (
          <div className="pointer-events-auto max-w-md rounded-xl border border-brand-lime/40 bg-black/70 px-3 py-2 text-center backdrop-blur">
            <p className="text-white/90">{hint}</p>
            <button type="button" onClick={onSkipTutorial} className="mt-1 text-[10px] text-white/50 underline hover:text-white">
              skip tip
            </button>
          </div>
        ) : null}
      </div>

      {/* bottom-left: vitals */}
      <div className="absolute bottom-3 left-3 w-[210px]">
        <Card>
          <Meter label="Health" value={hud.health} max={hud.maxHealth} color="bg-emerald-400" />
          <Meter label="Hunger" value={hud.hunger} max={100} color={hud.hunger < 20 ? "bg-brand-coral" : "bg-amber-400"} />
          <Meter label="Prayer" value={hud.prayer} max={hud.maxPrayer} color="bg-violet-400" />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-semibold">Lvl {hud.level}</span>
            <span className="text-white/60">
              {hud.xp}/{hud.xpToNext} xp
            </span>
          </div>
          <Bar value={hud.xp / hud.xpToNext} color="bg-white/70" />
        </Card>
      </div>

      {/* bottom-right: actions */}
      <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
        {hud.buildMode && (
          <Pill tone="lime">Placing: {hud.buildMode} · click to build · right-click to stop</Pill>
        )}
        <div className="flex gap-1.5">
          {hud.nearMarket && hasCrops && <Btn onClick={onSell}>Sell all (E)</Btn>}
          <Btn onClick={onAutoSell} title="Toggle auto-sell">
            Auto-sell {hud.autoSell ? "on" : "off"}
          </Btn>
          <Btn onClick={onBuild} active={hud.buildMode !== null}>
            Build <Key>B</Key>
          </Btn>
          <Btn onClick={onSkills} badge={hud.skillPoints > 0 ? hud.skillPoints : undefined}>
            Skills <Key>K</Key>
          </Btn>
          <Btn onClick={onRoster}>
            Roster <Key>R</Key>
          </Btn>
          <Btn onClick={onJournal} badge={readyQuests > 0 ? readyQuests : undefined}>
            Quests <Key>J</Key>
          </Btn>
          <Btn onClick={onPause}>
            <Key>Esc</Key>
          </Btn>
        </div>
      </div>

      {/* toasts */}
      <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-1 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-md rounded-lg border px-3 py-1.5 text-center backdrop-blur ${
              t.tone === "good"
                ? "border-brand-lime/50 bg-black/70 text-brand-lime"
                : t.tone === "bad"
                  ? "border-brand-coral/50 bg-black/70 text-[#ffb3ab]"
                  : "border-white/20 bg-black/70 text-white/90"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/15 bg-black/65 px-3 py-2 backdrop-blur">{children}</div>;
}

function Pill({ children, tone = "white" }: { children: React.ReactNode; tone?: "white" | "lime" }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 backdrop-blur ${
        tone === "lime" ? "border-brand-lime/50 bg-black/70 text-brand-lime" : "border-white/20 bg-black/70 text-white/90"
      }`}
    >
      {children}
    </div>
  );
}

function Bar({ value, color, className = "" }: { value: number; color: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/15 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-200`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Meter({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-1">
      <Row label={label} value={`${Math.round(value)}/${Math.round(max)}`} />
      <Bar value={value / max} color={color} />
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between text-white/80 ${className}`}>
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <span>{icon}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="ml-1 rounded border border-white/30 px-1 text-[9px] text-white/70">{children}</kbd>;
}

function Btn({
  children,
  onClick,
  active,
  badge,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  badge?: number;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center rounded-lg border px-2.5 py-1.5 font-semibold backdrop-blur transition ${
        active ? "border-brand-lime bg-brand-lime text-[#12121a]" : "border-white/20 bg-black/65 text-white hover:bg-white/10"
      }`}
    >
      {children}
      {badge !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-lime px-1 text-[9px] font-bold text-[#12121a]">
          {badge}
        </span>
      )}
    </button>
  );
}
