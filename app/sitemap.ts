import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { caseStudies } from "@/content/work";
import { posts } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/work", "/gems", "/star-glide", "/shalom-valley", "/roast", "/gallery", "/blog", "/about"].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
    }),
  );

  const workRoutes = caseStudies.map((c) => ({
    url: `${site.url}/work/${c.slug}`,
    lastModified: new Date(),
  }));

  const blogRoutes = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...workRoutes, ...blogRoutes];
}
