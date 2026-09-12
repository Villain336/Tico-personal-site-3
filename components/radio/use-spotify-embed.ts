"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpotifyEmbedController, SpotifyIFrameAPI } from "./spotify-iframe";

const SCRIPT_SRC = "https://open.spotify.com/embed/iframe-api/v1";

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

function loadIframeApi(): Promise<SpotifyIFrameAPI> {
  if (window.__spotifyIframeApi) return Promise.resolve(window.__spotifyIframeApi);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = (api) => {
      window.__spotifyIframeApi = api;
      resolve(api);
    };
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export type EmbedStatus = {
  ready: boolean;
  isPaused: boolean;
  position: number;
  duration: number;
};

/**
 * Mounts one Spotify embed into `hostRef` and exposes its controller plus
 * live playback state. `onTrackEnd` fires once when the current item plays
 * out, which is what lets us implement shuffle on top of the embed.
 */
export function useSpotifyEmbed(
  hostRef: React.RefObject<HTMLDivElement | null>,
  initialUri: string | null,
  onTrackEnd?: () => void,
) {
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const endFiredRef = useRef(false);
  const onTrackEndRef = useRef(onTrackEnd);
  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

  const [status, setStatus] = useState<EmbedStatus>({
    ready: false,
    isPaused: true,
    position: 0,
    duration: 0,
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !initialUri) return;
    let cancelled = false;
    let controller: SpotifyEmbedController | null = null;

    // createController replaces the element it is given, so hand it a child
    // we own rather than the React-managed host node.
    const mount = document.createElement("div");
    host.appendChild(mount);

    loadIframeApi().then((api) => {
      if (cancelled) return;
      api.createController(
        mount,
        { uri: initialUri, width: "100%", height: 80 },
        (c) => {
          controller = c;
          controllerRef.current = c;
          c.addListener("ready", () => setStatus((s) => ({ ...s, ready: true })));
          c.addListener("playback_update", (e) => {
            const { isPaused, position, duration } = e.data;
            setStatus({ ready: true, isPaused, position, duration });
            const nearEnd = duration > 0 && position >= duration - 1200;
            if (nearEnd && isPaused && !endFiredRef.current) {
              endFiredRef.current = true;
              onTrackEndRef.current?.();
            } else if (!nearEnd && position < duration - 5000) {
              endFiredRef.current = false;
            }
          });
        },
      );
    });

    return () => {
      cancelled = true;
      controller?.destroy();
      controllerRef.current = null;
      host.innerHTML = "";
    };
  }, [hostRef, initialUri]);

  const load = useCallback((uri: string) => {
    endFiredRef.current = false;
    controllerRef.current?.loadUri(uri);
    controllerRef.current?.play();
  }, []);

  const togglePlay = useCallback(() => controllerRef.current?.togglePlay(), []);
  const play = useCallback(() => controllerRef.current?.play(), []);
  const pause = useCallback(() => controllerRef.current?.pause(), []);

  return { status, load, togglePlay, play, pause };
}
