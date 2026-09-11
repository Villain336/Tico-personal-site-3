import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
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
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {["My Story", "Goals", "Accomplishments"].map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center"
            >
              <p className="font-display text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted">Coming soon</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">
            Certifications & Badges
          </h2>
          {credentials.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              No badges yet — this section fills in automatically as
              certifications are completed. Check back soon.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {credentials.map((c) => (
                <div
                  key={c.name}
                  className="rounded-2xl border border-border bg-surface p-5 text-center"
                >
                  <p className="font-display text-sm font-bold">{c.name}</p>
                  <p className="mt-1 text-xs text-muted">{c.issuer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
