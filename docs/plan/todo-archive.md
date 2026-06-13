# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 第二十五至第三十七阶段全文: [archive/todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md)、[archive/todo-archive-phases-32-37.md](./archive/todo-archive-phases-32-37.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前保留第三十八至第四十五阶段的近线归档块。
- 第一至第三十七阶段的完整待办归档正文已迁入区间分片。
- 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---

## 第四十八阶段：深度治理与清理收口 (已审计归档)

> 归档说明: 第四十八阶段「0 个新功能 + 5 个优化」已于 2026-06-13 完成五条主线交付与阶段收口。
> 五条主线: ESLint/类型债窄切片扩展、结构复用深度收敛、API Schema RouterParam Zod 校验、未使用 API 安全删除（含前端引用验证）、第二轮闲置端点扩大调研。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. ESLint / 类型债 — 窄切片扩展（9 处 as any 清零）

- `seed-demo.ts`: 6 处 `'published' as any` → `PostStatus.PUBLISHED`
- `translation.ts`: 1 处残留 `(item as any)` → `T & { translations: unknown[] }`
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

---

## 第四十五阶段：隐私闭环与文档治理 (已审计归档)

> 归档说明: 第四十五阶段「1 个新功能 + 1 个评估 + 3 个优化」已完成并通过阶段收口检查。  
> 对照结果：`todo.md` 五条主线均已勾选；实现文件、测试与文档证据已回链并完成状态同步；当前执行面已清理为待准入状态。

### 1. Umami 隐私自托管分析集成 — Phase 1 核心 (P0)

- **实现对照**: `plugins/umami-analytics.client.ts`、`components/admin/settings/analytics-settings.vue`、`server/api/settings/public.get.ts`、`types/setting.ts`、`server/services/setting.constants.ts` 均已落地。
- **验收对照**:
  - 后台可配置 Umami Website ID + Script URL；
  - 公开设置包含 `umamiAnalytics` 字段；
  - 与 GA4 / Clarity / 百度统计并行，不互相覆盖。
- **验证证据**: `components/admin/settings/analytics-settings.test.ts`、`tests/server/api/settings/public.get.test.ts`、`pnpm run typecheck`。

### 2. Digital Garden / 知识花园探索评估 (P1)

- **结论**: No-Go（当前阶段不进入实现，保留后续 P2 候选）。
- **评估文档**: `docs/design/governance/archive/digital-garden-evaluation.md`
- **验收对照**: 文档覆盖存储模型、性能影响、前端依赖三维评估并给出 go/no-go 结论。

### 3. 文档治理收口 (P1)

- **归档治理**: `docs/design/governance/` 19 份历史文档已迁入 `archive/` 并补齐索引。
- **规范分层**: `docs/standards/performance.md` 已移除时间线历史，迁出到 `docs/reports/performance-optimization-log.md`。
- **规划清理**: `docs/plan/backlog.md` 已移除已上收 Blogroll 条目，并同步更新候选状态与描述。

### 4. ESLint / 类型债继续窄切片 (P1)

- **收口对照**: `feed.get.test.ts` 的 `require-await` 豁免清理与 `server/utils/ai/openai-provider.ts` 的 `no-explicit-any` 子桶收敛已完成。
- **结果摘要**: 两轮窄切片完成，满足“单规则 + 小范围”治理约束。

### 5. 结构复用治理继续收敛 (P1)

- **切片 A（页面层）**: `categories/[slug]` 与 `tags/[slug]` 公共详情模板统一到 `TaxonomyPostPage`。
- **切片 B（server/utils）**: `tts-openai.ts` 与 `tts-siliconflow.ts` 抽取公共请求层 `server/utils/ai/tts-http-shared.ts`。
- **基线对照**: `pnpm duplicate-code:check` 保持通过，重复率未反弹。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm lint:md`、`pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`

---

## 第四十四阶段：友链生态与性能闭环 (已审计归档)

> 归档说明: 第四十四阶段「1 个新功能 + 1 个评估 + 3 个优化」组合已于 2026-06-07 完成六条主线交付、代码审计与阶段收口。
> 当前仓库可对照到六条主线的实现与证据落点：友链 RSS 聚合（Blogroll Feed，含 showRssFeed 管理配置 + RSS/Atom 抓取解析 + 缓存）、
> 隐私自托管分析评估（Umami Docker 方案，条件性 Go 结论）、ESLint / 类型债（3 组窄切片 + no-non-null-assertion + no-explicit-any）、
> 结构复用治理（SettingFieldMetadata + AgreementFormData 收敛）、CWV 性能优化（Logo 预加载 + CSS @import 扁平化）、
> Phase 44 测试回填（Phase A + B，覆盖零覆盖模块及低分支模块）。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. Blogroll 友链 RSS 聚合 — Blogroll Feed (P1)

- **功能**: 友链页面新增「最近更新」RSS 聚合摘要。后端 `server/services/friend-link-feed.ts` 抓取友链站点的 RSS/Atom Feed 并解析标题 + 链接 + 日期，缓存在 `limiterStorage`（TTL 1h）；前端友链页新增「最近更新」卡片区域（最多 5 条，按日期降序）。
- **管理端**: `FriendLink` 实体新增 `showRssFeed` 布尔字段，管理员在编辑弹窗中控制该友链是否参与 RSS 聚合。
- **端到端链路**: DB Entity → service.saveFriendLinkEntity 白名单 → Zod schema `showRssFeed` 校验 → Admin Form Checkbox → Public Feed API (`where: { showRssFeed: true }`) → 公开页渲染。
- **修复**: `extractAtomLink` 补全单对象（非数组）link 解析 Atom XML 边界 case；`friendLinkSchema` 补全字段避免 safeParse 静默丢弃。
- **i18n**: 5 locale `public.json` 新增 `feed_title` / `feed_empty`；5 locale `admin-friend-links.json` 新增 `show_rss_feed`。
- **提交**: `3fa5b924` (初始), `432ac2e8` (审计修复), `d580d6c0` (showRssFeed 配置), `b06314b6` (i18n 迁移), `e545baa0` (类型修复), `e29e3750` (schema 修复), `d1deb781` (lint 清零), `b06314b6` (i18n 迁移完结)

### 2. 隐私自托管分析集成评估 — 评估态 (P1)

- **评估对象**: Umami v3.1.0 (MIT License)
- **结论**: 条件性 Go — 资源开销（<512 MB RAM + 1 GB 磁盘）、接入复杂度（~4h, 9 文件）、兼容性（PostgreSQL 双库并存）均通过最低阈值。
- **文档**: `docs/design/governance/privacy-analytics-evaluation.md`
- **建议**: 下个迭代作为 P1 主线推进实施。
- **提交**: `2d41ae1d`

### 3. ESLint / 类型债治理 — 至少三组窄切片 (P1)

- **Slice 1** (no-non-null-assertion): `import-path-alias.ts` + `quota-governance.ts` + `post-distribution.ts` (5 处 `!` 清零)
- **Slice 2** (no-explicit-any): `gemini-provider.ts` (typed accumulator)
- **Slice 3**: `server/services/*.ts` non-null assertions 全清零
- **统计**: 4 文件 +10/-6, typecheck + lint pass
- **提交**: `28e171f8`

### 4. 结构复用治理 — 至少两组热点切片 (P1)

- **Slice 1** (SettingFieldMetadata): 4 组件统一 import `types/setting.ts`（ai-cost-factors / ai-alert-thresholds / ai-quota-policies / setting-form-field）
- **Slice 2** (AgreementFormData): `agreement-edit-dialog.vue` export → `agreements-settings.vue` import
- **统计**: 同名类型/接口 20→18 (-2)，6 文件 +6/-28
- **提交**: `249eb90a`

### 5. CWV 性能优化 (P0)

- **优化 1**: Logo 图片预加载 — `app.vue` useHead 新增 `<link rel="preload" href="/logo.png" as="image">`，预期降低 LCP 100-300ms
- **优化 2**: CSS @import 扁平化 — 将 `vendor.css` 中嵌套 `@import` 改为 `nuxt.config.ts` `css[]` 数组直接声明，消除串行下载，预期降低 FCP 50-150ms
- **记录**: `docs/reports/performance-optimization-log.md`
- **提交**: `8669d0c0`

### 6. Phase 44 测试回填 (P0)

- **Phase A**: `friend-link-feed.test.ts`（16 用例: 缓存/RSS/Atom/降级/排序）+ `feed.get.test.ts`（3 用例: 正常/空/rate-limit）
- **Phase B**: composable + service + schema 共补 7 用例覆盖 showRssFeed 全链路
- **生产 Bug**: `extractAtomLink` 补全单对象 link 解析
- **验收**: 四项指标全部达成（零覆盖模块 > 70% stmts, 低分支模块 > 55%/70%）
- **提交**: `2d41ae1d`, `8d35652f`
- **剩余缺口**（已回灌 backlog）:
  - `pages/admin/friend-links/index.test.ts` — Checkbox 渲染交互测试
  - Phase C: `pages/friend-links.test.ts` — 公开页 feed 渲染/降级测试

## 第四十三阶段：AI 分发复用与治理深化 (已审计归档)

> 归档说明: 第四十三阶段「1 个新功能 + 4 个优化」组合已于 2026-06-05 完成五条主线交付、代码审计与阶段收口。
> 当前仓库可对照到五条主线的实现与证据落点：AI 内容多格式复用（社交帖子生成 Twitter/LinkedIn，4 新文件 + 5 locale i18n）、
> ESLint / 类型债（3 组窄切片 + no-non-null-assertion 扩展）、结构复用治理（commercial-link-manager 自重复提取 + PostNavigationItem/DirectUploadStrategy/toErrorMessage 收敛）、
> Windows Dev/Build 性能（Vite warmup + resolve.extensions + Nitro inline 瘦身 + sourceMap + build:done skip，最终确认平台级瓶颈，Linux CI 106s vs Windows >1800s）、
> i18n duplicates 归属漂移收敛（voice/actions 键统一至 common，-5 组 -11 keys）。
> todo.md 当前执行面已清理，第四十四阶段待 backlog 候选池评估后确定。
>
> **ROI 评估**: AI 内容多格式复用 1.40；ESLint / 类型债治理 1.50；结构复用治理 1.60；Windows Dev/Build 性能治理 2.00；i18n 运行时验证扩面 1.45。

#### A. AI 内容多格式复用 (P1)

1. [x] **主线：AI 内容多格式复用 (P1)**
    - 执行范围：一键 AI 生成 Twitter Thread + LinkedIn 帖子，复用 AI 管线，纯前端 + API 增量。
    - 当前进度：已完成。新建 4 文件（API + Service + Prompt + Dialog），修改编辑页 + 5 locale i18n。
    - 最小验收: (1) 编辑页入口 ✅；(2) Twitter + LinkedIn 两格式 ✅；(3) 复用 AI 计费 ✅

#### B. ESLint / 类型债治理 (P1)

1. [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
    - 执行范围：vue/require-explicit-emits + vue/no-required-prop-with-default + max-statements-per-line + max-lines（app-header 804→675）+ no-non-null-assertion 扩展。
    - 当前进度：已完成。0w baseline，13 tests pass。
    - 提交: `d3068ab5`

#### C. 结构复用治理 (P1)

1. [x] **主线：结构复用治理 — commercial-link-manager 自重复 + 至少三组热点 (P1)**
    - 执行范围：commercial-link-manager 自重复提取 + PostNavigationItem / DirectUploadStrategy / toErrorMessage 收敛。
    - 当前进度：已完成。同名类型 24→20，7 文件 +196/-293。
    - 提交: `a9cf62ff`

#### D. Windows 本地 Dev / Build 性能治理 (P0)

1. [x] **主线：Windows 本地 Dev / Build 性能治理 (P0)**
    - 执行范围：Vite warmup + resolve.extensions 收紧 + Nitro inline 瘦身 + sourceMap 关闭 + build:done 跳过。
    - 当前进度：已完成。Linux CI 对照验证：构建 106s vs Windows >1800s（>17x 差距），确认为平台级瓶颈，本条主线关闭。
    - 提交: `227eca85`, `c8e5ba39`, `9afe8553`

#### E. i18n 运行时验证扩面 (P1)

1. [x] **主线：i18n 运行时验证扩面 + duplicates 归属漂移收敛 (P1)**
    - 执行范围：voice/actions 重复键收敛至 common 命名空间。
    - 当前进度：已完成。duplicates 102→97 组，240→229 keys，total: 0 missing。
    - 提交: `7bc309df`

---

## 第四十二阶段：AI 深化与运营闭环 (已审计归档)

> 归档说明: 第四十二阶段「新功能 + 优化」组合已于 2026-06-04 完成五条主线交付、代码审计修复与阶段收口。
> 当前仓库可对照到三条新功能 / 优化面的实现与证据落点：性能 CWV 基线（脚本 + 图片懒加载 + PrimeVue 配置清理）、
> AI 内容审计（评分徽章 + 审计报告 + 缓存 24h + 行级权限）、内容日历（月/周日历视图 + 看板拖拽 + 管线阶段 PATCH），
> 以及两条治理切片（ESLint / 类型债三组窄切片 + 结构复用三组热点切片）。
> todo.md 当前执行面已清理，第四十三阶段待 backlog 候选池评估后确定。
>
> **ROI 评估**: 站点性能 CWV 基线 1.80；AI 内容审计 1.60；内容日历 1.50；ESLint / 类型债治理 1.50；结构复用治理 1.60。

#### A. 站点性能与 Core Web Vitals 基线 (P0)

1. [x] **主线：站点性能与 Core Web Vitals 基线 (P0)**
    - 执行范围：建立公开页 CWV 基线，优先收敛首页 banner 图片、mavon-editor bundle 懒加载、PrimeVue tree-shaking。
    - 当前进度：已完成 CWV 脚本、封面图懒加载、PrimeVue 配置清理、性能规范更新。实际数值由 CI 产出。
    - 最小验收: (1) CWV 基础设施就绪 ✅；(2) 至少一项可量化优化 ✅

#### B. AI 内容审计与质量优化 (P1)

1. [x] **主线：AI 内容审计与质量优化 (P1)**
    - 执行范围：后台文章列表 SEO/质量评分徽章，覆盖 meta 完整性与可读性两维度，AI 建议仅展示不应用。
    - 当前进度：已完成。新建 5 文件 + 修改 8 文件。评分：元数据（JS 5 维度 ×20）+ 可读性（AI），>=70 良好。缓存 24h，行级权限收敛。
    - 最小验收: (1) 评分徽章 ✅；(2) meta+可读性 ✅；(3) 建议仅展示 ✅

#### C. 内容日历与编辑排期 (P1)

1. [x] **主线：内容日历 / 编辑排期 (P1)**
    - 执行范围：后台月/周日历视图 + 草稿管线看板（构思→写作→待发布），与定时发布联动。
    - 当前进度：已完成。新建 9 文件 + 修改 4 文件。看板 HTML5 DnD + 乐观 UI。日历 CSS Grid 月视图 + 月份切换刷新。行级权限收敛。
    - 最小验收: (1) 日历视图 ✅；(2) 看板拖拽 ✅；(3) 数据一致 ✅

#### D. ESLint / 类型债治理 (P1)

1. [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
    - 当前进度：已完成。三组 no-explicit-any 窄切片（agreements API ×5 + submissions API ×3 + AI utils ×2）。治理范围 26→36 文件。warning=0。
    - 最小验收: 三组切片完成 ✅

#### E. 结构复用治理 (P1)

1. [x] **主线：结构复用治理 — 至少三组热点切片 (P1)**
    - 当前进度：已完成。三组热点切片收敛。jscpd clones 40→37 (-3)，duplication % 0.69%→0.63%。typecheck 通过。
    - 最小验收: duplicate-code 基线不反弹 ✅

## 第四十阶段：发布前守护与 TypeORM 升级评估收口 (已审计归档)

> 归档说明: 第四十阶段「0 个新功能 + 6 个优化」已于 2026-05-31 完成对账、文档同步与归档收口。当前仓库可对照到三段执行面的实现与证据落点：发布前守护轨（统一 pre-check 入口与固定回归顺序）、TypeORM 评估轨（`typeorm@1.0.0` 兼容性探针、失败分桶与 go/no-go 结论）、收口轨（回归窗口自动回填与守护策略分级）。`todo.md` 当前执行面已清理，下一阶段仅保留候选分析，不在本轮直接上收。

> **ROI 评估**: CI 前置守护脚本接入 `2.25`；发布链路最小回归闸门收紧 `2.00`；TypeORM 1.0.0 兼容性探针与分桶验证 `1.75`；TypeORM 升级 go/no-go 与回滚预案落盘 `1.67`；文档证据自动回填 `1.60`；守护策略分级与依赖风险口径对齐 `1.40`。

#### A. 发布前守护轨

1. [x] **CI 前置守护脚本接入首轮落地 (P0)**
	- 执行范围：在正式执行主命令前增加统一 pre-check，并要求 release/test/docker 三条 workflow 复用同一入口。
	- 非目标：不重写全部 workflow；不在本轮把所有 warning 一次性升级为 blocker。
	- 最小验收：release/test/docker 三条 workflow 在执行主体前都调用同一守护入口；至少覆盖依赖风险、关键脚本存在性、必要环境检查。
	- 证据落点：workflow 变更记录、守护入口定向执行结果、至少一条失败样本定位记录。
	- 2026-05-25：共享入口 `pnpm ci:precheck -- --profile=<workflow>` 已接入三条 workflow；首轮执行摘要与失败样本定位记录已回写到 [活动回归窗口](../reports/regression/current.md)。

2. [x] **发布链路最小回归闸门收紧 (P0)**
	- 执行范围：把已有 release:check / regression 脚本编排成固定顺序，先解决本地与 CI 执行顺序不一致的问题。
	- 非目标：不新增第二套回归入口；不把阶段收口专用命令强行塞进日常开发默认流程。
	- 最小验收：失败日志可直接定位到守护子项；本地与 CI 的执行顺序一致，且至少保留一份标准化执行摘要。
	- 证据落点：发布前守护脚本或回归入口定向执行记录、活动回归窗口摘要。
	- 2026-05-25：本地 `pnpm release` 已改为先走 `pnpm regression:pre-release`；[.github/workflows/release.yml](../../.github/workflows/release.yml) 已收敛为 `precheck -> regression -> release`；`regression:pre-release` 摘要会把 `release:check:full` 的内部失败子项直接上浮到 blocker / warning，并保留 `artifacts/review-gate/*-pre-release-regression.{md,json}` 标准化摘要。

#### B. TypeORM 评估轨

3. [x] **TypeORM 1.0.0 兼容性探针与分桶验证 (P1)**
	- 执行范围：仅做评估态兼容性探针，不直接把 `typeorm` 从 `0.3.29` 升级后作为本阶段已交付；优先覆盖 `server/database/**`、`server/database/typeorm-adapter.ts`、公开热点读链路与依赖 TypeORM 形态的定向测试。
	- 非目标：不在本轮完成真实升级实施；不顺手重写仓库内所有 TypeORM mock。
	- 最小验收：完成一轮 `typeorm@1.0.0` 兼容性探针，并按“数据库与适配层 / 实体层 / 查询与服务层 / API 层 / 测试桩”输出失败分桶；最小验证矩阵至少覆盖 `pnpm run typecheck`、适配层相关测试、数据库初始化与公开读链路定向测试。
	- 证据落点：[docs/design/governance/archive/typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md)、定向验证记录、活动回归窗口阶段结论。
	- 2026-05-25：已完成隔离 worktree 首轮 probe；`typeorm@1.0.0` 下适配层与初始化层测试通过，首个 runtime blocker 收敛到 [server/utils/translation.ts](../../server/utils/translation.ts) 的字符串数组 `select` 语法，主工作区已落一条前向兼容补丁。当前 `pnpm run typecheck` 仍暴露主工作区剩余 `22` 处 `select: [...]` 与 `38` 处 `relations: [...]` 旧语法，以及待隔离的 `packages/**` 类型噪音；详情见 [docs/design/governance/archive/typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md) 与 [docs/reports/regression/current.md](../reports/regression/current.md)。
	- 2026-05-27：已补齐第二轮 closeout probe；`typeorm@1.0.0` 下适配层 `11/11`、数据库初始化 `2/2`、公开热点读链路 `41/41` 全部通过，failure buckets 已收敛到 `11` 个服务端文件中的 `13` 个 TypeORM 旧语法静态错误，以及 `packages/**` 的 `22` 个类型噪音错误。当前结论维持 `NO-GO（直接升级）` / `GO（评估任务收口）`，可关闭本条待办；详情见 [docs/design/governance/archive/typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md) 与 [docs/reports/regression/current.md](../reports/regression/current.md)。

4. [x] **TypeORM 升级 go/no-go 与回滚预案落盘 (P1)**
	- 执行范围：依据兼容性探针结果输出 go/no-go，并把回滚锚点、触发条件与后续是否升格为真实升级实施写清楚。
	- 非目标：不把已有评估文档误写成“升级已可执行”；不在结论不清时强行把真实升级放进下一阶段实施面。
	- 最小验收：明确记录 `typeorm@0.3.29` 回滚锚点、no-go 触发条件、下一次重新评估窗口，以及是否允许把真实升级实施纳入后续阶段。
	- 证据落点：评估文档更新、活动回归窗口结论、roadmap/todo 阶段摘要对齐。
	- 2026-05-25：当前结论已落盘为“`NO-GO（直接升级）` / `GO（继续评估）`”；回滚锚点保持 `typeorm@0.3.29`，下一次重新评估触发点为完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移、隔离 `packages/**` typecheck 噪音并重跑最小验证矩阵后，再决定是否允许把真实升级实施上收到后续阶段。详情见 [docs/design/governance/archive/typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md) 与 [docs/reports/regression/current.md](../reports/regression/current.md)。

#### C. 收口轨

5. [x] **文档证据自动回填 (P1)**
	- 执行范围：将 pre-check、回归摘要与 TypeORM 评估结论自动沉淀到活动回归窗口模板，减少阶段收口时的人工补录。
	- 非目标：不重新设计第二套回归记录文档；不要求本轮自动生成完整审计报告。
	- 最小验收：每次主流程后能生成一条标准化证据记录，至少包含执行入口、结果摘要、阻断项或 go/no-go 结论。
	- 证据落点：[docs/reports/regression/current.md](../reports/regression/current.md) 中的模板化记录与对应脚本输出。
	- 2026-05-25：`scripts/ci/workflow-precheck.mjs` 与 `scripts/regression/run-periodic-regression.mjs` 已在落盘 artifact 后自动 upsert [活动回归窗口](../reports/regression/current.md) 的紧凑记录；新增 `pnpm regression:typeorm-assessment` 可从 [typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md) 自动同步 go/no-go 与 probe 摘要。定向验证覆盖 `tests/scripts/workflow-precheck.test.ts`、`tests/scripts/run-periodic-regression.main.test.ts` 与 `tests/scripts/sync-typeorm-assessment.test.ts`。

6. [x] **守护策略分级与依赖风险口径对齐 (P2)**
	- 执行范围：把阻断项和提醒项配置化，并同步校准 `security:audit-deps` 与 `security:audit-deps:daily` 的判断口径。
	- 非目标：不把所有 daily warning 升级为发版 blocker；不新增独立的第三套依赖风险入口。
	- 最小验收：策略表可读、可审计，新增规则不需要改 workflow 结构；同一类风险在 daily 与 release 前的结论一致，只有时机差异。
	- 证据落点：守护策略配置、依赖审计入口定向执行结果、对应文档摘要。
	- 2026-05-25：已新增共享策略表 `scripts/security/dependency-risk-policy.mjs`，`security:audit-deps` / `security:audit-deps:daily` / `scripts/ci/workflow-precheck.mjs` 已统一读取同一套 dependency-risk finding level；daily 摘要新增 `reviewGate`、`requiresAttention` 与 `shouldOpenIssue` 字段，定向验证覆盖 `tests/scripts/check-dependency-risk.test.ts`、`tests/scripts/run-daily-dependency-audit.test.ts` 与 `tests/scripts/workflow-precheck.test.ts`。
	- 2026-05-25：已补跑 `pnpm security:audit-deps` 与 `pnpm security:audit-deps:daily` 的真实入口验证；当前 `high+` 风险均为 `0`，release / daily 两条入口统一给出 `Pass (none)`，活动回归窗口已新增 closeout 摘要，可关闭本条待办。

## 第四十一阶段：TypeORM 前置清障与治理切片推进 (已审计归档)

> 归档说明: 第四十一阶段「0 个新功能 + 5 个优化」已于 2026-06-03 完成对账、文档同步与归档收口。当前仓库可对照到五条主线的实现与证据落点：TypeORM 前置清障（`select: string[]` → 对象语法全量迁移）、Postgres 热点读链路治理（归档查询字段裁剪去重）、文档门禁与脚本治理（candidate 基线 warning 面压缩）、结构复用治理（2 组热点切片）与 ESLint / 类型债治理（四组窄切片覆盖 26 文件）。`todo.md` 当前执行面已清理，下一阶段仅保留候选分析。

> **ROI 评估**: TypeORM 升级前置清障切片 `1.80`；Postgres 热点读链路治理 `1.75`；文档门禁和脚本治理 `1.60`；结构复用治理 `1.60`；ESLint / 类型债治理 `1.50`。

1. [x] **TypeORM 升级前置清障切片 (P0)**
	- 执行范围：按第四十阶段 `NO-GO` 结论，优先处理适配层契约、测试桩形态与查询链路兼容缺口。
	- 最小验收：阻断项分桶、清障优先级已完成，下一轮复评触发条件已记录。
	- 结果：`select: string[]` 旧语法全部迁移为对象语法（适配层 + `attachTranslations` + 3 API + 测试桩），`relations: [...]` 已确认零命中。剩余 P1 probe worktree 复验待后续触发。
	- 证据：commit `2f655d2a`、回归记录 `current.md`。

2. [x] **Postgres 热点读链路治理 (P0)**
	- 执行范围：聚焦 `posts / archive / categories / tags / settings / friend-links` 单路径或单组切片，优先收敛结果集体量与重复读。
	- 最小验收：已通过归档接口字段裁剪与去重策略给出下行对比证据。
	- 结果：`archive` 链路查询已从 `SELECT *` 裁剪为显式字段列表，减少重复读与冗余数据传输。
	- 证据：commit `3af52a1c`、回归记录与 `todo.md` 当前进度描述。

3. [x] **文档门禁和脚本治理 (P1)**
	- 执行范围：推进 docs candidate 门禁与治理脚本基线收敛，优先处理 warning 面、误报与入口漂移。
	- 最小验收：已完成 1 轮 candidate 基线重跑、1 轮 warning 面压缩与脚本治理误报收敛。
	- 结果：`docs:check:line-count:candidate` 已将 `guide/deploy` 收回到 warning 线内；`docs:check:source-of-truth:candidate` 已由 `21` 条 freshness warning 降到 `16` 条；`governance:check:scripts` 收敛到稳定入口 `45` / 缺失 `0`。默认门禁 `docs:check:source-of-truth`、`docs:check:i18n` 均已恢复通过。
	- 证据：门禁执行记录、回归窗口当前基线。

4. [x] **结构复用治理 (P1)**
	- 执行范围：按"重复代码 + 零散类型 + 纯函数 / 工具函数"口径做小切片。
	- 最小验收：已完成 2 组热点切片并确认 `duplicate-code` 基线不反弹。
	- 结果：提取用户和分发共享类型 (`cd2e44fd`)、重构 JSON 克隆功能 (`537d5f6d`)。
	- 证据：`duplicate-code` 基线对比、commit 记录。

5. [x] **ESLint / 类型债治理 (P1)**
	- 执行范围：坚持"单规则 + 单文件 / 双文件"窄切片，结合规则债 inventory 输出推进。
	- 最小验收：目标规则命中数下降且定向 lint / typecheck 通过。
	- 结果：已完成四组窄切片（覆盖 26 个文件）：公开列表 API `no-explicit-any`、广告配置类型组 `no-explicit-any`、文本 / 广告目标断言组 `no-non-null-assertion`、上传/设置服务组 `no-explicit-any`。
	- 证据：commits `c983b7b3` `8bc7b4c3` `3905895d`、回归记录 `current.md`。

> **审计结论**: 第四十一阶段五条主线已在实现代码、定向测试、回归记录与规划文档中完成闭环，满足归档条件。TypeORM 前置清障已产出可复跑的阻断项分桶与清障清单；Postgres 热点读链路已通过字段裁剪给出下行对比证据；文档门禁 warning 面已显著压缩且默认门禁全部恢复；结构复用与 ESLint / 类型债各完成目标切片且基线未反弹。本次归档通过的门禁包括 `typecheck`、`docs:check:source-of-truth`、`docs:check:i18n` 与 `docs:check:line-count`（warning 面均在窗口内）。

## 第三十九阶段：公众号排版预览与治理基线落盘 (已审计归档)

> 归档说明: 第三十九阶段「1 个新功能 + 4 个优化」已于 2026-05-23 完成对账、文档同步与归档收口。当前仓库可对照到五条主线的实现与证据落点：`wechat_mp` 预览 / 复制能力、结构复用第三轮热点收敛、注释治理首轮切片、文档 / 脚本治理最小收口包、国际化文案复用治理。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: 微信公众号格式预览 / 导出辅助 `1.56`；结构复用第三轮（3 个热点）`1.72`；注释治理首轮（1 - 2 组模块）`1.43`；文档 / 脚本治理最小收口包 `1.67`；国际化文案复用治理 `1.60`。

### 1. 微信公众号格式预览 / 导出辅助 (P0)

- 结果: `wechat_mp` profile 已落地到分发预览与预检链路，覆盖公众号兼容规则（标题 / 引用 / 代码块降级、提示容器 / 代码分组转换）、外链转文末引用（去重、代码块排除、裸 URL 兼容），并新增“复制排版后内容”入口（`ClipboardItem` 双格式 + `writeText` 降级）。
- 证据: 提交 `3f0989d8`、`9c7a5eb2`，设计文档 [docs/design/governance/wechat-mp-preview-export-assist.md](../../docs/design/governance/wechat-mp-preview-export-assist.md)，以及分发预览相关测试集。
- [x] 仅交付“公众号风格预览 + 复制排版后内容”，未扩写为编辑器替换工程。
- [x] 定向验证已覆盖转换链路与复制逻辑，核心行为可复现。

### 2. 结构复用第三轮：3 个热点收敛 (P1)

- 结果: `confirmDelete`、`getStatusSeverity`、`DistributionMaterialBundle` 三组热点均已在 `simple-duplicates` 基线中消失；统计由同名内部函数候选 `112` 降至 `110`，同名 type/interface 候选由 `156` 降至 `27`，近似命名函数候选保持 `10`。
- 证据: `pnpm governance:audit:simple-duplicates` 产物、`pnpm duplicate-code:check`（warn 模式 `40 clones / 0.69%`）与定向测试通过记录。
- [x] 至少 `3` 组热点完成收敛。
- [x] `duplicate-code` 基线未反弹。

### 3. 注释治理首轮：1 - 2 组模块 (P1)

- 结果: `usePostEditorIO`、`usePostEditorAI` 与 `useInstallationWizard` 已完成契约 / 副作用 / 失败回退注释补齐，并清理所选文件内 TODO / 临时口吻；`comment-drift` 基线已形成本轮可追溯 delta。
- 证据: `pnpm governance:audit:comment-drift` 产物与三组 composable 定向测试通过记录。
- [x] 已按高复杂度优先策略完成首轮模块切片。
- [x] 所选范围内未保留低价值 TODO 注释噪音。

### 4. 文档 / 脚本治理最小收口包 (P0)

- 结果: 回归活动窗口完成历史滚动归档（`588` 行降至 `235` 行），英文高频 must-sync 页 freshness 回补到 `2026-05-19`，脚本治理三条 finding 完成处置闭环（稳定入口补齐与失效声明下线）。
- 证据: `pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts` 均通过；脚本治理统计收敛为“缺少稳定入口 `0`、文档声明但缺失 `0`”。
- [x] 文档与脚本两条治理面均完成最小闭环。
- [x] 已保留前后对比的可追溯事实源。

### 5. 国际化文案复用治理 (P1)

- 结果: `AppFooter`、`archives`、`categories`、`tags` 四组公开装配链路已并入固定 runtime 验证面；页面私有命名空间与共享组件命名空间边界已在 runtime 装配测试中固化，同时完成首个重复键收敛切片（`common.refresh` 统一）。
- 证据: `pnpm i18n:audit:missing` 维持 `0`，`pnpm i18n:audit:duplicates` 命中由 `101/56` 降至 `100/55`，`pnpm i18n:verify:runtime`（`15` 文件 / `108` 用例）通过。
- [x] 新增范围未出现 raw key 暴露。
- [x] 复用治理与运行时装配边界保持一致。

## 第三十八阶段：分发一致性修补与热点治理续推 (已审计归档)

> 归档说明: 第三十八阶段「0 个新功能 + 5 个优化」已于 2026-05-19 完成对账、文档同步与归档收口。当前仓库已可对照到五条主线的实现落点：`B 站 / Memos` 标签尾注与预览一致性、高风险测试有效性第二轮切片、公开热点读链路止损式瘦身与根因收敛、至少 3 处结构复用热点，以及 AI provider 聚合层 ESLint / 类型债窄切片。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: 第三方分发标签尾注与预览一致性修补 1.60；测试有效性第二轮切片 1.85；Postgres 公开热点读链路继续瘦身 1.75；结构复用第二轮（至少 3 处热点）1.70；ESLint / 类型债下一轮窄切片 1.50。

### 1. 第三方分发标签尾注与预览一致性修补 (P1)

- 结果: `B 站 / Memos` 两个渠道已统一复用同一条标签标准化与尾注拼装入口；`B 站` 预览、`B 站` 实际同步 payload 与 `Memos` 预览三处输出已按“标签尾注中的标签项去除空格后再输出”的同一规则收敛。
- 验证: 分发物料 helper / template 测试、实际分发 / 导出层测试，以及必要的后台分发预览组件测试已在当前仓库与阶段事实源中闭环。
- [x] 仅覆盖 `B 站 / Memos` 两个渠道，不扩写到其他分发器。
- [x] 预览构造与实际分发复用同一条标签标准化 / 尾注拼装入口。

### 2. 测试有效性第二轮切片 (P0)

- 结果: 本轮已完成 `3` 组高风险切片：[components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 覆盖 direct TTS 任务创建失败后的可见错误映射；[pages/login.test.ts](../../pages/login.test.ts) 与 [pages/login.vue](../../pages/login.vue) 覆盖登录页 logical failure 后 `refreshAuthSession` 退化不吞主错误；[tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 覆盖 `503` bootstrap 失败不污染短 TTL runtime cache、后续成功请求可恢复。
- 验证: `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts pages/login.test.ts tests/server/api/settings/public.get.test.ts`、`pnpm exec nuxt typecheck`，以及 [docs/reports/regression/current.md](../reports/regression/current.md) 中的本轮定向回归矩阵记录。
- [x] 至少完成 `3` 组高风险失败 / 边界断言。
- [x] 其中至少 `1` 组覆盖用户可见错误映射，而不是只断言内部异常被抛出。

### 3. Postgres 公开热点读链路继续瘦身 (P0)

- 结果: 已将 [server/api/posts/home.get.ts](../../server/api/posts/home.get.ts)、[server/api/categories/index.get.ts](../../server/api/categories/index.get.ts) 与 [server/api/tags/index.get.ts](../../server/api/tags/index.get.ts) 从完整 `initializeDB()` 语义切到 connection-only helper [server/database/index.ts](../../server/database/index.ts)，并同步修正两阶段初始化状态机，确保 connection/full init 的 in-flight promise 在每轮结束后释放，维护链失败后下一次请求仍可重试。
- 结果: [server/api/posts/home.get.ts](../../server/api/posts/home.get.ts) 已把首页列表查询切到 `includeAuthorEmail: false`，并在首页响应剥离 `author.email / emailHash`，避免公开首页卡片继续为未消费的作者邮箱链路付费；对应守线见 [tests/server/api/posts/home.get.test.ts](../../tests/server/api/posts/home.get.test.ts) 与 [tests/server/database/init-boundary.test.ts](../../tests/server/database/init-boundary.test.ts)。
- 结果: 基于 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)，当前超预算更像“公开热读 + 稀疏公共流量持续打醒 compute”的组合，而不是剩余显式 `initializeDB()` 调用点继续主导成本。本阶段据此完成“单路径瘦身 + 根因收敛 + 停止继续沿连接初始化链路硬挤收益”的止损收口；剩余缓存侧优化继续回收到长期主线候选，而不伪装为本阶段已彻底根治。
- 验证: `pnpm exec vitest run tests/server/database/init-boundary.test.ts tests/server/api/posts/home.get.test.ts tests/server/api/categories/index.get.test.ts tests/server/api/tags/index.get.test.ts`，受影响文件无错误静态诊断，以及 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)。
- [x] 本轮只推进“公开热点读链路继续瘦身”，不并行开启剩余显式 `initializeDB()` 调用点审计。
- [x] 已形成一组新的等价 live sample，并完成“当前超预算更像公开热读问题而不是初始化误触问题”的根因回答。

### 4. 结构复用第二轮（至少 3 处热点） (P1)

- 结果: 已完成 `3` 处热点收敛：`components/commercial-link-manager.vue` 将社交 / 打赏卡片区下沉到共享组件 `components/commercial-link-section.vue`；`utils/shared/commercial-schema.ts` 已把 `SocialLinkSchema / DonationLinkSchema` 收敛到同一工厂函数；`utils/shared/duration.ts` 已把秒 / 分钟解析与 fallback + clamp 逻辑收敛到共享内部 helper。
- 验证: `components/commercial-link-manager.test.ts`、`utils/shared/commercial-schema.test.ts`、`utils/shared/duration.test.ts`、`pnpm exec nuxt typecheck`、`pnpm duplicate-code:check`，以及浏览器侧验证 `http://127.0.0.1:3002/settings?tab=commercial` 的定向交互记录。
- [x] 至少 `3` 处热点完成收敛，其中包含 `commercial-link-manager` 文件内自重复。
- [x] `pnpm duplicate-code:check` 基线未反弹。

### 5. ESLint / 类型债下一轮窄切片 (P1)

- 结果: 已在 `server/utils/ai/index.ts` 为数据库 provider 值补上 `AIProviderType` 守卫与归一化 helper，移除直接写入 `AIConfig.provider` 的 `as any`；`server/utils/ai/index.test.ts` 同步把聚合层邻近的多处 `unknown as` 历史结构断言改为 `toMatchObject`，并补上“stored provider 不受支持时回退到 `openai`”的守线用例。
- 验证: `pnpm exec eslint server/utils/ai/index.ts server/utils/ai/index.test.ts`、`pnpm exec vitest run server/utils/ai/index.test.ts`、`pnpm exec nuxt typecheck`。
- [x] 定向 ESLint、定向测试与类型检查通过。
- [x] 残余债务与下一轮候选已明确记录。
