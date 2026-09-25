# 待办归档深度分片：第六十一至第六十三阶段

> 本文件承接 `docs/plan/todo-archive.md` 主窗口迁出的第六十一、六十二、六十三阶段完整归档块（迁出时点：2026-09-25）。
> 归档规则见 [深度归档治理索引](./index.md)；路线图对应区间见 [roadmap-phases-54-67.md](./roadmap-phases-54-67.md)。

---

## 第六十三阶段：设置 UI 盘点与治理续航（已审计归档）

> 归档说明: 第六十三阶段「5 个优化」已于 2026-07-27 完成五条主线交付与阶段收口。设置表单 UI Phase 1（盘点+SoT 映射 5 项）已完成缺口清单与映射补齐；响应式状态模型 reactive→ref Step 4 完成 5 处迁移（user-filters/notification-delivery-log-list/waitlist/subscribers/submit）；结构复用治理完成 2 组热点切片（`getErrorDetail` 共享抽取 + 编辑器面板 SCSS 共享），duplicate-code 基线 0.39%→0.35%；测试覆盖率 90%+ 第五批新增 22 个测试覆盖 3 个模块；翻译质量审计（ko-KR/ja-JP）修复 10 项问题。所有主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 设置表单 UI Phase 1 `1.60`；reactive→ref Step 4 `1.60`；结构复用治理 `1.50`；测试覆盖率 90%+ 第五批 `1.00`；翻译质量审计 `1.30`。

### 1. 设置表单 UI Phase 1 — 盘点与 SoT 映射补齐（候选 #7）(P2)

- **执行范围**: 产出现有配置项缺口清单（Gap A/B 分类），为 5 个 env var 补充 `SettingKey` + `SETTING_ENV_MAP` 映射（EMAIL_SECURE/EMAIL_EXPIRES_IN/TEMP_EMAIL_DOMAIN_NAME/TTS_DEFAULT_VOICE/AI_MAX_TOKENS），`INTERNAL_ONLY_ENV_KEYS` 扩充 5 项运维级 key。
- **非目标**: 不做 UI 组件、不改 `FORCED_ENV_LOCKED_KEYS`。
- **实现对照**:
  - `types/setting.ts`：新增 5 个 SettingKey
  - `server/services/setting.constants.ts`：新增 5 条 SETTING_ENV_MAP + 5 条 INTERNAL_ONLY
  - `utils/shared/env.ts`：添加 `@settingKey` / `@internalOnly` 注释
  - `docs/design/governance/settings-form-ui-phase1-gap-inventory.md`：缺口清单
- **验收对照**: ✅ 5 个映射补齐（超要求 3-5）；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 2. 响应式状态模型收敛：reactive→ref Step 4（候选 #14）(P1)

- **执行范围**: 筛选类（`user-filters.vue`/`notification-delivery-log-list.vue`/`waitlist/index.vue`/`subscribers/index.vue`）和表单错误类（`submit.vue`）中的 `reactive` → `ref` 迁移。
- **非目标**: 不追求全仓 reactive 清零；表单/弹窗类延期。
- **实现对照**:
  - `components/admin/users/user-filters.vue`：`internalFilters` reactive → ref
  - `components/admin/settings/notification-delivery-log-list.vue`：`filters` reactive → ref
  - `pages/admin/waitlist/index.vue`：`filters` reactive → ref + 显式类型
  - `pages/admin/subscribers/index.vue`：`filters` reactive → ref
  - `pages/submit.vue`：`errors` reactive → ref
- **验收对照**: ✅ 5 处迁移完成；✅ 所有 template 零改动；✅ `pnpm typecheck` + `pnpm lint` + tests 通过。

### 3. 结构复用治理 — 下一轮热点切片（候选 #2）(P1)

- **执行范围**: 基于 duplicate-code 基线 0.39% 识别重复热点，优先检查 Phase 62 新增代码。
- **收敛切片**:
  - Slice 1：`getErrorDetail` 从 5 文件抽取到 `utils/shared/error-detail.ts`，消除 5×13 行重复
  - Slice 2：`_editor-panel-shared.scss` 共享 placeholder 抽取，消除 perspective/review panel 3 组 SCSS 克隆
- **验收对照**: ✅ 2 组切片完成；✅ duplicate-code 基线 0.35% ≤ 0.39%（-92 行 / -3 克隆）；✅ `pnpm typecheck` + `pnpm lint` + tests 通过。

### 4. 测试覆盖率 90%+ 第五批（长期主线 #1）(P2)

- **执行范围**: 选取高价值缺口模块：新文件 `error-detail.ts` 全覆盖、`server/utils/settings.ts` 边缘 case、`utils/shared/url.ts` 缺失场景。
- **实现对照**:
  - `utils/shared/error-detail.test.ts`：10 个测试覆盖全部路径至 100%
  - `server/utils/settings.test.ts`：新增 8 个边缘 case（mask 短值/非 mask 类型/类型优先级）
  - `utils/shared/url.test.ts`：新增 4 个场景（HTTP base 拼接/nullish normalizeBaseUrl）
- **验收对照**: ✅ 新 22 个测试通过；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 5. 翻译质量审计 — ko-KR/ja-JP（候选 #18）(P2)

- **执行范围**: 审计 home/auth/common/components/public/settings 模块的翻译质量，修复中国语残留、品牌名未本地化、格式/标点问题。
- **实现对照**:
  - ja-JP：中国语残留修复（"近期人気"→"最近の人気"、"全期間人気"→"総合人気"）、品牌名本地化（Momei ブログ）、标语本地化、缩进修复
  - ko-KR：品牌名本地化（모메이 블로그 3 处）、archives 缩进修复、settings 标点修复
  - `docs/design/governance/i18n-quality-audit-ko-ja.md`：审计报告
- **验收对照**: ✅ 10 项问题修复；✅ `i18n:audit:missing = 0` 保持。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---

---

## 第六十二阶段：迁移适配扩展与治理续航（已审计归档）

> 归档说明: 第六十二阶段「1 个新功能 + 4 个优化」已于 2026-07-24 完成五条主线交付与阶段收口。多平台迁移适配器 WordPressParser（WXR 解析 + `--format wordpress` + Hexo/Hugo 无回归）；测试覆盖率 90%+ 第四批（26 个测试覆盖 4 个纯函数至 100%）；AI 编辑视角/读者视角检查（`/api/ai/perspective-check` + 编辑器工具栏 + `PostEditorPerspectivePanel` + AI 计费）；响应式状态模型 reactive→ref Step 3（3 文件 6 处深层嵌套迁移 + 11 个定向测试）；脚本治理 warning 清理（TODO 归零 + 逐行复述 15→6 + docs candidate 清洁）。所有主线均通过 lint/typecheck/test/docs:build 质量门。

> **ROI 评估**: WordPress Parser `1.50`；测试覆盖率 90%+ 第四批 `1.00`；AI 编辑视角/读者视角检查 `1.20`；reactive→ref Step 3 `1.60`；脚本治理 warning 清理 `1.30`。

### 1. 多平台迁移适配器 — WordPress Parser（候选 #12）(P2)

- **执行范围**: 基于 `ContentParser` 接口实现 `WordPressParser` 适配器，支持 WXR 格式解析。CLI 新增 `--format wordpress` 参数。适配器单元测试覆盖 title/date/tags/categories/content/slug/draft 映射。
- **非目标**: 不支持 WordPress REST API 在线导入、不做自动格式检测、不改变现有 Hexo/Hugo 解析。
- **实现对照**:
  - `packages/cli/src/wordpress-parser.ts`（376 行）：WordPressParser 实现，WXR XML → `ParsedPost` 转换
  - `packages/cli/src/wordpress-parser.test.ts`（343 行）：17 个测试覆盖完整映射
  - `packages/cli/src/import-command.ts`：`--format wordpress` 参数
  - `packages/cli/package.json`：新增 `fast-xml-parser` 依赖
- **验收对照**: ✅ `--format wordpress` 参数正确选择 WordPressParser；✅ WXR 映射通过 17 个测试；✅ `pnpm typecheck` + `pnpm lint` + `86/86 CLI 测试` 通过；✅ Hexo 21/21 + Hugo 17/17 无回归。

### 2. 测试覆盖率 90%+ 第四批（长期主线 #1）(P2)

- **执行范围**: 基于 Phase 61 覆盖率缺口报告，选择 `server/utils/date.ts`（49 行）和 `server/utils/query-params.ts`（14 行）作为高价值缺口模块。
- **实现对照**:
  - `server/utils/date.test.ts`（64 行）：`toDateOrNull`、`toDateOrUndefined` 全覆盖（空值/有效日期/无效日期/undefined/null/边缘行为）
  - `server/utils/query-params.test.ts`（62 行）：`toQueryString`、`toQueryStringArray` 全覆盖（空值/单值/多值/混合/undefined）
- **验收对照**: ✅ 新增 26 个测试覆盖 4 个纯函数至 100%（0%→100%）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 26/26 定向测试通过。

### 3. AI 编辑视角/读者视角检查（候选 #9 剩余子功能）(P2)

- **执行范围**: 基于 Phase 59-61 已交付的改写+审查+续写+扩写+缩写管线，新增编辑视角检查（Edit Perspective Check）和读者视角检查（Reader Perspective Check）功能。
- **实现对照**:
  - `server/api/ai/perspective-check.post.ts`：POST 端点，`TextService.perspectiveCheck()` 方法
  - `server/services/ai/text.ts`：`perspectiveCheck()` 实现，`AI_PROMPTS.PERSPECTIVE_CHECK` 模板
  - `components/admin/posts/post-editor-header.vue`：工具栏"视角检查"按钮
  - `components/admin/posts/post-editor-perspective-panel.vue`（291 行）：结构化建议面板，支持编辑/读者视角切换
  - `composables/use-post-editor-ai.ts`：`doPerspectiveCheck()` + loading/error 状态
  - `utils/schemas/ai.ts` + `types/ai.ts`：`PerspectiveMode` / `PerspectiveCheckItem` 类型
  - `i18n/locales/*/admin-posts.json`：5 语种翻译
  - 计费：`recordTask({ type: 'perspective_check', category: 'text' })` 复用现有 AI 计费
- **验收对照**: ✅ 视角检查端点正确返回结构化建议；✅ 前端按钮触发对应操作；✅ 支持编辑/读者视角切换；✅ 计费正确记录；✅ `pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅。

### 4. 响应式状态模型收敛：reactive→ref Step 3（候选 #14）(P1)

- **执行范围**: 在 Step 2 完成后，推进 Step 3 高风险复合对象：settings-notifications、admin/comments、admin/submissions 中的深层嵌套 reactive 对象。
- **实现对照**:
  - `components/settings/settings-notifications.vue`：聚合订阅状态 reactive → ref（4 处）
  - `pages/admin/comments/index.vue`：筛选/弹窗/分页 reactive → ref（8 处）
  - `pages/admin/submissions/index.vue`：筛选/弹窗/分页 reactive → ref（6 处）
  - 新增测试：`pages/admin/comments/index.test.ts`（162 行，6 个测试）+ `pages/admin/submissions/index.test.ts`（143 行，4 个测试）+ 已有 settings-notifications 6 个测试
- **验收对照**: ✅ 3 文件 18 处 reactive → ref 迁移完成；✅ 新增 11 个定向测试通过；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ `pnpm test`（4198 全部通过）。

### 5. 脚本治理 warning 清理（长期主线 #10）(P1)

- **执行范围**: 清理 `audit-comment-drift` 的 TODO 计数与逐行复述误报、清理两条 docs candidate 入口的 warning 面。
- **实现对照**:
  - `scripts/governance/audit-comment-drift.mjs`：isRestatementComment 过滤器优化，误报 from 15→6（-60%），TODO 计数归零
  - `docs:check:line-count:candidate`：已清洁，无 warning
  - `docs:check:source-of-truth:candidate`：21 条 freshness warning → 0（`candidate` 入口已清洁）
- **验收对照**: ✅ 三条脚本产出清洁输出；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test + docs:build）
- [x] 归档记录已写入

---

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
