# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-05-05 第三十四阶段 `周期性回归执行 (P1)` 关闭

### 范围

- 目标：执行真实的 `pnpm regression:phase-close` 阶段关闭回归，并把阻塞本轮放行的依赖安全、导航 E2E、性能预算与回归窗口治理全部收口。
- 本轮覆盖：[package.json](../../package.json)、[pnpm-lock.yaml](../../pnpm-lock.yaml)、[tests/e2e/navigation.e2e.test.ts](../../tests/e2e/navigation.e2e.test.ts)、[scripts/perf/check-bundle-budget.mjs](../../scripts/perf/check-bundle-budget.mjs)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md)、[docs/reports/regression/archive/index.md](../../docs/reports/regression/archive/index.md)、[docs/reports/regression/archive/2026-05-01-to-2026-05-02.md](../../docs/reports/regression/archive/2026-05-01-to-2026-05-02.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不新建另一套回归规范，不借机扩写与本轮放行无关的治理主线。

### 实施结论

- 依赖安全阻塞已解除：根仓 `axios` override 已提升到 `^1.15.2` 并刷新锁文件，`security:audit-deps` 与随后的发布前校验恢复通过。
- 导航 E2E 阻塞已解除：[tests/e2e/navigation.e2e.test.ts](../../tests/e2e/navigation.e2e.test.ts) 改为基于真实 header href + `openPath()` 的稳态导航模型，`pnpm test:e2e` 恢复为 `230 passed / 48 skipped`，`release:check:full` 恢复为 `12 / 12` 通过。
- 性能预算误判已解除：[scripts/perf/check-bundle-budget.mjs](../../scripts/perf/check-bundle-budget.mjs) 现已识别模板字符串动态 `import()`，并从 Nuxt `client.precomputed.mjs` 回填 route owner；admin-only 的 `mavon-editor` chunk 不再被计入公开 async chunk 预算，`test:perf:budget:strict` 恢复通过。
- 回归窗口阻塞已解除：2026-05-01 至 2026-05-02 的旧记录已整体滚动归档到 [docs/reports/regression/archive/2026-05-01-to-2026-05-02.md](../../docs/reports/regression/archive/2026-05-01-to-2026-05-02.md)，活动窗口压回 `214` 行、`5` 条近线记录。
- 最终 `pnpm regression:phase-close` 已完整通过；`artifacts/review-gate/2026-05-05-phase-close-regression.md` 与对应 JSON 已生成，第三十四阶段这条周期性回归 P1 可正式关闭。

### 已执行验证

- `pnpm test:perf:budget:strict`
	- 结果：通过；`maxAsyncChunkJs` 回落到 `46.46KB / 120KB`，不再命中预算上限。
- `pnpm exec lint-md docs/reports/regression/current.md docs/reports/regression/archive/index.md docs/reports/regression/archive/2026-05-01-to-2026-05-02.md`
	- 结果：通过；回归窗口与新归档分片结构合法。
- `pnpm regression:phase-close`
	- 结果：通过；`release:check:full`、`docs:check:i18n`、`test:perf:budget:strict`、`duplicate-code:check:strict` 与 `review-gate:generate:check` 全部通过，Review Gate 结论为 `Pass`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮放行建立在真实 phase-close 回归、性能预算复核、回归窗口治理与证据文件生成全部通过之上。

### 未覆盖边界

- `prIncrementJs` 仍因 `.github/perf/bundle-baseline.json` 缺少 baseline 而处于 MVP 跳过状态；当前不阻塞本轮关闭，但若后续要把性能预算从单次守线提升为增量比较，需要先补齐 baseline。
- Playwright 套件中仍有 `48` 条已设计跳过用例；本轮目标是恢复真实回归放行，不等于这些跳过场景已经被重新纳入要求执行矩阵。

## 2026-05-05 第三十四阶段 `i18n 运行时继续扩面 (P1)` 关闭

### 范围

- 目标：完成第三十四阶段 `i18n 运行时继续扩面 (P1)` 的最后一条公开页装配链路收口，并把该待办正式关闭。
- 本轮覆盖：[vitest.shared.ts](../../vitest.shared.ts)、[pages/archives/index.test.ts](../../pages/archives/index.test.ts)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不重写 [pages/archives/index.vue](../../pages/archives/index.vue) 的页面实现，不继续扩写新的公开页矩阵，也不重新处理已在前序切片中完成的 `app-footer`、`auth-card` 或 `taxonomy-post-page` 运行时命名空间问题。

### 实施结论

- 当前仓库里 [pages/archives/index.test.ts](../../pages/archives/index.test.ts) 已经具备真实翻译命中断言，会校验归档月份、文章计数文案与 raw key 泄漏；缺口只在于它尚未被纳入 `i18n:verify:runtime` 的固定运行时回归入口。
- 本轮将 [pages/archives/index.test.ts](../../pages/archives/index.test.ts) 加入 [vitest.shared.ts](../../vitest.shared.ts) 的 `i18nRuntimeTestFiles`，把 `archives` 公开页装配链路正式并入固定回归矩阵。
- 结合 2026-05-04 已完成的 `forgot-password` / `reset-password` / taxonomy RSS 与更早完成的 `app-footer`、About、Friend Links、Categories、Tags 等守线，当前待办验收条件已经满足，可正式关闭。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run --config vitest.i18n.config.ts pages/archives/index.test.ts`
	- 结果：通过；`8` 个测试全部通过，新增公开页链路已能在固定 i18n runtime 配置下稳定运行。
- 缺词 parity：`pnpm i18n:audit:missing`
	- 结果：通过；`total: 0`，所有已扫描 locale / module 仍无缺词 blocker。
- 固定运行时入口：`pnpm i18n:verify:runtime`
	- 结果：通过；`15` 个测试文件、`103` 个测试全部通过，`archives` 已被纳入固定回归入口。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮改动只扩大固定运行时测试矩阵，没有引入新的共享命名空间或页面实现风险。

### 未覆盖边界

- 本轮没有继续新增 `archives` 之外的公开页装配链路；后续若再扩面，应以新的高风险公开页或新增共享组件为单位单独切片，而不是在当前已关闭的待办上继续膨胀范围。
- `i18n:verify:runtime` 的通过结果已足够支撑本条待办关闭，但不等于未来所有新增公开页都会自动获得守线；后续新增入口仍需按相同口径显式纳入。
- 当前完整 `i18n:verify:runtime` 套件在 `friend-links` 与 `reset-password` 相关用例上仍会打印既有的 Nuxt i18n 初始化 stderr；现阶段不影响测试通过与本条待办关闭，但后续应单列治理以降低回归噪音。

## 2026-05-04 第三十四阶段 `ESLint 下一轮切片 (P1)` 关闭

### 范围

- 目标：在已确认 `composables` 子桶没有新的高 ROI `no-non-null-assertion` 生产命中后，沿 todo 的回退口径把剩余高 ROI `@typescript-eslint/no-explicit-any` 生产 composable 单文件 / 双文件切片全部收口，并关闭第三十四阶段 `ESLint 下一轮切片 (P1)`。
- 本轮覆盖：[composables/use-upload.ts](../../composables/use-upload.ts)、[composables/use-asr-task.ts](../../composables/use-asr-task.ts)、[composables/use-admin-ai.ts](../../composables/use-admin-ai.ts)、[composables/use-admin-i18n.ts](../../composables/use-admin-i18n.ts)、[composables/use-post-editor-auto-save.ts](../../composables/use-post-editor-auto-save.ts)、[composables/use-onboarding.ts](../../composables/use-onboarding.ts)、[composables/use-post-editor-page.helpers.ts](../../composables/use-post-editor-page.helpers.ts)、[composables/use-tts-volcengine-direct.ts](../../composables/use-tts-volcengine-direct.ts)、[composables/use-post-editor-ai.ts](../../composables/use-post-editor-ai.ts)、[composables/use-post-editor-io.ts](../../composables/use-post-editor-io.ts)、[eslint.config.js](../../eslint.config.js)、[docs/design/governance/eslint-type-debt-tightening.md](../../docs/design/governance/eslint-type-debt-tightening.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把规则外溢到测试文件，不并行开启 `no-unsafe-*`、`prefer-nullish-coalescing` 或更宽的 editor / composables 目录级提级。

### 实施结论

- 本轮把回退主线剩余的高 ROI 生产 composable 显式 `any` 全部收敛为本地接口、窄 payload 类型、`unknown` 错误解析 helper 或更精确的函数签名，没有新增新的共享抽象层，也没有扩写为目录级规则提级。
- 具体收口点包括：上传 / TTS / ASR 链路的错误对象读取，后台 AI / i18n / onboarding 的局部接口约束，编辑器自动保存草稿类型，`use-post-editor-ai.ts` 的标题建议 / 翻译响应类型，以及 `use-post-editor-io.ts` 的 frontmatter `unknown` 解析与分类匹配守卫。
- [eslint.config.js](../../eslint.config.js) 已把这批 production composable 全部纳入既有 `noExplicitAnyFiles` 聚合 override。复核后，`composables/*.ts` 范围内残余 `any` 已只存在于测试文件，不再存在新的生产源码阻塞点，因此第三十四阶段这条 ESLint P1 待办可正式关闭。

### 已执行验证

- 定向 ESLint：
	`pnpm exec eslint composables/use-upload.ts composables/use-asr-task.ts composables/use-admin-ai.ts composables/use-admin-i18n.ts composables/use-post-editor-auto-save.ts composables/use-onboarding.ts composables/use-post-editor-page.helpers.ts composables/use-tts-volcengine-direct.ts eslint.config.js --max-warnings 0`
	`pnpm exec eslint composables/use-post-editor-ai.ts composables/use-post-editor-io.ts eslint.config.js --max-warnings 0`
	- 结果：通过；新纳入切片的 production composable 与配置文件均无新增 warning / error。
- 同级 Vitest：
	`pnpm exec vitest run composables/use-upload.test.ts composables/use-asr-task.test.ts composables/use-admin-ai.test.ts composables/use-admin-i18n.test.ts composables/use-post-editor-auto-save.test.ts composables/use-onboarding.test.ts composables/use-post-editor-page.helpers.test.ts composables/use-post-editor-io.test.ts`
	- 结果：通过；`8` 个测试文件、`87` 个测试全部通过。
	`pnpm exec vitest run composables/use-post-editor-ai.test.ts composables/use-tts-volcengine-direct.test.ts`
	- 结果：通过；新增 focused test `2` 个文件、`4` 个测试全部通过。
- Nuxt typecheck：`pnpm exec nuxt typecheck`
	- 结果：通过；本轮局部类型收窄与 `header.titleOp ?? null` 修正后未出现新的类型错误。
- 根仓 lint：`npm run lint`
	- 结果：通过；根仓 `eslint . --fix --max-warnings 10` 与 `packages/*` lint 均通过。
- Markdown 校验：`pnpm exec lint-md docs/design/governance/eslint-type-debt-tightening.md docs/reports/regression/current.md docs/plan/todo.md`
	- 结果：通过；治理设计、回归窗口与 todo 文档均通过 markdown lint。
- 受影响文件诊断：`get_errors`
	- 结果：通过；本轮 touched composable 与 [eslint.config.js](../../eslint.config.js) 无新增诊断。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker。当前关闭依据不是“整仓所有 ESLint 技术债清零”，而是第三十四阶段 todo 中这条主线要求的 `composables` 子桶复核 + 回退单文件 `no-explicit-any` 切片已经全部完成，且验证链路完整。

### 未覆盖边界

- 当前剩余 `any` 命中主要在测试文件与刻意保留的 mock / 非法输入断言，不属于本条 production composable 治理范围。
- 更宽的 editor 规则提级、`no-unsafe-*`、`prefer-nullish-coalescing` 与其它目录级规则治理仍是后续独立候选，不应混入本次已关闭的第三十四阶段 ESLint 切片待办。

## 2026-05-04 `use-tts-task.ts` `no-explicit-any` 回退切片

### 范围

- 目标：推进第三十四阶段 `ESLint 下一轮切片 (P1)` 时，先复核 `composables` 子桶当前没有新的 `no-non-null-assertion` 生产命中可继续上收，再按 todo 里的回退口径完成 `composables/use-tts-task.ts` 单文件 `@typescript-eslint/no-explicit-any` 切片。
- 本轮覆盖：[composables/use-tts-task.ts](../../composables/use-tts-task.ts)、[composables/use-tts-task.test.ts](../../composables/use-tts-task.test.ts)、[eslint.config.js](../../eslint.config.js)、[docs/design/governance/eslint-type-debt-tightening.md](../../docs/design/governance/eslint-type-debt-tightening.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把规则扩到整个 `composables/**`，不并行开启新的 `no-non-null-assertion` 或 `no-unsafe-*` 切片，也不把其它 TTS / upload composable 打包成多文件联动治理。

### 实施结论

- 结合既有 [2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md) 中 `composables` 子桶收口记录与当前生产源码命中分布，`no-non-null-assertion` 没有新的单文件高 ROI 候选，因此本轮按既定回退方案改做 `no-explicit-any` 单文件切片。
- [composables/use-tts-task.ts](../../composables/use-tts-task.ts) 当前生产源码中的显式 `any` 共有 `2` 处，分别位于任务状态轮询的 `$fetch<any>` 与错误回退 `catch (e: any)`，且已有同级测试，符合“单文件、可回滚、验证便宜”的准入条件。
- 本轮将任务轮询响应收窄为本地 `TTSTaskStatusPayload` / `TTSTaskResultPayload`，并复用 [types/ai.ts](../../types/ai.ts) 中的 `AITaskStatus` 作为状态事实源；音频 URL 解析与错误消息提取改为局部 helper，不再依赖显式 `any`。
- [eslint.config.js](../../eslint.config.js) 已把 `composables/use-tts-task.ts` 并入既有的 `noExplicitAnyFiles` 聚合列表，继续维持“单文件 + 单条 override”的回滚边界。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run composables/use-tts-task.test.ts`
	- 结果：通过；`5` 个测试全部通过，TTS 任务轮询、完成态音频 URL 解析与失败态错误回退行为保持稳定。
- 定向 ESLint：`pnpm exec eslint composables/use-tts-task.ts eslint.config.js --max-warnings 0`
	- 结果：通过；受影响文件无新增 warning / error。
- 受影响文件诊断：`get_errors(use-tts-task.ts, eslint.config.js)`
	- 结果：通过；两文件均无新增诊断。
- 根仓类型检查：`nuxt typecheck targeted`
	- 结果：失败，但命中均为本轮范围外的既有测试文件；[composables/use-tts-task.ts](../../composables/use-tts-task.ts) 与 [eslint.config.js](../../eslint.config.js) 自身无新增错误。
- 文档构建：`pnpm docs:build`
	- 结果：通过；文档站可完成 build，仅保留既有的 VitePress / Rolldown warning，不影响本轮治理记录落盘。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮切片本身无 blocker，单测、定向 ESLint 与文件级诊断均通过；当前只保留根仓 `nuxt typecheck` 的既有测试文件错误作为仓内背景噪音，不影响本轮单文件治理放行。

### 未覆盖边界

- 本轮没有把 `@typescript-eslint/no-explicit-any` 外溢到其它 TTS / upload composable；[composables/use-upload.ts](../../composables/use-upload.ts)、[composables/use-tts-volcengine-direct.ts](../../composables/use-tts-volcengine-direct.ts) 与其它轮询链路仍保留为后续单文件 / 双文件候选。
- `no-non-null-assertion` 在 `composables` 子桶没有新的单文件候选不等于整条主线已经结束；后续若再推进，仍应优先保持“单一 composable / 单一链路”的切片策略。

## 2026-05-04 第三十四阶段 coverage 80%+ 冲刺收口线达成

### 范围

- 目标：在第三十四阶段 `测试覆盖率冲刺 80%+ (P0)` 中，先把阶段收口线稳定推过 `>= 78%`，不再停留于局部定向 coverage，而是以全量 `pnpm test:coverage` 的 lines 结果作为唯一放行口径。
- 起点基线：沿用本窗口首轮记录的全仓基线，lines `75.28%`；本轮推进过程中曾依次复跑到 `76.52%`、`76.91%`、`77.22%`、`77.48%`，最后继续补两块低风险高 ROI 后再做最终全量复跑。
- 本轮覆盖：公开读链路失败路径、通知/商业/安全等用户 settings 面板、后台简单 settings 表单、后台友链管理 composable 与短链服务等高 ROI 切片。
- 非目标：本轮只要求达成 `>= 78%` 阶段收口线，不把条目直接扩写成“已达成 80%+”；仓内仍保留若干 0% 或低覆盖的大体量后台编辑器文件，暂不在本轮硬啃。

### 实施结论

- 公开读链路与轻量公共组件侧，已补齐 [components/ad-placement.test.ts](../../components/ad-placement.test.ts)、[components/rss-icon.test.ts](../../components/rss-icon.test.ts) 与 [pages/benefits.behavior.test.ts](../../pages/benefits.behavior.test.ts)，把广告位装配、SVG 图标与 benefits 页提交失败路径纳入守线。
- 用户侧 settings / notifications / commercial / security 切片，已新增并稳定通过 [components/settings/settings-security.test.ts](../../components/settings/settings-security.test.ts)、[components/settings/settings-api-keys.test.ts](../../components/settings/settings-api-keys.test.ts)、[components/settings/settings-notifications.test.ts](../../components/settings/settings-notifications.test.ts)、[components/settings/settings-commercial.test.ts](../../components/settings/settings-commercial.test.ts) 与 [components/settings/notification-history-list.test.ts](../../components/settings/notification-history-list.test.ts)。
- 后台简单 settings 表单继续作为低风险高 ROI 补量面，已新增并通过 [components/admin/settings/auth-settings.test.ts](../../components/admin/settings/auth-settings.test.ts)、[components/admin/settings/security-settings.test.ts](../../components/admin/settings/security-settings.test.ts)、[components/admin/settings/limits-settings.test.ts](../../components/admin/settings/limits-settings.test.ts)、[components/admin/settings/storage-settings.test.ts](../../components/admin/settings/storage-settings.test.ts)、[components/admin/settings/email-settings.test.ts](../../components/admin/settings/email-settings.test.ts) 与 [components/admin/settings/analytics-settings.test.ts](../../components/admin/settings/analytics-settings.test.ts)。
- 较大 ROI 切片方面，已补齐 [composables/use-admin-friend-links-page.test.ts](../../composables/use-admin-friend-links-page.test.ts) 与 [server/services/link.test.ts](../../server/services/link.test.ts)，分别回收后台友链管理状态流与短链服务 DB 路径的大块缺口。
- 最终全量 coverage 已稳定过线：All files statements `78.01%` / branches `65.32%` / functions `74.17%` / lines `78.06%`。这说明第三十四阶段 coverage 冲刺的阶段收口线已经达成，后续若继续推进，目标应从“保 78”切换为“继续冲 80+”。
- 方法论沉淀已完成：本轮已将“先估算缺口、逐文件定向验证、累计后再跑全量 checkpoint、过程持续写回回归窗口”的 coverage 冲刺口径回写到 [docs/standards/testing.md](../../standards/testing.md)，后续同类治理不再只依赖口头约定。

### 已执行验证

- `pnpm exec vitest run components/admin/settings/email-settings.test.ts components/admin/settings/analytics-settings.test.ts`
	- 结果：通过；`2` 个文件、`2` 个测试全部通过。
- `pnpm exec eslint components/admin/settings/email-settings.test.ts components/admin/settings/analytics-settings.test.ts`
	- 结果：通过；无输出。
- `pnpm test:coverage`
	- 结果：通过；`451` 个测试文件通过、`1` 个跳过；`3482` 个测试通过、`1` 个跳过；All files 为 statements `78.01%` / branches `65.32%` / functions `74.17%` / lines `78.06%`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已经达成 `>= 78%` 阶段收口线，但 Todo 条目标题仍是 `80%+` 冲刺，因此当前只能视为阶段目标达成，不等于整个 coverage 治理条目已经完成；若后续继续冲 `80%+`，应优先转向高体量低覆盖后台编辑器或 composable，而不是继续在个位数增益的小文件上摊薄时间。

### 未覆盖边界

- 当前全仓 coverage 已过 `78%`，但距离 `80%+` 仍有明显空间；[components/admin/settings/site-settings.vue](../../components/admin/settings/site-settings.vue)、[components/admin/settings/cache-settings.vue](../../components/admin/settings/cache-settings.vue)、后台 posts editor 相关大文件仍是下一批高 ROI 候选。
- 根仓 `nuxt typecheck` 仍存在本轮范围外的既有问题，因此本条回归记录只把“本轮新增测试文件局部 lint 通过 + 全量 coverage 过线”作为放行证据，不把整仓 merge-ready 与本条混为一谈。

## 2026-05-04 第三十四阶段 coverage 80%+ 冲刺首轮推进

### 范围

- 目标：启动第三十四阶段 `测试覆盖率冲刺 80%+ (P0)`，先做基线缺口量化，再只挑“已有测试基础、贴近当前待办风险、可做定向验证”的切片推进，避免一开始就铺向全仓低价值补测。
- 当前基线：以 2026-05-04 全量 `pnpm test:coverage` 输出为准，lines `75.28%`。按现有总代码行数估算，达到 `78%` 还约差 `625` 行覆盖，达到 `80%` 还约差 `1085` 行覆盖。
- 本轮覆盖：`composables/use-auth-session.test.ts`（认证链路 hydration + 生命周期守线）与 `components/admin/posts/post-tts-dialog.test.ts`（火山直连 TTS 成功分支）。
- 非目标：本轮不做全量 coverage 复跑，不强行碰 `0%` 大块目录，不把失败态尚未稳定的 TTS 任务创建错误映射断言留在仓库里。

### 实施结论

- 认证链路先落地到 [composables/use-auth-session.test.ts](../../composables/use-auth-session.test.ts)：新增 hydration 回填断言、生命周期注册/清理断言、focus 可见性过期刷新断言，以及刷新失败 warning 断言。
- 定向 coverage 结果显示 [composables/use-auth-session.ts](../../composables/use-auth-session.ts) 当前已达 lines `89%`，说明原先未覆盖的 hydration / lifecycle 分支已被实打实回收，适合作为“认证边角分支”组的首个已完成切片。
- TTS 新链路补到 [components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts)：新增火山直连生成 + confirm emit 成功路径断言，保留现有 openai 轮询路径断言。
- 定向 coverage 结果显示 [components/admin/posts/post-tts-dialog.vue](../../components/admin/posts/post-tts-dialog.vue) 当前已达 lines `84.78%`，并带动 [composables/use-post-tts-dialog.ts](../../composables/use-post-tts-dialog.ts) 达到 lines `85.21%`。这说明当前 Phase 34 TTS 分流链路的“直连成功路径”已有稳定回归守线。
- TTS 的“任务创建失败 -> 可见错误映射”断言在组件层连续 3 次局部修正后仍未稳定打穿，因此本轮按最小风险原则回退该测试，不把不稳定断言留在仓库里；后续若继续补这一支，优先改走 composable 级定向测试，而不是继续在组件文件里来回试探。

### 已执行验证

- `pnpm exec vitest run composables/use-auth-session.test.ts`
	- 结果：通过；`9` 个测试全部通过。
- `pnpm exec vitest run composables/use-auth-session.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=composables/use-auth-session.ts`
	- 结果：通过；[composables/use-auth-session.ts](../../composables/use-auth-session.ts) 为 statements `88.78%` / branches `72.22%` / functions `96.29%` / lines `89%`。
- `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts`
	- 结果：通过；`3` 个测试全部通过。
- `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/posts/post-tts-dialog.vue --coverage.include=composables/use-post-tts-dialog.ts`
	- 结果：通过；[components/admin/posts/post-tts-dialog.vue](../../components/admin/posts/post-tts-dialog.vue) 为 lines `84.78%`，[composables/use-post-tts-dialog.ts](../../composables/use-post-tts-dialog.ts) 为 lines `85.21%`。
- 编辑器诊断复核
	- 结果：通过；受影响测试文件无新增诊断。

### Review Gate

- 结论：Pass（本轮切片）
- 问题分级：warning
- 主要问题：当前只完成了 coverage 冲刺的首轮切片，尚未复跑全仓 coverage，因此不能用本轮局部结果替代阶段基线；TTS 失败态映射断言仍是已知候选，但未保留不稳定实现。

### 未覆盖边界

- 全仓 coverage 仍停留在 2026-05-04 的 `75.28%` 基线口径，本轮只做了局部切片验证，尚未刷新阶段级总线。
- `80%+` 冲刺距离仍然较大，当前应继续优先命中三类高 ROI 区域：认证边角分支剩余切片、热点读链路失败路径、已有测试基础但 coverage 仍偏低的 Phase 33/34 共享组件。
- 下一轮优先候选：`pages/posts/[id].test.ts` 或 `tests/server/api/posts/access-error-mapping.test.ts` 所在的公开读链路失败态，以及缺少专门 composable 测试的 `use-post-tts-dialog.ts` 失败映射分支。


## 近线窗口外历史入口

- 2026-05-01 至 2026-05-02 的第三十二阶段收口与阶段切片记录已滚动归档到 [archive/2026-05-01-to-2026-05-02.md](./archive/2026-05-01-to-2026-05-02.md)。
- 2026-04-21 至 2026-05-01 的第三十/三十一阶段回归记录（治理切片 + 归档复核）已整体迁移合并到 [archive/2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md)。
