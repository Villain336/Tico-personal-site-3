import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Tag } from "@/components/ui";
import { workCopy } from "@/content/copy";
import { caseStudies } from "@/content/work";

export const metadata: Metadata = {
  title: "Work",
  description: workCopy.sub,
};

function Group({
  label,
  items,
}: {
  label: string;
  items: typeof caseStudies;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-14">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
        {label}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/work/${c.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-foreground/20"
          >
            <div className="flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <h3 className="font-display mt-4 text-lg font-bold">{c.title}</h3>
            <p className="mt-2 text-sm text-muted">{c.summary}</p>
            {c.placeholder && (
              <p className="mt-3 text-xs font-medium text-brand-coral">
                Placeholder — swap with a real project
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              View
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function WorkPage() {
  const shipped = caseStudies.filter((c) => c.status === "shipped");
  const wip = caseStudies.filter((c) => c.status === "wip");

  return (
    <div>
      <PageHeader
        eyebrow={workCopy.eyebrow}
        heading={workCopy.heading}
        sub={workCopy.sub}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <Group label={workCopy.shippedLabel} items={shipped} />
        <Group label={workCopy.wipLabel} items={wip} />
      </div>
    </div>
  );
}
