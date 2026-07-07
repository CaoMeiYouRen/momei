# 墨梅博客 待办事项归档 — 第四十二至第四十五阶段

本文档包含第四十二至第四十五阶段的完整待办归档正文。主文档 [todo-archive.md](../todo-archive.md) 保留摘要与索引。

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
- **结果摘要**: 两轮窄切片完成，满足"单规则 + 小范围"治理约束。

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
- **端到端链路**: DB Entity → service.saveFriendLinkEntity 白名单 → Zod schema `showRssFeed` 校验 → Admin Form Checkbox → Public Feed API `where: { showRssFeed: true }` → 公开页渲染。
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

---

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
