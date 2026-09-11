export type Goal = {
  period: string;
  headline: string;
  body: string;
  milestones: string[];
};

// Draft roadmap for the About page "Goals" timeline, built from what Tico
// has shared so far. TODO(Tico): tweak periods, wording, and milestones —
// this is meant to be edited like a living document.
export const goals: Goal[] = [
  {
    period: "Now",
    headline: "Build in public.",
    body: "Launch TicoHamphill.com as a living, always-shipping home for my work, resources, and ideas — and grow Launchabl alongside it.",
    milestones: [
      "Ship v1 of the site: Home, Work, Gems, Star Glide, Blog, About",
      "Publish the first two blog posts: \"Is SEO Dead?\" and \"1-Man Agency: Is It Possible?\"",
      "Curate the first batch of Gems for marketers and web designers",
    ],
  },
  {
    period: "Next",
    headline: "Earn the badges.",
    body: "Complete the certifications and courses that back up the work, and turn this page into a wall of gold plaques.",
    milestones: [
      "Finish core marketing certifications (Google, HubSpot)",
      "Level up web design and frontend fundamentals",
      "Add every earned badge to the certifications section",
    ],
  },
  {
    period: "Soon",
    headline: "Make Star Glide a thing.",
    body: "Grow the game until people play it enough that in-game ad placements become a real, sellable product.",
    milestones: [
      "Ship progressive difficulty, skins, and daily challenges",
      "Hit a sustained player base worth advertising to",
      "Open the first in-game ad slots to sponsors",
    ],
  },
  {
    period: "Later",
    headline: "Build the mini world.",
    body: "Turn the site into a first-person, explorable world that shows off web design, graphic design, and AI work in a way a flat portfolio never could.",
    milestones: [
      "Introduce 3D components and interactive scenes",
      "Showcase Launchabl case studies inside the world",
      "Keep iterating — this site is a permanent work in progress",
    ],
  },
];
