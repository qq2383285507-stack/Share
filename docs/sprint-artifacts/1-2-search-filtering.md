# Story 1.2: 搜索与筛选体验

Status: ready-for-dev

## Story

As a 自我驱动型学习者，
I want 通过搜索与筛选快速定位匹配的学习内容，
so that 我能在特定主题/时长/难度范围内找到可复用的资料。

## Acceptance Criteria

1. 搜索框支持模糊匹配标题、摘要与标签；输入≥2字符后 300ms debounce，调用 `/api/v1/search?q=`，返回列表结构与首页卡片一致。
2. 筛选面板提供标签、主题、学习时长（≤30min/30-90min/≥90min）、难度（初阶/进阶/专家）、内容类型等多选项，选择后生成查询参数（如 `tags=...&duration=short`），并可一键清除，面板在 Web/移动端均支持键盘/触控操作（WCAG 2.1 AA）。
3. 搜索结果空态需展示清晰提示与“清除筛选”按钮；若服务端返回推荐替代项（`suggestions`），需在空态中显示最多 5 条跳转链接。
4. 所有筛选条件与搜索词都写入 URL（Web）或本地路由状态（移动端），刷新/重新打开时保持选择；移动端在冷启动后恢复最近一次筛选组合。
5. 任何搜索/筛选请求都会记录 `content.search` 事件到 `/api/v1/events`，包含搜索词、筛选项、结果数；失败需重试 2 次并在前端 Toast 提示。
6. 性能：搜索 API P95 < 2s，并使用 Postgres Trigram/FTS；筛选组合命中缓存时（Redis）返回 < 500ms。前端加载骨架屏≤800ms。

## Tasks / Subtasks

- [ ] 前端 Web：搜索框 + 筛选面板 (AC: 1,2,3,4,5,6)
  - [ ] `apps/web/app/(feed)/search/page.tsx` 实现输入、debounce、URL 同步
  - [ ] 构建筛选 Drawer + 可访问标签、多选控件、清除按钮
- [ ] 移动端：统一体验 (AC: 1,2,3,4,5)
  - [ ] `apps/mobile/src/screens/Search` 集成 hooks，支持触控与持久化
- [ ] Hooks/状态管理 (AC: 1,2,4,5)
  - [ ] 在 `packages/hooks/search.ts` 暴露 `useSearchFeed`，封装参数生成、React Query 请求、事件上报
- [ ] BFF 搜索 API (AC: 1,2,3,5,6)
  - [ ] `services/bff-api/src/modules/search`：Controller、Service、Repository、Swagger
  - [ ] 集成 Postgres FTS + Trigram + 标签/时长过滤；Redis 缓存热门组合
  - [ ] 记录 `content.search` 事件并写入 Redis Stream
- [ ] 数据/迁移 (AC: 1,2,6)
  - [ ] 为内容表添加 trigram 索引、UNACCENT 扩展、标签物化视图/索引
  - [ ] 维护 `search_cache` 表或 Redis key 结构
- [ ] 质量保障 (AC: 全部)
  - [ ] API 集成测试：搜索 + 筛选组合、空态、建议项
  - [ ] 前端 E2E：搜索流程、筛选/URL 状态保持、空态复原
  - [ ] 性能监控：记录 P95、命中率

## Dev Notes

- 重用架构中的“排序信号流水线”事件上报策略，[Source: docs/architecture.md#Novel Pattern Designs]
- API 命名遵循 `/api/v1/search`、`/api/v1/events`，并在 Swagger 记录参数与响应，[Source: docs/architecture.md#API Contracts]
- 数据层需遵守 PostgreSQL + Prisma 约定，表命名 snake_case，[Source: docs/architecture.md#Data Architecture]
- 前端 SSR + React Query 模式，骨架屏与无障碍要求同 Story 1.1。

### Project Structure Notes

- Web 页面位于 `apps/web/app/(feed)/search`，移动端入口在 `apps/mobile/src/screens/Search`。
- 共享 hooks 与类型放在 `packages/hooks/search.ts`、`packages/config/api.ts`。
- BFF 模块 `services/bff-api/src/modules/search` 按 controller/service/repository/dto 分层，Worker 无需新增但复用事件流。

### References

- [Source: docs/PRD.md##MVP Scope]
- [Source: docs/PRD.md##Functional Requirements]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/architecture.md#Technology Stack Details]
- [Source: docs/architecture.md#Performance Considerations]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-2-search-filtering.context.xml

### Agent Model Used

TBD

### Debug Log References

### Completion Notes List

### File List
