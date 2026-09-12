import { assertPublicHost } from "@/lib/roast/url";

export type PageExtract = {
  finalUrl: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  h1: string[];
  h2: string[];
  ctas: string[];
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasViewportMeta: boolean;
  hasCanonical: boolean;
  hasJsonLd: boolean;
  bodyExcerpt: string;
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;

/**
 * Fetches a page's HTML and pulls out the signals a copy/SEO critique cares
 * about. Redirects are followed manually so every hop is re-checked against
 * the private-network rules.
 */
export async function extractPage(start: URL): Promise<PageExtract> {
  let url = start;
  let res: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; TicoRoastBot/1.0; +https://ticohamphill.com/roast)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      const next = new URL(loc, url);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new Error("Redirected somewhere weird.");
      }
      await assertPublicHost(next.hostname);
      url = next;
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new Error(`Page responded with ${res?.status ?? "no status"}.`);
  }

  const html = await readCapped(res, MAX_BYTES);
  return { finalUrl: url.toString(), ...parseHtml(html) };
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < max) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  reader.cancel().catch(() => {});
  const merged = new Uint8Array(Math.min(total, max));
  let offset = 0;
  for (const c of chunks) {
    const slice = c.subarray(0, Math.max(0, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= merged.length) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

function parseHtml(html: string): Omit<PageExtract, "finalUrl"> {
  const head = html.slice(0, 200_000);

  const title = firstMatch(head, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    metaContent(head, "description") ?? metaContent(head, "og:description");
  const ogTitle = metaContent(head, "og:title");

  const h1 = allMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).slice(0, 5);
  const h2 = allMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).slice(0, 12);

  const buttonish = [
    ...allMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi),
    ...allMatches(html, /<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi),
    ...allMatches(html, /<input[^>]*type="submit"[^>]*value="([^"]*)"/gi),
  ];
  const ctas = dedupe(buttonish.filter((t) => t.length > 0 && t.length < 60)).slice(0, 12);

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesMissingAlt = imgTags.filter((t) => !/\balt\s*=\s*"[^"]+"/i.test(t)).length;

  const bodyText = textOf(html);
  const words = bodyText.split(/\s+/).filter(Boolean);

  return {
    title,
    description,
    ogTitle,
    h1,
    h2,
    ctas,
    wordCount: words.length,
    imageCount: imgTags.length,
    imagesMissingAlt,
    hasViewportMeta: /<meta[^>]+name="viewport"/i.test(head),
    hasCanonical: /<link[^>]+rel="canonical"/i.test(head),
    hasJsonLd: /application\/ld\+json/i.test(html),
    bodyExcerpt: words.slice(0, 900).join(" "),
  };
}

function metaContent(html: string, name: string): string | null {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${esc}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${esc}["']`,
    "i",
  );
  const m = html.match(re);
  const v = m?.[1] ?? m?.[2];
  return v ? decode(v).trim() : null;
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? cleanText(m[1]) || null : null;
}

function allMatches(html: string, re: RegExp): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(re)) {
    const t = cleanText(m[1] ?? "");
    if (t) out.push(t);
  }
  return out;
}

function textOf(html: string): string {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<(head|nav|footer)[\s\S]*?<\/\1>/gi, " "),
  );
}

function cleanText(fragment: string): string {
  return decode(fragment.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function dedupe(list: string[]): string[] {
  return [...new Set(list.map((s) => s.trim()))];
}
