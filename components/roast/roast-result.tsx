"use client";

import { motion } from "motion/react";
import { roastCategories, roastCopy } from "@/content/roast";
import { site } from "@/content/site";
import { roastCategoryKeys, type RoastResponse } from "@/lib/roast/schema";

function tone(score: number) {
  if (score >= 75) return { text: "text-emerald-600", ring: "#16a34a", label: "Solid" };
  if (score >= 50) return { text: "text-amber-600", ring: "#d97706", label: "Mid" };
  return { text: "text-brand-coral", ring: "#ff5b4a", label: "Rough" };
}

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const t = tone(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth="10" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.ring}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-4xl font-bold ${t.text}`}>{Math.round(score)}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          / 100
        </span>
      </div>
    </div>
  );
}

export function RoastResult({ data }: { data: RoastResponse }) {
  const { result } = data;
  const host = safeHost(data.url);
  const share = `https://x.com/intent/post?${new URLSearchParams({
    text: roastCopy.shareText(result.oneLiner),
    url: `${site.url}/roast`,
  }).toString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      {/* verdict header */}
      <div className="grid gap-6 rounded-3xl border border-border bg-surface p-6 shadow-card md:grid-cols-[auto_1fr] md:p-8">
        <div className="flex items-center justify-center">
          <ScoreRing score={result.overall} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
            {host}
            {data.pageTitle ? ` · ${data.pageTitle}` : ""}
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {result.headline}
          </h2>
          <p className="mt-3 text-lg leading-snug text-foreground/85">
            &ldquo;{result.oneLiner}&rdquo;
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={share}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2H21.5l-7.5 8.57L22.75 22h-6.91l-5.41-7.07L4.24 22H1l8.02-9.17L.5 2h7.08l4.89 6.47L18.24 2Zm-1.21 18h1.8L7.05 3.9H5.12L17.03 20Z" />
              </svg>
              {roastCopy.shareCta}
            </a>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-foreground/5"
            >
              Open the page →
            </a>
          </div>
        </div>
      </div>

      {/* screenshot + categories */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {data.screenshotUrl ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-brand-coral/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 truncate text-xs text-muted">{data.url}</span>
            </div>
            {/* Third-party screenshot URL; not routed through next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.screenshotUrl}
              alt={`Screenshot of ${host}`}
              className="block w-full"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Couldn&apos;t grab a screenshot, so this roast is judged from the copy alone.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {roastCategoryKeys.map((key, i) => {
            const cat = result.categories[key];
            const t = tone(cat.score);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-border bg-surface p-4 shadow-card"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold">
                      {roastCategories[key].label}
                    </p>
                    <p className="text-xs text-muted">{roastCategories[key].blurb}</p>
                  </div>
                  <p className={`font-display text-2xl font-bold ${t.text}`}>
                    {Math.round(cat.score)}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: t.ring }}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.score}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <p className="mt-3 text-sm leading-snug text-foreground/85">{cat.verdict}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* the roast */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-coral">
          The roast
        </p>
        <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-foreground/90">
          {result.roast.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {/* fixes */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
          Top 3 fixes
        </p>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {result.fixes.map((f, i) => (
            <li key={i} className="rounded-2xl bg-background p-5">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-lime font-display text-sm font-bold text-foreground">
                {i + 1}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold leading-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.why}</p>
              <p className="mt-2 text-sm text-foreground/85">{f.how}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-border pt-5 text-base text-foreground/85">
          {result.closer}
        </p>
      </div>
    </motion.div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
