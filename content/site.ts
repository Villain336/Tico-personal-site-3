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
  // Public Spotify playlist that powers the site radio, e.g.
  // "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M". Empty hides the dock.
  // With SPOTIFY_CLIENT_ID/SECRET set the dock gets true shuffle; without them it
  // falls back to the plain playlist embed.
  spotifyPlaylistUrl: "",
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
  { label: "Shalom Valley", href: "/shalom-valley" },
  { label: "Roast Me", href: "/roast" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  { label: "About Me", href: "/about" },
] as const;
