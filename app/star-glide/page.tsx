import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { Vortex } from "@/components/ui/vortex";
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
        <div className="overflow-hidden rounded-3xl border border-border shadow-lg">
          <Vortex
            backgroundColor="#0b0b16"
            baseHue={230}
            rangeY={220}
            particleCount={450}
            baseSpeed={0.1}
            rangeSpeed={1.2}
            containerClassName="min-h-[780px] w-full"
            className="flex h-full w-full flex-col items-center justify-center px-4 py-10"
          >
            <StarGlideGame />
          </Vortex>
        </div>
      </div>
    </div>
  );
}
