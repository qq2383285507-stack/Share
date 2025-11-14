"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FeedTabs } from "../../components/FeedTabs";
import { FeedList } from "../../components/FeedList";
import { FeedSort, useFeed } from "@dome/hooks/useFeed";
import "../../styles/feed.css";

const FEATURE_TOGGLES: Record<FeedSort, string[]> = {
  latest: ["刚刚发布", "作者亲述", "即时问答", "现场图集"],
  trending: ["全网热议", "精选长文", "视频回顾", "人气合辑"],
  recommended: ["你关注的主题", "常看的作者", "为你精选", "社区口碑"],
};

const NAV_LINKS = [
  { id: "overview", label: "概览" },
  { id: "feature-toggles", label: "功能开关" },
  { id: "feed-panels", label: "排序实验" },
];

const HERO_METRICS = [
  { label: "今日新增分享", value: "428", helper: "社区高活跃" },
  { label: "与你相关", value: "36", helper: "兴趣优先" },
  { label: "互动提醒", value: "12", helper: "朋友在讨论" },
  { label: "未读消息", value: "5", helper: "保持关注" },
];

const INSIGHTS = [
  {
    title: "热门话题",
    value: "旅行季",
    trend: "7.4万参与",
    description: "晒出你的春季出行灵感",
  },
  {
    title: "作者推荐",
    value: "小宇宙",
    trend: "新作品 3 篇",
    description: "关注作者更新不错过",
  },
  {
    title: "活动预告",
    value: "创作马拉松",
    trend: "报名倒计时 2 天",
    description: "完成任务赢限定徽章",
  },
];

export default function FeedPage() {
  const [sort, setSort] = useState<FeedSort>("recommended");
  const { data, isFetching, refetch } = useFeed(sort);
  const items = data ?? [];
  type FeedItemType = (typeof items)[number];
  const [localLatest, setLocalLatest] = useState<FeedItemType[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerTopic, setComposerTopic] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerMedia, setComposerMedia] = useState("");
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!composerMessage) return;
    const timer = setTimeout(() => setComposerMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [composerMessage]);

  const openComposer = () => {
    setIsComposerOpen(true);
    setComposerMessage(null);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setComposerTitle("");
    setComposerTopic("");
    setComposerBody("");
    setComposerMedia("");
  };

  const guessMediaType = (url: string): "image" | "video" | "audio" => {
    const lower = url.toLowerCase();
    if (/(mp4|mov|webm)$/.test(lower)) return "video";
    if (/(mp3|wav|aac)$/.test(lower)) return "audio";
    return "image";
  };

  const handlePublish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composerTitle.trim() || !composerBody.trim()) {
      setComposerMessage("请填写标题和内容");
      return;
    }
    const topic = composerTopic.trim() || "即时分享";
    const body = composerBody.trim();
    const mediaLink = composerMedia.trim();
    const newItem: FeedItemType = {
      id: `local-${Date.now()}`,
      title: composerTitle.trim(),
      summary: body.length > 80 ? `${body.slice(0, 80)}…` : body,
      topic,
      tags: topic ? [topic] : [],
      author: "我",
      authorMeta: { isFollowing: true, isBookmarked: true },
      publishedAt: new Date().toISOString(),
      engagement: { views: 0, bookmarks: 0, rating: 5 },
      details: {
        body,
        media: mediaLink
          ? [
              {
                id: `media-${Date.now()}`,
                type: guessMediaType(mediaLink),
                src: mediaLink,
                caption: topic,
              },
            ]
          : [],
      },
      comments: [],
    };
    setLocalLatest((prev) => [newItem, ...prev]);
    setComposerMessage(`《${composerTitle.trim()}》已发布，可在最新列表查看。`);
    closeComposer();
  };

  const displayedItems = useMemo(() => {
    if (sort === "latest") {
      return [...localLatest, ...items];
    }
    return items;
  }, [items, localLatest, sort]);

  return (
    <main className="feed">
      <nav className="feed-nav" aria-label="Share Feed 导航">
        <div className="feed-nav-brand">
          <span className="badge">Share Feed</span>
          <div>
            <h1>创作者动态</h1>
            <p>发现你关注的作者、话题与活动，及时掌握社区新鲜事。</p>
          </div>
        </div>
        <ul className="feed-nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} className="feed-nav-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="feed-nav-actions">
          <button className="ghost">浏览专题</button>
          <button type="button" className="primary" onClick={openComposer}>
            发布内容
          </button>
        </div>
      </nav>
      {composerMessage && <p className="feed-compose-feedback">{composerMessage}</p>}

      <section id="overview" className="feed-hero">
        <div>
          <p className="eyebrow">Share Feed · 今日亮点</p>
          <h2>好内容在此集合，灵感随时刷新</h2>
          <p className="muted">
            根据你的关注、收藏和浏览记录，为你聚合值得一看的创作和讨论。
          </p>
        </div>
        <div className="feed-hero-actions">
          {HERO_METRICS.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.helper}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="feed-insights">
        {INSIGHTS.map((insight) => (
          <article key={insight.title} className="feed-insight-card">
            <div className="feed-insight-body">
              <p className="insight-title">{insight.title}</p>
              <p className="insight-description">{insight.description}</p>
            </div>
            <div className="feed-insight-metric">
              <strong>{insight.value}</strong>
              <span>{insight.trend}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="feature-toggles" className="feed-feature-panel">
        <div className="feed-feature-copy">
          <h3>内容偏好</h3>
          <p>切换排序，探索热门或最新内容，也可以刷新以获取更多灵感。</p>
          <button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "加载中..." : "刷新推荐"}
          </button>
        </div>
        <ul className="feed-feature-list">
          {FEATURE_TOGGLES[sort].map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section id="feed-panels" className="feed-panels">
        <FeedTabs active={sort} onChange={setSort} isLoading={isFetching} />
        <div id={`panel-${sort}`} role="tabpanel">
          <FeedList items={displayedItems} sort={sort} isLoading={isFetching} />
        </div>
      </section>

      {isComposerOpen && (
        <div className="feed-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title">
          <form className="feed-modal-content feed-compose" onSubmit={handlePublish}>
            <button type="button" className="feed-modal-close" onClick={closeComposer} aria-label="关闭发布器">
              ×
            </button>
            <p className="feed-modal-topic">发布内容</p>
            <h2 id="composer-title">创建新的分享</h2>
            <label>
              主题
              <input
                type="text"
                value={composerTopic}
                onChange={(event) => setComposerTopic(event.target.value)}
                placeholder="例如：城市漫游、旅行季"
              />
            </label>
            <label>
              标题
              <input
                type="text"
                value={composerTitle}
                onChange={(event) => setComposerTitle(event.target.value)}
                required
                placeholder="为你的内容起一个吸引人的标题"
              />
            </label>
            <label>
              正文
              <textarea
                value={composerBody}
                onChange={(event) => setComposerBody(event.target.value)}
                rows={15}
                required
                placeholder="写下分享的灵感、故事或教程"
              />
            </label>
            <label>
              媒体链接（选填）
              <input
                type="url"
                value={composerMedia}
                onChange={(event) => setComposerMedia(event.target.value)}
                placeholder="粘贴图片/视频/音频链接"
              />
            </label>
            <small>内容会先保存为草稿，稍后可在桌面端继续编辑后发布。</small>
            <div className="feed-compose-actions">
              <button type="button" onClick={closeComposer}>
                取消
              </button>
              <button type="submit" className="primary">
                保存草稿
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
