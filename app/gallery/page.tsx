import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { GalleryView } from "@/components/gallery/gallery-view";
import { artworks, galleryCopy, musicTracks } from "@/content/gallery";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Gallery — Art & Music",
  description: galleryCopy.sub,
  alternates: { canonical: `${site.url}/gallery` },
  openGraph: {
    title: "Tico Hamphill — Art & Music Gallery",
    description: galleryCopy.sub,
    url: `${site.url}/gallery`,
    type: "website",
  },
};

export default function GalleryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tico Hamphill — Gallery",
    url: `${site.url}/gallery`,
    description: galleryCopy.sub,
    author: { "@type": "Person", name: site.name, url: site.url },
    hasPart: [
      {
        "@type": "ImageGallery",
        name: "Art",
        image: artworks.map((a) => ({
          "@type": "ImageObject",
          name: a.title,
          contentUrl: `${site.url}${a.src}`,
          description: a.description,
          creator: { "@type": "Person", name: site.name },
        })),
      },
      ...(musicTracks.length
        ? [
            {
              "@type": "MusicPlaylist",
              name: "Tracks",
              track: musicTracks.map((t) => ({
                "@type": "MusicRecording",
                name: t.title,
                url: `${site.url}${t.src}`,
                byArtist: { "@type": "Person", name: site.name },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow={galleryCopy.eyebrow}
        heading={galleryCopy.heading}
        sub={galleryCopy.sub}
      />
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <GalleryView art={artworks} music={musicTracks} />
      </div>
    </div>
  );
}
