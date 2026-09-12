import {
  fetchPlaylistTracks,
  radioPlaylistId,
  spotifyCredentialsConfigured,
  type RadioTrack,
} from "@/lib/radio/spotify";

export type RadioTracksResponse = {
  mode: "shuffle" | "embed" | "off";
  playlistId: string | null;
  tracks: RadioTrack[];
};

export async function GET() {
  const playlistId = radioPlaylistId();
  if (!playlistId) {
    return Response.json(
      { mode: "off", playlistId: null, tracks: [] } satisfies RadioTracksResponse,
      { headers: { "cache-control": "public, max-age=300" } },
    );
  }

  if (!spotifyCredentialsConfigured()) {
    return Response.json(
      { mode: "embed", playlistId, tracks: [] } satisfies RadioTracksResponse,
      { headers: { "cache-control": "public, max-age=300" } },
    );
  }

  try {
    const tracks = await fetchPlaylistTracks(playlistId);
    return Response.json(
      { mode: tracks.length ? "shuffle" : "embed", playlistId, tracks } satisfies RadioTracksResponse,
      { headers: { "cache-control": "public, max-age=1800, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    console.error("[radio] playlist fetch failed", e instanceof Error ? e.message : e);
    // Credentials exist but Spotify said no — still give visitors the plain embed.
    return Response.json(
      { mode: "embed", playlistId, tracks: [] } satisfies RadioTracksResponse,
      { headers: { "cache-control": "public, max-age=120" } },
    );
  }
}
