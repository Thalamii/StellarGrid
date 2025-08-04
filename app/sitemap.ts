import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://wordgrid.game",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]
}
