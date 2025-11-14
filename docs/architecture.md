# Architecture

## Executive Summary

Share 采用分层架构：前端层包含 Next.js Web 应用与 Expo/React Native 移动客户端，通过统一的 BFF（NestJS + REST）访问业务能力；服务层以 Node.js + Prisma 驱动 PostgreSQL 主存储，并辅以 Redis 做缓存/排序信号聚合；对象与富媒体走 S3/Cloudinary；搜索依托 PostgreSQL 全文索引。该方案优先“boring tech”，强调一致的内容模型、排序信号流水线，以及易于扩展的审核/运营后台。

### 项目初始化
- 输入文档：`docs/PRD.md`（最新 Share PRD），暂未提供 Epics 文档。
- 运行模式：独立模式（无 workflow-status）。
- 关键约束：Web + 移动端同步上线、首批内容由团队自建、排序需基于质量/点击/收藏。

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Frontend Web | Next.js (App Router) + React Query + Tailwind | 14.x | Content Discovery, Authoring | SSR + SSG 满足 SEO，组件生态成熟，易与 BFF 配合；React Query 统一数据缓存。 |
| Mobile | Expo / React Native + React Query | SDK 51+ | Content Consumption, Authoring | 与 Web 共享组件思想，Expo 加速发布，React Query 共享 API 套路。 |
| API Pattern | RESTful BFF on NestJS + Swagger/OpenAPI | Node 20 | 全部 | NestJS 提供模块化结构、内建验证；REST 契合多端、易调试。 |
| Persistence | PostgreSQL + Prisma ORM | 15.x | 所有 | 关系模型覆盖内容/标签/信号；Prisma schema 即文档化。 |
| Caching & Jobs | Redis (cache + BullMQ) | 7.x | Ranking, Analytics | 实时写入点击/收藏队列，后台聚合，降低数据库热度。 |
| File Storage | S3 (minio/dev) + Cloudinary CDN | latest | Authoring | 图片/封面解耦 DB，Cloudinary 负责裁剪。 |
| Search | PostgreSQL Full-Text Search + Trigram 索引 | 15.x | Discovery | 早期无需外部引擎，但保留向 Elasticsearch 迁移路径。 |
| Deployment | Web on Vercel, API & workers on AWS ECS Fargate, DB on RDS | latest | All | Web SSR 最佳托管，服务层与队列集中在 AWS 便于扩展与监控。 |

## Project Structure

```
Share/
├─ apps/
│  ├─ web/ (Next.js)
│  └─ mobile/ (Expo)
├─ packages/
│  ├─ ui/ (共享组件)
│  ├─ hooks/ (React Query hooks)
│  └─ config/ (API 客户端、类型)
├─ services/
│  ├─ bff-api/ (NestJS, REST, Swagger)
│  └─ workers/ (BullMQ 消费者、批处理)
├─ infra/
│  ├─ terraform/ (VPC、RDS、Redis、ECS)
│  └─ vercel/ (Web 项目设置)
├─ docs/
│  ├─ prd.md
│  └─ architecture.md
└─ scripts/ (数据注入、内容导入)
```

## Epic to Architecture Mapping

| Planned Epic | Key Components | Notes |
| --- | --- | --- |
| E1 内容发现与排序 | Next.js web、Expo 客户端、BFF `/feeds`, Redis 聚合、Postgres 视图 | 支持最新/最热/推荐三种排序；推荐权重配置存于 Postgres `ranking_config` 表。 |
| E2 内容创作与审核 | Next.js/Expo 编辑器、S3 上传、BFF `/content`, 后台 `ops-console`、Worker 审核队列 | 发布后进入审核队列，审核通过写入 `content_status`。 |
| E3 用户资料与收藏 | Auth 模块（NextAuth + JWT）、BFF `/users`, `/collections`、Postgres `collections`, Redis 缓存 | 收藏写 Redis Stream，异步刷新计数。 |
| E4 平台运营与数据面板 | Admin UI（Next.js 子应用）、Workers、Analytics schema | 统计点击/收藏、质量评分，输出给后台。 |

## Technology Stack Details

### Core Technologies
- 前端：Next.js 14（App Router）、Expo SDK 51、TypeScript、Tailwind/shadcn UI、React Query。  
- BFF：NestJS（GraphQL 预留但当前 REST）、class-validator、Swagger/OpenAPI、Prisma、Zod DTO。  
- 数据：PostgreSQL 15（RDS）、Redis 7（Elasticache）、S3 + Cloudinary。  
- DevOps：Turborepo monorepo、PNPM、Vitest/Jest、Playwright、GitHub Actions、Terraform + AWS。

### Integration Points
- 对象存储：直传 S3（预签名 URL），Cloudinary 作为 CDN。  
- 邮件/通知：Resend (Alpha)，Webhook 发送至 Slack/Email。  
- 日志与监控：OpenTelemetry + Datadog（APM、日志、RUM）。

## Novel Pattern Designs
- **排序信号流水线**：前端将点击/收藏事件写入 `/events`，BFF 异步推送到 Redis Stream；Worker 每分钟聚合到 `content_rankings` 表并刷新推荐列表。  
- **跨端共享组件**：`packages/ui` 提供 Headless 组件（按钮、卡片、评分指示器），通过 `react-native-web` 做样式复用，减少视觉分叉。  
- **内容审核双轨**：自动规则（敏感词、版权校验）运行于 Worker，同步返回初筛结果；人工审核 UI 通过后台完成最终决策。

## Implementation Patterns
- 请求封装：所有前端请求通过 `packages/hooks` 的 `useApiQuery/useApiMutation`，内含重试和错误模式。  
- DTO & Schema：BFF 在 Controller 层使用 DTO（class-validator）再映射到 Prisma schema，保证输入输出一致。  
- 事件命名：`event_type` 统一为 `content.viewed`, `content.favorited`, `content.published` 等。  
- 排序配置：`ranking_config` 表由后台 UI 维护，Worker 读取后缓存于 Redis。

## Consistency Rules

### Naming Conventions
- 数据表：`snake_case`，如 `content_items`, `quality_signals`。  
- Prisma Models & TS 接口：`PascalCase`。  
- API 路径：`/api/v1/{resource}`，复数资源名。  
- React 组件：`FeatureComponent`.tsx。  

### Code Organization
- Monorepo：`apps/`（web/mobile）、`services/`（bff/workers）、`packages/`（共享逻辑）。  
- 每个 NestJS 模块包含 `controller`, `service`, `repository`, `dto`。  
- Worker job 定义在 `services/workers/src/jobs/*`，消费逻辑 `processors/*`。  

### Error Handling
- BFF 统一使用 NestJS `HttpExceptionFilter`，映射为 `{code,message,details}`。  
- 前端基于 React Query `onError` 弹出 Toast，并写入 Sentry/Datadog。  
- Worker 失败进入 DLQ（BullMQ 延迟队列），三次失败后告警。

### Logging Strategy
- 结构化 JSON（pino）输出，带 `traceId`, `userId`, `feature`.  
- 前端捕获严重错误通过 `window.reportError` => BFF => Datadog。  
- 审核/发布操作写入 `audit_logs` 表。

## Data Architecture
- **Users** (`users`): 账户资料、角色、偏好。  
- **ContentItems** (`content_items`): 主题、摘要、正文（Markdown/JSON）、封面 URL、状态。  
- **Sections** (`content_sections`): 归属于 ContentItem，用于目录锚点。  
- **Tags** (`tags`, `content_tags`): 多对多标签。  
- **Collections** (`collections`, `collection_items`): 用户收藏夹。  
- **QualitySignals** (`quality_signals`): 人工评分、审核结果、理由。  
- **EngagementEvents** (`engagement_events`): 点击/收藏事件（冷热存储：Redis Stream + Postgres 归档）。  
- **RankingConfig/Rankings**: 存储排序权重与生成结果视图。  
- **AuditLogs**: 审核操作记录。

## API Contracts
- `GET /api/v1/feeds?sort={latest|hot|recommended}` → 返回内容卡片（含质量/收藏指标）。  
- `GET /api/v1/content/{id}` → 完整内容 + 章节。  
- `POST /api/v1/content` → 创建草稿，需作者权限。  
- `POST /api/v1/content/{id}/submit` → 进入审核流。  
- `POST /api/v1/events` → 上报点击/收藏等事件。  
- `GET /api/v1/users/me`, `PATCH /api/v1/users/me`.  
- `POST /api/v1/collections/{id}/items`.  
- 管理端：`/api/v1/admin/review`, `/api/v1/admin/ranking-config`。

## Security Architecture
- 认证：NextAuth（邮箱 + OAuth 可选），JWT + Refresh Token；移动端使用 PKCE。  
- 授权：RBAC（user, creator, reviewer, admin），实现于 NestJS Guard + Postgres RLS（部分表）。  
- 数据安全：S3 预签名上传、内容敏感词扫描、审计日志。  
- 合规：GDPR 基线（数据导出/删除接口），未来接入 FERPA/COPPA。  

## Performance Considerations
- Redis 缓存热门 feed（60s 失效），减少 Postgres 压力。  
- 内容详情 SSR + Incremental Static Regeneration（ISR）缓存。  
- 图片走 Cloudinary CDN，自适应裁剪。  
- Worker 异步聚合，避免同步写热表。  
- 指标：P95 feed <2s，内容详情 <1.5s，审核 API <500ms。

## Deployment Architecture
- Web：Vercel 项目 `share-web`，连到 BFF `https://api.share.app`.  
- BFF：Docker 镜像发布到 AWS ECR，ECS Fargate 多 AZ，ALB + WAF。  
- Workers：与 BFF 同代码库不同任务定义，运行在独立 Fargate Service。  
- 数据：RDS PostgreSQL（多可用区），ElastiCache Redis，S3（版本控制）。  
- CI/CD：GitHub Actions → Vercel / AWS（通过 OIDC）。

## Development Environment

### Prerequisites
- Node.js 20+, PNPM 8+。  
- Docker Desktop（本地 Postgres/Redis/S3 minio）。  
- AWS CLI, Terraform CLI。  
- OpenSSL（生成 JWT 密钥）。

### Setup Commands
```bash
pnpm install
pnpm turbo run lint
pnpm turbo run dev --filter=web
pnpm turbo run dev --filter=mobile
pnpm turbo run dev --filter=bff-api
pnpm prisma migrate dev
```

## Architecture Decision Records (ADRs)
1. ADR-001：选择 Next.js + Expo + NestJS 作为三层分离架构，原因是共享 TS 类型、提升生产力。  
2. ADR-002：排序信号流水线使用 Redis Stream + Worker 聚合，避免数据库热写。  
3. ADR-003：文件存储采用 S3 + Cloudinary，兼顾上传与分发效率。  
4. ADR-004：部署采用 Vercel + AWS ECS 组合，发挥各自托管优势。

---
_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-13_
_For: BMad_
