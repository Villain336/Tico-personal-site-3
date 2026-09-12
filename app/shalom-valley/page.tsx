import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ValleyApp } from "@/components/valley/valley-app";
import { valleyCopy } from "@/content/valley";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Shalom Valley — Free Browser Tycoon Defense Game",
  description:
    "Build a biblical-era village, grow and sell crops, house villagers, pray at the altar and defend against robbers, tempters, deceivers, spirits and false prophets. Free pixel-art tycoon defense game in your browser — no download, saves locally.",
  alternates: { canonical: `${site.url}/shalom-valley` },
  openGraph: {
    title: "Shalom Valley — build, multiply, push back the dark",
    description:
      "A free top-down pixel tycoon-defense game by Tico Hamphill. Earn by day, defend by night, and light up the valley.",
    url: `${site.url}/shalom-valley`,
    type: "website",
  },
};

export default function ShalomValleyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: "Shalom Valley",
        url: `${site.url}/shalom-valley`,
        description: metadata.description,
        genre: ["Tycoon", "Tower defense", "Simulation"],
        gamePlatform: "Web browser",
        applicationCategory: "Game",
        operatingSystem: "Any",
        playMode: "SinglePlayer",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: site.name, url: site.url },
        publisher: { "@type": "Organization", name: site.agency },
      },
      {
        "@type": "FAQPage",
        mainEntity: valleyCopy.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader eyebrow={valleyCopy.eyebrow} heading={valleyCopy.heading} sub={valleyCopy.sub} />

      <div className="mx-auto max-w-5xl px-6 pb-20">
        <ValleyApp />
        <p className="mt-4 text-center text-sm text-muted">{valleyCopy.instructions}</p>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">{valleyCopy.howHeading}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {valleyCopy.how.map((h, i) => (
              <div key={h.title} className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">Step {i + 1}</p>
                <h3 className="mt-2 font-semibold">{h.title}</h3>
                <p className="mt-1 text-sm text-muted">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">{valleyCopy.enemiesHeading}</h2>
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {valleyCopy.enemies.map((e) => (
              <li key={e.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
                <span className="w-32 shrink-0 font-semibold">{e.name}</span>
                <span className="text-sm text-muted">{e.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">FAQ</h2>
          <div className="mt-6 space-y-4">
            {valleyCopy.faq.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-surface px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold">{f.q}</summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
