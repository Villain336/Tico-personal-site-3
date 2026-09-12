import { generateObject } from "ai";
import { encode } from "qss";
import { roastSchema, type RoastResponse } from "@/lib/roast/schema";
import { normalizePublicUrl, RoastInputError } from "@/lib/roast/url";
import { extractPage, type PageExtract } from "@/lib/roast/extract";
import { clientKey, takeToken } from "@/lib/roast/rate-limit";

export const maxDuration = 60;

// Same AI Gateway routing as /api/chat. This route sends the screenshot as an
// image part, so the model must accept vision input.
const ROAST_MODEL = process.env.ROAST_MODEL ?? "openai/gpt-5-mini";

const SCREENSHOT_TIMEOUT_MS = 15_000;

function gatewayConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
}

const systemPrompt = `You are "The Roaster" — Tico Hamphill's landing-page critic. Tico is a marketer, web designer, and founder of the agency Launchabl (spell it exactly that way).

Your job: roast a landing page so it's entertaining to read AND genuinely useful.

Rules:
- Blunt, witty, personality-driven delivery. Roast the PAGE, never the person or their business idea.
- Every jab must point at something specific you can see in the screenshot or read in the extracted HTML. If you can't ground a criticism, don't make it.
- Praise what deserves it. A page that does something well should hear it — credibility depends on being fair.
- Use the full 0–100 range. 85+ is rare and earned. Most pages land between 40 and 75.
- Category scores must be consistent with the verdicts and the overall score.
- Fixes are prioritized by impact, concrete, and shippable within a week. No "consider improving your branding" fluff.
- The closer is sincere: name the single most important next step.
- Keep everything tight. Short paragraphs. No markdown, no emojis, no hashtags.
- If the screenshot is missing, say you're judging from the copy only and don't invent visual details.`;

export async function POST(req: Request) {
  if (!gatewayConfigured()) {
    return Response.json(
      {
        error:
          "The Roaster isn't connected to a model yet. Add AI_GATEWAY_API_KEY to the environment (or deploy on Vercel) to turn it on.",
      },
      { status: 503 },
    );
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON with a url." }, { status: 400 });
  }

  let url: URL;
  try {
    url = await normalizePublicUrl(typeof body.url === "string" ? body.url : "");
  } catch (e) {
    const msg = e instanceof RoastInputError ? e.message : "Invalid URL.";
    return Response.json({ error: msg }, { status: 400 });
  }

  // Only successful, well-formed requests spend a token — typos are free.
  const limit = takeToken(clientKey(req));
  if (!limit.ok) {
    return Response.json(
      {
        error: `Easy there. You've hit the hourly roast limit — try again in about ${Math.max(1, Math.ceil(limit.retryAfterSec / 60))} minutes.`,
      },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  const t0 = Date.now();
  const [shot, page] = await Promise.all([
    captureScreenshot(url).catch(() => null),
    extractPage(url).catch(() => null),
  ]);
  const tFetch = Date.now() - t0;

  if (!shot && !page) {
    return Response.json(
      { error: "Couldn't reach that page. Is it live and public?" },
      { status: 422 },
    );
  }

  try {
    const { object } = await generateObject({
      model: ROAST_MODEL,
      schema: roastSchema,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildBrief(url, page, Boolean(shot)) },
            ...(shot ? [{ type: "image" as const, image: new URL(shot) }] : []),
          ],
        },
      ],
    });

    console.info(
      `[roast] ${url.hostname} fetch=${tFetch}ms model=${Date.now() - t0 - tFetch}ms shot=${Boolean(shot)} html=${Boolean(page)}`,
    );

    const payload: RoastResponse = {
      url: page?.finalUrl ?? url.toString(),
      screenshotUrl: shot,
      pageTitle: page?.title ?? page?.ogTitle ?? null,
      result: object,
    };
    return Response.json(payload);
  } catch (e) {
    console.error(
      `[roast] model call failed after fetch=${tFetch}ms shot=${Boolean(shot)} html=${Boolean(page)}`,
      e instanceof Error ? e.message : e,
    );
    return Response.json(
      { error: "The Roaster choked on that one. Try again in a moment." },
      { status: 502 },
    );
  }
}

async function captureScreenshot(url: URL): Promise<string | null> {
  const params = encode({
    url: url.toString(),
    screenshot: true,
    meta: false,
    colorScheme: "light",
    "viewport.width": 1280,
    "viewport.height": 800,
    "viewport.deviceScaleFactor": 1,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.microlink.io/?${params}`, {
      signal: controller.signal,
      headers: process.env.MICROLINK_API_KEY
        ? { "x-api-key": process.env.MICROLINK_API_KEY }
        : {},
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      data?: { screenshot?: { url?: string } };
    };
    return json.status === "success" ? json.data?.screenshot?.url ?? null : null;
  } finally {
    clearTimeout(timer);
  }
}

function buildBrief(url: URL, page: PageExtract | null, hasShot: boolean): string {
  const lines: string[] = [
    `Roast this landing page: ${url.toString()}`,
    hasShot
      ? "A desktop screenshot (1280×800, above the fold) is attached."
      : "No screenshot could be captured — judge from the extracted copy only.",
  ];

  if (page) {
    lines.push(
      "",
      "Extracted from the HTML:",
      `- <title>: ${page.title ?? "(missing)"}`,
      `- meta description: ${page.description ?? "(missing)"}`,
      `- og:title: ${page.ogTitle ?? "(missing)"}`,
      `- H1s (${page.h1.length}): ${page.h1.join(" | ") || "(none)"}`,
      `- H2s (${page.h2.length}): ${page.h2.slice(0, 8).join(" | ") || "(none)"}`,
      `- Button/CTA text (${page.ctas.length}): ${page.ctas.join(" | ") || "(none found)"}`,
      `- Word count: ${page.wordCount}`,
      `- Images: ${page.imageCount} (${page.imagesMissingAlt} missing alt text)`,
      `- viewport meta: ${page.hasViewportMeta ? "yes" : "no"}; canonical: ${page.hasCanonical ? "yes" : "no"}; JSON-LD: ${page.hasJsonLd ? "yes" : "no"}`,
      "",
      "Body copy excerpt:",
      page.bodyExcerpt || "(empty — likely rendered client-side)",
    );
  } else {
    lines.push("", "The HTML could not be fetched; rely on the screenshot.");
  }

  return lines.join("\n");
}
