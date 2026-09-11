import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui";
import { caseStudies } from "@/content/work";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = caseStudies.find((c) => c.slug === slug);
  if (!item) return {};
  return { title: item.title, description: item.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = caseStudies.find((c) => c.slug === slug);
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <h1 className="font-display mt-4 text-4xl font-bold tracking-tight">
        {item.title}
      </h1>
      <p className="mt-4 text-lg text-muted">{item.summary}</p>

      {item.placeholder && (
        <div className="mt-6 rounded-2xl border border-brand-coral/40 bg-brand-coral/5 p-4 text-sm text-foreground/80">
          This is placeholder content. Replace with the real problem,
          approach, and results for this project.
        </div>
      )}

      <div className="mt-10 space-y-8">
        {item.problem && (
          <section>
            <h2 className="font-display text-xl font-bold">The Problem</h2>
            <p className="mt-2 text-muted">{item.problem}</p>
          </section>
        )}
        {item.approach && (
          <section>
            <h2 className="font-display text-xl font-bold">The Approach</h2>
            <p className="mt-2 text-muted">{item.approach}</p>
          </section>
        )}
        {item.results && (
          <section>
            <h2 className="font-display text-xl font-bold">The Results</h2>
            <p className="mt-2 text-muted">{item.results}</p>
          </section>
        )}
      </div>
    </article>
  );
}
