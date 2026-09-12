/**
 * Gallery content.
 *
 * TODO(Tico): replace the placeholder pieces with real work. Drop images into
 * public/gallery/ and audio into public/audio/, then describe them here. If
 * the audio library gets large (>~50 MB total), move files to Vercel Blob and
 * point `src` at the blob URLs instead of the repo.
 */

export type Artwork = {
  slug: string;
  title: string;
  year: number;
  medium: string;
  description: string;
  src: string;
  width: number;
  height: number;
  placeholder?: boolean;
};

export type MusicTrack = {
  slug: string;
  title: string;
  description?: string;
  src: string;
  cover?: string;
  durationSec?: number;
  year?: number;
};

export const galleryCopy = {
  eyebrow: "Gallery",
  heading: "Art and sound, straight from the studio.",
  sub: "The visual and musical side of what I make — pieces, experiments, and tracks. Everything here is original work.",
  artHeading: "Pieces",
  musicHeading: "Tracks",
  musicEmpty:
    "The music is on its way. Tico's tracks drop here — with a player built for them.",
  filters: [
    { key: "all", label: "All" },
    { key: "art", label: "Art" },
    { key: "music", label: "Music" },
  ] as const,
};

export type GalleryFilter = (typeof galleryCopy.filters)[number]["key"];

export const artworks: Artwork[] = [
  {
    slug: "orbit-01",
    title: "Orbit Study I",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Composition study in the site's violet and lime.",
    src: "/gallery/orbit-01.svg",
    width: 800,
    height: 1000,
    placeholder: true,
  },
  {
    slug: "signal-02",
    title: "Signal",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Coral strokes on near-black.",
    src: "/gallery/signal-02.svg",
    width: 1000,
    height: 800,
    placeholder: true,
  },
  {
    slug: "plaque-03",
    title: "Plaque",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Gold and ink on parchment.",
    src: "/gallery/plaque-03.svg",
    width: 800,
    height: 800,
    placeholder: true,
  },
  {
    slug: "launch-04",
    title: "Launch Sequence",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Vertical, violet field.",
    src: "/gallery/launch-04.svg",
    width: 800,
    height: 1100,
    placeholder: true,
  },
  {
    slug: "glide-05",
    title: "Glide",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Magenta drift across deep space — a Star Glide mood board.",
    src: "/gallery/glide-05.svg",
    width: 1000,
    height: 700,
    placeholder: true,
  },
  {
    slug: "grid-06",
    title: "Grid Break",
    year: 2026,
    medium: "Digital · vector",
    description: "Placeholder piece. Ink shapes escaping a lime grid.",
    src: "/gallery/grid-06.svg",
    width: 800,
    height: 900,
    placeholder: true,
  },
];

/** Empty until Tico hands over audio files — the page shows a tasteful empty state. */
export const musicTracks: MusicTrack[] = [];
