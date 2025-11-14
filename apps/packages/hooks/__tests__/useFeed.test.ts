import { describe, expect, it } from "vitest";
import { feedResponseSchema } from "../useFeed";

describe("feedResponseSchema", () => {
  it("accepts valid responses", () => {
    const parsed = feedResponseSchema.parse({
      items: [
        {
          id: "1",
          title: "最新排序",
          summary: "测试摘要",
          topic: "AI",
          tags: ["tag1"],
          author: "系统",
          publishedAt: new Date().toISOString(),
          engagement: { views: 10, bookmarks: 5, rating: 4.5 },
        },
      ],
    });

    expect(parsed.items).toHaveLength(1);
  });

  it("rejects invalid payloads", () => {
    expect(() =>
      feedResponseSchema.parse({ items: [{ id: 1 }] })
    ).toThrowError();
  });
});
