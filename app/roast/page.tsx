import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RoastTool } from "@/components/roast/roast-tool";
import { roastCopy } from "@/content/roast";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Free Landing Page Roaster — AI Website Audit",
  description:
    "Paste a URL and get a brutally honest AI roast of your landing page: scores for copy, design, conversion and SEO/AIO, plus three prioritized fixes. Free, no signup, nothing stored.",
  alternates: { canonical: `${site.url}/roast` },
  openGraph: {
    title: "Get your landing page roasted",
    description:
      "A free AI landing page audit that's funny on purpose and useful by design. Built by Tico Hamphill of Launchabl.",
    url: `${site.url}/roast`,
    type: "website",
  },
};

export default function RoastPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Landing Page Roaster",
        url: `${site.url}/roast`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: metadata.description,
        author: { "@type": "Person", name: site.name, url: site.url },
        publisher: { "@type": "Organization", name: site.agency },
      },
      {
        "@type": "FAQPage",
        mainEntity: roastCopy.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        eyebrow={roastCopy.eyebrow}
        heading={roastCopy.heading}
        sub={roastCopy.sub}
      />

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <RoastTool />

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {roastCopy.howItWorks.map((step, i) => (
            <div key={step.title} className="rounded-3xl border border-border bg-surface p-6">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-violet font-display text-sm font-bold text-white">
                {i + 1}
              </span>
              <h2 className="font-display mt-4 text-xl font-bold leading-tight">{step.title}</h2>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Questions people ask before pasting their URL.
          </h2>
          <dl className="mt-8 divide-y divide-border">
            {roastCopy.faq.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-display text-lg font-bold">{f.q}</dt>
                <dd className="mt-2 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
