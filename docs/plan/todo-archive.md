# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 第二十五至第四十一阶段全文: [archive/todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md)、[archive/todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)
- 第四十二至第四十五阶段全文: [archive/todo-archive-phases-42-45.md](./archive/todo-archive-phases-42-45.md)
- 第四十六至第四十九阶段全文: [archive/todo-archive-phases-46-49.md](./archive/todo-archive-phases-46-49.md)
- 第五十至第五十一阶段全文: [archive/todo-archive-phases-50-51.md](./archive/todo-archive-phases-50-51.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前保留第五十二至第六十阶段的近线归档块。
    - 第一至第四十九阶段、第五十至第五十一阶段的完整待办归档正文已迁入区间分片。
    - 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---


## 第五十九阶段：AI 编辑增强与展示优化（已审计归档）

> 归档说明: 第五十九阶段「2 新功能 + 1 修复 + 2 优化」已于 2026-07-23 完成五条主线交付与阶段收口。两条新功能主线（AI 编辑增强改写+审查、近期热门文章列表）均已实施并通过验证；Demo Banner 暗色模式修复已完成；E2E CI 限流修复 + GHA 分片已完成三层限流修复与共享构建架构，代码已提交（`b6b567a7` + 后续 CI 修复 commits），E2E CI 验证依赖外部运行时延期验证；测试覆盖率 90%+ 首批已完成缺口盘点报告与两批次共 8 文件补测，覆盖改进 ~252 行（≈+1.09%）。所有主线均通过 Review Gate 审计。

> **ROI 评估**: Demo Banner 暗色模式修复 2.00；近期热门文章列表 1.50；AI 编辑增强（改写+审查）1.50；E2E CI 限流修复 + GHA 分片 1.80；测试覆盖率 90%+ 首批 1.00。

### 1. Demo Banner 暗色模式修复 (P0)

- **执行范围**: 修复 `components/demo-banner.vue` 暗色模式下 `.demo-banner__stage`（"当前推荐阶段：公开体验"）和 `.demo-banner__text` 透明度（`rgba(#f1f5f9, 0.82)`）导致文字对比度不足的问题。
- **非目标**: 不改其他暗色模式样式、不改组件逻辑、不涉及国际化文本改动。
- **实现对照**:
  - `components/demo-banner.vue`：`.demo-banner__stage` 透明度修复（`rgba(#f1f5f9, 0.82)` → `#f1f5f9`）
  - `.demo-banner__text` 确认已为实色无需修改
- **验收对照**: ✅ 暗色模式下"当前推荐阶段：公开体验"文字清晰可见；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 2. 近期热门文章列表（候选 #16）(P2)

- **执行范围**: 后端新增 `GET /api/posts/hot?range=365` 端点，基于 `post_view_hourly` 聚合近 365 天 views 增量，返回前 3 篇；前端首页新增"近期热门"区块，位于"最新文章"与"全站热门"之间；原"热门文章"重命名为"全站热门"；近期热门与最新文章不重复（复用 `excludeIds` 机制），全站热门允许与近期热门重复。
- **实现对照**:
  - `server/api/posts/hot/index.get.ts`：新增热点文章端点
  - 后续重构：三个端点合并为 `/api/posts/home` 统一返回 `{ items, popular, hot }`，移除 `/api/posts/hot` 独立端点
  - 首页组件：新增"近期热门"区块，重命名"全站热门"
  - i18n：新增 5 语种翻译
- **验收对照**: ✅ 首页三区块（最新文章 → 近期热门 → 全站热门）完整展示；✅ 近期热门基于近 365 天 `post_view_hourly` 聚合排序；✅ `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过。

### 3. AI 编辑增强 — 改写+审查（候选 #9）(P2)

- **执行范围**: 从候选 #9 AI 编辑增强套件中选取改写（Rewrite）+ 审查（Review）两个 P1 子功能。改写支持中英文、风格选择（口语/正式/学术/技术/创意/简洁）、可撤销/重做。审查输出结构化修改建议列表（不自动应用），内容哈希对比缓存。
- **实现对照**:
  - 后端：`/api/ai/rewrite` + `/api/ai/review` 端点
  - 前端：编辑器工具栏新增"改写"按钮（风格选择）+ "审查"按钮（结构建议列表）
  - 计费：复用现有 AI 管线，扩展支持 rewrite/review 操作类型
  - 改写流程：选中文本 + 对比窗口（保留原文/替换选中）
  - 审查缓存：内容哈希对比，未变化不重复请求 AI
- **验收对照**: ✅ 改写支持中英文、6 种风格选择、撤销/重做；✅ 审查输出结构化建议列表、不自动修改内容；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（11/11 tests 通过）；✅ Code Auditor Review Gate Pass。

### 4. E2E CI 限流修复 + GHA 分片（候选 #17）(P2→P1)

- **执行范围**: 三层限流修复（rate-limit-config.ts VIEWS 规则 + TEST_MODE 全局守卫 + views.post.ts 移除硬编码）+ GHA 分片（test.yml 共享 build job + e2e 4 矩阵分片 + 所有下游 job 复用构建产物）。
- **实现对照**:
  - `rate-limit-config.ts`：新增 `VIEWS` 规则（`match: path => path.endsWith('/views')`），环境变量可配置
  - `rateLimit()`：添加 `TEST_MODE` 全局守卫
  - `views.post.ts`：移除独立硬编码 `rateLimit()` 调用
  - `playwright.config.ts`：CI reporter 改为 blob（支持 `--shard` 分片报告合并）
  - `test.yml`：共享 `build` job + e2e 4 矩阵分片 + 各 job 下载复用
  - 后续修复：`8f44f99c`（merge-reports blob 路径）、`d21e732f`（隐藏文件上传）、`54adfb8b`（构建依赖验证）、`0284e2c0`（Docker 构建复用）
- **验收对照**: ✅ 三层限流代码 + GHA 分片架构已落地；✅ `pnpm typecheck` + `pnpm lint` 通过；⏳ E2E CI 验证依赖外部运行时，标记为延期验证（代码已提交至 `main`，可随时在 CI 环境确认）。

### 5. 测试覆盖率 90%+ 首批（长期主线 #1）(P1)

- **执行范围**: 基于长期主线 #1 策略，先对覆盖缺口做分层盘点，输出缺口报告；再补高价值缺口覆盖度，两批次共 8 文件补测，推进全仓 coverage +1%。
- **实现对照**:
  - 覆盖缺口分层盘点报告输出
  - 首批 5 文件覆盖改进（`85a95601`）
  - 第二批 3 文件覆盖改进（`2e559cbd`）
  - 覆盖改进合计 ~252 行（≈+1.09% 全仓预估）
- **验收对照**: ✅ 覆盖率缺口盘点报告落盘；✅ 全仓 coverage 提升 ~1%；✅ `pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过（3958/3959 tests pass）。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test + docs:build）
- [x] 归档记录已写入

---

## 第六十阶段：编辑器延续与代码质量治理（已审计归档）

> 归档说明: 第六十阶段「1 新功能 + 1 重构 + 1 治理 + 1 覆盖率 + 1 新能力」已于 2026-07-24 完成五条主线交付与阶段收口。AI 续写（Continue）复用 Phase 59 AI 管线，支持光标上下文续写 + Ctrl+Z 撤销 + AI 计费续写类型；响应式状态模型收敛完成 5 个文件 reactive→ref Step 1 迁移；Zod Schema 复用治理抽取 Ad Campaign + Ad Placement 共享基对象 + `.partial()` 派生，消除重复定义；测试覆盖率 90%+ 第二批新增 69 个测试覆盖 3 个 AI Provider 模块；多平台迁移适配器新增 Hugo 格式支持（TOML/YAML/JSON 自动检测 + `--format hugo` CLI 参数 + 17 个单元测试）。所有主线均通过 Review Gate 审计。

> **ROI 评估**: AI 续写 1.40；reactive→ref Step 1 1.60；Zod Schema 复用首批 1.60；测试覆盖率 90%+ 第二批 1.00；多平台迁移适配器 Hugo 格式 1.50。

### 1. AI 编辑增强 — 续写（候选 #9 子功能）(P0)

- **执行范围**: 基于 Phase 59 已交付的改写+审查管线，新增续写（Continue）功能。后端新增 `/api/ai/continue` 端点，复用现有 AI 管线与计费体系。前端编辑器工具栏新增"续写"按钮，基于光标位置或选中文本续写内容，支持撤销。
- **非目标**: 不做扩写/缩写/视角检查（P2，留后续阶段）。
- **实现对照**:
  - `server/api/ai/continue.post.ts`：POST 端点，复用 `TextService.continueWriting()` + `AI_PROMPTS.CONTINUE` 模板
  - `composables/use-post-editor-ai.ts`：`continueContent()` + `getEditorCursorContext()` + loading 状态
  - `components/admin/posts/post-editor-header.vue`：工具栏"续写"按钮（`#ai-continue-btn`）
  - i18n：5 语种 4 个新 key（`editor.continue` 等）
  - 计费：`recordTask({ type: 'continue' })` 复用现有 AI 计费体系
- **验收对照**: ✅ 续写内容在光标处正确插入；✅ 支持 Ctrl+Z 撤销；✅ 计费正确记录；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（503/504 files, 3958/3959 tests）；✅ Code Auditor Review Gate Pass。

### 2. 响应式状态模型收敛：reactive→ref Step 1（候选 #14）(P1)

- **执行范围**: 选取低风险首批文件（登录页、注册页、权益页、个人设置、安全设置中的 `form`/`errors` 类 `reactive` 对象），逐文件迁移为 `ref<{...}>()`。
- **非目标**: 不追求全仓 reactive 清零；不改动 API 契约或页面交互语义。
- **实现对照**:
  - `pages/login.vue`：`form` + `errors` ref 迁移
  - `pages/register.vue`：`form` + `errors` ref 迁移
  - `pages/benefits.vue`：`form` ref 迁移
  - `components/settings/settings-profile.vue`：`profileForm` ref 迁移
  - `components/settings/settings-security.vue`：`passwordForm` ref 迁移
- **验收对照**: ✅ Step 1 目标文件全部迁移完成（+56/-56，纯 script 层转换，模板零改动）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ Code Auditor Review Gate Pass。

### 3. Zod Schema 复用治理首批：Ad Campaign + Ad Placement（候选 #18）(P1)

- **执行范围**: 将 Ad Campaign 和 Ad Placement 的 create/update schema 抽取到 `utils/schemas/ad.ts`，使用共享基对象 + `.partial()` 派生 update schema。
- **非目标**: 不改动 API 行为或验证语义。
- **实现对照**:
  - `utils/schemas/ad.ts`（新建）：`campaignBase` + `placementBase` 共享基对象，`.partial()` 派生 update
  - `server/api/admin/ad/campaigns.post.ts` / `campaigns/[id].put.ts`：import 共享 schema
  - `server/api/admin/ad/placements.post.ts` / `placements/[id].put.ts`：import 共享 schema
  - update 独有字段（`impressions/clicks/revenue`）通过 `.extend()` 追加
- **验收对照**: ✅ Ad Campaign/Placement 共享基对象；✅ update schema 通过 `.partial()` 派生；✅ `pnpm typecheck` ✅ + `pnpm lint`（定向）✅ + 56/56 定向测试通过 ✅；✅ Code Auditor Review Gate Pass。

### 4. 测试覆盖率 90%+ 第二批（长期主线 #1）(P2)

- **执行范围**: 基于 Phase 59 缺口报告，选择 AI Provider 层（openai-provider / fallback-provider / stable-diffusion-provider）作为下一批高价值覆盖缺口模块。
- **实现对照**:
  - `server/utils/ai/openai-provider.test.ts：30 测试，覆盖构造器/chat 错误路径/流式 SSE/图片尺寸映射（1K/2K/4K/512PX））
  - `server/utils/ai/fallback-provider.test.ts`：39 测试，覆盖降级重试/非重试判定（401/403/404/409 vs 429/500）/事件记录
  - `server/utils/ai/stable-diffusion-provider.test.ts`：14 测试，覆盖尺寸解析/API 错误处理/鉴权 header
  - 修复 bug：`openai-provider.ts` 中 `512px` → `512PX` 大小写不匹配
- **验收对照**: ✅ 新增 69 个测试，覆盖 3 个 AI Provider 模块；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅(0 error) + 69/69 定向测试 ✅。

### 5. 多平台迁移适配器：Hugo 格式支持（候选 #12）(P2)

- **执行范围**: 抽象 `ContentParser` 接口，实现 `HugoParser` 适配器支持 TOML/YAML/JSON Front-matter 自动检测。CLI 命令增加 `--format hugo` 参数。
- **非目标**: 不支持 WordPress/Jekyll、不做自动格式检测、不改变现有 Hexo 解析。
- **实现对照**:
  - `packages/cli/src/types.ts`：`ContentParser` 接口 + `ParsedPost` 通用类型
  - `packages/cli/src/hugo-parser.ts`（281 行）：`HugoParser` 实现，YAML+TOML+JSON 三种格式通过 `gray-matter` 自动检测 + `smol-toml` 作为 TOML 引擎
  - `packages/cli/src/import-command.ts`：`--format hugo` CLI 参数
  - `packages/cli/src/hugo-parser.test.ts`（224 行）：17 个测试覆盖 title/date/tags/categories/slug/draft/cover/lastmod 映射
- **验收对照**: ✅ `--format hugo` 参数正确选择 HugoParser；✅ TOML/YAML Front-matter 正确映射；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅(0 error) + 86/86 CLI 测试 ✅ + Hexo 21/21 无回归 ✅。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）
- [x] Code Auditor Review Gate 通过
- [x] 归档记录已写入

---

## 第六十一阶段：AI 编辑增强扩展与治理延续（已审计归档）

> 归档说明: 第六十一阶段「1 个新功能 + 4 个优化」已于 2026-07-24 完成五条主线交付与阶段收口。AI 编辑增强（扩写+缩写）复用 Phase 59-60 AI 管线，支持中英文 + Ctrl+Z 撤销 + AI 计费；结构复用治理完成 CLI 包类型收敛（枚举派生 + `@deprecated` 类型别名）与 `toDateOrNull`/`toDateOrUndefined` 抽取；响应式状态模型 reactive→ref Step 2 完成 9 处后台列表页迁移；测试覆盖率 90%+ 第三批完成 4 个高价值模块覆盖（installation.ts 86.84%、comment.ts 86.82%、admin-drafts.ts 92.45%、post-automation-helpers.ts 全覆盖）；Zod Schema 复用治理第二批完成 Category/Tag 冗余清理 + Post 4 字段共享 + Marketing Campaign updateSchema。所有主线均通过 Review Gate 审计。

> **ROI 评估**: AI 编辑增强（扩写+缩写）1.20；结构复用治理 1.50；reactive→ref Step 2 1.40；测试覆盖率 90%+ 第三批 1.00；Zod Schema 复用第二批 1.30。

### 1. AI 编辑增强 — 扩写+缩写（候选 #9 子功能）(P2)

- **执行范围**: 基于 Phase 59-60 已交付的改写+审查+续写管线，新增扩写（Expand）和缩写（Condense）功能。后端新增 `/api/ai/expand` + `/api/ai/condense` 端点，复用现有 `TextService` 方法与计费体系。前端编辑器工具栏新增"扩写"和"缩写"按钮，选中文本后调用对应 API，支持 Ctrl+Z 撤销。提示词模板复用现有 `AI_PROMPTS` 结构扩展。
- **非目标**: 不做编辑视角检查 / 读者视角检查（P2，留后续阶段）；不做扩写/缩写的自定义程度调节（如扩写幅度）。
- **实现对照**:
  - `server/api/ai/expand.post.ts`：POST 端点，`TextService.expandContent()` + `AI_PROMPTS.EXPAND` 模板
  - `server/api/ai/condense.post.ts`：POST 端点，`TextService.condenseContent()` + `AI_PROMPTS.CONDENSE` 模板
  - `components/admin/posts/post-editor-header.vue`：工具栏"扩写"（`#ai-expand-btn`）+ "缩写"（`#ai-condense-btn`）按钮
  - 计费：`recordTask({ type: 'expand' })` / `recordTask({ type: 'condense' })` 复用现有 AI 计费体系
- **验收对照**: ✅ 扩写/缩写端点正确返回 AI 结果；✅ 前端按钮触发对应操作；✅ 支持 Ctrl+Z 撤销；✅ 计费正确记录；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + 49/49 AI 测试通过；✅ Code Auditor Review Gate Pass。

### 2. 结构复用治理：CLI 包类型收敛 + 工具函数抽取（长期主线 #3）(P1)

- **执行范围**: 聚焦 CLI 包（`packages/api-client`、`packages/cli/src/types.ts`）与主项目的类型收敛，以及 `toDateOrNull`/`toDateOrUndefined` 重复函数抽取。
- **收敛切片**:
  - 切片 1：`MomeiPostStatus`/`MomeiPostVisibility` → 从 `PostStatus`/`PostVisibility` 枚举派生（自包含枚举）
  - 切片 2：`MomeiPostScaffoldMetadata` → `PostScaffoldMetadata` 类型别名（保留向后兼容 + `@deprecated` 标记）
  - 切片 3：`toDateOrNull`/`toDateOrUndefined` → 已抽取到 `server/utils/date.ts`（2 个 ad campaigns 文件改为导入共享函数）
- **验收对照**: ✅ ≥2 组热点切片完成（实际 3 组）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ `pnpm duplicate-code:check` 基线不反弹。

### 3. 响应式状态模型收敛：reactive→ref Step 2（候选 #14）(P1)

- **执行范围**: 在 Step 1（5 文件低风险迁移）已验证模式可行后，推进 Step 2 中风险文件：后台列表页和筛选组件中的 `filters`/`pagination`/`sort`/`dialog` 类 `reactive` 对象。
- **实现对照**:
  - `composables/use-admin-friend-links-page.ts`：4 处 reactive → ref 迁移
  - `composables/use-admin-list.ts`：2 处 reactive → ref 迁移
  - `pages/admin/users/index.vue`：3 处 reactive → ref 迁移
  - 合计 9 处迁移，同步调整 composable 返回值类型约束（`Ref<F>`）
- **验收对照**: ✅ ≥5 处 `reactive` 迁移完成（实际 9 处）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 受影响页面的筛选/分页/弹窗/排序行为无回归（30 tests pass）。

### 4. 测试覆盖率 90%+ 第三批（长期主线 #1）(P2)

- **执行范围**: 基于 Phase 60 最新全仓覆盖率缺口报告，选择高价值覆盖缺口模块进行补测。
- **实现对照**:
  - `server/services/installation.test.ts`：lines 72.36%→86.84%, branches 42.38%→84.28%
  - `server/services/comment.test.ts`：lines 75.96%→86.82%, branches 49.2%→71%
  - `server/services/ai/admin-drafts.test.ts`：lines 71.69%→92.45%, branches 44.68%→74.46%
  - `server/services/ai/post-automation-helpers.test.ts`：新增测试文件，纯函数全覆盖
- **验收对照**: ✅ 全仓 coverage 提升；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + 109/109 tests ✅ + AI 全量 141/141 ✅ + Audit Pass ✅。

### 5. Zod Schema 复用治理第二批（候选 #18）(P2)

- **执行范围**: 在首批（Ad Campaign + Ad Placement）完成后，推进第二批清理任务。
- **实现对照**:
  - `utils/schemas/category.ts` / `utils/schemas/tag.ts`：移除 `updateSchema` 中不必要的 `.extend({slug})`（`.partial()` 已覆盖）
  - `utils/schemas/post.ts`：将 `createdAt`/`publishedAt`/`updatedAt`/`views` 4 字段抽取为 `postTimestampsAndViews` 共享对象
  - `utils/schemas/notification.ts`：为 Marketing Campaign 创建 `marketingCampaignUpdateSchema`（不含默认值，避免局部更新重置字段）
  - `server/api/admin/marketing/campaigns/[id].put.ts`：更新 PUT 端点使用新 schema + 字段级 `!== undefined` 守卫
- **验收对照**: ✅ Category/Tag `updateSchema` 不再冗余；✅ Post 日期/视图字段共享；✅ Marketing Campaign 独立 update schema 可用；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + 139/139 schema 定向测试通过 ✅ + Audit Pass ✅。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + docs:build）
- [x] Code Auditor Review Gate 通过
- [x] 归档记录已写入

---

## 第五十八阶段：HTTP MCP 与展示增强（已审计归档）

> 归档说明: 第五十八阶段「2 新功能 + 3 治理延续」已于 2026-07-22 完成五条主线交付与阶段收口。两条新功能主线（MCP HTTP 传输与本体挂载、RSS 订阅链接美化）均已实施并通过验证；结构复用主线承接 Phase 57 延期项，完成 api-client 类型枚举收敛 + 接口重命名 2 组热点切片；ESLint/类型债主线关闭已完成治理循环（NO_EXPLICIT_ANY_FILES 全部 65+ 项已在前序阶段收敛，豁免列表清零，全量 TypeScript 规则基线报告落盘）；测试有效性第六轮切片完成 12 个失败路径断言，覆盖 3 个模块（feed utils、feed-taxonomy-route、MCP endpoint）。所有主线均通过 Review Gate 审计。

> **ROI 评估**: MCP HTTP 传输与本体挂载 1.40；RSS 订阅链接美化 1.30；结构复用热点切片 1.60；ESLint/类型债窄切片 1.50；测试有效性第六轮 1.50。

### 1. MCP HTTP 传输与本体挂载 (P2)

- **执行范围**: 新增 `server/plugins/mcp-http.ts`（Nitro Plugin），条件守卫 + 动态导入 `@modelcontextprotocol/sdk`，使用 `StreamableHTTPServerTransport` 处理 `GET/POST/DELETE /api/mcp`。新增 `MOMEI_ENABLE_MCP_HTTP` 环境变量（默认 false）。根依赖新增 `@modelcontextprotocol/sdk`。复用外部 API Key 鉴权。Serverless 环境静默降级。
- **非目标**: 不替换现有 stdio 模式，双模式共存；不做 MCP 共享层抽取；不新增独立端口。
- **实现对照**:
  - `server/plugins/mcp-http.ts`：Nitro 插件，条件守卫 + 动态导入 SDK + `StreamableHTTPServerTransport`
  - `server/api/mcp/index.ts`：MCP HTTP 端点路由，GET/POST/DELETE 处理
  - `server/api/mcp/index.test.ts`：覆盖 401 鉴权失败、Web Request 构造、GET 跳过 body、null body 返回
- **验收对照**: ✅ `MOMEI_ENABLE_MCP_HTTP=true` 时 `/api/mcp` 端点可用；✅ 未设置时不加载 SDK（零冷启动影响）；✅ Serverless 环境静默降级；✅ API Key 缺失返回 401；✅ `pnpm typecheck` + `pnpm lint` 通过。
- **设计文档**: [`docs/design/modules/mcp-http.md`](../design/modules/mcp-http.md)

### 2. RSS 订阅链接美化 (P2)

- **执行范围**: 在 RSS feed 输出 XML 头部添加 `<?xml-stylesheet?>` 指令指向 CSS 样式文件（`/feed-style.css`），使浏览器直接访问 RSS 时显示美观的 HTML 样式页面。CSS 支持响应式设计，保留 RSS 阅读器正常解析能力。
- **非目标**: 不改变 feed 内容结构、不引入 JavaScript 交互、不做完整 RSS 阅读器。
- **实现对照**:
  - `public/feed-style.css`：新增 RSS 显示美化样式（响应式设计）
  - `server/utils/feed.ts`：新增 `injectRssStylesheet` 函数
  - `server/routes/feed.xml.ts` + `server/routes/feed/podcast.xml.ts` + `server/utils/feed-taxonomy-route.ts`：集成样式注入
- **验收对照**: ✅ 浏览器访问 `/feed.xml` 时显示美化样式而非原始 XML；✅ 响应式设计移动端可用；✅ RSS 阅读器仍能正常解析；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 现有 12 条 feed 测试全部通过。
- **设计文档**: [`docs/design/modules/rss-beautification.md`](../design/modules/rss-beautification.md)

### 3. 结构复用下一轮热点切片 — Phase 57 延续 (P1)

- **执行范围**: 承接 Phase 57 未完成的结构复用主线，继续收敛高频重复逻辑与轻量类型重复。
- **收敛切片**:
  - Slice 1：`MomeiPostStatus`/`MomeiPostVisibility` 从 `string` union 改为 `enum` 派生类型，与主项目 `types/post.ts` 规范值自动对齐
  - Slice 2：`MomeiPostScaffoldMetadata` → `PostScaffoldMetadata`、`MomeiPublishIntent` → `PublishIntent`（保留类型别名向后兼容 + `@deprecated` 标记）
- **涉及文件**: `packages/api-client/src/types.ts`
- **验收对照**: ✅ 完成 ≥2 组热点切片；✅ `duplicate-code` 基线不反弹（45 clones, 0.31%）；✅ `pnpm typecheck` + `pnpm lint` + api-client `29/29 tests` 全部通过。

### 4. ESLint / 类型债下一轮窄切片 — 治理循环关闭 (P1)

- **执行范围**: 确认 `NO_EXPLICIT_ANY_FILES` 全部 65+ 项已在前序阶段（Phase 51-57）逐批收敛完毕，本轮不做新切片而是关闭已完成的治理循环。
- **关键交付**:
  - 全量 TypeScript 规则基线扫描报告：`docs/reports/eslint-typescript-baseline.md`（覆盖 9 条已禁用规则的数据基线，供后续阶段决策参考）
  - NO_EXPLICIT_ANY_FILES 中 47 个目标文件全部清零（as any 使用量降为 0）
- **涉及文件**: `scripts/governance/eslint-debt-targets.mjs`（清理已失效分组变量）、`eslint.config.js`（条件展开 override）
- **验收对照**: ✅ 全部 65+ 项已确认收敛完毕；✅ `warning=0` 保持；✅ `pnpm typecheck` + `eslint types/ad.ts` 0 warning 通过；✅ `duplicate-code` 基线不反弹。

### 5. 测试有效性第六轮切片 (P1)

- **执行范围**: 围绕已有测试基座但失败路径不足的高风险链路补断言，优先覆盖 Phase 58 新增代码路径。
- **失败路径断言**:
  - `server/utils/feed.test.ts`：`injectRssStylesheet` 5 条测试（主路径/回退路径/自定义 href/内容顺序）
  - `server/utils/feed-taxonomy-route.test.ts`：3 条样式注入条件断言（rss2 注入 / atom 不注入 / json 不注入）
  - `server/api/mcp/index.test.ts`：4 条失败路径+行为验证（401 鉴权失败/Web Request 正确构造/GET 跳过 body/null body 返回）
- **验收对照**: ✅ 新增失败路径断言 ≥5 条（实际 12 条）；✅ 覆盖模块 ≥3 个（feed utils、feed-taxonomy-route、MCP endpoint）；✅ `pnpm test` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm lint:md`、`pnpm typecheck` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---


---


## 第五十二至第五十七阶段（已归档）

> 以下六阶段的完整正文已迁入 [todo-archive-phases-52-57.md](./archive/todo-archive-phases-52-57.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **57** | 2026-07-14~20 | 迁移体验增强（本地图片自动上传+updatedAt 元数据扩展）；测试有效性第五轮（13+ 断言，4 模块）；ESLint/类型债 3 组窄切片（validate-api-key/translation/types/ai）。结构复用延期至 Phase 58 |
| **56** | 2026-07-13~14 | 共享 API 客户端库提取（`packages/api-client` 包 + 29 测试，CLI/MCP axios 移除）；CLI 导出命令（`momei export` + Hexo Front-matter）；ESLint/类型债 3 组窄切片；结构复用 2 组热点；测试有效性第四轮 6 个断言 |
| **55** | 2026-07-07~13 | CLI/MCP 阶段二（4 REST + 灵感转文章 + 版本，CLI +15, MCP +16）；AI 降级 fallback 链；结构复用逻辑重复 2 组收敛；ESLint/类型债 3 组窄切片消除 22 处；测试有效性第三轮 7 个断言 |
| **54** | 2026-07-06~07 | CLI/MCP 环节一（CLI +3, MCP +4）；结构复用深水区（文件整合+重复检测脚本）；ESLint/类型债规则 inventory 脚本+3 组窄切片；测试有效性第二轮 6 个断言；脚本治理 eslint-debt 升格 |
| **53** | 2026-06-29~07-04 | Vercel CDN Tier 2 架构（ISR/SWR+Upstash Redis）；文档治理阈值收紧；ESLint/类型债清零 3 处 as any；结构复用 5 组热点（基线 0.39%→0.24%）；AI 编辑增强评估条件性 Go；E2E seed-test 修复 |
| **52** | 2026-06-23~28 | 脚本治理 warning 清理+升格；文档治理归档审计+阈值收紧；移动端 CWV 基线（LCP 1.6s-2.2s）；i18n runtime 扩面 2 页；测试有效性第二轮 9 个断言 4 模块 |

---

## 第五十至第五十一阶段（已归档）

> 以下两阶段的完整正文已迁入 [todo-archive-phases-50-51.md](./archive/todo-archive-phases-50-51.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **51** | 2026-06-14~16 | types/utils 边界收敛；跨包复用评估 No-Go；ESLint/类型债 11 处 as any 收敛；结构复用 5 组热点切片；backlog 长期主线状态同步 |
| **50** | 2026-06-14 | PWA 功能开启；API 测试分层收敛；i18n 首屏翻译稳定性治理；backlog 深度清理；友链博客环评估 Go |

---

## 第四十六至第四十九阶段（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-46-49.md](./archive/todo-archive-phases-46-49.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **49** | 2026-06-13 | Postgres 流量治理（89% 耗尽警戒→减列+缓存）；formatDate 函数级复用；Phase C 延期测试回填；清理收口；type 收敛 12→11 |
| **48** | 2026-06-12~13 | ESLint/类型债 9 处 as any 清零（seed-demo/translation/typeorm-adapter）；结构复用 3 组类型收敛 15→12；API Schema RouterParam Zod 校验；未使用 API 安全删除；第二轮闲置端点调研 |
| **47** | 2026-06-10~11 | ESLint/类型债 6 处 as any 收敛；结构复用 FeedItem/TitleSuggestion 收敛 17→14；页面与 API 路径规范化治理；admin 路由风格统一；未使用 API 清单评估（7 零引用端点）；API Schema 覆盖与复用治理 |
| **46** | 2026-06-08~10 | Umami Phase 2 部署化；ESLint/类型债 4 组窄切片；结构复用 3 组热点收敛；测试覆盖率 82%+ 收口；周期性回归；数据库初始化脚本同步 |

---


---

## 第四十二至第四十五阶段（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-42-45.md](./archive/todo-archive-phases-42-45.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **45** | 2026-06-08~10 | Umami 隐私自托管分析集成 Phase 1；Digital Garden 评估 No-Go；文档治理收口；ESLint / 类型债窄切片；结构复用治理收敛 |
| **44** | 2026-06-07 | 友链 RSS 聚合（Blogroll Feed）；Umami 评估条件性 Go；ESLint / 类型债 3 组窄切片；结构复用 2 组热点切片；CWV 性能优化；Phase 44 测试回填 |
| **43** | 2026-06-05 | AI 内容多格式复用（Twitter/LinkedIn）；ESLint / 类型债 3 组窄切片；结构复用治理；Windows Dev/Build 性能治理；i18n duplicates 收敛 |
| **42** | 2026-06-04 | CWV 基线建立；AI 内容审计评分徽章；内容日历与编辑排期；ESLint / 类型债 3 组窄切片；结构复用 3 组热点切片 |

---



---

## 第三十八至第四十一阶段概览（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **38** | 2026-05-27~28 | 分发一致性修补（B/Memos 标签标准化+尾注拼装）；测试有效性第二轮切片；Postgres 热点读链路瘦身；结构复用 3 组热点；ESLint AI provider 窄切片 |
| **39** | 2026-05-29~30 | 公众号排版预览（Markdown→WeChat 实时预览面板）；结构复用第三轮；注释治理首轮；文档/脚本治理最小收口包；国际化文案复用治理 |
| **40** | 2026-05-30~06-01 | 发布前 pre-check 统一化（`release:check`/`release:check:full`）；TypeORM 升级评估 No-Go 结论；守护策略分级；文档证据自动回填；守护策略分级与依赖风险口径对齐 |
| **41** | 2026-06-01~03 | TypeORM 前置清障（select: string[]→对象语法全量迁移）；Postgres 归档查询字段裁剪；文档门禁 warning 压缩；结构复用 2 组热点；ESLint 四组窄切片（26 文件 warning=0） |
