import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, Tag } from "@/components/ui";
import { blogCopy } from "@/content/copy";
import { posts } from "@/content/blog";

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
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-foreground/20"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-background">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <Tag>{post.category}</Tag>
                  {post.status === "coming-soon" && (
                    <Tag>Coming soon</Tag>
                  )}
                </div>
                <h2 className="font-display mt-3 text-xl font-bold">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
