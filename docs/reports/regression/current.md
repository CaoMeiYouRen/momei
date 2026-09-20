# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

<!-- regression-window:start:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:periodic-regression:weekly:2026-06-10 -->

<!-- regression-window:start:workflow-precheck:release:2026-07-25 -->

<!-- regression-window:start:periodic-regression:weekly:2026-07-27 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-07-27 -->

<!-- regression-window:start:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->
## 2026-09-21 PostgreSQL 值类型解析退化导致「所有文章显示置顶」修复

### 范围

- 现象：后台文章管理列表所有行「置顶」列显示「是」；友链页 `isPinned` / `isFeatured`、站内通知 `isRead` 等布尔徽章存在同类误判风险。
- 根因：Nitro 2.13 的 Rollup `treeshake.moduleSideEffects` 白名单默认不含 `pg-types`，其顶层 `textParsers.init(...)` / `binaryParsers.init(...)` 被摇树；`getTypeParser` 永久回退 `noParse`，PostgreSQL 的 `bool` / `int4` / `json` 等全部以原始文本返回（`isPinned: 'f'`、`views: '0'`、`metadata` 为 JSON 字符串）。前端 `data.isPinned ? 是 : 否` 把非空字符串 `'f'` 判为真值。
- 取证：线上 `GET /api/posts` 返回 `"isPinned":"f"`；`isPinned=true` 过滤 `total: 0`（库内为真实 false，排除数据迁移）；修复前构建产物中 `textParsers` / `binaryParsers` 出现 0 次。
- 修复：
    - 新增 `modules/nitro-pg-types-side-effects.ts`：`nitro:init` 阶段把 `pg-types` 追加进 `nitro.options.moduleSideEffects`，并以 `nitro:build:before` 护栏断言注入生效。
    - 新增 `server/database/pg-value-types.ts`，并在 `initializeDB` 接入启动自检：PostgreSQL 下跑 `SELECT true, 1::integer, '{"ok":true}'::json` 探针，类型退化时记录 `[db-type-guard]` error（不抛出）。
    - `server/decorators/custom-column.ts`：`type: 'boolean'` 列统一注入归一化 transformer（`'t'/'1'/1` → true，`'f'/'0'/0` → false）。
    - `AdminNotificationSettings` / `InAppNotification` 的布尔列改用 `CustomColumn`，消除绕过点。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4471 用例通过，1 skipped）。
- `pnpm build`：PASS；产物 `chunks/nitro/nitro.mjs` 已包含 `textParsers.init` / `binaryParsers.init`。
- 真实 PostgreSQL 16 端到端（Docker + 重建产物）：修复前 `/api/posts` 返回 `isPinned: 'f'` / `views: '0'`；修复后返回 `isPinned=True/False (bool)`、`views=7/0 (int)`、`metadata` 为对象、`audioUrl` 由 `metadata.audio` 正确回填；`isPinned=true` 过滤 `total: 0`；启动日志出现 `pg-value-type-check` 且无 `db-type-guard` 报错。
- 定向测试：`server/decorators/custom-column.test.ts` + `tests/modules/nitro-pg-types-side-effects.test.ts` + `server/database/pg-value-types.test.ts` 共 26 用例 PASS。
- Review Gate：初审 Pass（0 blocker / 3 warning / 7 suggest）→ 修复 W1/W2/W3 与 S1/S3 后复审 Pass（0 blocker / 0 warning）。审计记录见 `artifacts/review-gate/2026-09-21-pinned-boolean-pg-types.md`。

### 未覆盖边界

- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（依据 nitropack 源码与 node-server 产物判定因果充分）。
- 启动自检为 log-only（不 fail-fast），依赖日志可观测性；后续可选在 CI 增加产物断言（grep `textParsers.init`）。
- 未在真实 MySQL / SQLite 实例复核水合（仅单测覆盖归一化语义）。
- 本批无 UI 模板 / 样式 / 交互变更，UI 浏览器验证按「数据契约修复」口径豁免；用户可见行为已由真实 PostgreSQL API 契约验证。
- S7（补「非布尔列不注入 transformer」负向断言）仍敞口，非阻塞。

<!-- regression-window:end:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->

<!-- regression-window:start:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->
## 2026-09-20 第六十七阶段 M1 接入基座验证（PrimeVue → caomei-ui）

### 范围

- 接入 npm `caomei-ui@0.1.0`（迁移期精确锁定）；`caomei-ui/nuxt` 与 `@primevue/nuxt-module` 并存。（`@lucide/vue` 延后到真正直连图标的批次再声明为直接依赖。）
- 新增同名自动导入隔离模块 `modules/caomei-ui-coexistence.ts`（`useToast` / `useConfirm` / `useTheme`）。
- 新增并存期白名单载体 `lib/ui-library.ts`（路由 → 组件来源单一事实源）。
- 新增迁移基线重取脚本 `scripts/governance/count-primevue-usage.mjs` 与 npm 入口 `governance:count:primevue-usage`（含组件名清单再生成入口）。
- 包体预算并存期配额调整（`keyCssGzipBytes` 70KB → 85KB）与基线刷新。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（524 文件 / 4448 用例通过，1 skipped）。
- `pnpm build`：PASS；产物同时包含 `--caomei-color-primary` / `.caomei-button` 与 `--p-*`，双库同产物共存已实证。
- `pnpm test:perf:budget`：PASS（`keyCss` 73.35KB / 85KB 并存期配额；口径与决策见迁移方案 §8.4.1）。
- 定向测试：`lib/ui-library.test.ts` 8 用例 + `tests/modules/caomei-ui-coexistence.test.ts` 6 用例，共 14 用例 PASS。
- 自动导入隔离实证：`nuxt prepare` 无 `Duplicated imports` 警告；`.nuxt/imports.d.ts` 中 `useToast` 归 `primevue/usetoast`、`useConfirm` 归 `primevue/useconfirm`、`useTheme` 归 `composables/use-theme.ts`，caomei-ui 仅保留 `useLocale` / `provideLocale`。
- 迁移基线重取：组件 59 类 / 1515 处 / 148 文件；图标 629 处 / 145 文件；token 1403 处（`var()` 1323）/ 114 唯一 / 134 文件；`<Column>` 153；`.toggle()` 7。

### 未覆盖边界

- **E2E 关键集未稳定通过**：`pnpm test:e2e:critical` 首次运行 `auth-session-governance` 超时失败。已取证判定为 **flaky 而非回归**——firefox 单独运行全通过、chromium `--repeat-each=3` 为 2 通过 / 1 失败、两次运行失败的不是同一条测试、失败形态均为 timeout。**M2 采集 E2E 基线时必须显式登记已知 flaky 集**，并对比 M1 前后的 flaky 率是否有实质上升。
- **`CaomeiConfigProvider` 与组件内建文案 locale 注入延后**：本批只接入模块与自动导入的 `useLocale` / `provideLocale`，Provider 包裹与 `plugins/primevue-i18n.ts` 替换推迟到真正启用 caomei-ui 组件的批次，避免在 PrimeVue 仍在使用时提前切换文案来源。
- **CSS `@layer` 顺序决策已落盘**：保持既有层序 `primevue, momei-base, momei-overrides` 不变，caomei-ui 以未分层形态加载（依据：其实测无 `@layer`、无全局元素规则）。由此产生的定制约束见迁移方案「样式层叠与 @layer 决策」章节。
- 视觉验证回归（单元 / E2E / 截图三层）尚未建立，属 M2 范围；本批无 UI 可见变化。
- 白名单初始为空（尚无路由迁移），路由级隔离规则未被真实用例触发。

<!-- regression-window:end:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->

<!-- regression-window:start:periodic-regression:weekly:2026-09-11 -->
## 2026-09-11 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `../../../artifacts/review-gate/2026-09-11-weekly-regression.md` / `../../../artifacts/review-gate/2026-09-11-weekly-regression.json`
- 结果摘要: `Reject`；blocker=1，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=FAIL
- 回归窗口: 323 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=security:audit-deps failed。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:weekly:2026-09-11 -->

## 2026-07-27 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `artifacts/review-gate/2026-07-27-phase-close-regression.md` / `artifacts/review-gate/2026-07-27-phase-close-regression.json`
- 结果摘要: `Reject`；blocker=2，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=FAIL
- 回归窗口: 322 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=release:check:full failed -> test (Vitest)；regression-log window exceeded: 活动日志当前 13 条记录，超过 8 条窗口。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:phase-close:2026-07-27 -->

## 2026-07-27 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly -- --dry-run`
- 证据 artifact: `artifacts/review-gate/2026-07-27-weekly-regression.md` / `artifacts/review-gate/2026-07-27-weekly-regression.json`
- 结果摘要: `Prepared`；blocker=0，warning=1。
- 已执行验证: test:coverage=DRY RUN，security:audit-deps=DRY RUN，docs:check:source-of-truth=DRY RUN，docs:check:i18n=DRY RUN，docs:check:line-count=DRY RUN，i18n:audit:missing=DRY RUN，duplicate-code:check=DRY RUN，governance:check:scripts=DRY RUN，governance:audit:eslint-debt=DRY RUN，governance:audit:comment-drift=DRY RUN，governance:audit:simple-duplicates=DRY RUN
- 回归窗口: 294 行 / 11 条，归档判定=需要滚动归档。
- Review Gate: `Prepared` / `warning`；主要问题=regression-log window exceeded: 活动日志当前 11 条记录，超过 8 条窗口。
- 未覆盖边界: 本轮为 dry-run，仅验证编排与回填，不代表真实回归执行结果。

<!-- regression-window:end:periodic-regression:weekly:2026-07-27 -->

## 2026-07-25 workflow pre-check（release，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=release`
- 证据 artifact: `artifacts/review-gate/2026-07-25-ci-precheck-release.md` / `artifacts/review-gate/2026-07-25-ci-precheck-release.json`
- 结果摘要: `Reject`；blocker=1，warning=0。
- 已执行验证: release critical files=PASS，release environment=FAIL
- Review Gate: `Reject` / `blocker`；主要问题=release environment failed。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:release:2026-07-25 -->

## 2026-06-10 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `artifacts/review-gate/2026-06-10-weekly-regression.md` / `artifacts/review-gate/2026-06-10-weekly-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=PASS，docs:check:source-of-truth=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，i18n:audit:missing=PASS，duplicate-code:check=FAIL，governance:check:scripts=PASS
- 回归窗口: 189 行 / 7 条，归档判定=窗口健康。
- Review Gate: `Pass` / `warning`；主要问题=duplicate-code:check failed。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:weekly:2026-06-10 -->

## 2026-06-04 第四十二阶段收口回归

### 范围

- 目标：第四十二阶段「AI 深化与运营闭环」5 条主线全部交付后的阶段收口回归，覆盖 typecheck、lint、CWV 基线、代码审计与归档操作。
- 本轮覆盖：全仓 typecheck + ESLint (`--max-warnings 0`)，Code Auditor 审计及修复，plan 文档归档（roadmap 深度分片 + todo-archive 滚动归档）。
- 非目标：不包含浏览器端 E2E 回归测试，不包含 CWV 实际数值采集（由 CI `build-lighthouse` job 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 无静态错误 |
| `pnpm lint` | Pass | ESLint `--max-warnings 0` 通过 |
| Code Auditor | Pass | 4 个问题（1H+3M）已修复提交 |
| CWV 基线 | 待 CI | 基础设施就绪，实际数值由 CI 产出 |
| roadmap.md 深度归档 | 完成 | Phase 22-24 迁入 `roadmap-phases-22-24.md`，主文档 799→719 行 |
| todo-archive.md 滚动归档 | 完成 | Phase 32-37 迁入 `todo-archive-phases-32-37.md`，主文档保留 Phase 38-42 |
| todo.md 状态 | 清理 | Phase 42 5/5 主线 `[x]`，进度与验收均已填写 |

### 未覆盖边界

- CWV 中位数基线需等待 CI 运行 `pnpm build && pnpm test:perf:cwv` 产出后，回填到性能规范 `docs/standards/performance.md`。
- `pnpm lint:i18n` 未在本轮单独执行，新增 i18n 键依赖 typecheck + 运行时验证。

<!-- regression-window:end:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->
## 2026-06-04 第四十二阶段收口后文档同步

### 范围

- 目标：执行第四十二阶段归档后的文档收口，包括 todo.md 清理、搜索优先原则规范文档同步、英文翻译同步。
- 本轮覆盖：todo.md（Phase 42 完成项归档）、AGENTS.md（4.5 搜索优先摘要）、ai-collaboration.md（1.4 搜索优先详细规则）、development.md（搜索优先原则）、ai-development.md（搜索优先指引）、CLAUDE.md（搜索优先触发规则）、full-stack-master/code-auditor/qa-assistant agent 定义（搜索优先强化）。
- 非目标：不新增功能、不改变代码。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | — | 仅文档改动，不涉及代码 |
| `pnpm lint` | — | 仅文档改动 |
| `pnpm docs:check:source-of-truth` | Pass | 文档事实源层级正确 |
| `pnpm docs:check:i18n` | Pass | 翻译文档时效性通过 |
| en-US 翻译同步 | 完成 | ai-collaboration.md（1.3/1.4 搜索优先）、development.md（搜索优先原则） |
| todo.md 清理 | 完成 | Phase 42 完成项归档，当前执行面清空 |

### 未覆盖边界

- `en-US/standards/ai-collaboration.md` 仅同步搜索优先相关章节（1.3/1.4），完整 PDTFC+ 2.0 细节仍待后续同步。
- `zh-TW` / `ko-KR` 翻译保持 source-only，无需更新。

<!-- regression-window:end:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->

<!-- regression-window:start:phase43-close:第四十三阶段:2026-06-05 -->
## 2026-06-05 第四十三阶段收口回归

### 范围

- 目标：第四十三阶段「AI 分发复用与治理深化」5 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、Code Auditor 审计及修复、i18n nesting bug 修复、sourceMap 跨平台修正。
- 非目标：不包含 Windows 本地 perf 测量（确认为平台级瓶颈，已关闭）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0w（pre-existing 4 个除外） |
| `pnpm i18n:audit:missing` | Pass | total: 0 |
| `pnpm i18n:audit:duplicates` | Pass | 97 组（Phase 43 收敛后） |
| `pnpm governance:audit:simple-duplicates` | Pass | 同名函数 110, 同名类型 20 |
| Code Auditor | Pass | 2 blocker 已修复（i18n nesting + sourceMap） |
| roadmap.md 归档 | 完成 | Phase 43 审计结论已写入 |
| todo-archive.md 滚动归档 | 完成 | Phase 43 归档块已写入 |
| todo.md 状态 | 清理 | Phase 43 5/5 主线完成，执行面清空 |

### Phase 43 交付清单

| 主线 | 交付 | 提交 |
|---|---|---|
| AI 内容多格式复用 | social-post API + Service + Prompt + Dialog + 5 locale i18n | `e749f3de` |
| ESLint / 类型债 | vue emits/props + max-statements + max-lines + no-non-null-assertion 扩展 | `d3068ab5` |
| 结构复用治理 | commercial-link-manager 自重复 + PostNavigationItem/DirectUploadStrategy/toErrorMessage | `a9cf62ff` |
| Windows 性能治理 | warmup + extensions + inline 瘦身 + sourceMap + build:done；平台级瓶颈确认关闭 | `227eca85`, `c8e5ba39`, `9afe8553` |
| i18n duplicates 收敛 | voice/actions 键统一至 common，-5 组 -11 keys | `7bc309df` |

### 未覆盖边界

- AI 社交帖子 API 无速率限制（审计 warning #3）
- AI 服务 + API 无测试覆盖（审计 warning #4）
- Windows 本地 perf 采集受平台瓶颈阻塞，对比数据仅 CI Linux 对照（106s）

<!-- regression-window:end:phase43-close:第四十三阶段:2026-06-05 -->

<!-- regression-window:start:phase49-close:第四十九阶段:2026-06-13 -->
## 2026-06-13 第四十九阶段收口回归

### 范围

- 目标：第四十九阶段「延期清缴与流量治理」5 条优化主线交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、5 条主线全部交付。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors, 0 warnings |
| todo-archive.md 滚动归档 | 完成 | Phase 49 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 49 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| Postgres 流量治理 | includeAuthorEmail:false + 移除 JSON 字段 | `95dc1a0f`, `80dc313c` |
| formatDate 复用 | 6 处自定义 wrapper 消除 | `793e5af4` |
| 延期测试回填 | friend-links.test 3 用例 + admin checkbox | `7907b793` |
| 清理收口 | vendor.css 删除 + backlog.md | `455ced9c` |
| type 收敛 | AdAdapterConfig 统一 (12→11) | `10eb6fff` |
<!-- regression-window:end:phase49-close:第四十九阶段:2026-06-13 -->

<!-- regression-window:start:phase48-close:第四十八阶段:2026-06-13 -->
## 2026-06-13 第四十八阶段收口回归

### 范围

- 目标：第四十八阶段「深度治理与清理收口」5 条优化主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、治理文档 2 份、todo-archive 滚动归档。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors（删除 API 时捕获 3 处前端引用） |
| `pnpm lint` | Pass | 0 errors |
| todo-archive.md 滚动归档 | 完成 | Phase 48 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 48 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| ESLint / 类型债 | 9 处 as any 清零 | `a9499974`, `47233bab` |
| 结构复用 | 3 组类型收敛 (15→12) | `2f099780`, `baa65136` |
| API Schema | 2 端点 RouterParam Zod + 2 测试 | `cf1a2035`, `44e9e25c` |
| 未使用 API 删除 | 2 端点删除 + 前端引用验证 | `15658bd1`, `fd72487b` |
| 第二轮调研 | 4 端点评估 + 1 确认候选 | `f9013bcc` |

### 关键发现

- 删除 API 时 typecheck 捕获 3 处"假零引用"（前端实际调用）：posts/audit、theme-configs/delete、snippets/convert
<!-- regression-window:end:phase48-close:第四十八阶段:2026-06-13 -->

<!-- regression-window:start:phase47-close:第四十七阶段:2026-06-11 -->
## 2026-06-11 第四十七阶段收口回归

### 范围

- 目标：第四十七阶段「接口契约与路由治理深化」6 条优化主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、治理文档 4 份、todo-archive 滚动归档。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors |
| todo-archive.md 滚动归档 | 完成 | Phase 47 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 47 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| ESLint / 类型债 | 6 处 as any 收敛 | `b704618f` |
| 结构复用治理 | 3 组类型收敛 (FeedItem/TitleSuggestionOverlayRef) | `7ef401b0`, `516daa45` |
| API 路径规范化 | route-api-path-governance.md + 2 处 P0 修复 | `102b107b`, `db2a54e0` |
| 路由风格统一 | 规范冻结 + calendar/marketing → index.vue | `4f6686a6`, `9e3ddad1` |
| 未使用 API 评估 | unused-api-cleanup-assessment.md | `e3864b1a`, `5d690e5e` |
| API Schema 治理 | taxonomy.ts + 3 组复用样板 | `09924a42`, `8259fa75` |

### 未覆盖边界

- Phase 44-46 的回归窗口不在本轮扫描范围（已有独立窗口）。
<!-- regression-window:end:phase47-close:第四十七阶段:2026-06-11 -->

<!-- regression-window:start:phase44-close:第四十四阶段:2026-06-07 -->
## 2026-06-07 第四十四阶段收口回归

### 范围

- 目标：第四十四阶段「友链生态与性能闭环」6 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、i18n 键完整性、Phase 44 全部主线、docs 归档。
- 非目标：不包含 CWV 实际数值采集（需 CI `build-lighthouse` 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors, 10 pre-existing warnings |
| i18n key 覆盖 | Pass | feed_title / feed_empty / show_rss_feed 在 5 locale 中完整 |
| todo-archive.md 滚动归档 | 完成 | Phase 44 归档块已写入 |
| todo.md 状态 | 清理 | Phase 44 6/6 主线完成，执行面已清空 |

### Phase 44 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| 友链 RSS 聚合 | showRssFeed 管理配置 + RSS/Atom 抓取/解析/缓存 + 公开页最近更新 | `3fa5b924`, `d580d6c0`, `b06314b6` |
| 隐私自托管分析评估 | Umami 评估文档，条件性 Go 结论 | `2d41ae1d` |
| ESLint / 类型债 | 3 组窄切片: no-non-null-assertion + no-explicit-any | `28e171f8` |
| 结构复用治理 | SettingFieldMetadata + AgreementFormData 收敛 | `249eb90a` |
| CWV 性能优化 | Logo 预加载 + CSS @import 扁平化 | `8669d0c0` |
| Phase 44 测试回填 | Phase A (19 用例) + Phase B (7 用例) | `2d41ae1d`, `8d35652f` |

### 未覆盖边界

- CWV 基线数值待 CI 运行 `pnpm build && pnpm test:perf:cwv` 后回填。
- 友链管理页 Checkbox 渲染测试及公开页 feed 渲染/降级测试已回灌 backlog。
<!-- regression-window:end:phase44-close:第四十四阶段:2026-06-07 -->

<!-- regression-window:start:phase46-weekly-kickoff:第四十六阶段:2026-06-10 -->
## 2026-06-10 第四十六阶段周级回归执行结果（已收口）

### 范围

- 目标：完成第四十六阶段 P0 主线「周期性回归任务 + 项目现状调研」的固定入口执行，并沉淀可复查证据。
- 本轮覆盖：执行 `pnpm regression:weekly`，完成 `test:coverage` 全量运行并落盘 Review Gate artifact。
- 非目标：本条记录不直接修复 blocker，仅输出本轮回归结论与后续治理入口。

### 执行快照

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 固定入口 `pnpm regression:weekly` | 已完成 | 本轮执行完成，退出码 `1` |
| `test:coverage` | 失败 | `485` 个测试文件中 `2` 个失败文件，`3` 条失败用例 |
| 周级回归 artifact | 已生成 | `artifacts/review-gate/2026-06-10-weekly-regression.{md,json}` |
| 回归窗口记录 | 已更新 | 自动回填条目已写入当前窗口（`Reject` / blocker=1） |

### 项目现状调研（阶段候选）

- 候选 1：后台与设置页测试链路存在高频 i18n 缺词告警（如 `pages.admin.*`、`pages.admin.settings.theme.*`），应优先治理“测试环境 locale 装配与键完整性”基线。
- 候选 2：全量 coverage 成本高且输出噪音大，建议补“周级回归稳定执行策略”（隔离日志、分段回归或覆盖率分片），降低周期性任务被中断风险。
- 候选 3：部分组件测试暴露第三方 mock 契约噪音（如 `primevue/usetoast` 导出提示），建议纳入“测试 mock 契约一致性”专项窄切片。

### 后续治理计划

- 优先修复 `tests/scripts/run-e2e.test.ts` 中 `walks directories recursively while skipping ignored entries` 的不稳定断言。
- 对齐 `server/api/ai/tts/estimate.post.test.ts` 与最新 Zod 校验契约，修复 `voice/text` 缺失时断言口径漂移。
- 修复后再次执行 `pnpm regression:weekly`，将本轮 `Reject` 收敛为可放行结论。

<!-- regression-window:end:phase46-weekly-kickoff:第四十六阶段:2026-06-10 -->