import { listPublishedApps } from "~~/server/repositories/apk.repository";
import { withTransaction } from "~~/server/db/postgres";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");

  const baseUrl = "https://eka-dev.cloud";
  const today = new Date().toISOString().split("T")[0];

  let apps: any[] = [];
  try {
    apps = await withTransaction(async (client) => {
      return await listPublishedApps(client);
    });
  } catch (err) {
    console.error("[sitemap.xml] Error fetching published apps:", err);
  }

  const staticUrls = [
    {
      loc: `${baseUrl}/`,
      lastmod: today,
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      loc: `${baseUrl}/apps`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.9",
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: "2026-10-27",
      changefreq: "monthly",
      priority: "0.3",
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: "2026-10-27",
      changefreq: "monthly",
      priority: "0.3",
    },
  ];

  const appUrls = apps.map((app) => {
    const slug = app.slug || app.package_name;
    const lastModDate = app.updated_at
      ? new Date(app.updated_at).toISOString().split("T")[0]
      : today;
    return {
      loc: `${baseUrl}/apps/${slug}`,
      lastmod: lastModDate,
      changefreq: "weekly",
      priority: "0.8",
    };
  });

  const allUrls = [...staticUrls, ...appUrls];

  const xmlEntries = allUrls
    .map(
      (u) => `    <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`
    )
    .join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
});
