"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { posts, type Post } from "@/content/blog";

/**
 * Aceternity "expandable card (standard)" pattern, wired to the blog posts.
 * Clicking a card morphs it into a centered reading panel.
 */
export function BlogExpandableCards() {
  const [active, setActive] = useState<Post | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    document.body.style.overflow = active ? "hidden" : "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-foreground/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-0 sm:p-6">
            <motion.button
              key={`button-${active.slug}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <CloseIcon />
            </motion.button>

            <motion.div
              layoutId={`card-${active.slug}-${id}`}
              ref={ref}
              className="flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-surface sm:h-fit sm:max-h-[90%] sm:rounded-3xl"
            >
              <motion.div
                layoutId={`image-${active.slug}-${id}`}
                className="relative aspect-[16/9] w-full"
              >
                <Image
                  src={active.cover}
                  alt={active.title}
                  fill
                  sizes="560px"
                  className="object-cover"
                />
              </motion.div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <motion.p
                      layoutId={`category-${active.slug}-${id}`}
                      className="text-[11px] font-semibold uppercase tracking-widest text-brand-violet"
                    >
                      {active.category}
                    </motion.p>
                    <motion.h3
                      layoutId={`title-${active.slug}-${id}`}
                      className="font-display mt-1 text-2xl font-bold"
                    >
                      {active.title}
                    </motion.h3>
                  </div>
                  <motion.div layoutId={`button-${active.slug}-${id}`}>
                    <Link
                      href={`/blog/${active.slug}`}
                      className="whitespace-nowrap rounded-full bg-brand-lime px-4 py-2 text-sm font-bold text-foreground"
                    >
                      Open post
                    </Link>
                  </motion.div>
                </div>

                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex flex-col gap-4 text-sm text-muted"
                >
                  <p>{active.excerpt}</p>
                  {active.status === "coming-soon" && (
                    <p className="rounded-xl border border-brand-violet/30 bg-brand-violet/5 p-3 text-xs text-foreground/80">
                      Full article coming soon — this is the premise.
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ul className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {posts.map((post) => (
          <motion.li
            layoutId={`card-${post.slug}-${id}`}
            key={`card-${post.slug}-${id}`}
            onClick={() => setActive(post)}
            className="flex cursor-pointer flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-foreground/20 md:flex-row"
          >
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
              <motion.div
                layoutId={`image-${post.slug}-${id}`}
                className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl md:h-20 md:w-36 md:aspect-auto"
              >
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  sizes="(min-width: 768px) 144px, 100vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="text-center md:text-left">
                <motion.p
                  layoutId={`category-${post.slug}-${id}`}
                  className="text-[11px] font-semibold uppercase tracking-widest text-brand-violet"
                >
                  {post.category}
                </motion.p>
                <motion.h3
                  layoutId={`title-${post.slug}-${id}`}
                  className="font-display mt-1 text-lg font-bold"
                >
                  {post.title}
                </motion.h3>
                <p className="mt-1 text-sm text-muted">{post.excerpt}</p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${post.slug}-${id}`}
              className="shrink-0 rounded-full bg-field px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-brand-lime"
            >
              {post.status === "coming-soon" ? "Preview" : "Read"}
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-foreground"
    >
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}
