export const site = {
  name: "Tico Hamphill",
  agency: "Launchabl",
  url: "https://ticohamphill.com",
  titleTemplate: "%s | Tico Hamphill",
  defaultTitle: "Tico Hamphill — Marketer, Designer & Founder of Launchabl",
  description:
    "Tico Hamphill is a marketer, web & graphic designer, and founder of the marketing agency Launchabl. Explore his work, favorite tools, blog, and Star Glide — a Star of David vs. space birds arcade game.",
  // Calendly scheduling link (e.g. "https://calendly.com/tico/roast-review").
  // Leave empty until it exists — the booking CTA falls back to X DMs.
  calendlyUrl: "",
  socials: {
    twitter: "https://x.com/PushinSaas",
    instagram: "https://instagram.com/",
    linkedin: "https://www.linkedin.com/",
  },
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Gems", href: "/gems" },
  { label: "Star Glide", href: "/star-glide" },
  { label: "Roast Me", href: "/roast" },
  { label: "Blog", href: "/blog" },
  { label: "About Me", href: "/about" },
] as const;
