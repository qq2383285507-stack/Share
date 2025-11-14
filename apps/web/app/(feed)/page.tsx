"use client";

import { useState } from "react";
import { FeedTabs } from "../../components/FeedTabs";
import { FeedList } from "../../components/FeedList";
import { FeedSort, useFeed } from "@dome/hooks/useFeed";
import "../../styles/feed.css";

const FEATURE_TOGGLES: Record<FeedSort, string[]> = {
  latest: ["SSR", "React Query", "离线中心化", "分片增量发布"],
  trending: ["Redis Cache", "Signals", "热度因子", "聚类曝光"],
  recommended: ["ranking_config", "AI Mix", "召回埋点", "多臂老虎机"],
};

const NAV_LINKS = [
  { id: "overview", label: "概览" },
  { id: "feature-toggles", label: "功能开关" },
  { id: "feed-panels", label: "排序实验" },
];

const HERO_METRICS = [
  { label: "今日成功率", value: "99.1%", helper: "较昨日 +0.4%" },
  { label: "平均刷新", value: "210ms", helper: "P95 稳定" },
  { label: "缓存命中", value: "87%", helper: "Redis" },
  { label: "活跃实验", value: "6", helper: "3 控制 + 3 试验" },
];

const INSIGHTS = [
  {
    title: "推荐池热度",
    value: "132",
    trend: "+12%",
    description: "AI 混排请求数 / 分钟",
  },
  {
    title: "排序回滚",
    value: "0",
    trend: "正常",
    description: "近 24 小时无回滚",
  },
  {
    title: "手动干预",
    value: "4",
    trend: "两次置顶",
    description: "运营介入次数",
  },
];

export default function FeedPage() {
  const [sort, setSort] = useState<FeedSort>("recommended");
  const { data, isFetching, refetch } = useFeed(sort);
  const items = data ?? [];

  return (
    <main className="feed">
      <nav className="feed-nav" aria-label="Share Feed 导航">
        <div className="feed-nav-brand">
          <span className="badge">Share Feed</span>
          <div>
            <h1>创作者动态</h1>
            <p>实时掌握排序策略、缓存层以及实验对体验的影响。</p>
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
          <button className="ghost">产品手册</button>
          <button className="primary">创建分享</button>
        </div>
      </nav>

      <section id="overview" className="feed-hero">
        <div>
          <p className="eyebrow">Feed 实验 · P95 目标 300ms</p>
          <h2>在成员察觉前先捕捉性能回归</h2>
          <p className="muted">
            持续关注排序实验、缓存命中率与刷新频次，快速定位异常波动。
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
          <article key={insight.title}>
            <div>
              <p className="insight-title">{insight.title}</p>
              <p className="insight-description">{insight.description}</p>
            </div>
            <div className="insight-metric">
              <strong>{insight.value}</strong>
              <span>{insight.trend}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="feature-toggles" className="feed-feature-panel">
        <div className="feed-feature-copy">
          <h3>当前排序实验</h3>
          <p>切换排序查看特征组合，需要时即时刷新缓存。</p>
          <button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "刷新中..." : "立即刷新"}
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
          <FeedList items={items} sort={sort} isLoading={isFetching} />
        </div>
      </section>
    </main>
  );
}
