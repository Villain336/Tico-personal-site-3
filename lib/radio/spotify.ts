import { site } from "@/content/site";

export type RadioTrack = {
  uri: string;
  name: string;
  artists: string;
  albumArt: string | null;
  durationMs: number;
  externalUrl: string | null;
};

export function playlistIdFromUrl(url: string): string | null {
  const m = url.trim().match(/playlist[/:]([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

export function radioPlaylistId(): string | null {
  return site.spotifyPlaylistUrl ? playlistIdFromUrl(site.spotifyPlaylistUrl) : null;
}

export function spotifyCredentialsConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function accessToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // Tokens last an hour; let Next cache the response for most of it.
    next: { revalidate: 50 * 60 },
  });
  if (!res.ok) throw new Error(`Spotify token request failed (${res.status})`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

type PlaylistPage = {
  items: {
    track: {
      uri: string;
      name: string;
      duration_ms: number;
      is_local?: boolean;
      artists: { name: string }[];
      album: { images: { url: string; width: number }[] };
      external_urls?: { spotify?: string };
    } | null;
  }[];
  next: string | null;
};

/** Reads every track in the configured public playlist (client-credentials flow). */
export async function fetchPlaylistTracks(playlistId: string): Promise<RadioTrack[]> {
  const token = await accessToken();
  const fields =
    "items(track(uri,name,duration_ms,is_local,artists(name),album(images),external_urls)),next";
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=${encodeURIComponent(fields)}`;
  const out: RadioTrack[] = [];

  while (url && out.length < 500) {
    const res: Response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      next: { revalidate: 60 * 60 },
    });
    if (!res.ok) throw new Error(`Spotify playlist request failed (${res.status})`);
    const page = (await res.json()) as PlaylistPage;
    for (const item of page.items) {
      const t = item.track;
      if (!t || t.is_local || !t.uri.startsWith("spotify:track:")) continue;
      const art = [...(t.album.images ?? [])].sort((a, b) => a.width - b.width);
      out.push({
        uri: t.uri,
        name: t.name,
        artists: t.artists.map((a) => a.name).join(", "),
        albumArt: art.find((i) => i.width >= 200)?.url ?? art.at(-1)?.url ?? null,
        durationMs: t.duration_ms,
        externalUrl: t.external_urls?.spotify ?? null,
      });
    }
    url = page.next;
  }
  return out;
}
