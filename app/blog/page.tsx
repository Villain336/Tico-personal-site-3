import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { BlogExpandableCards } from "@/components/blog-expandable-cards";
import { blogCopy } from "@/content/copy";

export const metadata: Metadata = {
  title: "Blog",
  description: blogCopy.sub,
};

export default function BlogPage() {
  return (
    <div>
      <PageHeader
        eyebrow={blogCopy.eyebrow}
        heading={blogCopy.heading}
        sub={blogCopy.sub}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <BlogExpandableCards />
      </div>
    </div>
  );
}
