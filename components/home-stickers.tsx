"use client";

import StickerPeel from "@/components/StickerPeel";

/**
 * Peelable, draggable stickers scattered around the Home hero.
 * They're bounded to their parent, so drop this inside a `relative` section.
 */
export function HomeStickers() {
  return (
    <>
      <StickerPeel
        imageSrc="/stickers/launchabl-rocket.svg"
        width={150}
        rotate={-12}
        peelDirection={20}
        shadowIntensity={0.5}
        lightingIntensity={0.12}
        className="right-[6%] top-[14%] hidden lg:block"
      />
      <StickerPeel
        imageSrc="/stickers/star-glide.svg"
        width={130}
        rotate={10}
        peelDirection={-15}
        shadowIntensity={0.5}
        lightingIntensity={0.12}
        className="right-[24%] bottom-[8%] hidden md:block"
      />
      <StickerPeel
        imageSrc="/stickers/wip-bolt.svg"
        width={170}
        rotate={6}
        peelDirection={0}
        shadowIntensity={0.45}
        lightingIntensity={0.1}
        className="right-[2%] bottom-[18%] hidden xl:block"
      />
    </>
  );
}
