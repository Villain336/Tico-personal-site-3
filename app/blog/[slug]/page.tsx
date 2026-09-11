import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui";
import { posts } from "@/content/blog";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Tag>{post.category}</Tag>
      <h1 className="font-display mt-4 text-4xl font-bold tracking-tight">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-muted">{post.excerpt}</p>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
        <Image src={post.cover} alt={post.title} fill className="object-cover" />
      </div>

      <div className="mt-10 rounded-2xl border border-brand-violet/30 bg-brand-violet/5 p-6 text-sm text-foreground/80">
        Full post coming soon. In the meantime, here&apos;s the premise:{" "}
        {post.excerpt}
      </div>
    </article>
  );
}
