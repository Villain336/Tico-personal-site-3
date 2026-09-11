import Link from "next/link";
import { nav, site } from "@/content/site";
import { TwitterButton } from "@/components/twitter-button";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Marketer, designer, and founder of{" "}
            <span className="font-semibold text-foreground">
              {site.agency}
            </span>
            . Building this site out in the open.
          </p>
          <div className="mt-4">
            <TwitterButton size="sm" label="@PushinSaas" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/80 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
