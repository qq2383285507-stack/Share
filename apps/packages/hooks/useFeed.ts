import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { env } from "@dome/config/env";

export type FeedSort = "latest" | "trending" | "recommended";

export const feedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  topic: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  publishedAt: z.string(),
  engagement: z.object({
    views: z.number(),
    bookmarks: z.number(),
    rating: z.number(),
  }),
});

export const feedResponseSchema = z.object({
  items: z.array(feedItemSchema),
  cacheTtlSeconds: z.number().optional().default(60),
});

export async function fetchFeed(sort: FeedSort) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(
    `${env.bffBaseUrl}/api/v1/feeds?sort=${sort}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    }
  );
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status})`);
  }

  const json = await response.json();
  return feedResponseSchema.parse(json);
}

export function useFeed(sort: FeedSort) {
  return useQuery({
    queryKey: ["feed", sort],
    queryFn: () => fetchFeed(sort),
    select: (data) => data.items,
    retry: 2,
  });
}
