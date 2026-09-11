"use client";

import { MagneticButton } from "@/components/ui/magnetic-button";
import { site } from "@/content/site";

function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TwitterButton({
  label = "Follow @PushinSaas",
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm";
  return (
    <MagneticButton className="p-1">
      <a
        href={site.socials.twitter}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${label} on X (Twitter)`}
        className={`inline-flex items-center gap-2 rounded-full bg-foreground font-semibold text-background ring-1 ring-white/20 ring-inset transition-transform duration-150 active:scale-[0.98] ${padding}`}
      >
        <XLogo className="h-4 w-4" />
        {label}
      </a>
    </MagneticButton>
  );
}
