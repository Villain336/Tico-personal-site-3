"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 620;
const GROUND_HEIGHT = 24;
const STAR_RADIUS = 16;
const STAR_X = LOGICAL_WIDTH * 0.28;
const GRAVITY = 1500; // px/s^2
const FLAP_VELOCITY = -420; // px/s
const MAX_FALL_SPEED = 620;
const BASE_GAP = 165;
const MIN_GAP = 105;
const BASE_SPEED = 150; // px/s
const MAX_SPEED = 300;
const OBSTACLE_INTERVAL = 1.5; // seconds between obstacles at base speed
const POINTS_PER_LEVEL = 5;
const BEST_SCORE_KEY = "star-glide-best-score";

type Obstacle = {
  x: number;
  gapCenter: number;
  gapHeight: number;
  passed: boolean;
};

type GameState = "idle" | "playing" | "gameover";

function levelForScore(score: number) {
  return Math.floor(score / POINTS_PER_LEVEL) + 1;
}

function difficultyForLevel(level: number) {
  const t = Math.min((level - 1) / 12, 1); // ramps over ~12 levels then caps
  const gap = BASE_GAP - (BASE_GAP - MIN_GAP) * t;
  const speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * t;
  return { gap, speed };
}

function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function StarGlideGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);

  const stateRef = useRef<GameState>("idle");
  const starYRef = useRef(LOGICAL_HEIGHT / 2);
  const starVYRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const timeSinceLastObstacleRef = useRef(0);
  const scoreRef = useRef(0);
  const starsBgRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const [, forceRender] = useState(0);
  const [muted, setMuted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [uiState, setUiState] = useState<GameState>("idle");
  const [uiScore, setUiScore] = useState(0);
  const [uiLevel, setUiLevel] = useState(1);

  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of a value that only exists in localStorage
    if (!Number.isNaN(stored)) setBestScore(stored);

    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * LOGICAL_WIDTH,
        y: Math.random() * (LOGICAL_HEIGHT - GROUND_HEIGHT),
        r: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
    starsBgRef.current = stars;
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback(
    (freq: number, duration: number, type?: OscillatorType) => {
      if (mutedRef.current) return;
      const ctx = ensureAudio();
      if (!ctx) return;
      playTone(ctx, freq, duration, type);
    },
    [ensureAudio],
  );

  const resetGame = useCallback(() => {
    starYRef.current = LOGICAL_HEIGHT / 2;
    starVYRef.current = 0;
    obstaclesRef.current = [];
    timeSinceLastObstacleRef.current = 0;
    scoreRef.current = 0;
    setUiScore(0);
    setUiLevel(1);
  }, []);

  const startGame = useCallback(() => {
    ensureAudio();
    resetGame();
    stateRef.current = "playing";
    setUiState("playing");
  }, [ensureAudio, resetGame]);

  const flap = useCallback(() => {
    if (stateRef.current === "idle") {
      startGame();
      return;
    }
    if (stateRef.current === "gameover") {
      startGame();
      return;
    }
    starVYRef.current = FLAP_VELOCITY;
    beep(520, 0.08);
  }, [beep, startGame]);

  const endGame = useCallback(() => {
    stateRef.current = "gameover";
    setUiState("gameover");
    beep(140, 0.35, "sawtooth");
    const finalScore = scoreRef.current;
    setBestScore((prev) => {
      if (finalScore > prev) {
        localStorage.setItem(BEST_SCORE_KEY, String(finalScore));
        return finalScore;
      }
      return prev;
    });
  }, [beep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.min(container.clientWidth, LOGICAL_WIDTH);
      const scale = displayWidth / LOGICAL_WIDTH;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${LOGICAL_HEIGHT * scale}px`;
      canvas.width = LOGICAL_WIDTH * dpr;
      canvas.height = LOGICAL_HEIGHT * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function drawStarOfDavid(x: number, y: number, r: number) {
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.shadowColor = "#d7ff3e";
      ctx!.shadowBlur = 14;
      ctx!.fillStyle = "#d7ff3e";
      ctx!.strokeStyle = "#12121a";
      ctx!.lineWidth = 1.5;
      for (const rot of [0, Math.PI]) {
        ctx!.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = rot + (Math.PI * 2 * i) / 3 - Math.PI / 2;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawBird(x: number, y: number, flip: boolean, t: number) {
      ctx!.save();
      ctx!.translate(x, y);
      if (flip) ctx!.scale(1, -1);
      ctx!.fillStyle = "#12121a";
      const wingFlap = Math.sin(t * 10) * 6;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.moveTo(-4, 0);
      ctx!.lineTo(-20, -6 + wingFlap);
      ctx!.lineTo(-4, 6);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = "#ff5b4a";
      ctx!.beginPath();
      ctx!.moveTo(14, -2);
      ctx!.lineTo(22, 0);
      ctx!.lineTo(14, 3);
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
    }

    function step(ts: number) {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min((ts - last) / 1000, 1 / 30);
      lastTsRef.current = ts;

      // Background
      ctx!.fillStyle = "#0b0b16";
      ctx!.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      const g = ctx!.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      g.addColorStop(0, "#171733");
      g.addColorStop(1, "#0b0b16");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      for (const star of starsBgRef.current) {
        const twinkle = 0.5 + 0.5 * Math.sin(ts / 500 + star.phase);
        ctx!.fillStyle = `rgba(255,255,255,${0.3 + twinkle * 0.5})`;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      const level = levelForScore(scoreRef.current);
      const { gap, speed } = difficultyForLevel(level);

      if (stateRef.current === "playing") {
        starVYRef.current = Math.min(
          starVYRef.current + GRAVITY * dt,
          MAX_FALL_SPEED,
        );
        starYRef.current += starVYRef.current * dt;

        timeSinceLastObstacleRef.current += dt;
        const interval = OBSTACLE_INTERVAL * (BASE_SPEED / speed);
        if (timeSinceLastObstacleRef.current >= interval) {
          timeSinceLastObstacleRef.current = 0;
          const margin = 80;
          const gapCenter =
            margin + Math.random() * (LOGICAL_HEIGHT - GROUND_HEIGHT - margin * 2);
          obstaclesRef.current.push({
            x: LOGICAL_WIDTH + 20,
            gapCenter,
            gapHeight: gap,
            passed: false,
          });
        }

        for (const ob of obstaclesRef.current) {
          ob.x -= speed * dt;
        }
        obstaclesRef.current = obstaclesRef.current.filter(
          (ob) => ob.x > -40,
        );

        for (const ob of obstaclesRef.current) {
          if (!ob.passed && ob.x < STAR_X) {
            ob.passed = true;
            scoreRef.current += 1;
            setUiScore(scoreRef.current);
            const newLevel = levelForScore(scoreRef.current);
            if (newLevel !== level) setUiLevel(newLevel);
            beep(880, 0.07);
          }
        }

        const groundY = LOGICAL_HEIGHT - GROUND_HEIGHT;
        let collided = false;
        if (starYRef.current + STAR_RADIUS >= groundY) {
          starYRef.current = groundY - STAR_RADIUS;
          collided = true;
        }
        if (starYRef.current - STAR_RADIUS <= 0) {
          starYRef.current = STAR_RADIUS;
          collided = true;
        }
        for (const ob of obstaclesRef.current) {
          const withinX =
            STAR_X + STAR_RADIUS > ob.x - 22 && STAR_X - STAR_RADIUS < ob.x + 22;
          if (!withinX) continue;
          const topEdge = ob.gapCenter - ob.gapHeight / 2;
          const bottomEdge = ob.gapCenter + ob.gapHeight / 2;
          if (
            starYRef.current - STAR_RADIUS < topEdge ||
            starYRef.current + STAR_RADIUS > bottomEdge
          ) {
            collided = true;
          }
        }
        if (collided) {
          endGame();
        }
      }

      // Obstacles (birds)
      for (const ob of obstaclesRef.current) {
        const topEdge = ob.gapCenter - ob.gapHeight / 2;
        const bottomEdge = ob.gapCenter + ob.gapHeight / 2;
        for (let y = topEdge; y > -20; y -= 34) {
          drawBird(ob.x, y - 12, true, ts / 1000 + ob.x);
        }
        for (let y = bottomEdge; y < LOGICAL_HEIGHT - GROUND_HEIGHT + 20; y += 34) {
          drawBird(ob.x, y + 12, false, ts / 1000 + ob.x);
        }
      }

      // Ground
      ctx!.fillStyle = "#1c1c2e";
      ctx!.fillRect(0, LOGICAL_HEIGHT - GROUND_HEIGHT, LOGICAL_WIDTH, GROUND_HEIGHT);

      // Star
      drawStarOfDavid(STAR_X, starYRef.current, STAR_RADIUS);

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKey);
    };
  }, [flap, endGame, beep]);

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[400px]">
      <div className="mb-3 flex items-center justify-between text-sm text-white">
        <div className="flex gap-4">
          <span className="font-display font-bold">Score: {uiScore}</span>
          <span className="text-white/70">Level {uiLevel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/70">Best: {bestScore}</span>
          <button
            type="button"
            onClick={() => {
              const next = !mutedRef.current;
              mutedRef.current = next;
              setMuted(next);
              forceRender((n) => n + 1);
            }}
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium hover:bg-white/10"
            aria-pressed={muted}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerDown={flap}
          className="block cursor-pointer touch-none select-none bg-[#0b0b16]"
        />

        {uiState !== "playing" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center text-white">
            {uiState === "idle" && (
              <>
                <p className="font-display text-2xl font-bold">Star Glide</p>
                <p className="mt-2 max-w-[240px] text-sm text-white/80">
                  Tap, click, or press Space to glide.
                </p>
                <p className="mt-4 rounded-full bg-brand-lime px-5 py-2 text-sm font-semibold text-foreground">
                  Tap to start
                </p>
              </>
            )}
            {uiState === "gameover" && (
              <>
                <p className="font-display text-2xl font-bold">Game Over</p>
                <p className="mt-2 text-sm text-white/80">
                  Score: {uiScore} · Best: {bestScore}
                </p>
                <p className="mt-4 rounded-full bg-brand-lime px-5 py-2 text-sm font-semibold text-foreground">
                  Tap to retry
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
