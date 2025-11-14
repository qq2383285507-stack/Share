import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { env } from "@dome/config/env";

export type FeedSort = "latest" | "trending" | "recommended";

const mediaSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video", "audio"]),
  src: z.string(),
  cover: z.string().optional(),
  caption: z.string().optional(),
});

const replySchema = z.object({
  id: z.string(),
  author: z.string(),
  avatar: z.string().optional(),
  content: z.string(),
  publishedAt: z.string(),
});

const commentSchema = z.object({
  id: z.string(),
  author: z.string(),
  avatar: z.string().optional(),
  content: z.string(),
  publishedAt: z.string(),
  replies: z.array(replySchema).optional().default([]),
});

export const feedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  topic: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  authorMeta: z
    .object({
      avatar: z.string().optional(),
      isFollowing: z.boolean().optional().default(false),
      isBookmarked: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
  publishedAt: z.string(),
  engagement: z.object({
    views: z.number(),
    bookmarks: z.number(),
    rating: z.number(),
  }),
  details: z
    .object({
      body: z.string().optional().default(""),
      media: z.array(mediaSchema).optional().default([]),
    })
    .optional()
    .default({ body: "", media: [] }),
  comments: z.array(commentSchema).optional().default([]),
});

export const feedResponseSchema = z.object({
  items: z.array(feedItemSchema),
  cacheTtlSeconds: z.number().optional().default(60),
});

export async function fetchFeed(sort: FeedSort) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
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
      console.warn(`Feed request failed (${response.status}). Serving mock data.`);
      return buildMockFeed(sort);
    }

    const json = await response.json();
    return feedResponseSchema.parse(json);
  } catch (error) {
    console.warn(`Feed request errored (${(error as Error).message}). Serving mock data.`);
    clearTimeout(timeout);
    return buildMockFeed(sort);
  }
}

const mockFeedItems: Record<FeedSort, z.infer<typeof feedItemSchema>[]> = {
  latest: [
    {
      id: "latest-1",
      title: "今天的第一杯咖啡：城市角落里的书店",
      summary: "探访社区新开的复合书店，在咖啡香里与店主聊聊选书故事。",
      topic: "生活方式",
      tags: ["城市", "咖啡", "书店"],
      author: "阿絮",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=AX",
        isFollowing: false,
        isBookmarked: false,
      },
      publishedAt: new Date().toISOString(),
      engagement: { views: 1280, bookmarks: 64, rating: 4.6 },
      details: {
        body: "从社区漫步开始，我在雨后的街角遇见这家新书店。店主把咖啡机放在落地窗旁，读者可以一边听黑胶一边挑选独立杂志。",
        media: [
          {
            id: "media-ax-1",
            type: "image",
            src: "https://placehold.co/620x360",
            caption: "书店门口的绿植",
          },
          {
            id: "media-ax-2",
            type: "audio",
            src: "https://filesampleshub.com/download/audio/mp3/sample-3.mp3",
            caption: "与店主的聊天",
          },
        ],
      },
      comments: [
        {
          id: "c-ax-1",
          author: "杉杉",
          avatar: "https://placehold.co/40x40?text=SS",
          content: "这家店的司康太好吃啦！",
          publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          replies: [
            {
              id: "c-ax-1-r1",
              author: "阿絮",
              avatar: "https://placehold.co/32x32?text=AX",
              content: "下次一起去～",
              publishedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
            },
          ],
        },
      ],
    },
    {
      id: "latest-2",
      title: "通勤路上的 3 件小事，让心情迅速变好",
      summary: "五分钟内完成的放松仪式，帮助你和早高峰握手言和。",
      topic: "效率提升",
      tags: ["通勤", "习惯", "心情"],
      author: "斑马",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=ZM",
        isFollowing: true,
        isBookmarked: false,
      },
      publishedAt: new Date().toISOString(),
      engagement: { views: 980, bookmarks: 103, rating: 4.4 },
      details: {
        body: "把音乐、香气和五分钟伸展纳入通勤，心情也会跟着放松。文中附赠可下载的播放列表。",
        media: [
          {
            id: "media-zm-1",
            type: "audio",
            src: "https://filesampleshub.com/download/audio/mp3/sample-6.mp3",
            caption: "早安播客片段",
          },
        ],
      },
      comments: [],
    },
    {
      id: "latest-3",
      title: "雨后拍照指南：用手机记录街头倒影",
      summary: "掌握三个构图技巧，让手机也能拍出胶片般的质感。",
      topic: "摄影",
      tags: ["手机", "教程", "胶片感"],
      author: "林可",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=LK",
        isFollowing: false,
        isBookmarked: true,
      },
      publishedAt: new Date().toISOString(),
      engagement: { views: 1560, bookmarks: 320, rating: 4.8 },
      details: {
        body: "阴天和雨后的街道适合捕捉倒影。示范了三种构图方式，附原始参数供练习。",
        media: [
          {
            id: "media-lk-1",
            type: "image",
            src: "https://placehold.co/640x360?text=Reflection",
            caption: "街头倒影",
          },
          {
            id: "media-lk-2",
            type: "video",
            src: "https://filesampleshub.com/download/video/mp4/sample-5.mp4",
            cover: "https://placehold.co/640x360?text=Video",
            caption: "拍摄过程",
          },
        ],
      },
      comments: [],
    },
  ],
  trending: [
    {
      id: "trending-1",
      title: "#旅行季·成都# 二日逛吃路线全记录",
      summary: "人气作者整理的 16 小时成都走读，含咖啡、展览与深夜面。",
      topic: "旅行季",
      tags: ["成都", "路线", "打卡"],
      author: "木南",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=MN",
        isFollowing: true,
        isBookmarked: false,
      },
      publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      engagement: { views: 6230, bookmarks: 880, rating: 4.9 },
      details: {
        body: "为期两天的成都巡游路线，涵盖咖啡、展览与夜宵地图。",
        media: [
          {
            id: "media-mn-1",
            type: "image",
            src: "https://placehold.co/620x360?text=CD",
            caption: "春日街景",
          },
        ],
      },
      comments: [],
    },
    {
      id: "trending-2",
      title: "10 位创作者分享的学习桌面灵感",
      summary: "收集自社区的人气桌搭，含灯光、收纳、香氛等布置建议。",
      topic: "创作马拉松",
      tags: ["桌搭", "收纳", "灵感"],
      author: "Lois",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=L",
        isFollowing: false,
        isBookmarked: false,
      },
      publishedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
      engagement: { views: 7110, bookmarks: 1320, rating: 4.7 },
      details: {
        body: "10 位创作者的人气桌搭，含灯光、收纳与香氛建议。",
        media: [
          {
            id: "media-lo-1",
            type: "image",
            src: "https://placehold.co/640x360?text=Desk",
            caption: "极简桌面",
          },
        ],
      },
      comments: [],
    },
    {
      id: "trending-3",
      title: "朋友都在聊的 Spring Chill 播放清单",
      summary: "由社区 DJ 共同策划的 25 首春日小众好歌，一键收藏。",
      topic: "音乐",
      tags: ["歌单", "春日", "氛围"],
      author: "Echo",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=EC",
        isFollowing: false,
        isBookmarked: false,
      },
      publishedAt: new Date(Date.now() - 5400 * 1000).toISOString(),
      engagement: { views: 4890, bookmarks: 940, rating: 4.5 },
      details: {
        body: "春日限定的独立音乐清单，提供双平台链接。",
        media: [
          {
            id: "media-ec-1",
            type: "audio",
            src: "https://filesampleshub.com/download/audio/mp3/sample-9.mp3",
            caption: "清单试听",
          },
        ],
      },
      comments: [],
    },
  ],
  recommended: [
    {
      id: "recommended-1",
      title: "为你挑的：小宇宙的创作日常",
      summary: "来自你关注作者的幕后花絮，感受她准备新作品的灵感来源。",
      topic: "关注作者",
      tags: ["随笔", "创作", "幕后"],
      author: "小宇宙",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=XY",
        isFollowing: true,
        isBookmarked: true,
      },
      publishedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
      engagement: { views: 2100, bookmarks: 450, rating: 4.9 },
      details: {
        body: "幕后记录创作灵感，从草图到上线插画。",
        media: [
          {
            id: "media-xy-1",
            type: "image",
            src: "https://placehold.co/640x360?text=Sketch",
            caption: "起稿阶段",
          },
        ],
      },
      comments: [],
    },
    {
      id: "recommended-2",
      title: "社区口碑 · 值得一看的手作视频",
      summary: "结合你的收藏主题推荐的 3 支短片，含材料清单与成品展示。",
      topic: "手作",
      tags: ["视频", "DIY", "收藏"],
      author: "慢手慢脚",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=MS",
        isFollowing: false,
        isBookmarked: false,
      },
      publishedAt: new Date(Date.now() - 43200 * 1000).toISOString(),
      engagement: { views: 3650, bookmarks: 770, rating: 4.6 },
      details: {
        body: "三支短视频展示手作首饰的制作步骤。",
        media: [
          {
            id: "media-ms-1",
            type: "video",
            src: "https://filesampleshub.com/download/video/mp4/sample-2.mp4",
            cover: "https://placehold.co/640x360?text=DIY",
            caption: "制作过程",
          },
        ],
      },
      comments: [],
    },
    {
      id: "recommended-3",
      title: "兴趣优先：三分钟了解 AI 绘画入门",
      summary: "根据你的浏览记录推送的短教程，涵盖常用提示词与练习思路。",
      topic: "灵感营地",
      tags: ["AI", "绘画", "教程"],
      author: "杉木",
      authorMeta: {
        avatar: "https://placehold.co/64x64?text=SM",
        isFollowing: true,
        isBookmarked: false,
      },
      publishedAt: new Date(Date.now() - 21600 * 1000).toISOString(),
      engagement: { views: 2980, bookmarks: 640, rating: 4.7 },
      details: {
        body: "入门 AI 绘画的关键提示词与练习方法，附工具链接。",
        media: [],
      },
      comments: [],
    },
  ],
};

function buildMockFeed(sort: FeedSort) {
  return { items: mockFeedItems[sort], cacheTtlSeconds: 0 };
}

export function useFeed(sort: FeedSort) {
  return useQuery({
    queryKey: ["feed", sort],
    queryFn: () => fetchFeed(sort),
    select: (data) => data.items,
    retry: 2,
  });
}
