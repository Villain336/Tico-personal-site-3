import type { Metadata } from "next";
import { ValleyPlayShell } from "@/components/valley/valley-play-shell";
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
    <div className="h-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.valleyPlay="1"`,
        }}
      />
      <ValleyPlayShell />
    </div>
  );
}
