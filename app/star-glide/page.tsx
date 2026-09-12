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
      <div className="mx-auto max-w-5xl px-6 pb-20">
        {/* The vortex IS the playfield: the game draws on a transparent
            canvas layered directly over it. */}
        <div className="overflow-hidden rounded-3xl border border-border shadow-2xl">
          <Vortex
            backgroundColor="#0b0b16"
            baseHue={230}
            rangeY={260}
            particleCount={420}
            baseSpeed={0.1}
            rangeSpeed={1.1}
            containerClassName="h-[640px] w-full sm:h-[680px]"
            className="h-full w-full"
          >
            <StarGlideGame />
          </Vortex>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {starGlideCopy.instructions}
        </p>
      </div>
    </div>
  );
}
