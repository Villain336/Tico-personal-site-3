import Link from "next/link";
import { Button, Eyebrow } from "@/components/ui";
import { TiltCard } from "@/components/tilt-card";
import { HeroMotion } from "@/components/hero-motion";
import { HomeStickers } from "@/components/home-stickers";
import { TwitterButton } from "@/components/twitter-button";
import { homeCopy } from "@/content/copy";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="brand-gradient absolute -top-40 right-[-10%] h-96 w-96 rounded-full opacity-30 blur-3xl sm:h-[32rem] sm:w-[32rem]"
        />
        <div className="mx-auto flex max-w-6xl flex-col items-start px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <HeroMotion>
            <Eyebrow>{homeCopy.eyebrow}</Eyebrow>
            <h1 className="font-display mt-4 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
              {homeCopy.heading}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              {homeCopy.sub}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={homeCopy.ctaPrimary.href}>
                {homeCopy.ctaPrimary.label}
              </Button>
              <Button href={homeCopy.ctaSecondary.href} variant="secondary">
                {homeCopy.ctaSecondary.label}
              </Button>
              <TwitterButton />
            </div>
          </HeroMotion>
        </div>
        {/* Peelable stickers — drag them around */}
        <HomeStickers />
      </section>

      {/* World intro */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <TiltCard className="rounded-3xl border border-border bg-surface p-10 shadow-sm sm:p-14">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {homeCopy.worldHeading}
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
            {homeCopy.worldBody}
          </p>
        </TiltCard>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {homeCopy.highlights.map((h, i) => (
            <Link
              key={h.href}
              href={h.href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-foreground/20"
            >
              <span
                aria-hidden
                className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-70 blur-2xl transition-transform group-hover:scale-125 ${
                  ["bg-brand-lime", "bg-brand-violet/40", "bg-brand-coral/40", "bg-brand-lime"][
                    i % 4
                  ]
                }`}
              />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {h.label}
              </p>
              <h3 className="font-display mt-2 text-xl font-bold">
                {h.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{h.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                Explore
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Launchabl CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-foreground px-8 py-12 text-background sm:px-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-lime">
            Launchabl
          </p>
          <p className="font-display mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
            {homeCopy.launchablBlurb}
          </p>
        </div>
      </section>
    </div>
  );
}
