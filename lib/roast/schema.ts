import { z } from "zod";

export const roastCategoryKeys = ["copy", "design", "conversion", "seo"] as const;
export type RoastCategoryKey = (typeof roastCategoryKeys)[number];

const category = z.object({
  score: z.number().min(0).max(100).describe("0–100, be honest and use the whole range"),
  verdict: z
    .string()
    .describe("One punchy sentence. Specific to this page, not generic advice."),
});

export const roastSchema = z.object({
  overall: z.number().min(0).max(100).describe("Overall score 0–100"),
  headline: z
    .string()
    .describe("A 6–12 word roast title for this page, like a tabloid headline."),
  oneLiner: z
    .string()
    .describe(
      "A tweetable, under-200-character roast of the page. Funny, specific, no hashtags.",
    ),
  categories: z.object({
    copy: category,
    design: category,
    conversion: category,
    seo: category,
  }),
  roast: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe("2–3 short paragraphs. Blunt and funny, but every jab points at something real."),
  fixes: z
    .array(
      z.object({
        title: z.string().describe("Short imperative, e.g. 'Kill the three competing CTAs'"),
        why: z.string().describe("One sentence: why this hurts the page"),
        how: z.string().describe("One or two sentences: concretely what to do instead"),
      }),
    )
    .length(3),
  closer: z
    .string()
    .describe(
      "One or two sentences of genuine encouragement + the single most important next step.",
    ),
});

export type RoastResult = z.infer<typeof roastSchema>;

export type RoastResponse = {
  url: string;
  screenshotUrl: string | null;
  pageTitle: string | null;
  result: RoastResult;
};
