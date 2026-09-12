# Landing Page Roaster — design

_Status: approved by Tico 2026-09-12. Tier: "Visual Roast"._

## Goal

A free tool at `/roast`: paste a URL, get an AI critique of that landing page
that is funny in delivery but defensible in substance. It serves four goals at
once — Launchabl lead-gen (CTA to book a call), SEO/AIO (an indexable page
that answers "free landing page audit" queries), virality (share-to-X), and
positioning (Tico builds tools, not just link lists).

## User flow

1. Visitor pastes a URL and hits **Roast Me**.
2. Server validates the URL, then in parallel: captures a desktop screenshot
   via microlink (the same service the Gems link-previews already use) and
   fetches the page HTML to extract title, meta, headings, CTAs and body copy.
3. One `generateObject` call (Vercel AI Gateway, vision-capable model) gets
   the screenshot + extracted text and returns a **structured** result.
4. UI renders: overall score, four category scores (Copy, Design, Conversion,
   SEO/AIO) each with a one-line verdict, the roast paragraphs, "Top 3 fixes",
   a tweetable one-liner, and the screenshot thumbnail.
5. CTAs: **Share this roast** (pre-filled X post + link back to `/roast`) and
   **Book a real fix with Launchabl** (Calendly inline embed).
6. No persistence in this tier — results live in the browser session only.

## Tone contract (system prompt)

- Blunt, funny, personality-driven delivery. Roast the page, never the person.
- Every point must be a real, specific, defensible critique tied to something
  visible on the page or in its copy. No cheap shots without a reason.
- Always close with a genuine, constructive pivot — the reader should leave
  knowing what to fix first.
- Keep it short: 2–3 roast paragraphs, one-sentence verdicts, three fixes.

## Architecture

| Unit | Responsibility |
| --- | --- |
| `app/roast/page.tsx` | Server page: metadata, header, how-it-works + FAQ (AIO copy), JSON-LD, renders the client form. |
| `components/roast/roast-tool.tsx` | Client: URL input, submit, loading (`PixelLoader`), error states, renders result. |
| `components/roast/roast-result.tsx` | Presentational: score ring/cards, roast text, fixes, share + book CTAs. |
| `components/roast/book-call.tsx` | Calendly inline embed when `site.calendlyUrl` is set; falls back to a "DM @PushinSaas" button when it isn't. |
| `app/api/roast/route.ts` | POST `{ url }` → validate → rate-limit → screenshot + HTML in parallel → `generateObject` → JSON. 503 when the AI Gateway isn't configured (same pattern as `/api/chat`). |
| `lib/roast/schema.ts` | Zod schema for the result (shared by route and UI types). |
| `lib/roast/url.ts` | URL normalisation + safety: http/https only, no credentials, no localhost / private / link-local hosts (checked on the literal host and on the DNS-resolved address). |
| `lib/roast/extract.ts` | Fetch HTML with timeout, size cap and manual redirect handling (re-validating each hop); regex-based extraction of title/meta/headings/CTA text/body excerpt. |
| `lib/roast/rate-limit.ts` | In-memory per-IP fixed window (5 roasts / hour). Known limitation: per-instance on serverless; upgrade to Upstash/KV together with the "Shareable" tier. |
| `content/roast.ts` | Page copy, category labels, FAQ, share text. |
| `content/site.ts` | `calendlyUrl` (empty until Tico provides it); nav gains **Roast Me**. |

Also: add `/roast` to `app/sitemap.ts` and `public/llms.txt`.

## Error handling

- Invalid / unsafe URL → 400 with a human message shown inline.
- Rate limited → 429 with a "come back in a bit" message.
- Screenshot failure → continue text-only and flag `screenshotUrl: null`; the
  UI hides the thumbnail. HTML fetch failure → continue screenshot-only.
  Both failing → 422 "couldn't reach that page".
- Model / gateway missing → 503 with the same graceful copy used by Ask Tico.

## Open technical assumption

`openai/gpt-5-mini` on the Gateway is assumed to accept image input. If it
rejects the image part at build/verify time, swap `ROAST_MODEL` to a
vision-capable Gateway model for this route only; the feature is unaffected.

## Out of scope (fast-follows)

Persistent per-roast pages + OG images ("Shareable" tier), account-gated extra
roasts, distributed rate limiting.
