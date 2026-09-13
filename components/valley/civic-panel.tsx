"use client";

import { useState } from "react";
import type { EdictId, HudState, OfficeId, RecruitId, StatuteId, TitheRate, Verdict } from "@/lib/valley/types";
import { CIVIC } from "@/lib/valley/config";
import { EDICT_COPY, EDICT_IDS, OFFICE_COPY, OFFICE_IDS, STATUTE_COPY, STATUTE_IDS, TITHE_RATES } from "@/lib/valley/world/civic";
import { compileLaw, INTENT_COPY } from "@/lib/valley/world/laws";
import { BIG_RECRUITS, SCATTERED_RECRUITS } from "@/lib/valley/quests/content";

const LAW_STARTERS = [
  "Do not hunt.",
  "Stay home after dusk.",
  "Share the bread.",
  "Stay in the light.",
  "No idols.",
  "Welcome the stranger.",
];

const CASE_LABEL: Record<string, string> = {
  fall: "A fall",
  nightSale: "Night sale",
  idol: "Idol kept",
  hoard: "Hoarding",
  hunt: "A hunt",
  custom: "Custom law",
};

export function CivicPanel({
  hud,
  onEdict,
  onStatute,
  onTithe,
  onSteward,
  onOffice,
  onJudge,
  onWriteLaw,
  onRepealLaw,
  onClose,
}: {
  hud: HudState;
  onEdict: (id: EdictId, on: boolean) => void;
  onStatute: (id: StatuteId, on: boolean) => void;
  onTithe: (rate: TitheRate) => void;
  onSteward: (who: "self" | RecruitId) => void;
  onOffice: (office: OfficeId, seed: number | null) => void;
  onJudge: (id: string, verdict: Verdict) => void;
  onWriteLaw: (text: string) => void;
  onRepealLaw: (id: string) => void;
  onClose: () => void;
}) {
  const c = hud.civic;
  const locked = !hud.hasHall;
  const roster = hud.recruits;
  const [draft, setDraft] = useState("");
  const preview = compileLaw(draft);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 font-mono text-[11px] text-white">
      <div className="max-h-[92%] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#14121f]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-amber-200">Civic hall</h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            close (Esc)
          </button>
        </div>
        <p className="mt-1 text-white/55">
          Write any law in your own words. The people will try to keep it. Edicts and statutes still stand beside what you write.
        </p>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Loyalty</span>
            <span className={c.loyalty < 40 ? "text-brand-coral" : c.loyalty >= 80 ? "text-brand-lime" : "text-white"}>
              {c.loyalty}/100
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full rounded-full ${c.loyalty < 40 ? "bg-brand-coral" : "bg-amber-300"}`}
              style={{ width: `${c.loyalty}%` }}
            />
          </div>
          <p className="mt-2 text-white/50">
            Steward:{" "}
            <span className="text-white/80">
              {c.steward === "self" ? "you" : c.steward ? stewardName(c.steward) : "none — build the hall"}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Mini disabled={locked} onClick={() => onSteward("self")} active={c.steward === "self"}>
              Sit yourself
            </Mini>
            {roster.map((r) => (
              <Mini key={r.id} disabled={locked} onClick={() => onSteward(r.id)} active={c.steward === r.id}>
                {r.name}
              </Mini>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Written laws</span>
            <span className="text-white/50">
              {(c.laws ?? []).length}/{CIVIC.maxLaws}
            </span>
          </div>
          <p className="mt-1 text-white/45">
            Speak a sentence. Villagers quote it. If they understand it, they keep it — curfew, sanctuary, no hunting, share the bread, and the rest.
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={locked}
            maxLength={140}
            rows={2}
            placeholder='e.g. "Do not hunt. Stay home after dusk. Share the bread."'
            className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-white placeholder:text-white/30 focus:border-amber-200/50 focus:outline-none disabled:text-white/30"
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {LAW_STARTERS.map((line) => (
              <Mini
                key={line}
                disabled={locked}
                onClick={() => setDraft((cur) => (cur ? `${cur.replace(/\s+$/, "")} ${line}` : line).slice(0, 140))}
              >
                {line}
              </Mini>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Mini
              disabled={locked || !draft.trim()}
              onClick={() => {
                onWriteLaw(draft);
                setDraft("");
              }}
            >
              Write the law
            </Mini>
            {preview.understood ? (
              <span className="text-brand-lime">
                They will keep: {preview.intents.map((i) => INTENT_COPY[i]).join(" · ")}
              </span>
            ) : draft.trim() ? (
              <span className="text-amber-200/80">They will try to honor the words, even if they do not yet know how.</span>
            ) : null}
          </div>
          <div className="mt-2 space-y-1.5">
            {(c.laws ?? []).length === 0 && <p className="text-white/35">No laws written yet. The tablet is empty.</p>}
            {(c.laws ?? []).map((law) => (
              <div key={law.id} className="rounded-lg border border-white/10 px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-amber-100">&ldquo;{law.text}&rdquo;</p>
                  <Mini disabled={locked} onClick={() => onRepealLaw(law.id)}>
                    repeal
                  </Mini>
                </div>
                <p className="text-white/40">
                  {law.intents.length > 0 ? law.intents.map((i) => INTENT_COPY[i]).join(" · ") : "Spoken only — not yet understood"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="font-semibold">Tithe</div>
          <div className="mt-2 flex gap-1.5">
            {TITHE_RATES.map((rate) => (
              <Mini key={rate} disabled={locked} onClick={() => onTithe(rate)} active={c.titheRate === rate}>
                {rate === 0 ? "None" : `${rate}%`}
              </Mini>
            ))}
          </div>
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-3">
            <div className="font-semibold">Edicts</div>
            <div className="mt-2 space-y-1.5">
              {EDICT_IDS.map((id) => (
                <Toggle
                  key={id}
                  disabled={locked}
                  on={c.edicts[id]}
                  onClick={() => onEdict(id, !c.edicts[id])}
                  label={EDICT_COPY[id].name}
                  hint={EDICT_COPY[id].hint}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <div className="font-semibold">Statutes</div>
            <div className="mt-2 space-y-1.5">
              {STATUTE_IDS.map((id) => (
                <Toggle
                  key={id}
                  disabled={locked}
                  on={c.statutes[id]}
                  onClick={() => onStatute(id, !c.statutes[id])}
                  label={STATUTE_COPY[id].name}
                  hint={STATUTE_COPY[id].hint}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="font-semibold">Offices</div>
          {OFFICE_IDS.map((office) => {
            const seed = c.offices[office];
            const holder = seed != null ? hud.villagerOffices.find((v) => v.seed === seed) : null;
            return (
              <div key={office} className="mt-2">
                <div className="flex items-center justify-between">
                  <span>
                    {OFFICE_COPY[office].name}
                    <span className="ml-2 text-white/45">{holder?.name ?? "vacant"}</span>
                  </span>
                  {seed != null && (
                    <Mini disabled={locked} onClick={() => onOffice(office, null)}>
                      clear
                    </Mini>
                  )}
                </div>
                <p className="text-white/40">{OFFICE_COPY[office].hint}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {hud.villagerOffices.map((v) => (
                    <Mini key={v.seed} disabled={locked} onClick={() => onOffice(office, v.seed)} active={seed === v.seed}>
                      {v.name}
                    </Mini>
                  ))}
                  {hud.villagerOffices.length === 0 && <span className="text-white/35">No villagers yet.</span>}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Docket</span>
            <span className="text-white/50">{c.docket.length} pending</span>
          </div>
          {c.docket.length === 0 ? (
            <p className="mt-2 text-white/40">No cases. Ratified laws write the next ones.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {c.docket.map((kase) => (
                <div key={kase.id} className="rounded-lg border border-white/10 p-2">
                  <div className="font-semibold text-amber-100">
                    {CASE_LABEL[kase.kind] ?? kase.kind} · {kase.accused}
                  </div>
                  <p className="text-white/55">{kase.note}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Mini onClick={() => onJudge(kase.id, "mercy")}>Mercy</Mini>
                    <Mini onClick={() => onJudge(kase.id, "fine")}>Fine</Mini>
                    <Mini onClick={() => onJudge(kase.id, "exile")}>Exile</Mini>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {locked && (
          <p className="mt-3 text-white/40">Build a town hall (hotkey .) at altar 2 to govern from here.</p>
        )}
      </div>
    </div>
  );
}

function stewardName(id: string) {
  if (id in BIG_RECRUITS) return BIG_RECRUITS[id as keyof typeof BIG_RECRUITS].name;
  if (id in SCATTERED_RECRUITS) return SCATTERED_RECRUITS[id as keyof typeof SCATTERED_RECRUITS].name;
  return id;
}

function Mini({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-2 py-1 ${
        disabled
          ? "cursor-not-allowed border-white/10 text-white/30"
          : active
            ? "border-brand-lime/60 bg-brand-lime/15 text-brand-lime"
            : "border-white/20 hover:border-white/50 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  on,
  onClick,
  label,
  hint,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={hint}
      onClick={onClick}
      className={`w-full rounded-lg border px-2.5 py-1.5 text-left ${
        disabled ? "cursor-not-allowed border-white/10 text-white/35" : on ? "border-brand-lime/50 bg-brand-lime/10" : "border-white/15 bg-white/5"
      }`}
    >
      <div className="font-semibold">
        {label} <span className={on ? "text-brand-lime" : "text-white/40"}>{on ? "on" : "off"}</span>
      </div>
      <p className="text-white/45">{hint}</p>
    </button>
  );
}
