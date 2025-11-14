"use client";

import { FeedSort } from "@dome/hooks/useFeed";
import { clsx } from "clsx";

const tabs: { label: string; value: FeedSort; description: string }[] = [
  { label: "最新", value: "latest", description: "过去 20 分钟实时" },
  { label: "热度", value: "trending", description: "7 天互动量排序" },
  { label: "推荐", value: "recommended", description: "推荐配置" },
];

export function FeedTabs({
  active,
  onChange,
  isLoading,
}: {
  active: FeedSort;
  onChange: (value: FeedSort) => void;
  isLoading: boolean;
}) {
  return (
    <div className="feed-tabs" role="tablist" aria-label="Feed sort tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          aria-controls={`panel-${tab.value}`}
          className={clsx("feed-tab", active === tab.value && "feed-tab-active")}
          onClick={() => onChange(tab.value)}
          disabled={isLoading && active !== tab.value}
        >
          <span>{tab.label}</span>
          <small>{tab.description}</small>
        </button>
      ))}
    </div>
  );
}
