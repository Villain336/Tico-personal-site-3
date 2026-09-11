export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Business" | "Tech" | "Marketing";
  cover: string;
  status: "coming-soon" | "published";
};

// First batch of blog cards, per Tico — full posts coming soon. Titles are
// locked in; excerpts are draft teaser copy to be refined when the posts
// are actually written.
export const posts: Post[] = [
  {
    slug: "is-seo-dead",
    title: "Is SEO Dead?",
    excerpt:
      "Everyone declares SEO dead the second AI search shows up. Here's what's actually changing — and what isn't.",
    category: "Marketing",
    cover: "/images/blog/is-seo-dead.jpg",
    status: "coming-soon",
  },
  {
    slug: "one-man-agency",
    title: "1-Man Agency: Is It Possible?",
    excerpt:
      "Running an agency solo sounds like a burnout story waiting to happen. I'm testing that theory in real time — here's the plan.",
    category: "Business",
    cover: "/images/blog/one-man-agency.jpg",
    status: "coming-soon",
  },
];
