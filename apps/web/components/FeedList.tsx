"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedSort } from "@dome/hooks/useFeed";

type FeedItem = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  author: string;
  authorMeta?: {
    avatar?: string;
    isFollowing?: boolean;
    isBookmarked?: boolean;
  };
  publishedAt: string;
  engagement: {
    views: number;
    bookmarks: number;
    rating: number;
  };
  details: {
    body: string;
    media: MediaItem[];
  };
  comments: CommentItem[];
};

type MediaItem = {
  id: string;
  type: "image" | "video" | "audio";
  src: string;
  cover?: string;
  caption?: string;
};

type CommentItem = {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  publishedAt: string;
  replies?: Array<{
    id: string;
    author: string;
    avatar?: string;
    content: string;
    publishedAt: string;
  }>;
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
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const [activeComments, setActiveComments] = useState<CommentItem[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!activeItem) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem]);

  const openDetail = (item: FeedItem) => {
    setActiveItem(item);
    setActiveComments(item.comments ?? []);
    setCommentDraft("");
    setReplyDraft("");
    setReplyTarget(null);
    setIsFollowing(item.authorMeta?.isFollowing ?? false);
    setIsBookmarked(item.authorMeta?.isBookmarked ?? false);
  };

  const closeDetail = () => {
    setActiveItem(null);
    setReplyTarget(null);
  };

  const handleSubmitComment = () => {
    if (!activeItem || !commentDraft.trim()) return;
    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      author: "我",
      avatar: undefined,
      content: commentDraft.trim(),
      publishedAt: new Date().toISOString(),
      replies: [],
    };
    setActiveComments((prev) => [newComment, ...prev]);
    setCommentDraft("");
  };

  const handleSubmitReply = () => {
    if (!replyTarget || !replyDraft.trim()) return;
    const reply = {
      id: `reply-${Date.now()}`,
      author: "我",
      avatar: undefined,
      content: replyDraft.trim(),
      publishedAt: new Date().toISOString(),
    };
    setActiveComments((prev) =>
      prev.map((comment) =>
        comment.id === replyTarget
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), reply],
            }
          : comment
      )
    );
    setReplyDraft("");
    setReplyTarget(null);
  };

  const modalHeading = useMemo(() => {
    if (!activeItem) return "";
    return `${activeItem.topic} · ${activeItem.title}`;
  }, [activeItem]);

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
          className="feed-card feed-card-clickable"
          aria-labelledby={`content-${item.id}`}
          role="button"
          tabIndex={0}
          onClick={() => openDetail(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDetail(item);
            }
          }}
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
          </div>
        </article>
      ))}

      {activeItem && (
        <div
          className="feed-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feed-modal-title"
        >
          <div className="feed-modal-content">
            <button
              type="button"
              className="feed-modal-close"
              onClick={closeDetail}
              aria-label="关闭详情"
            >
              ×
            </button>
            <p className="feed-modal-topic">{activeItem.topic}</p>
            <h2 id="feed-modal-title">{modalHeading}</h2>
            <p className="feed-modal-summary">{activeItem.summary}</p>
            <div className="feed-modal-body">
              <p>{activeItem.details.body}</p>
            </div>
            {activeItem.details.media.length > 0 && (
              <div className="feed-modal-media">
                {activeItem.details.media.map((media) => {
                  if (media.type === "image") {
                    return (
                      <figure key={media.id}>
                        <img src={media.src} alt={media.caption ?? media.id} />
                        {media.caption && <figcaption>{media.caption}</figcaption>}
                      </figure>
                    );
                  }
                  if (media.type === "video") {
                    return (
                      <figure key={media.id}>
                        <video
                          src={media.src}
                          poster={media.cover}
                          controls
                        />
                        {media.caption && <figcaption>{media.caption}</figcaption>}
                      </figure>
                    );
                  }
                  return (
                    <figure key={media.id}>
                      <audio src={media.src} controls />
                      {media.caption && <figcaption>{media.caption}</figcaption>}
                    </figure>
                  );
                })}
              </div>
            )}
            <ul className="feed-modal-tags">
              {activeItem.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <div className="feed-modal-author">
              {activeItem.authorMeta?.avatar && (
                <img
                  src={activeItem.authorMeta.avatar}
                  alt={activeItem.author}
                  className="feed-modal-author-avatar"
                />
              )}
              <div>
                <strong>{activeItem.author}</strong>
                <span>
                  发布时间 · {new Date(activeItem.publishedAt).toLocaleString()}
                </span>
              </div>
              <div className="feed-modal-author-actions">
                <button
                  type="button"
                  onClick={() => setIsFollowing((prev) => !prev)}
                >
                  {isFollowing ? "已关注" : "关注作者"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookmarked((prev) => !prev)}
                  className={isBookmarked ? "active" : undefined}
                >
                  {isBookmarked ? "已收藏" : "收藏"}
                </button>
              </div>
            </div>
            <div className="feed-modal-metrics">
              <span>阅读 {activeItem.engagement.views}</span>
              <span>收藏 {activeItem.engagement.bookmarks}</span>
              <span>评分 {activeItem.engagement.rating.toFixed(1)}</span>
            </div>

            <section className="feed-modal-comments">
              <h3>评论</h3>
              <div className="comment-form">
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="写下你的想法..."
                  rows={3}
                />
                <button type="button" onClick={handleSubmitComment}>
                  发布评论
                </button>
              </div>
              {replyTarget && (
                <div className="comment-reply-form">
                  <p>回复 @{activeComments.find((c) => c.id === replyTarget)?.author}</p>
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    rows={2}
                  />
                  <div>
                    <button type="button" onClick={() => setReplyTarget(null)}>
                      取消
                    </button>
                    <button type="button" onClick={handleSubmitReply}>
                      发送回复
                    </button>
                  </div>
                </div>
              )}
              <ul className="comment-list">
                {activeComments.map((comment) => (
                  <li key={comment.id}>
                    <div className="comment-item">
                      {comment.avatar && (
                        <img src={comment.avatar} alt={comment.author} />
                      )}
                      <div>
                        <div className="comment-item-heading">
                          <strong>{comment.author}</strong>
                          <span>
                            {new Date(comment.publishedAt).toLocaleString()}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                        <button
                          type="button"
                          onClick={() => setReplyTarget(comment.id)}
                        >
                          回复
                        </button>
                      </div>
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <ul className="comment-replies">
                        {comment.replies.map((reply) => (
                          <li key={reply.id}>
                            <div className="comment-item reply">
                              {reply.avatar && (
                                <img src={reply.avatar} alt={reply.author} />
                              )}
                              <div>
                                <div className="comment-item-heading">
                                  <strong>{reply.author}</strong>
                                  <span>
                                    {new Date(reply.publishedAt).toLocaleString()}
                                  </span>
                                </div>
                                <p>{reply.content}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <button type="button" className="feed-modal-action" onClick={closeDetail}>
              返回列表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
