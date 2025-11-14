# Story 1.1: 实现首页多排序内容流

Status: ready-for-dev

## Story

As a 自我驱动型学习者，
I want 在首页按“最新 / 最热 / 个性化推荐”切换内容流，
so that 我可以用最少点击找到可信赖的学习资料。

## Acceptance Criteria

1. 首页提供“最新 / 最热 / 推荐”三个显式排序标签；切换后 300ms 内更新 UI 状态，并调用对应 API 查询，默认“推荐”。
2. 最新排序按 `published_at` 倒序返回 20 条内容卡片，卡片包含标题、摘要、标签、质量评分、点击数、收藏数，所有字段与 API 响应一致并可本地化显示。
3. 最热排序按最近 7 天聚合的点击 + 收藏得分（Redis 聚合写入 `content_rankings`）降序返回，缓存 60 秒；缓存失效时自动回退至数据库视图。
4. 推荐排序读取 `ranking_config` 权重（质量:点击:收藏 默认 0.5:0.3:0.2），由 BFF `/api/v1/feeds?sort=recommended` 计算得分返回；当配置更新时 1 分钟内生效。
5. 每个排序请求都会向 `/api/v1/events` 上报 `content.viewed` 事件，并将点击/收藏操作写入事件管线，供 worker 聚合；事件失败需在前端 Toast 并重试 2 次。
6. SEO/可访问性：默认排序页面可 SSR，Tab 切换符合 WCAG 2.1（键盘可达、ARIA 标签）；P95 API 响应 < 2s，前端加载骨架屏不超过 800ms。

## Tasks / Subtasks

- [x] 前端：实现排序 Tab + 内容区 (AC: 1,2,5,6)
  - [x] 使用 React Query 在 pps/web/app/(feed) 封装 useFeed(sort)，支持最新/热度/推荐
  - [x] 升级卡片展示，包含作者/标签/收藏指标，切换 Tab 即时反馈
- [x] 移动端：同等排序体验 (AC: 1,2,5,6)
  - [x] 在 pps/mobile/src/components/FeedScreen.tsx 复用 hooks，保持 Tab 可访问与语义化
- [ ] BFF：实现 /api/v1/feeds & /api/v1/events (AC: 3,4,5,6)
  - [ ] 在 services/bff-api/src/modules/feed 补充控制器/DTO/Swagger
  - [ ] 组合 Redis + Postgres 读写，封装 ranking_config 加权
- [ ] Worker：聚合排序信号 (AC: 3,4,5)
  - [ ] 在 services/workers 新增 ankings-aggregator job，写入 Redis Stream 与 content_rankings
- [ ] 数据&迁移 (AC: 2,3,4)
  - [ ] 使用 Prisma 为 content_rankings, anking_config 建模并落库
  - [ ] 为 content_events/quality_signals 增加所需索引
- [ ] 测试保障 (AC: 全部)
  - [ ] 编写 API 契约测试、前端 E2E（Tab 切换 + 事件上报）
  - [ ] 记录性能监控：feed P95、Redis 命中率等

## Dev Notes## Dev Notes

- 架构约束：遵循 `apps/* + services/* + packages/*` monorepo 结构；BFF 使用 NestJS 模块 + Prisma，[Source: docs/architecture.md#Project Structure]
- 排序权重与聚合流程必须复用“排序信号流水线”设计：前端事件 → Redis Stream → Worker → Postgres 视图，[Source: docs/architecture.md#Novel Pattern Designs]
- API 命名保持 `/api/v1/feeds`、`/api/v1/events`，并在 Swagger 中记录查询参数与响应，[Source: docs/architecture.md#API Contracts]
- 前端需遵循 Next.js + React Query 模式，SSR + ISR，满足 P95 <2s，[Source: docs/architecture.md#Performance Considerations]

### Project Structure Notes

- Web 端代码放入 `apps/web/app/(feed)`，移动端放 `apps/mobile/src/screens/Home`，共享 hooks 置于 `packages/hooks/feed.ts`。
- 新增 Redis/DB 访问逻辑位于 `services/bff-api/src/modules/feed/{feed.controller.ts, feed.service.ts, feed.repository.ts}`，Worker job 位于 `services/workers/src/jobs/rankings-aggregator.ts`。
- 新建 Prisma schema 及迁移放在 `services/bff-api/prisma/schema.prisma`，命名遵循 snake_case 表规则。

### References

- [Source: docs/PRD.md##MVP Scope]
- [Source: docs/PRD.md##Functional Requirements]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/architecture.md#API Contracts]
- [Source: docs/architecture.md#Performance Considerations]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-1-home-feed-sorting.context.xml

### Agent Model Used

TBD

### Debug Log References

1. [2025-11-14 10:20] 初始化 monorepo 骨架，配置 pnpm workspace、根级 TypeScript/测试工具。
2. [2025-11-14 10:35] 完成 Web feed Tab + 列表实现（Next.js + React Query + 事件上报 Toast）。
3. [2025-11-14 10:50] 完成移动端 FeedScreen，实现可访问 Tab、下拉刷新与事件上报。

### Completion Notes List

- 2025-11-14: Story 1.1/1.2 UI 端实现完成，包含共享 hooks、事件追踪、基础 Vitest schema 校验。

### File List

- package.json
- pnpm-workspace.yaml
- tsconfig.base.json
- vitest.config.ts
- apps/web/app/(feed)/layout.tsx
- apps/web/app/(feed)/page.tsx
- apps/web/components/FeedTabs.tsx
- apps/web/components/FeedList.tsx
- apps/web/components/Toast.tsx
- apps/web/components/toast.css
- apps/web/lib/query-client.ts
- apps/web/styles/globals.css
- apps/web/styles/feed.css
- apps/web/next.config.mjs
- packages/config/env.ts
- packages/hooks/package.json
- packages/hooks/useFeed.ts
- packages/hooks/useContentEvents.ts
- packages/hooks/__tests__/useFeed.test.ts
- packages/config/package.json
- packages/ui/package.json
- apps/mobile/package.json
- apps/mobile/app/index.tsx
- apps/mobile/src/components/FeedScreen.tsx
- apps/mobile/app.json
- apps/mobile/tsconfig.json

### Change Log

- 2025-11-14: 交付 web/mobile feed 排序体验、事件上报 hook 与校验测试，完成任务 1.1/1.2。


