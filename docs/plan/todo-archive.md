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
- 第五十二至第五十七阶段全文: [archive/todo-archive-phases-52-57.md](./archive/todo-archive-phases-52-57.md)
- 第五十八至第六十阶段全文: [archive/todo-archive-phases-58-60.md](./archive/todo-archive-phases-58-60.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前保留第六十一至第六十六阶段的近线归档块。
    - 第一至第五十七阶段、第五十八至第六十阶段的完整待办归档正文已迁入区间分片。
    - 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---

## 第六十六阶段：编辑器续航与覆盖率攻坚（已审计归档）

> 归档说明: 第六十六阶段「1 个功能扩展 + 4 个优化」已于 2026-08-13 完成五条主线交付与阶段收口。编辑器工具栏收敛 Phase B（风格扩展）为续写/扩写/缩写新增 `style` 参数并复用 6 种风格定义，Phase A 工具栏分组无回归；设置表单 UI Phase 4 补齐 AI Fallback 文本备用 3 项（`AI_FALLBACK_API_KEY`/`AI_FALLBACK_MODEL`/`AI_FALLBACK_ENDPOINT`）表单控件与五语种翻译；结构复用治理完成 theme 颜色 model composable 抽取（duplicate-code 基线 0.31%→0.30%）；测试覆盖率 90%+ 第八批补测 5 个高价值模块（text 55.64%→94.82%、tts 59.84%→88.63%、parser 60.00%→92.00%、aggregator 68.29%→97.56%、category 63.01%→98.63%），全仓 Statements 79.55%→80.63%（≥80.48% 目标达标，+1.08%）；脚本治理完成 audit:comment-drift 升格复核（GO，维持 Phase 52 已升格状态）并收口 7 处文档漂移。所有主线均通过 typecheck + lint 质量门与 Code Auditor Review Gate 审计。

> **ROI 评估**: 测试覆盖率 90%+ 第八批 `1.00`；编辑器工具栏收敛 Phase B `1.60`；设置表单 UI Phase 4 `1.75`；结构复用治理 `1.60`；脚本治理 comment-drift 升格 `2.00`。

### 1. 测试覆盖率 90%+ 第八批（长期主线 #1）（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告（[`phase-66-coverage-gap-analysis.md`](../design/governance/phase-66-coverage-gap-analysis.md)），吸取第七批教训——优先选择 `server/services/` 层代码量大、分支数多的模块，确保每批覆盖 ≥1% 的数字可见提升。选取 5 个高价值缺口模块推进。
- **非目标**: 不做低价值铺量补测；不牺牲断言有效性换取数字增长；不选代码量 <50 行的小模块。
- **实现对照**:
  - `server/services/ai/text.ts`：55.64% → **94.82%**（新增 18 用例：rewrite/review/perspectiveCheck/translate 完整路径、JSON 解析失败 fallback、10 方法无 chat 降级 it.each、suggestTitles JSON fallback）
  - `server/services/ai/tts.ts`：59.84% → **88.63%**（新增 14 用例：compensateStaleTask 各分支、generateSpeech 成功/失败、getVoices、estimateCostBreakdown、getAvailableProviders、generateAndUploadSpeech、processTask 失败路径）
  - `server/services/external-feed/parser.ts`：60.00% → **92.00%**（新增 12 用例：实体解码、相对链接、封面解析、Atom 规范化、CDATA 对象、异常格式）
  - `server/services/external-feed/aggregator.ts`：68.29% → **97.56%**（新增 7 用例：fixed-locale 过滤、同时间去重排序、refresh 失败 degraded、缓存刷新计数）
  - `server/services/category.ts`：63.01% → **98.63%**（新增 7 用例：ensureCategory 全分支、updateCategory translation/parent 冲突）
  - `category.test.ts` beforeEach 加 mockReset 修复 once 队列跨测试污染
- **验收对照**: ✅ 全仓 Statements 80.63% ≥ 80.48%（+1.08%，Branches 69.26% +1.32% / Lines 80.68% +1.12% / Funcs 78.64% +0.39%）；✅ 定向 subset 134/134 全绿 + 周边 14/14 无回归；✅ `pnpm typecheck` + `pnpm lint` 通过（0 errors）。
- **交付**: `85d69d7d`

### 2. 编辑器工具栏收敛 Phase B — 风格扩展（短期候选 #14）（P2）

- **执行范围**: 为续写（Continue）/ 扩写（Expand）/ 缩写（Condense）新增 `style` 参数，复用 Phase A 已完成的 6 种风格定义（专业/简洁/创意/学术/技术/友好）。后端 `TextService` 扩展 `style` 参数传递；前端工具栏 SplitButton 子项支持风格选择。
- **非目标**: 不新增 AI Provider；不改动 AI 计费/配额逻辑；不改写（Rewrite）已有风格参数。
- **验收对照**: ✅ 续写/扩写/缩写支持 6 种风格选择；✅ Phase A 工具栏分组无回归；✅ `pnpm typecheck` + `pnpm lint` + 受影响 AI 测试通过。

### 3. 设置表单 UI Phase 4（短期候选 #13 延续）（P2）

- **执行范围**: 按缺口清单选取 AI Fallback 3 项（`AI_FALLBACK_API_KEY`/`AI_FALLBACK_MODEL`/`AI_FALLBACK_ENDPOINT`）。范围校准：`WEBHOOK_TIMESTAMP_TOLERANCE` 当前实现不读取、`hexo_sync_*` 已实现且定位 `INTERNAL_ONLY`/`ADMIN_EXCLUDED`，均不在本批处理；AI Image Fallback 4 项留 Phase 5。
- **非目标**: 不暴露基础设施密钥到后台管理；不改变 `FORCED_ENV_LOCKED_KEYS` 安全锁定策略；不做通用 Key-Value 编辑器；不做 AI Image Fallback 系列（留 Phase 5）。
- **实现对照**:
  - 补齐 SETTING_ENV_MAP 3 条映射 + `.env.full.example` 注释示例
  - `ai-settings.vue` 实现 Password + InputText + InputText 表单控件（`v-if` 跟随 `ai_fallback_provider`）并补齐五语种翻译
  - 新增 `setting.constants.test.ts` + `ai-settings.test.ts` 共 6 个新用例
- **验收对照**: ✅ ≥2 个配置项新增后台 UI 控件（3/3）；✅ `pnpm typecheck` + `pnpm lint` + `pnpm lint:i18n` + `i18n:audit:missing = 0` 通过 + 定向测试 49/49 全绿；✅ A 阶段 `@code-auditor` Review Gate Pass（RG-W01 同轮闭环、RG-W02 待手动浏览器验证）。

### 4. 结构复用治理（长期主线 #3）（P1）

- **执行范围**: 基于 `duplicate-code: 0.30%` 最新基线识别 ≥1 组重复热点。优先方向：检查 Phase 64-65 新增代码（共享查询层、设置表单扩展等）是否引入重复；检查 `server/api/` 层请求上下文/参数校验的共性逻辑。
- **非目标**: 不推动跨模块大重构；不为复用而复用；不改变业务行为。
- **实现对照**:
  - 新建 `composables/use-theme-color-models.ts`：抽取 4 个共享函数（`resolveThemePresetKey` / `getPresetValue` 纯函数 + `createThemeColorModel` / `createThemeColorPickerModel<K>` 泛型工厂）
  - `theme-config-section.vue` ↔ `theme-preview-section.vue` 组件保留模板调用点，本地 1-3 行 closure 委托到 composable
  - 新增 `composables/use-theme-color-models.test.ts` 20 个单测覆盖关键分支
  - 消除 jscpd id 12+13 共 41 行重复 / 201 tokens，duplicate-code 基线 0.31%→0.30%
- **验收对照**: ✅ ≥1 组热点切片完成；✅ `pnpm duplicate-code:check` 基线 ≤0.30%；✅ `pnpm typecheck` + `pnpm lint` 通过。
- **交付**: `8fb91ecd`

### 5. 脚本治理 — audit:comment-drift 升格评估（长期主线 #10）（P1）

- **执行范围**: 复核 `audit:comment-drift` 是否满足升格条件——确认脚本输出稳定、误报率可控、warning 面清洁；输出明确 go/no-go 结论与理由。
- **非目标**: 不新增脚本；不改脚本 API；不引入新治理基线。
- **实现对照**:
  - 实测运行验证：exit 0，扫描 1294 文件，TODO=0 / restatement=6 / drift=139（较 Phase 65 基线 136 仅 +3 正常波动），五维评估（稳定/清洁/轻量/互补/可消费）全部满足
  - 结论 **GO**：维持 Phase 52 已升格状态（`regression:weekly` 第 10 步，required: false），无需重复升格操作
  - 评估文档：`docs/design/governance/script-promotion-eval-phase66.md`
  - 更正 comment-drift 升格归属 Phase 54 → Phase 52（经 git 提交 `8eb2c923` 与 `todo-archive-phases-52-57.md` 权威归档核实），收口 7 处文档漂移（backlog / README / planning / script-governance / phase65 评估文档 / todo-archive）
- **验收对照**: ✅ 输出升格评估结论（go + 理由）；✅ `regression:weekly` 配置确认已纳入（Phase 52 第 10 步，测试断言同步）；✅ `pnpm governance:audit:comment-drift` 清洁输出。
- **交付**: `1fc73e54`

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

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

## 第六十五阶段：编辑器工具栏收敛与设置 UI 续航（已审计归档）

> 归档说明: 第六十五阶段「2 个增量功能 + 3 个治理切片」于 2026-07-27~28 完成 4/5 主线交付。编辑器工具栏收敛 Phase A（10→5 按钮折叠 + 标题栏弹性宽度）验收通过；设置表单 UI Phase 3（AI_TEMPERATURE/AI_CHUNK_SIZE/AI_FALLBACK_PROVIDER UI + tts_credential_ttl_seconds + ExternalFeedSourcesEditor + 五语种翻译 + SettingKey 映射）验收通过；结构复用治理（Categories/Tags 共享查询层，-226 行重复，基线 0.34%→0.30%）验收通过；脚本治理升格评估（simple-duplicates 升格至 regression:weekly）验收通过；测试覆盖率 90%+ 第七批新增 3 个测试文件（external-links-shared.test.ts + settings.test.ts + setting.constants.test.ts），全仓覆盖率 79.48%（未达 ≥1% 目标，未通过验收，转入长期治理）。vitest.shared.ts 统一为 forks 池修复 `<repo-root>/tmp` 竞态问题；新增 regression-weekly.yml 定时 CI 回归工作流。所有已交付主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 编辑器工具栏收敛 Phase A `2.33`；设置表单 UI Phase 3 `1.75`；测试覆盖率 90%+ 第七批 `1.00`；结构复用治理 `1.60`；脚本治理升格评估 `2.50`。

### 1. 编辑器工具栏收敛 Phase A（候选 #14）（P1）

- **执行范围**: 将文章编辑器的 10 个独立 AI 按钮折叠为 5 个入口：「AI 写作（SplitButton: 改写/续写/扩写/缩写）」+「AI 审校（审查）」+「AI 翻译」+「格式化」+「语音」，标题输入框获得完整弹性宽度。
- **非目标**: 不改动 MavonEditor 原生工具栏；不改动编辑器页面整体布局；不改动 AI 计费/配额逻辑；不新增 AI Provider。
- **设计文档**: [`docs/design/governance/editor-toolbar-consolidation-eval.md`](../design/governance/editor-toolbar-consolidation-eval.md)
- **验收对照**: ✅ 5 个入口代替原有 10 个按钮；✅ 标题输入框宽度恢复正常；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 编辑器功能无回归（4 单元测试通过 + 14/14 UI 验证通过）。
- **交付**: `e936ec1e`

### 2. 设置表单 UI Phase 3（候选 #13 延续）（P1）

- **执行范围**: 基于 Phase 1 缺口清单，新增 5 个表单控件——ai-settings.vue 扩展（`AI_TEMPERATURE` InputNumber + `AI_CHUNK_SIZE` InputNumber + `AI_FALLBACK_PROVIDER` Select + `TTS_CREDENTIAL_TTL_SECONDS` InputNumber）+ 第三方标签页新增 `external_feed_sources` 组件；补齐五语种翻译条目及 SettingKey/SETTING_ENV_MAP 映射。
- **非目标**: 不新增独立标签页（归入现有 AI/第三方标签页）；不改动 `FORCED_ENV_LOCKED_KEYS`；不做 AI_IMAGE_FALLBACK 系列（留 Phase 4）。
- **详细方案**: [`docs/design/governance/settings-form-ui-phase1-gap-inventory.md`](../design/governance/settings-form-ui-phase1-gap-inventory.md)
- **验收对照**: ✅ ≥4 个字段 UI 完成（5/5）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 受影响表单保存/验证通过。
- **交付**: `01ce9670`

### 3. 测试覆盖率 90%+ 第七批（长期主线 #1）（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告，选取 3-5 个高价值缺口模块（优先 `server/services/` 或 `server/utils/` 层尚未深度覆盖的模块），推进全仓 coverage +≥1%。
- **非目标**: 不做低价值铺量补测；不牺牲断言有效性换取数字增长。
- **测试新增**:
  - `server/utils/external-links-shared.test.ts`：handleExternalLinkError 覆盖
  - `server/utils/settings.test.ts`：inferSettingMaskType 行为变更 + isPublicSettingKey
  - `server/services/setting.constants.test.ts`：isSettingEnvLocked / resolveSettingEnvEntry / getSettingLockReason 覆盖
- **验收对照**: ❌ 全仓覆盖率 Statements 79.48%（未达 ≥1% 提升目标）；✅ 516/517 测试文件通过，0 失败；✅ `pnpm typecheck` + `pnpm lint` 通过。
- **结论**: 未通过验收，转入长期治理继续推进。

### 4. 结构复用治理（长期主线 #3）（P1）

- **执行范围**: 基于 `duplicate-code` 0.35% 最新基线识别 ≥2 组重复热点；优先检查 Phase 63-64 新增代码是否引入重复。
- **非目标**: 不推动跨模块大重构；不为复用而复用；不改变业务行为。
- **实现对照**:
  - 新建 `server/utils/category-public-list.ts`：`queryCategoryPublicList()` 共享函数
  - 新建 `server/utils/tag-public-list.ts`：`queryTagPublicList()` 共享函数
  - 4 端点 handler 简化：`api/categories/index.get.ts` / `api/external/categories/index.get.ts` / `api/tags/index.get.ts` / `api/external/tags/index.get.ts`
  - 累计消除 226 行重复（+14/-226），2 克隆消除，基线 0.34%→0.30%
- **验收对照**: ✅ ≥2 组热点切片完成；✅ `duplicate-code` 基线 0.30% ≤ 0.35%；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 22/22 测试通过。

### 5. 脚本治理升格评估（长期主线 #10）（P1）

- **执行范围**: 评估将 `governance:audit:simple-duplicates` 和 `governance:audit:comment-drift` 从独立 baseline 升格进入 `regression:weekly` warning 面；输出明确 go/no-go 结论与理由；确保所有治理脚本当前清洁运行。
- **非目标**: 不新增脚本；不改脚本 API；不引入新治理基线。
- **实现对照**:
  - 升格评估报告输出：`docs/design/governance/script-promotion-eval-phase65.md`
  - `audit:simple-duplicates` Go → 已加入 `regression:weekly` step 11（required: false）
  - `audit:comment-drift` 确认已升格（Phase 52 已接入）
  - 四组治理脚本清洁运行（simple-duplicates 114/11/10, comment-drift TODO=0 restatement=6 drift=136, eslint-debt 0w, check-scripts 50/50/50）
- **验收对照**: ✅ 升格评估报告输出；✅ `regression:weekly` 步骤列表更新；✅ 治理脚本清洁运行。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---

## 第六十四阶段：设置 UI Phase 2 与治理续航（已审计归档）

> 归档说明: 第六十四阶段「1 个新功能 + 4 个优化」已于 2026-07-27 完成五条主线交付与阶段收口。设置表单 UI Phase 2（首批 UI 组件）将 Phase 63 的 SoT 映射落地为 5 个可交互表单控件（EMAIL_SECURE/EMAIL_EXPIRES_IN/TEMP_EMAIL_DOMAIN_NAME/AI_MAX_TOKENS/TTS_DEFAULT_VOICE）并补齐五语种翻译；reactive→ref Step 5 收尾剩余 3 个表单/弹窗类文件（admin-taxonomy-page/marketing-campaign-form/comment-form）；结构复用治理完成 2 组热点切片（safeDeleteCategory + handleExternalLinkError），duplicate-code 基线保持 0.35%；测试覆盖率第六批为 privacy.ts 新增 7 个边缘 case 测试；ko-KR/ja-JP 文档治理完成 freshness 审计报告、ko-KR 13 文件 last_sync 刷新、ja-JP 语种升格为已支持、补齐 features/variables 翻译。所有主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 设置表单 UI Phase 2 `1.60`；reactive→ref Step 5 `1.60`；结构复用治理 `1.80`；测试覆盖率 90%+ 第六批 `1.50`；ko-KR/ja-JP 文档治理 `1.50`。

### 1. 设置表单 UI Phase 2 — 首批 UI 组件（P1）

- **执行范围**: 为 Phase 63 新映射的 5 个 SettingKey 开发 PrimeVue 表单控件：email-settings.vue（EMAIL_SECURE ToggleSwitch、EMAIL_EXPIRES_IN InputNumber、TEMP_EMAIL_DOMAIN_NAME InputText）、ai-settings.vue（AI_MAX_TOKENS InputNumber、TTS_DEFAULT_VOICE Select + ttsVoiceOptions computed）。types/setting.ts AISettingsFields 补齐新字段。
- **非目标**: 不新增标签页；不改动 FORCED_ENV_LOCKED_KEYS。
- **实现对照**:
  - `components/admin/settings/email-settings.vue`：新增 3 个表单控件
  - `components/admin/settings/ai-settings.vue`：新增 2 个表单控件 + ttsVoiceOptions computed
  - `types/setting.ts`：AISettingsFields 新增 2 字段
  - `i18n/locales/*/admin-settings.json`：五语种各 5 个翻译条目
- **验收对照**: ✅ 5 字段 UI 完成；✅ 五语种 20 个翻译条目；✅ `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过。

### 2. 响应式状态模型收敛 — reactive→ref Step 5（P1）

- **执行范围**: 补齐 Phase 63 延期的 3 个表单/弹窗类文件 `reactive` → `ref` 迁移。
- **迁移明细**:
  - `components/admin/admin-taxonomy-page.vue`：deleteDialog reactive → ref（6 处 .value）
  - `components/admin/marketing-campaign-form.vue`：form reactive → ref（15+ 处 .value）
  - `components/comment-form.vue`：form reactive → ref（8 处 .value）
- **验收对照**: ✅ 3 文件迁移完成；✅ 所有 template v-model 零改动；✅ `pnpm typecheck` + `pnpm lint` + 9 tests 通过。

### 3. 结构复用治理 — 下一轮热点切片（P1）

- **执行范围**: 基于 duplicate-code 0.35% 基线做增量切片收敛。
- **收敛切片**:
  - Slice 1：`server/utils/category-delete.ts` 新建 `safeDeleteCategory()`，内部/external categories/[id].delete 双端点共用，消除 26 行重复
  - Slice 2：`server/utils/external-links-shared.ts` 新建 `handleExternalLinkError()`，POST + PUT external-links 双端点共用，消除 21 行重复
- **验收对照**: ✅ 2 组切片完成；✅ duplicate-code 基线 0.35%（47 clones，不反弹）；✅ `pnpm typecheck` + `pnpm lint` + 7 tests 通过。

### 4. 测试覆盖率 90%+ 第六批（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告选取高价值模块。
- **测试新增**:
  - `utils/shared/privacy.test.ts`：新增 7 个边缘 case（custom maskString/undefined/maskEmail/@/maskPhone 短值/maskIP IPv4 短段）
  - `server/utils/logger.test.ts`：维持已有 508 行全面覆盖
- **验收对照**: ✅ 75 tests 全部通过；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 5. ko-KR/ja-JP 文档治理（P2）

- **执行范围**:
  - Phase A：产出翻译文档 freshness 审计报告 `docs/design/governance/i18n-docs-freshness-audit-ko-ja.md`
  - Phase B：ko-KR 13 个文档 last_sync 从 2026-03 刷新至 2026-07-27；ja-JP 由 seo-ready 提升为已支持语种
  - Phase C：创建 ja-JP guide/features.md（7 节）和 guide/variables.md（3 节 + 映射表）翻译；documentation.md 矩阵同步 ja-JP 范围升级至与 ko-KR 一致
- **验收对照**: ✅ 审计报告输出；✅ 13 个文档问题修复；✅ ja-JP 升格 + 2 新翻译文件；✅ `docs:check:source-of-truth` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

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

## 第四十二至第四十五阶段（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-42-45.md](./archive/todo-archive-phases-42-45.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **45** | 2026-06-08~10 | Umami 隐私自托管分析集成 Phase 1；Digital Garden 评估 No-Go；文档治理收口；ESLint / 类型债窄切片；结构复用治理收敛 |
| **44** | 2026-06-07 | 友链 RSS 聚合（Blogroll Feed）；Umami 评估条件性 Go；ESLint / 类型债 3 组窄切片；结构复用 2 组热点切片；CWV 性能优化；Phase 44 测试回填 |
| **43** | 2026-06-05 | AI 内容多格式复用（Twitter/LinkedIn）；ESLint / 类型债 3 组窄切片；结构复用治理；Windows Dev/Build 性能治理；i18n duplicates 收敛 |
| **42** | 2026-06-04 | CWV 基线建立；AI 内容审计评分徽章；内容日历与编辑排期；ESLint / 类型债 3 组窄切片；结构复用 3 组热点切片 |

---

## 第三十八至第四十一阶段概览（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **38** | 2026-05-27~28 | 分发一致性修补（B/Memos 标签标准化+尾注拼装）；测试有效性第二轮切片；Postgres 热点读链路瘦身；结构复用 3 组热点；ESLint AI provider 窄切片 |
| **39** | 2026-05-29~30 | 公众号排版预览（Markdown→WeChat 实时预览面板）；结构复用第三轮；注释治理首轮；文档/脚本治理最小收口包；国际化文案复用治理 |
| **40** | 2026-05-30~06-01 | 发布前 pre-check 统一化（`release:check`/`release:check:full`）；TypeORM 升级评估 No-Go 结论；守护策略分级；文档证据自动回填；守护策略分级与依赖风险口径对齐 |
| **41** | 2026-06-01~03 | TypeORM 前置清障（select: string[]→对象语法全量迁移）；Postgres 归档查询字段裁剪；文档门禁 warning 压缩；结构复用 2 组热点；ESLint 四组窄切片（26 文件 warning=0） |
