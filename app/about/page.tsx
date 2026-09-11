import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { CredentialPlaques } from "@/components/credential-plaques";
import { GoalsTimeline } from "@/components/goals-timeline";
import { aboutCopy } from "@/content/copy";
import { credentials } from "@/content/credentials";

export const metadata: Metadata = {
  title: "About Me",
  description: aboutCopy.sub,
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow={aboutCopy.eyebrow}
        heading={aboutCopy.heading}
        sub={aboutCopy.sub}
      />

      <div className="mx-auto max-w-3xl px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {["My Story", "Accomplishments"].map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center"
            >
              <p className="font-display text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted">Coming soon</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goals — Aceternity timeline */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <GoalsTimeline />
      </section>

      {/* Certifications & badges — gold glare-card plaques */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">
            Certifications & Badges
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight">
            The wall of gold.
          </h2>
          <p className="mt-3 text-sm text-muted">
            {credentials.length === 0
              ? "Plaques unlock as certifications and courses get completed. Hover to see them shine."
              : "Every plaque here was earned. Hover to see them shine."}
          </p>
        </div>
        <CredentialPlaques />
      </section>
    </div>
  );
}
