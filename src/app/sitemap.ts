import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smartgrowth.app";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/plan", priority: 0.9, changeFrequency: "weekly" },
  { path: "/urunler", priority: 0.8, changeFrequency: "weekly" },
  { path: "/mikrofiliz", priority: 0.8, changeFrequency: "weekly" },
  { path: "/gorevler", priority: 0.6, changeFrequency: "monthly" },
  { path: "/panel", priority: 0.5, changeFrequency: "daily" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
