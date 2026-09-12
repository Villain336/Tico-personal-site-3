"use client";

import { useState } from "react";
import { ArtGrid } from "@/components/gallery/art-grid";
import { MusicPlayer } from "@/components/gallery/music-player";
import { galleryCopy, type Artwork, type GalleryFilter, type MusicTrack } from "@/content/gallery";

export function GalleryView({ art, music }: { art: Artwork[]; music: MusicTrack[] }) {
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const showArt = filter !== "music";
  const showMusic = filter !== "art";

  return (
    <div className="space-y-14">
      <div className="flex flex-wrap justify-center gap-2">
        {galleryCopy.filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-foreground text-background"
                : "border border-border bg-surface hover:bg-foreground/5"
            }`}
          >
            {f.label}
            <span className="ml-2 text-xs opacity-60">
              {f.key === "all" ? art.length + music.length : f.key === "art" ? art.length : music.length}
            </span>
          </button>
        ))}
      </div>

      {showArt && (
        <section>
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">
            {galleryCopy.artHeading}
          </h2>
          <ArtGrid pieces={art} />
        </section>
      )}

      {showMusic && (
        <section>
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">
            {galleryCopy.musicHeading}
          </h2>
          <MusicPlayer tracks={music} />
        </section>
      )}
    </div>
  );
}
