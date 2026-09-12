import type { RoastCategoryKey } from "@/lib/roast/schema";

export const roastCopy = {
  eyebrow: "Free tool",
  heading: "Get your landing page roasted.",
  sub: "Paste a URL. In about twenty seconds you'll get a brutally honest, occasionally funny, always useful teardown of the copy, design, conversion path, and SEO — from an AI trained on how Tico actually audits pages.",
  placeholder: "yourstartup.com",
  button: "Roast Me",
  loading: [
    "Taking a screenshot",
    "Reading the copy",
    "Judging the fonts",
    "Counting the CTAs",
    "Sharpening the roast",
  ],
  disclaimer:
    "Roasts are AI-generated from a screenshot and the page's HTML. Funny on purpose, useful by design. Nothing is stored.",
  shareCta: "Share this roast",
  shareText: (oneLiner: string) =>
    `My landing page just got roasted by @PushinSaas's AI:\n\n"${oneLiner}"\n\nRoast yours →`,
  bookHeading: "Want it actually fixed?",
  bookSub: "Launchabl turns roasts into rebuilds. Grab a slot and we'll go through your page live — no pitch deck, just fixes.",
  bookFallback: "DM @PushinSaas to talk",
  howItWorks: [
    {
      title: "We look at it like a visitor would",
      body: "A real screenshot of your page at desktop size, plus the raw HTML — headline, meta tags, buttons, word count, image alt text, structured data.",
    },
    {
      title: "Four lenses, one verdict",
      body: "Copy (does the message land?), Design (does it look trustworthy?), Conversion (is there one obvious next step?), and SEO/AIO (can Google and AI assistants understand it?).",
    },
    {
      title: "Roast first, fix second",
      body: "You get the jokes, but every jab points at something concrete. Then three prioritized fixes you could ship this week.",
    },
  ],
  faq: [
    {
      q: "Is the Landing Page Roaster free?",
      a: "Yes. Five roasts an hour per person, no signup. If you want a human to go deeper, book a call with Launchabl.",
    },
    {
      q: "What does the roast check?",
      a: "Headline clarity, value proposition, call-to-action count and placement, visual hierarchy, trust signals, mobile readiness, meta title and description, heading structure, image alt text, and structured data for AI search (AIO).",
    },
    {
      q: "Do you store my URL or the results?",
      a: "No. The screenshot and HTML are fetched, scored, returned to your browser, and discarded. Nothing is saved server-side.",
    },
    {
      q: "Why is the roast so harsh?",
      a: "Because polite feedback doesn't get pages fixed. The tone is blunt on purpose, but every point is tied to something real on your page — and it always ends with what to do about it.",
    },
  ],
};

export const roastCategories: Record<
  RoastCategoryKey,
  { label: string; blurb: string }
> = {
  copy: { label: "Copy", blurb: "Does the message land in five seconds?" },
  design: { label: "Design", blurb: "Does it look like something you'd trust?" },
  conversion: { label: "Conversion", blurb: "Is there one obvious next step?" },
  seo: { label: "SEO / AIO", blurb: "Can search engines and AI understand it?" },
};
