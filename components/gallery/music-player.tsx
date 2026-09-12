"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MusicTrack } from "@/content/gallery";
import { galleryCopy } from "@/content/gallery";

function fmt(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function shuffledOrder(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Player for Tico's own hosted tracks: play all, shuffle, scrub, visualizer. */
export function MusicPlayer({ tracks }: { tracks: MusicTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const order = useMemo(
    () => (shuffle ? shuffledOrder(tracks.length) : tracks.map((_, i) => i)),
    [shuffle, tracks],
  );

  const track = tracks[current];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => next();
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `next` is stable enough; listeners re-bind per track anyway
  }, [current]);

  function playIndex(i: number) {
    setCurrent(i);
    setTime(0);
    // Let React swap the src before playing.
    requestAnimationFrame(() => {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    });
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function next() {
    const pos = order.indexOf(current);
    playIndex(order[(pos + 1) % order.length]);
  }

  function prev() {
    const pos = order.indexOf(current);
    playIndex(order[(pos - 1 + order.length) % order.length]);
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto flex h-10 items-end justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1.5 rounded-sm bg-brand-violet/40"
              style={{ height: `${8 + ((i * 7) % 20)}px` }}
            />
          ))}
        </div>
        <p className="mt-4 font-display text-lg font-bold">{galleryCopy.musicEmpty}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-3xl border border-border bg-surface p-5 shadow-card md:grid-cols-[1fr_1.3fr] md:p-6">
      <audio ref={audioRef} src={track?.src} preload="metadata" />

      {/* now playing */}
      <div className="flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-foreground">
          {track?.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- covers may be remote later
            <img src={track.cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-end justify-center gap-1 p-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="w-full rounded-sm bg-brand-lime"
                  style={{
                    height: playing ? undefined : "12%",
                    animation: playing
                      ? `eq-bar ${0.6 + (i % 5) * 0.13}s ease-in-out ${i * 0.05}s infinite alternate`
                      : "none",
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
          Now playing
        </p>
        <p className="font-display mt-1 text-xl font-bold">{track?.title}</p>
        {track?.description && <p className="mt-1 text-sm text-muted">{track.description}</p>}

        <div className="mt-4 flex items-center gap-2 text-[11px] tabular-nums text-muted">
          <span>{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) a.currentTime = Number(e.target.value);
            }}
            aria-label="Seek"
            className="flex-1 accent-brand-violet"
          />
          <span>{fmt(duration)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={prev} aria-label="Previous" className={ctl}>
            ‹
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-11 items-center justify-center rounded-full bg-foreground text-background"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button type="button" onClick={next} aria-label="Next" className={ctl}>
            ›
          </button>
          <button
            type="button"
            onClick={() => setShuffle((s) => !s)}
            aria-pressed={shuffle}
            className={`ml-auto rounded-full border px-3 py-1.5 text-xs font-semibold ${
              shuffle ? "border-brand-violet bg-brand-violet text-white" : "border-border"
            }`}
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* track list */}
      <ol className="divide-y divide-border">
        {tracks.map((t, i) => {
          const active = i === current;
          return (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => (active ? toggle() : playIndex(i))}
                className={`flex w-full items-center gap-4 px-2 py-3 text-left transition-colors hover:bg-foreground/[0.03] ${
                  active ? "text-foreground" : "text-foreground/80"
                }`}
              >
                <span className="w-6 text-center text-xs tabular-nums text-muted">
                  {active && playing ? "▮" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-bold">{t.title}</span>
                  {t.description && (
                    <span className="block truncate text-xs text-muted">{t.description}</span>
                  )}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {t.durationSec ? fmt(t.durationSec) : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const ctl =
  "flex size-9 items-center justify-center rounded-full border border-border text-lg hover:bg-foreground/5";
