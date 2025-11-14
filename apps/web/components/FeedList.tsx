"use client";

import { FeedSort } from "@dome/hooks/useFeed";
import { useContentEvent } from "@dome/hooks/useContentEvents";
import { useToast } from "./Toast";

type FeedItem = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  author: string;
  publishedAt: string;
  engagement: {
    views: number;
    bookmarks: number;
    rating: number;
  };
};

export function FeedList({
  items,
  sort,
  isLoading,
}: {
  items: FeedItem[] | undefined;
  sort: FeedSort;
  isLoading: boolean;
}) {
  const toast = useToast();
  const mutation = useContentEvent();

  const trackView = async (contentId: string, rating: number) => {
    try {
      await mutation.mutateAsync({
        event: "content.viewed",
        contentId,
        sort,
        metadata: { rating },
      });
      toast.push("事件上报成功", "success");
    } catch (error) {
      console.error(error);
      toast.push("事件上报失败，请重试", "error");
    }
  };

  if (isLoading && !items?.length) {
    return (
      <div className="feed-list" aria-live="polite" aria-busy="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div className="skeleton" key={idx} />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return <p role="status">暂无可展示的内容</p>;
  }

  return (
    <div className="feed-list" aria-live="polite">
      {items.map((item) => (
        <article
          key={item.id}
          className="feed-card"
          aria-labelledby={`content-${item.id}`}
        >
          <div className="feed-card-header">
            <div>
              <h2 id={`content-${item.id}`}>{item.title}</h2>
              <p>{item.summary}</p>
            </div>
            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
          </div>
          <div className="feed-card-tags">
            {[item.topic, ...item.tags].map((tag) => (
              <span key={tag} className="feed-card-tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="feed-card-footer">
            <div className="feed-card-metrics">
              <span>阅读 {item.engagement.views}</span>
              <span>收藏 {item.engagement.bookmarks}</span>
              <span>评分 {item.engagement.rating.toFixed(1)}</span>
            </div>
            <button onClick={() => trackView(item.id, item.engagement.rating)}>
              上报 content.viewed
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
