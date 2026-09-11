# Personal Site — Planning Doc

Status: **Draft for review** — nothing has been built yet. This doc captures the
plan so we can align before writing code.

## 1. Goals

- A personal site that works as: attention-grabbing intro (Home), portfolio
  (Work), authority/resource hub (Gems), a fun standalone game (Star Glide),
  a trust/authority builder (Blog), and a personal story + credentials page
  (About Me).
- Fast, modern, mobile-first, easy for you to update content in without
  touching code (blog posts, gems, case studies should all be simple to add).
- Room to grow: certifications/badges get added to About Me later; Work and
  Blog both grow over time; Gems is a living, curated list.

## 2. Proposed Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Best-in-class for content sites, file-based routing matches our page list 1:1, great SEO/image/perf story, huge ecosystem. |
| Styling | **Tailwind CSS** + a small design-token layer | Fast to build a consistent, unique look; easy dark mode. |
| Animation | **Framer Motion** | For Home page "wow" moments, page transitions, micro-interactions. |
| Content | **MDX** files in-repo for Blog & Work case studies | Version-controlled, no CMS to pay for/manage; you write posts as Markdown with embedded components. Can graduate to a headless CMS later without changing the URL structure. |
| Gems data | Typed data file (`content/gems.ts` or JSON) | Simple list of resources with category/tags; renders as filterable cards. |
| Game (Star Glide) | **HTML5 Canvas** game loop in a client component (no heavy game engine dependency, keeps bundle small) | Full control over "Star of David vs. bird in space" visuals; runs anywhere, no plugin needed. |
| Deployment | **Vercel** | Zero-config Next.js hosting, previews per PR, analytics, image optimization. |
| Analytics | **Vercel Analytics** (+ optionally Plausible/GA later) | Lightweight, privacy-friendly, no extra setup. |
| Contact / forms | API route + **Resend** (or a `mailto:`/social fallback if you'd rather not manage an email API yet) | Keep it simple until there's a real need for a full CRM hookup. |
| High scores (Star Glide) | **localStorage** first; optional Postgres/Upstash Redis leaderboard later | Ship fast now, add a global leaderboard as a v2 if you want it. |

Open question: are you set on Vercel for hosting, or is there another target
(Netlify, self-hosted, etc.)? Everything below assumes Next.js + Vercel but
isn't hard-locked to it.

## 3. Site Map

```
/                  Home
/work              Work index (case studies, finished work, products)
/work/[slug]       Individual case study
/gems              Gems (curated resources/tools/links)
/star-glide        Star Glide game
/blog              Blog index (filter by category: business/tech/marketing/…)
/blog/[slug]       Individual post
/about             About Me (story, goals, accomplishments, badges section)
```

Shared: Nav header (Home / Work / Gems / Star Glide / Blog / About Me), footer
with socials + contact, 404 page, sitemap.xml, robots.txt.

## 4. Page-by-Page Plan

### Home
Purpose: grab attention in the first 3 seconds, tell people who you are and
where to go next.
- Hero section with a distinctive visual identity (custom illustration/3D/
  animated gradient — needs your input on visual direction; see open
  questions) + a punchy one-liner + CTA buttons (See my work / Play Star
  Glide / Read the blog).
- Short "world" introduction — who you are, what you do, who you help.
- Highlight strip: featured case study, featured gem(s), latest blog post,
  a Star Glide teaser (mini animated preview that links to the game).
- Social proof if available (logos, testimonials, numbers).
- Final CTA (contact / newsletter / socials).

### Work
Purpose: portfolio of case studies, finished work, and products.
- Filterable/tag-able grid (by type: case study / product / freelance, or by
  skill/industry — TBD based on what you actually have).
- Each case study page: problem → approach → solution → results, with
  gallery, links to live product/repo, and metrics if you have them.
- "Products" can be a distinct card style if you sell/ship actual products.

### Gems
Purpose: resource hub — trust + generosity + SEO magnet.
- Grouped by category (e.g. Tools, Courses, Communities, Templates, Reading —
  exact categories depend on your niche).
- Each gem: name, short description, link, category/tags, optional icon.
- Search + category filter (client-side, no backend needed at this scale).
- Good candidate for "submit a gem" or "suggest a resource" form later.

### Star Glide
Purpose: fun, shareable, on-brand mini-game.
- Concept: Flappy-Bird-style side-scroller. Player controls a **Star of
  David** sprite flying through space, dodging **bird** obstacles (and/or
  gaps between birds) instead of pipes.
- Core loop: tap/click/space to "flap," gravity pulls the star down,
  obstacles scroll in, score increments per obstacle passed, collision ends
  the run, show score + best score + restart.
- Visual theme: starfield background, glowing Star of David character,
  stylized bird obstacles, subtle space-y particle effects.
- Controls: keyboard (space), mouse/tap (mobile-friendly — this matters,
  most flappy-bird traffic is mobile).
- Score persistence: localStorage best score initially; a shareable
  "I scored X" moment (copy-to-clipboard or share sheet) is a nice growth
  loop.
- Sound: optional, off by default with a mute toggle (avoid the classic
  "autoplaying sound" complaint).
- Stretch goals (post-v1): global leaderboard, difficulty ramps, skins/power-
  ups, embeddable widget version for the Home page teaser.

### Blog
Purpose: authority/trust builder alongside Work and Gems.
- Categories: Business, Tech, Marketing, (+ whatever else fits your niche).
- Index page with category filter, tag support, search (client-side to
  start).
- Post page: title, date, reading time, category/tags, table of contents for
  long posts, author bio blurb, related posts, share buttons.
- Written in MDX so you can drop in code blocks, embeds, and custom
  components (e.g. a callout box) directly in posts.

### About Me
Purpose: personal story, goals, accomplishments, and (future) certifications.
- Story section: narrative bio — where you came from, what got you here.
- Goals section: what you're working toward now/next.
- Accomplishments/timeline: milestones, launches, wins.
- Certifications & Badges section: **built now as an empty/placeholder
  state** (e.g. "Certifications — coming soon" grid) so it's just a data
  update (name, issuer, date earned, badge image, verify link) to populate
  once you complete courses — no code changes needed to add badges later.
- CTA to Work/Blog/contact.

## 5. Design System

- Design tokens: color palette (need your direction — see open questions),
  type scale, spacing scale, radius/shadow scale — defined once in Tailwind
  config so every page stays consistent.
- Dark mode by default with a light-mode toggle (common for
  tech/business/marketing personal brands; flexible if you'd rather default
  light).
- Shared components: `Navbar`, `Footer`, `Hero`, `SectionHeading`,
  `Card` (variants for case study / gem / blog post), `Badge`,
  `Timeline`, `Tag`/`FilterBar`, `CTA`, `GameCanvas`.
- Motion: consistent entrance animations (fade/slide on scroll) via Framer
  Motion, used sparingly so it feels premium rather than gimmicky.

## 6. Content Data Model (draft)

```ts
// Work
type CaseStudy = {
  slug: string
  title: string
  summary: string
  cover: string
  type: 'case-study' | 'product' | 'freelance'
  tags: string[]
  problem: string
  approach: string
  results: string
  gallery: string[]
  links?: { label: string; href: string }[]
  featured?: boolean
}

// Gems
type Gem = {
  slug: string
  title: string
  description: string
  url: string
  category: string      // e.g. 'Tools' | 'Courses' | 'Communities' | 'Templates'
  tags: string[]
  icon?: string
}

// Blog
type Post = {
  slug: string
  title: string
  date: string
  category: 'business' | 'tech' | 'marketing' | string
  tags: string[]
  excerpt: string
  cover?: string
  content: string // MDX
}

// About Me — Certifications/Badges
type Credential = {
  name: string
  issuer: string
  dateEarned: string
  badgeImage?: string
  verifyUrl?: string
}
```

## 7. SEO / Performance / Analytics

- Per-page metadata (title, description, OG image) — dynamic OG images for
  blog posts and case studies are a nice touch (`next/og`).
- `sitemap.xml` + `robots.txt` generated from content.
- JSON-LD structured data for blog posts (Article) and profile (Person).
- Vercel Analytics + Web Vitals monitoring.
- Image optimization via `next/image` everywhere.
- Accessibility pass (semantic HTML, focus states, contrast, game has a
  non-motion-dependent way to know score/game-over for screen readers where
  reasonable).

## 8. Build Roadmap (phases)

1. **Foundation** — scaffold Next.js + TS + Tailwind, repo structure, design
   tokens, layout shell (Navbar/Footer), deployment pipeline, base SEO setup.
2. **Home** — hero + intro + highlight sections (with placeholder content
   until Work/Gems/Blog have real entries).
3. **Work** — index + case study template + a few seed case studies (real or
   placeholder pending your content).
4. **Gems** — data file + card grid + filter/search + seed resources.
5. **Blog** — MDX pipeline + index + post template + categories/tags + a
   couple of seed posts.
6. **About Me** — story/goals/accomplishments sections + certifications
   section built as an empty state ready for future badges.
7. **Star Glide** — canvas game engine, sprites, scoring, mobile controls,
   mute toggle, local high score, teaser embed for Home.
8. **Polish** — SEO metadata/OG images/sitemap, analytics, accessibility,
   performance pass, cross-device QA.
9. **Launch** — final review, deploy to production.

Each phase lands as its own PR so you can review incrementally rather than
one giant drop at the end.

## 9. Open Questions (need your input before/while building)

1. **Brand basics**: your name/brand as it should appear on the site, your
   niche (this shapes Gems categories, Blog topics, and Home copy), and a
   one-line description of what you do.
2. **Visual direction**: any colors, fonts, or existing brand assets
   (logo, palette) to use? Reference sites you like the feel of? Dark mode
   default, light default, or user's choice?
3. **Work content**: how many case studies/products do you have ready now vs.
   need placeholders for at launch?
4. **Gems content**: rough list of resources/tools/links you want included
   at launch (even a rough dump is fine — I'll categorize).
5. **Blog**: do you have any posts drafted already, or should launch ship
   with 0–2 seed posts and grow from there?
6. **About Me**: story/goals/accomplishments content — can be placeholder
   text you refine later, or send me the real content now.
7. **Domain/hosting**: do you already have a domain + Vercel (or other)
   account, or should the plan include picking those?
8. **Star Glide specifics**: any preference on difficulty feel, whether to
   include sound, and whether a global leaderboard is a "must have for v1"
   or a nice-to-have later?

## 10. Proposed Repo Structure

```
/app
  /(site)/layout.tsx
  /page.tsx                 → Home
  /work/page.tsx            → Work index
  /work/[slug]/page.tsx     → Case study
  /gems/page.tsx            → Gems
  /star-glide/page.tsx      → Star Glide
  /blog/page.tsx            → Blog index
  /blog/[slug]/page.tsx     → Post
  /about/page.tsx           → About Me
/components
  /ui/...                   → shared building blocks
  /game/...                 → Star Glide engine + rendering
/content
  /work/*.mdx
  /blog/*.mdx
  gems.ts
  credentials.ts
/lib                        → content loaders, utils
/public                     → images, favicons, og assets
/docs/PLANNING.md           → this doc
```

---

Once you confirm the stack + answer (or punt on) the open questions above,
I'll start with Phase 1 (Foundation) and work through the roadmap PR-by-PR.
