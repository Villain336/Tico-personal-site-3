import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { starGlideCopy } from "@/content/copy";
import { StarGlideGame } from "@/components/game/star-glide-game";

export const metadata: Metadata = {
  title: "Star Glide",
  description: starGlideCopy.sub,
};

export default function StarGlidePage() {
  return (
    <div>
      <PageHeader
        eyebrow={starGlideCopy.eyebrow}
        heading={starGlideCopy.heading}
        sub={starGlideCopy.sub}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <StarGlideGame />
      </div>
    </div>
  );
}
