# 待办事项深度归档：第四十六至第四十九阶段

本文档包含了第四十六至第四十九阶段（2026-06-08 ~ 2026-06-13）的完整待办归档正文。
此区间的阶段已从 [todo-archive.md](../todo-archive.md) 主窗口迁出，归档到此文件。

---

## 第四十九阶段：延期清缴与流量治理 (已审计归档)

> 归档说明: 第四十九阶段「0 个新功能 + 5 个优化」已于 2026-06-13 完成五条主线交付与阶段收口。
> 五条主线: Postgres 网络传输削减（89% 耗尽警戒）、formatDate 函数级复用、Phase C 延期测试回填、清理收口（vendor.css + backlog.md）、type 收敛 + 归档索引修正。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. Postgres 流量治理 — 网络传输削减 (P0)

- 分析文档: `docs/design/governance/postgres-traffic-governance.md`
- P0-1: posts/index+search+archive.get 设为 `includeAuthorEmail: false`（-3 列/行）
- P0-2: post-detail-read.ts 移除 author.socialLinks/donationLinks
- Settings 已有 60s 缓存, 31 次单 key=cache hit, 无需优化
- 提交: `95dc1a0f`, `80dc313c`, `037b0856`

### 2. formatDate 函数级复用 (P0)

- 消除 6 处自定义 wrapper: campaigns.vue, external-links/index.vue, comment-item.vue, submissions/index.vue, friend-links/index.vue, use-admin-friend-links-page.ts
- 保留 2 处有自定义 fallback: agreements-settings, legal-agreement-page
- 提交: `793e5af4`, `e871b6c5`

### 3. 延期测试回填 (P1)

- Phase C: friend-links.test.ts 新增 3 用例（feed 渲染/空状态/降级）
- Admin: friend-links/index.test.ts 新增 showRssFeed 标签测试
- 提交: `7907b793`, `22609ca6`

### 4. 清理收口 (P1)

- vendor.css 空文件删除
- backlog.md: 测试主线 Phase 44/49 更新、隐私分析 Phase 45-46 修正、artifact 清理
- 提交: `455ced9c`, `370db523`

### 5. type 收敛 + 归档索引修正 (P2)

- AdAdapterConfig 统一至 types/ad.ts (12→11)
- 归档索引计数已确认正确 (11+6+1)
- 提交: `10eb6fff`, `e0d631cf`

## 第四十八阶段：深度治理与清理收口 (已审计归档)

> 归档说明: 第四十八阶段「0 个新功能 + 5 个优化」已于 2026-06-13 完成五条主线交付与阶段收口。
> 五条主线: ESLint/类型债窄切片扩展、结构复用深度收敛、API Schema RouterParam Zod 校验、未使用 API 安全删除（含前端引用验证）、第二轮闲置端点扩大调研。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. ESLint / 类型债 — 窄切片扩展（9 处 as any 清零）

- `seed-demo.ts`: 6 处 `'published' as any` → `PostStatus.PUBLISHED`
- `translation.ts`: 1 处残留 `(item as any)` →``T & { translations: unknown[]``
- `typeorm-adapter.ts`: 2 处 `as any` → `Record<string, unknown>`
- 提交: `a9499974`, `47233bab`

### 2. 结构复用 — 类型收敛（3 组，15→12）

- `DemoTourStage`: demo-banner → import from use-onboarding
- `AdminAiPageEvent`: task-list → import from use-admin-ai-page
- `ASRDirectOptions`: use-asr-direct → import from types/asr
- 提交: `2f099780`, `baa65136`

### 3. API Schema — RouterParam Zod 校验（2 端点 + 2 测试文件）

- `marketing/send`: safeParse({ id }) 校验
- `posts/restore`: safeParse({ id, versionId }) 校验
- 新增 refresh/restore 2 测试文件（4 用例）
- 提交: `cf1a2035`, `44e9e25c`

### 4. 未使用 API — 安全删除（2 端点 + 前端引用验证）

- 实际删除: notifications/broadcast + theme-configs/[id].put
- 保留（经 typecheck 引用验证）: 5 个端点
- 关键发现: typecheck 删除时捕获 3 个"假零引用"（前端实际调用）
- 提交: `15658bd1`, `fd72487b`

### 5. 第二轮未使用 API 扩大调研

- 调研 4 端点：subscriptions（无文件）、waitlist/export（有调用）、scaffold-to-post（有调用）、versions/restore（有测试）
- 文档: `docs/design/governance/unused-api-round2-assessment.md`
- 提交: `f9013bcc`

## 第四十七阶段：接口契约与路由治理深化 (已审计归档)

> 归档说明: 第四十七阶段「0 个新功能 + 6 个优化」已于 2026-06-11 完成六条主线交付与阶段收口。
> 六条优化主线: ESLint/类型债继续窄切片、结构复用治理继续推进、页面与 API 路径规范化、路由风格统一、未使用 API 清单评估、API Schema 覆盖与复用治理。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. ESLint / 类型债继续治理（窄切片）

- 收敛 6 处生产代码 `as any`: `link.ts`（`Record<string, unknown>`）、`translation.ts` ×4（`(item as T & { translations })`）、`email/i18n.ts`（`{} as Record<...>`）
- eslint-disable 总量维持 13 处（≤13 达标）
- 提交: `b704618f`

### 2. 结构复用治理继续推进

- Slice 1: `FeedItem` — page+service → `types/friend-link.ts` 统一来源
- Slice 2: `TitleSuggestionOverlayRef` — `use-post-editor-page.ts` → import from `use-post-editor-ai.ts`
- 同名 type/interface 候选 17→14 (-3)
- 提交: `7ef401b0`, `516daa45`

### 3. 页面与 API 路径规范化治理

- 治理文档: `docs/design/governance/route-api-path-governance.md`（46 page ↔ ~120 api 全量映射）
- P0 修复: `calendar.vue` + `marketing.vue` → `index.vue` 目录模式
- 提交: `102b107b`, `db2a54e0`

### 4. `pages/admin` 路由文件风格统一

- 主规范: 第一级强制目录，第二级允许平铺
- 迁移: `calendar.vue` + `marketing.vue` → `index.vue`（2 处）
- 提交: `4f6686a6`, `9e3ddad1`

### 5. 未使用 API 清单与清理可行性评估

- 三层交叉验证 ~120→识别 7 个零引用端点
- 三档分流: 可删除 7 / 观察 2 / 保留 ~111
- 治理文档: `docs/design/governance/unused-api-cleanup-assessment.md`
- 提交: `e3864b1a`, `5d690e5e`

### 6. API Schema 覆盖与复用治理

- 覆盖率: 完整 11 / 部分 7 / 缺失 1
- 3 组复用样板 + 新增 `utils/schemas/taxonomy.ts`
- 治理文档: `docs/design/governance/api-schema-coverage-governance.md`
- 提交: `09924a42`, `8259fa75`

## 第四十六阶段：隐私部署收口与治理深化 (已审计归档)

> 归档说明: 第四十六阶段「1 个新功能 + 5 个优化」已完成并通过阶段收口检查。  
> 对照结果：`todo.md` 六条主线均已勾选，`pnpm regression:weekly` 最新结果为 `Pass`（warning: `duplicate-code:check failed`），并已回填回归窗口与 Review Gate artifact。

### 1. Umami 隐私自托管分析集成 — Phase 2 部署化 (P0)

- **实现对照**: 已补齐 Umami 部署模板、部署变量说明与脚本化入口，且保持与 GA4 / Clarity / 百度统计并行开关，不互相覆盖。
- **验收对照**: 达成“可配置 + 可部署 + 可运维”的最小闭环，满足 Phase 2 部署化目标。

### 2. ESLint / 类型债治理 — 至少 3 组窄切片 (P1)

- **收口对照**: 已完成至少 3 组窄切片，本轮实际完成 4 组（`app.vue` 会话语言 `as any` 收敛；`analytics-settings.vue`、`auth-settings.vue`、`security-settings.vue` 的 `defineModel<any>` 收敛）。
- **验收对照**: 持续满足“单规则 + 小范围”治理约束，可与规则债盘点产物对照。

### 3. 结构复用治理 — 至少 3 组热点切片 (P1)

- **收口对照**: 已完成 3 组热点收敛（Umami 配置解析/序列化逻辑抽离、邮件模板预览 payload 类型统一、Volcengine 协议头与错误包类型复用）。
- **验收对照**: 达成本阶段最小切片目标，并保持重复代码治理基线可追溯。

### 4. 测试覆盖率治理 — 提升至 82% (P1)

- **收口对照**: 已完成 A/B/C/D 四组高风险补测切片，覆盖 Umami 共享工具、分析插件、文章 repush 失败路径、邮件模板 fallback/override、AI 图片生成上游状态码透传等关键边界。
- **验证证据**: 最新周级固定入口 `pnpm regression:weekly` 已回填 `test:coverage=PASS`，覆盖率治理主线达到本阶段收口条件。

### 5. 周期性回归任务 + 项目现状调研 (P0)

- **收口对照**: 阶段内已完成“先 Reject 后收敛为 Pass”的固定入口闭环，`artifacts/review-gate/2026-06-10-weekly-regression.{md,json}` 与 `docs/reports/regression/current.md` 已同步。
- **Review Gate 结论**: `Pass`（warning），当前唯一非阻塞项为 `duplicate-code:check failed`。

### 6. 数据库初始化脚本与文档同步 (P1)

- **收口对照**: 三套 `database/**/init.sql` 已补齐 AI 任务额度/计费相关字段（`category`、`estimated_quota_units`、`quota_units`、`charge_status`、`failure_stage`、`usage_snapshot`、`duration_ms`）。
- **文档同步**: `database/README.md`、`docs/design/database.md` 与部署指南（含 `en-US`）已对齐初始化字段说明。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 回归证据已落盘：`docs/reports/regression/current.md` 与 `artifacts/review-gate/2026-06-10-weekly-regression.{md,json}`

