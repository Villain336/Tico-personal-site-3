import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { GemsGrid } from "@/components/gems-grid";
import { gemsCopy } from "@/content/copy";

export const metadata: Metadata = {
  title: "Gems",
  description: gemsCopy.sub,
};

export default function GemsPage() {
  return (
    <div>
      <PageHeader
        eyebrow={gemsCopy.eyebrow}
        heading={gemsCopy.heading}
        sub={gemsCopy.sub}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <GemsGrid />
      </div>
    </div>
  );
}
