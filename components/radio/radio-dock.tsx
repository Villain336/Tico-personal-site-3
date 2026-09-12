"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { useSpotifyEmbed } from "@/components/radio/use-spotify-embed";
import type { RadioTracksResponse } from "@/app/api/radio/tracks/route";
import type { RadioTrack } from "@/lib/radio/spotify";

const NOTES = ["♪", "♫", "♩", "♬", "♪"];

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * "Tico's Radio": a Spotify-powered player that lives in the nav so it keeps
 * playing across pages. With app credentials it shuffles the playlist track
 * by track through Spotify's embed API; without them it's the plain embed.
 */
export function RadioDock() {
  const [data, setData] = useState<RadioTracksResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/radio/tracks")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: RadioTracksResponse | null) => {
        if (!alive || !json) return;
        setData(json);
        if (json.mode === "shuffle") setOrder(shuffled(json.tracks.length));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const tracks: RadioTrack[] = useMemo(() => data?.tracks ?? [], [data]);
  const shuffleMode = data?.mode === "shuffle" && tracks.length > 0;
  const current: RadioTrack | null = shuffleMode ? tracks[order[idx]] ?? null : null;

  const initialUri = useMemo(() => {
    if (!data || data.mode === "off") return null;
    if (data.mode === "shuffle" && order.length) return tracks[order[0]]?.uri ?? null;
    return data.playlistId ? `spotify:playlist:${data.playlistId}` : null;
  }, [data, order, tracks]);

  // Queue position lives in refs too so `next` can run from the embed's
  // end-of-track callback without stale closures or updater side effects.
  const loadRef = useRef<(uri: string) => void>(() => {});
  const idxRef = useRef(0);
  const orderRef = useRef<number[]>([]);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const next = useCallback(() => {
    if (!shuffleMode) return;
    let n = idxRef.current + 1;
    let ord = orderRef.current;
    if (n >= ord.length) {
      ord = shuffled(tracks.length);
      orderRef.current = ord;
      setOrder(ord);
      n = 0;
    }
    idxRef.current = n;
    setIdx(n);
    const uri = tracks[ord[n]]?.uri;
    if (uri) loadRef.current(uri);
  }, [shuffleMode, tracks]);

  const { status, load, togglePlay } = useSpotifyEmbed(hostRef, initialUri, next);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useOutsideClick(panelRef, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!data || data.mode === "off") return null;

  const playing = status.ready && !status.isPaused;
  const progress = status.duration ? (status.position / status.duration) * 100 : 0;

  return (
    <div ref={panelRef} className="relative">
      {/* nav pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={playing ? "Tico's Radio — now playing" : "Tico's Radio"}
        className={`relative flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
          playing
            ? "border-brand-violet/40 bg-brand-violet text-white"
            : "border-border bg-surface text-foreground hover:bg-foreground/5"
        }`}
      >
        {playing ? <Bars /> : <PlayGlyph />}
        <span className="hidden sm:inline">Radio</span>

        {playing && (
          <span aria-hidden className="pointer-events-none absolute right-0 top-1/2 h-0 w-0">
            {NOTES.map((n, i) => (
              <span
                key={i}
                className="absolute left-0 top-0 text-lg font-bold leading-none text-brand-violet drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
                style={{
                  animation: `note-float ${1.6 + (i % 3) * 0.3}s ease-out ${i * 0.35}s infinite`,
                  ["--dx" as string]: `${4 + (i % 3) * 6}px`,
                  ["--dy" as string]: `${-(22 + (i % 2) * 8)}px`,
                }}
              >
                {n}
              </span>
            ))}
          </span>
        )}
      </button>

      {/* popover — always mounted so the embed keeps playing when closed */}
      <motion.div
        initial={false}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        aria-hidden={!open}
        className={`absolute left-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-3rem))] origin-top-left rounded-2xl border border-border bg-surface p-3 shadow-card ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          {current?.albumArt ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art
            <img
              src={current.albumArt}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-foreground text-brand-lime">
              <PlayGlyph size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-violet">
              Tico&apos;s Radio
            </p>
            <p className="truncate font-display text-sm font-bold">
              {current?.name ?? "The playlist"}
            </p>
            <p className="truncate text-xs text-muted">
              {current?.artists ?? (shuffleMode ? "" : "Shuffle needs Spotify app keys")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!status.ready}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-9 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40"
          >
            {playing ? <PauseGlyph /> : <PlayGlyph size={14} />}
          </button>
          {shuffleMode && (
            <button
              type="button"
              onClick={next}
              disabled={!status.ready}
              aria-label="Shuffle to next track"
              className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-foreground/5 disabled:opacity-40"
            >
              <ShuffleGlyph />
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] tabular-nums text-muted">
            <span>{fmt(status.position)}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-brand-violet" style={{ width: `${progress}%` }} />
            </div>
            <span>{fmt(status.duration)}</span>
          </div>
        </div>

        <div ref={hostRef} className="mt-3 h-20 overflow-hidden rounded-xl bg-field" />

        <p className="mt-2 text-[10px] leading-snug text-ink-3">
          Full tracks play when you&apos;re signed in to Spotify in this browser; otherwise
          30-second previews.
          {current?.externalUrl && (
            <>
              {" "}
              <a
                href={current.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                Open in Spotify
              </a>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function PlayGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function ShuffleGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

function Bars() {
  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-current"
          style={{ animation: `eq-bar 0.9s ease-in-out ${i * 0.15}s infinite alternate` }}
        />
      ))}
    </span>
  );
}
