export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  type: "case-study" | "product" | "website";
  status: "shipped" | "wip";
  tags: string[];
  problem?: string;
  approach?: string;
  results?: string;
  href?: string; // live link, if any
  placeholder?: boolean;
};

// TODO(Tico): replace these with your real projects, screenshots, and
// results. Anything with `placeholder: true` is a stand-in so the layout
// has something to render — swap the copy/links, keep the shape.
export const caseStudies: CaseStudy[] = [
  {
    slug: "placeholder-brand-launch",
    title: "Brand Launch — Case Study",
    summary:
      "Add your first shipped project here: what the client needed, what you built, and the results.",
    type: "case-study",
    status: "shipped",
    tags: ["Branding", "Web Design", "Launchabl"],
    problem: "Describe the problem the client came to you with.",
    approach: "Describe your approach — design, dev, marketing, or all three.",
    results: "Drop in the numbers: traffic, conversion, revenue, launch speed.",
    placeholder: true,
  },
  {
    slug: "placeholder-product-site",
    title: "Product Website",
    summary: "Swap in a real product or SaaS site you designed and built.",
    type: "website",
    status: "shipped",
    tags: ["Web Design", "Product"],
    placeholder: true,
  },
  {
    slug: "placeholder-wip-build",
    title: "Currently Building",
    summary: "Something you're actively working on — show the work-in-progress.",
    type: "product",
    status: "wip",
    tags: ["AI", "In Progress"],
    placeholder: true,
  },
];
