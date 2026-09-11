"use client";

/* Beautiful UI (beautifului.dev) "Loading State" — Drive variant:
 * a 3×3 pixel grid with a chevron wavefront plus a shimmering label. */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3),
    c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

export function PixelLoader({ label = "Thinking" }: { label?: string }) {
  return (
    <div role="status" className="flex w-fit items-center gap-2.5">
      <span
        aria-hidden
        className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]"
      >
        {chevron.map((delay, index) => (
          <span
            key={index}
            className="size-[4px] rounded-[1px] bg-ink"
            style={{
              opacity: 0.15,
              animation: `pixel-on 650ms ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </span>
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-text 1.4s linear infinite",
        }}
      >
        {label}
      </span>
    </div>
  );
}
