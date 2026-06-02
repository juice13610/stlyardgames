import { MetadataRoute } from "next";

const BASE_URL = "https://stlyardgames.com";

const GAME_SLUGS = [
  "putterball",
  "cornhole",
  "washer-toss",
  "giant-jenga",
  "giant-connect-four",
  "ladder-ball",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const gameEntries: MetadataRoute.Sitemap = GAME_SLUGS.map((slug) => ({
    url: `${BASE_URL}/games/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/book`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...gameEntries,
  ];
}
