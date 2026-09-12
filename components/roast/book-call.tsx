import { site } from "@/content/site";
import { roastCopy } from "@/content/roast";

/**
 * Lead-gen block under a roast. Renders Calendly inline when a scheduling
 * URL is configured; otherwise degrades to a DM button so the CTA is never
 * a dead end.
 */
export function BookCall() {
  const calendly = site.calendlyUrl.trim();

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-foreground text-background">
      <div className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr] md:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-lime">
            {site.agency}
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight">
            {roastCopy.bookHeading}
          </h2>
          <p className="mt-3 text-background/75">{roastCopy.bookSub}</p>
          {!calendly && (
            <a
              href={site.socials.twitter}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-lime px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
            >
              <XGlyph />
              {roastCopy.bookFallback}
            </a>
          )}
        </div>

        {calendly ? (
          <div className="overflow-hidden rounded-2xl bg-white">
            <iframe
              title="Book a call with Launchabl"
              src={withEmbedParams(calendly)}
              className="h-[640px] w-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <ul className="grid gap-3 self-center text-sm text-background/80">
            {[
              "A 30-minute live walk-through of your page",
              "The three fixes, prioritized, with examples",
              "A straight answer on whether you need a rebuild",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-lime" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function withEmbedParams(url: string) {
  const u = new URL(url);
  u.searchParams.set("embed_type", "Inline");
  u.searchParams.set("hide_gdpr_banner", "1");
  u.searchParams.set("primary_color", "6d3cf5");
  return u.toString();
}

function XGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.5 8.57L22.75 22h-6.91l-5.41-7.07L4.24 22H1l8.02-9.17L.5 2h7.08l4.89 6.47L18.24 2Zm-1.21 18h1.8L7.05 3.9H5.12L17.03 20Z" />
    </svg>
  );
}
