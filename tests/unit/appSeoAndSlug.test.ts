import { describe, it, expect } from "vitest";

describe("App SEO & Slug Routing Logic", () => {
  it("should generate valid canonical URL from slug or package_name fallback", () => {
    const appWithSlug = { slug: "winmix", package_name: "exa31.winmix" };
    const appWithoutSlug = { slug: null, package_name: "cloud.eka_dev.chat_app" };

    const getCanonicalUrl = (a: { slug?: string | null; package_name: string }) =>
      `https://eka-dev.cloud/apps/${a.slug || a.package_name}`;

    expect(getCanonicalUrl(appWithSlug)).toBe("https://eka-dev.cloud/apps/winmix");
    expect(getCanonicalUrl(appWithoutSlug)).toBe("https://eka-dev.cloud/apps/cloud.eka_dev.chat_app");
  });

  it("should categorize apps correctly for Schema.org applicationCategory", () => {
    const getAppCategory = (pkg?: string) => {
      const p = (pkg || "").toLowerCase();
      if (p.includes("winmix") || p.includes("audio")) return "MultimediaApplication";
      if (p.includes("walpaper") || p.includes("wallpaper")) return "PersonalizationApplication";
      if (p.includes("tracker") || p.includes("finance")) return "FinanceApplication";
      if (p.includes("task")) return "ProductivityApplication";
      if (p.includes("chat")) return "CommunicationApplication";
      return "SoftwareApplication";
    };

    expect(getAppCategory("exa31.winmix")).toBe("MultimediaApplication");
    expect(getAppCategory("exa31.anime-walpaper")).toBe("PersonalizationApplication");
    expect(getAppCategory("cloud.eka_dev.f_tracker")).toBe("FinanceApplication");
    expect(getAppCategory("cloud.eka_dev.task_hub")).toBe("ProductivityApplication");
    expect(getAppCategory("cloud.eka_dev.chat_app")).toBe("CommunicationApplication");
    expect(getAppCategory("com.cyber.cyber")).toBe("SoftwareApplication");
  });

  it("should format valid SoftwareApplication Schema.org JSON-LD", () => {
    const app = {
      app_name: "Winmix",
      tagline: "Native Windows-Style Audio Mixer & Anti-Ducking Utility for macOS",
      slug: "winmix",
      package_name: "exa31.winmix",
      latest_version_name: "1.1.0",
      supported_platforms: ["macos"],
      icon_url: "/images/apps/winmix/icon.png",
    };

    const schema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app.app_name,
      headline: app.tagline,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "macOS",
      softwareVersion: app.latest_version_name,
      downloadUrl: `https://eka-dev.cloud/api/v1/apps/${app.slug}/download`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Moh. Eka Syafrino",
        url: "https://eka-dev.cloud",
      },
    };

    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.name).toBe("Winmix");
    expect(schema.operatingSystem).toBe("macOS");
    expect(schema.offers.price).toBe("0");
    expect(schema.downloadUrl).toBe("https://eka-dev.cloud/api/v1/apps/winmix/download");
  });

  it("should produce valid sitemap XML including static and dynamic app URLs", () => {
    const baseUrl = "https://eka-dev.cloud";
    const today = "2026-11-15";

    const staticUrls = [
      { loc: `${baseUrl}/`, lastmod: today, changefreq: "weekly", priority: "1.0" },
      { loc: `${baseUrl}/apps`, lastmod: today, changefreq: "weekly", priority: "0.9" },
      { loc: `${baseUrl}/privacy`, lastmod: "2026-10-27", changefreq: "monthly", priority: "0.3" },
      { loc: `${baseUrl}/terms`, lastmod: "2026-10-27", changefreq: "monthly", priority: "0.3" },
    ];

    const apps = [
      { slug: "winmix", updated_at: "2026-11-15T00:00:00Z" },
      { slug: "anime-wallpaper", updated_at: "2026-11-15T00:00:00Z" },
    ];

    const appUrls = apps.map((a) => ({
      loc: `${baseUrl}/apps/${a.slug}`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.8",
    }));

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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>`;

    expect(xml).toContain("<loc>https://eka-dev.cloud/</loc>");
    expect(xml).toContain("<loc>https://eka-dev.cloud/apps</loc>");
    expect(xml).toContain("<loc>https://eka-dev.cloud/apps/winmix</loc>");
    expect(xml).toContain("<loc>https://eka-dev.cloud/apps/anime-wallpaper</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });
});
