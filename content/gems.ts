export type Gem = {
  title: string;
  description: string;
  url: string;
  category: "Component Libraries" | "Font Libraries" | "Design Inspiration" | "Courses & Learning";
};

// V1 batch, per Tico: essential/unique component libraries, font libraries,
// design inspo sites, and courses for marketing + web design mastery.
export const gems: Gem[] = [
  // Component Libraries
  {
    title: "shadcn/ui",
    description: "Copy-paste, ownable React components built on Radix + Tailwind. The default starting point.",
    url: "https://ui.shadcn.com",
    category: "Component Libraries",
  },
  {
    title: "Aceternity UI",
    description: "Flashy, animated components for landing pages that want to feel alive.",
    url: "https://ui.aceternity.com",
    category: "Component Libraries",
  },
  {
    title: "Magic UI",
    description: "Animated, marketing-site-ready components built for Next.js + Tailwind + Framer Motion.",
    url: "https://magicui.design",
    category: "Component Libraries",
  },
  {
    title: "Motion Primitives",
    description: "Beautifully animated primitives for building interactive, motion-first interfaces.",
    url: "https://motion-primitives.com",
    category: "Component Libraries",
  },
  {
    title: "Radix UI",
    description: "Unstyled, accessible primitives that most component libraries (including shadcn) are built on.",
    url: "https://www.radix-ui.com",
    category: "Component Libraries",
  },
  {
    title: "Origin UI",
    description: "A huge, growing collection of Tailwind + React components for real product UI.",
    url: "https://originui.com",
    category: "Component Libraries",
  },
  {
    title: "HyperUI",
    description: "Free, open-source Tailwind CSS components — no attribution needed.",
    url: "https://www.hyperui.dev",
    category: "Component Libraries",
  },
  {
    title: "daisyUI",
    description: "Component classes on top of Tailwind for teams that want speed over full customization.",
    url: "https://daisyui.com",
    category: "Component Libraries",
  },

  // Font Libraries
  {
    title: "Google Fonts",
    description: "The default free font library — huge selection, easy Next.js integration.",
    url: "https://fonts.google.com",
    category: "Font Libraries",
  },
  {
    title: "Fontshare",
    description: "Free, high-quality fonts from the Indian Type Foundry. Great for display type.",
    url: "https://www.fontshare.com",
    category: "Font Libraries",
  },
  {
    title: "Fontsource",
    description: "Self-host any font with an npm install — no runtime requests to Google.",
    url: "https://fontsource.org",
    category: "Font Libraries",
  },
  {
    title: "Font Pair",
    description: "Curated Google Font pairings so you never have to guess what goes with what.",
    url: "https://www.fontpair.co",
    category: "Font Libraries",
  },
  {
    title: "Type Wolf",
    description: "Font recommendations and real-world type inspiration from an actual type nerd.",
    url: "https://www.typewolf.com",
    category: "Font Libraries",
  },
  {
    title: "Adobe Fonts",
    description: "Premium type library included with Creative Cloud — worth it for display fonts.",
    url: "https://fonts.adobe.com",
    category: "Font Libraries",
  },

  // Design Inspiration
  {
    title: "Awwwards",
    description: "The benchmark for cutting-edge, award-winning web design.",
    url: "https://www.awwwards.com",
    category: "Design Inspiration",
  },
  {
    title: "Godly",
    description: "A fast-moving feed of the best new sites on the web, updated constantly.",
    url: "https://godly.website",
    category: "Design Inspiration",
  },
  {
    title: "Land-book",
    description: "Landing page gallery, searchable by industry, style, and layout.",
    url: "https://land-book.com",
    category: "Design Inspiration",
  },
  {
    title: "Lapa Ninja",
    description: "Thousands of landing pages organized by category — great for structure ideas.",
    url: "https://www.lapa.ninja",
    category: "Design Inspiration",
  },
  {
    title: "Mobbin",
    description: "The largest library of real mobile and web app screens, for product-flow inspiration.",
    url: "https://mobbin.com",
    category: "Design Inspiration",
  },
  {
    title: "Dribbble",
    description: "Visual-first design inspiration — great for graphic design and brand exploration.",
    url: "https://dribbble.com",
    category: "Design Inspiration",
  },
  {
    title: "Behance",
    description: "Full case studies and project breakdowns, not just single shots.",
    url: "https://www.behance.net",
    category: "Design Inspiration",
  },
  {
    title: "Really Good Emails",
    description: "Because marketing emails deserve design attention too.",
    url: "https://www.reallygoodemails.com",
    category: "Design Inspiration",
  },

  // Courses & Learning
  {
    title: "Frontend Masters",
    description: "In-depth courses on modern frontend — great for leveling up the web design/dev side.",
    url: "https://frontendmasters.com",
    category: "Courses & Learning",
  },
  {
    title: "CXL",
    description: "Conversion optimization and growth marketing training built for practitioners.",
    url: "https://cxl.com",
    category: "Courses & Learning",
  },
  {
    title: "Reforge",
    description: "Growth and marketing programs taught by operators who've done it at scale.",
    url: "https://www.reforge.com",
    category: "Courses & Learning",
  },
  {
    title: "Demand Curve",
    description: "Tactical growth marketing playbooks for startups — no fluff.",
    url: "https://www.demandcurve.com",
    category: "Courses & Learning",
  },
  {
    title: "HubSpot Academy",
    description: "Free, well-structured certifications covering inbound marketing, SEO, and content.",
    url: "https://academy.hubspot.com",
    category: "Courses & Learning",
  },
  {
    title: "Google Skillshop",
    description: "Free official certifications for Google Ads, Analytics, and more.",
    url: "https://skillshop.withgoogle.com",
    category: "Courses & Learning",
  },
  {
    title: "web.dev/learn",
    description: "Google's free, thorough curriculum on modern web fundamentals and performance.",
    url: "https://web.dev/learn",
    category: "Courses & Learning",
  },
  {
    title: "Refactoring UI",
    description: "The book/course that teaches designers-by-necessity how to make things look good.",
    url: "https://www.refactoringui.com",
    category: "Courses & Learning",
  },
];

export const gemCategories = [
  "Component Libraries",
  "Font Libraries",
  "Design Inspiration",
  "Courses & Learning",
] as const;
