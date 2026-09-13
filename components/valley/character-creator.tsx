"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, Gender } from "@/lib/valley/types";
import {
  BODY_NAMES,
  FACE_NAMES,
  HAIR_COLORS,
  HAIR_NAMES,
  HAIR_STYLE_NAMES,
  OUTFIT_NAMES,
  SKIN_TONES,
} from "@/lib/valley/palette";
import { buildCharacter } from "@/lib/valley/sprites/chars";
import { paint } from "@/lib/valley/sprites/pixel";
import { characterLook, characterRoles } from "@/lib/valley/textures";

const SCALE = 7;

const DEFAULT: Character = {
  name: "",
  gender: "man",
  skin: 2,
  hairStyle: 0,
  hairColor: 0,
  face: 0,
  body: 1,
  outfit: 0,
};

function randomCharacter(): Character {
  const r = (n: number) => Math.floor(Math.random() * n);
  return {
    name: "",
    gender: r(2) === 0 ? "man" : "woman",
    skin: r(SKIN_TONES.length),
    hairStyle: r(3),
    hairColor: r(HAIR_COLORS.length),
    face: r(3),
    body: r(3),
    outfit: r(3),
  };
}

export function CharacterCreator({ onCreate }: { onCreate: (c: Character) => void }) {
  const [c, setC] = useState<Character>(DEFAULT);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const map = useMemo(() => buildCharacter(characterLook(c)), [c]);
  const roles = useMemo(() => characterRoles(c), [c]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    paint(ctx, map, roles, 0, 0, SCALE);
  }, [map, roles]);

  const set = <K extends keyof Character>(key: K, value: Character[K]) => setC((prev) => ({ ...prev, [key]: value }));

  const canStart = c.name.trim().length > 0;

  return (
    <div className="mx-auto grid h-full w-full max-w-5xl gap-6 overflow-y-auto bg-surface p-4 sm:p-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-[220px] w-full items-end justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_30%,#f6f1dc,#e6d3a0)]">
          <div className="absolute inset-x-0 bottom-0 h-10 bg-[#7fb24a]" />
          <div className="absolute inset-x-0 bottom-8 h-2 bg-[#73a643]" />
          <canvas
            ref={canvasRef}
            width={16 * SCALE}
            height={24 * SCALE}
            className="relative mb-6 [image-rendering:pixelated]"
            aria-label="Character preview"
          />
        </div>
        <button
          type="button"
          onClick={() => setC((prev) => ({ ...randomCharacter(), name: prev.name }))}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground/80 transition hover:bg-foreground/5"
        >
          Randomize
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="valley-name" className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
            Your name
          </label>
          <input
            id="valley-name"
            value={c.name}
            maxLength={16}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Yosef, Miriam, Tico"
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-brand-violet/40 focus:ring-2"
          />
        </div>

        <Field label="Body">
          <Segmented
            options={["Man", "Woman"]}
            value={c.gender === "man" ? 0 : 1}
            onChange={(i) => set("gender", (i === 0 ? "man" : "woman") as Gender)}
          />
          <Segmented options={BODY_NAMES} value={c.body} onChange={(i) => set("body", i)} />
        </Field>

        <Field label="Skin tone">
          <Swatches colors={SKIN_TONES} value={c.skin} onChange={(i) => set("skin", i)} label="Skin tone" />
        </Field>

        <Field label="Hair">
          <Segmented options={HAIR_STYLE_NAMES} value={c.hairStyle} onChange={(i) => set("hairStyle", i)} />
          <Swatches colors={HAIR_COLORS} names={HAIR_NAMES} value={c.hairColor} onChange={(i) => set("hairColor", i)} label="Hair color" />
        </Field>

        <Field label="Face">
          <Segmented options={FACE_NAMES} value={c.face} onChange={(i) => set("face", i)} />
        </Field>

        <Field label="Outfit">
          <Segmented options={OUTFIT_NAMES} value={c.outfit} onChange={(i) => set("outfit", i)} />
        </Field>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Saves live in this browser. Desktop keyboard recommended.</p>
          <button
            type="button"
            disabled={!canStart}
            onClick={() => onCreate({ ...c, name: c.name.trim() })}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enter the valley
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-background p-1">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(i)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            i === value ? "bg-foreground text-background" : "text-foreground/70 hover:bg-foreground/5"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Swatches({
  colors,
  names,
  value,
  onChange,
  label,
}: {
  colors: readonly string[];
  names?: readonly string[];
  value: number;
  onChange: (i: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
      {colors.map((col, i) => (
        <button
          key={col}
          type="button"
          aria-label={`${label} ${names?.[i] ?? i + 1}`}
          onClick={() => onChange(i)}
          style={{ backgroundColor: col }}
          className={`h-7 w-7 rounded-full border-2 transition ${
            i === value ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
          }`}
        />
      ))}
    </div>
  );
}
