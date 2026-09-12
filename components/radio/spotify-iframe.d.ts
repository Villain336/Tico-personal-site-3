/* Minimal typings for Spotify's iFrame API
 * (https://developer.spotify.com/documentation/embeds/references/iframe-api). */

export type SpotifyPlaybackUpdate = {
  data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
};

export interface SpotifyEmbedController {
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  seek(seconds: number): void;
  destroy(): void;
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: SpotifyPlaybackUpdate) => void): void;
  addListener(event: "playback_started", cb: () => void): void;
  removeListener(event: "ready" | "playback_update" | "playback_started"): void;
}

export interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number; theme?: string },
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    __spotifyIframeApi?: SpotifyIFrameAPI;
  }
}
