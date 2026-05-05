# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

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

## 2026-05-02 AITask stale compensation 宽行扫描收敛 P0 关闭

### 范围

- 目标：基于 2026-05-02 Neon live sample 复核第三十二阶段 P0 派生切片 `AITask stale compensation 宽行扫描收敛` 是否满足关闭条件，并修复 `RecoverableMediaTaskScanItem` 类型定义与 `select` 子句不一致的遗留问题。
- 本轮覆盖：`server/services/ai/media-task-monitor.ts`（类型对齐）、`docs/plan/todo.md`（关闭更新）与本回归记录（Neon 样本摘要）。
- 非目标：不并行开启新的代码切片，不把首页 `posts public list` 查询对治理并入本条。

### 闭合结论

- **代码层**：`scanAndCompensateTimedOutMediaTasks()` 首轮扫描已锁定 `id / type / status / result / startedAt / progress` 六字段最小集（commit `29f5ff11`），类型定义 `RecoverableMediaTaskScanItem` 已移除与 `select` 不一致的 `error` 字段，`task.error = null` 无用在内存赋值已删除。测试断言（`media-task-monitor.test.ts`）持续锁定 `select` 边界。
- **数据库层**：2026-05-02 Neon Query Performance 样本中，`momei_ai_tasks` stale compensation 扫描（前次 2026-05-01 样本 `53.9ms / 1 call`）已完全退出 Top SQL 列表。System Operations 全天 30+ 次 start/suspend 正常交替，未观察到 compute 异常钉住或 suspend 失败堆积。
- 同窗口其余样本：`settings/public` 两组 batched `IN (...)` 查询（`3.3ms + 3.3ms`，各 `1 call`）、首页 posts public list `DISTINCT + IN (...)` 查询对（`23.2ms + 21.4ms`，各 `1 call`）、精选友链查询对（`4.1ms + 2.8ms`）均在正常范围，无新增显著热点。
- 综上，本条 P0 派生切片代码、测试、类型与 live sample 四条证据链已闭环，第三十二阶段 `AITask stale compensation 宽行扫描收敛` 正式关闭。

### 运行期样本摘要（2026-05-02 Neon）

- `momei_ai_tasks` stale compensation 扫描：**未出现在 Top SQL 中**（前次 `53.9ms / 1 call`）。
- `settings/public` batched `IN (...)`：`32 key` 组 `3.3ms / 1 call`，`15 key` 组 `3.3ms / 1 call`。
- 首页 posts public list `DISTINCT` 预选：`23.2ms / 1 call`；`post.id IN (...)` 跟进：`21.4ms / 1 call`。
- 精选友链 `DISTINCT` 预选：`4.1ms / 1 call`；`friendLink.id IN (...)` 跟进：`2.8ms / 1 call`。
- TypeORM introspection 查询（`information_schema.columns` + `pg_catalog`）：`64.8ms / 3 calls`，为 Neon/TypeORM 连接初始化固有开销。
- System Operations：全天 30+ 次 start/suspend，全部 OK，无异常。

### 最低验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：核对 `docs/plan/todo.md` 与本记录对关闭口径的一致性，确认 Neon Top SQL 已无 AITask stale scan。
- V1：`pnpm exec eslint server/services/ai/media-task-monitor.ts`、`nuxt typecheck targeted`。
- V2：`pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`。
- RG：本轮 Review Gate 结论为 `Pass`，P0 切片可正式关闭。

### 已执行验证

- `pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`
	- 结果：通过；`7` 个测试全部通过，`select` 边界断言保持有效。
- `pnpm exec eslint server/services/ai/media-task-monitor.ts`
	- 结果：通过；无输出。
- `nuxt typecheck targeted`
	- 结果：通过；`RecoverableMediaTaskScanItem` 类型变更无新增诊断。
- Neon 2026-05-02 live sample
	- 结果：`momei_ai_tasks` stale scan 已退出 Top SQL；compute 生命周期正常。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；代码、测试、类型与 live sample 四条证据链一致，P0 切片可正式关闭。

### 未覆盖边界

- 当前 `momei_ai_tasks` 表仍无专用索引 `(status, type, updated_at)`，查询在无索引条件下进行过滤+排序；字段集收敛已有效压降热点，但若后续 stale task 数量显著增长，索引仍是下一步候选。
- 首页 `posts public list` 的 `DISTINCT + IN (...)` 查询对继续留在下一候选，不阻塞本条关闭。

## 2026-05-01 第三十二阶段测试覆盖率与有效性治理首轮推进

### 范围

- 目标：启动第三十二阶段 `测试覆盖率与有效性治理 (P0)`，优先沿公开页 runtime 高风险链路继续补“真实文案装配而非结构存在”的失败断言，并复跑固定 runtime 回归、全仓 coverage 与类型检查。
- 本轮覆盖：`pages/categories/index.test.ts`、`pages/tags/index.test.ts` 与 [package.json](../../package.json) 中的 `i18n:verify:runtime` 固定入口。
- 非目标：不把本轮扩写为 `80%+` 铺量补测，不并行处理统一承接入口、认证配置退化或公开热点读链路之外的其它低相关目录，也不继续扩散到更多静态页面 snapshot。

### 实施结论

- `pages/categories/index.test.ts` 已从“页面结构存在”提升为“真实分类页文案装配”断言，会直接拦截 `common.category`、`pages.posts.total_categories` 与 `pages.posts.article_count` 回退为 raw key 的公开页回归。
- `pages/tags/index.test.ts` 已同步提升为“真实标签页文案装配”断言，固定验证 `common.tags` 与 `pages.posts.total_tags` 不会在运行时消息加载退化时直接泄漏到 UI。
- `i18n:verify:runtime` 已把 `pages/categories/index.test.ts` 与 `pages/tags/index.test.ts` 纳入固定回归入口；公开页 runtime 守线从 About / Friend Links 扩展到 taxonomy 列表页，当前更接近待办中“公开页 runtime + raw key 暴露”这组高风险验收点。
- 全仓 coverage 在上一轮 `76.03% / 76.08%` 基线上继续小幅抬升到 statements `76.05%`、lines `76.10%`；其中 `pages/categories/index.vue` 当前为 statements `100%` / lines `100%`，`pages/tags/index.vue` 为 statements `93.93%` / lines `100%`。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run pages/categories/index.test.ts pages/tags/index.test.ts`
	- 结果：通过；`14` 条断言全部通过，新增真实文案装配断言稳定命中分类页与标签页的 runtime 风险。
- `pnpm i18n:verify:runtime`
	- 结果：通过；当前固定入口共 `11` 个测试文件、`88` 条断言全部通过。`pages/friend-links.test.ts` 仍会输出 Nuxt i18n 初始化阶段的既有 stderr，但未影响退出码。
- `pnpm test:coverage`
	- 结果：通过；全仓 coverage 为 statements `76.05%`、branches `63.34%`、functions `69.69%`、lines `76.10%`，较本轮开始前基线继续上升。
- `pnpm exec nuxt typecheck *> artifacts/typecheck-coverage-runtime-2026-05-01.txt`
	- 结果：通过；命令退出成功，artifact 已落盘且受影响测试文件无新增编辑器诊断。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮代码与测试变更本身无 blocker，公开页 runtime 固定回归、coverage 与类型检查均可重复执行；当前仅保留全仓 coverage 过程中的既有 stderr / warning 噪音，不影响退出码。

### 未覆盖边界

- 当前公开页 runtime 守线已覆盖 About、Friend Links、Categories 与 Tags，但 `archives` 列表页仍未提升到真实文案装配断言；若继续推进同组风险，优先补这一页而不是转向低相关静态结构测试。
- 认证配置退化、统一承接入口与公开热点读链路仍是当前待办要求中的剩余高风险组；本轮只启动了“公开页 runtime / raw key 暴露”这一个切片，尚不足以关闭整条 P0。
- taxonomy 列表页的分支覆盖仍低于 statements / lines，`pages/categories/index.vue` branches `71.42%`、`pages/tags/index.vue` branches `64.7%`；后续若继续在这两个页面上加测，应优先命中空列表、权重边界与错误 / pending 之外的剩余分支，而不是重复扩大文案断言数量。


## 2026-05-01 `use-post-editor-voice.ts` `no-explicit-any` 窄切片与 ESLint 作用域归并

### 范围

- 目标：继续推进第三十二阶段 `ESLint / 类型债治理 (P1)`，在不并行开启第二条规则治理的前提下，完成 `composables/use-post-editor-voice.ts` 单文件 `@typescript-eslint/no-explicit-any` 收敛，并把 `eslint.config.js` 中重复的 TS `files` / `ignores` 作用域判断抽成可复用配置片段。
- 本轮覆盖：`composables/use-post-editor-voice.ts`、`composables/use-post-editor-voice.test.ts`、`eslint.config.js` 与当前阶段待办 / 治理设计文档事实源同步。
- 非目标：不把 `no-explicit-any` 扩到整个 `composables/**`、不触碰 `no-unsafe-*`、不把 Web Speech 能力抽成新的跨文件运行时层，也不把其它规则切片一起打包上收。

### 实施结论

- 定向 ESLint 预检查确认 `composables/use-post-editor-voice.ts` 在 `@typescript-eslint/no-explicit-any` 下共有 `9` 处真实命中，全部集中在单文件的 ASR 配置拉取、Web Speech 构造器与错误路径，符合“单文件、可回滚”的治理预算。
- 这 `9` 处已统一收敛为本地最小类型：云端配置响应改为显式 `CloudVoiceConfigResponse` 归一化；Web Speech 改为局部 `SpeechRecognitionLike` / `WindowWithSpeechRecognition` 形状；批量与流式录音错误分支统一改走 `unknown` + 窄 helper 读取消息与名称。
- `eslint.config.js` 已抽出共享的 `testFiles`、`tsFiles`、`runtimeTsIgnores`、`productionTsIgnores` 常量与 `createRuleOverride()`，并把同一条 `@typescript-eslint/no-explicit-any` 的既有窄切片合并到单一 override，减少重复的 `files` / `ignores` 判断漂移。
- 配置归并后，`@typescript-eslint/no-explicit-any` 当前仍保持受控边界：仅作用于 `utils/shared/**/*.{ts,tsx,mts,cts}`、`server/utils/object.ts`、`server/utils/pagination.ts` 与 `composables/use-post-editor-voice.ts`，继续显式排除 tests / scripts 范围。

### 已执行验证

- 定向 ESLint：`pnpm exec eslint composables/use-post-editor-voice.ts --rule '{"@typescript-eslint/no-explicit-any":2}'`
	- 结果：通过；单文件 `9` 处显式 `any` 命中已清零，且新配置可以正常加载。
- 定向 Vitest：`pnpm exec vitest run composables/use-post-editor-voice.test.ts`
	- 结果：通过；`13` 条断言全部通过，Web Speech、云端批量与流式回退行为未回归。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；`use-post-editor-voice.ts` 与 `eslint.config.js` 未产生新的类型诊断。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮仍保持“单规则 + 单文件切片”边界，且配置归并只收敛重复判断，没有扩大规则作用面。

### 未覆盖边界

- 本轮没有把 `@typescript-eslint/no-explicit-any` 外溢到其它 `composables/**` 文件；后续若继续推进，仍应优先选择单文件或双文件切片，而不是直接整桶提级。
- `eslint.config.js` 当前只收敛了重复的 `files` / `ignores` 作用域与同规则 override；尚未把所有单文件规则都折叠成更高阶工厂，避免把配置治理本身扩写成抽象工程。

## 2026-05-01 `categories` 公开列表 `no-explicit-any` 单文件切片与待办收口

### 范围

- 目标：在不并行开启第二条规则治理的前提下，再上收一条单文件 `@typescript-eslint/no-explicit-any` 切片，并确认当前阶段的同规则归组已经足够支撑 `ESLint / 类型债治理 (P1)` 待办关闭。
- 本轮覆盖：`server/api/categories/index.get.ts`、`tests/server/api/categories/index.get.test.ts`、`eslint.config.js` 与当前阶段待办 / 治理设计文档同步。
- 非目标：不改 `attachTranslations()` helper 契约，不把 `categories / tags / posts` 三个入口打包成多文件联动治理，也不扩写到 `no-unsafe-*` 或 `no-non-null-assertion`。

### 实施结论

- `server/api/categories/index.get.ts` 当前生产源码中的 `as any` 仅剩 `attachTranslations(items as any, categoryRepo, ...)` 一处，根因是调用点没有显式告诉 TypeScript 这里实际只需要 `Category` 实体基线，而不是 `Object.assign()` 后的扩展视图。
- 本轮将该调用收敛为 `attachTranslations<Category>(items, categoryRepo, ...)`，保留 `postCount` 扩展字段与现有翻译附着行为不变，同时去掉单文件里的显式 `any`。
- `eslint.config.js` 的同规则文件组继续收敛：在既有工具层切片之外，新加 `server/api/categories/index.get.ts` 到 `noExplicitAnyApiFiles`，再与工具层文件组汇总为统一的 `noExplicitAnyFiles`，避免同一条规则继续靠散落单项扩写。
- 到这一轮为止，当前阶段已经完成“单规则窄切片 + 同规则归组 + 定向验证 + 残余债务说明”的收口条件，`ESLint / 类型债治理 (P1)` 可关闭，剩余更宽的治理面回到长期主线继续排队。

### 已执行验证

- 定向 ESLint：`pnpm exec eslint server/api/categories/index.get.ts --rule '{"@typescript-eslint/no-explicit-any":2}'`
	- 结果：通过；`categories` 公开列表入口当前无剩余显式 `any` 命中。
- 定向 Vitest：`pnpm exec vitest run tests/server/api/categories/index.get.test.ts`
	- 结果：通过；`12` 条断言全部通过，公开列表分页、聚合、翻译回退与缓存行为保持稳定。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；本轮 API 显式泛型与规则分组调整未引入新的类型诊断。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前阶段只继续上收 `@typescript-eslint/no-explicit-any` 这一条规则，且新增切片仍维持单文件边界。

### 未覆盖边界

- 本轮没有同步处理 `server/api/tags/index.get.ts` 与 `server/api/posts/index.get.ts` 中同类 `attachTranslations(... as any)` 调用，避免把当前单文件切片膨胀成三入口联动治理；这两处保留为后续长期主线候选。
- `eslint.config.js` 的同规则归组当前只覆盖 `no-explicit-any`；其它规则仍按现有窄切片单独管理，不在本轮继续抽象。


## 2026-05-01 第三十二阶段 P1「统一承接入口」闭关记录

### 范围

- 目标：为第三十二阶段 P1 主线「多语言内容资产化增强包的统一承接入口」补齐阶段闭合记录，覆盖候补名单去重、已登录预填充、多语言翻译补全与 Footer 导流入口。
- 本轮覆盖：`server/services/benefit-waitlist.ts`（去重）、`pages/benefits.vue`（预填充）、`i18n/locales/{ja-JP,ko-KR,zh-TW}/public.json` 与 `demo.json`（翻译补全）、`i18n/locales/*/common.json`（footer 键值）、`components/app-footer.vue`（页脚链接）、`docs/design/governance/multilingual-assetization-intake.md`（设计文档同步）。
- 非目标：不重做 `benefits.vue` 页面本体的实现级 review；浏览器视觉验证交由 `@ui-validator` 按需后续补跑。

### 闭合结论

- 候补名单邮箱去重已落地（应用层 `findOne` + early return，相同邮箱静默返回已有记录）。
- 已登录用户自动填充已落地（`watch(loggedInUser)` 首次自动填充 `name` + `email`，含 `hasAutoFilled` 守卫）。
- 多语言翻译已补全至 5 语种全覆盖：`pages.enhanced_pack`（`ja-JP` / `ko-KR` / `zh-TW`）与 `demo.paths.enhanced_pack` 三语均已同步。
- Footer 新增增强包链接，五语种 `common.enhanced_pack` 翻译已补齐。
- 当前共有 3 条公开导流入口：Demo Banner → `/benefits`、About 页 → `/benefits`、Footer → `/benefits`，形成「入口 → 承接页 → 候补名单」最小闭环。
- 设计文档已同步更新（导流入口状态、翻译覆盖状态、去重/预填充实现说明）。

### 最低验证矩阵

- 验证层级：`V0 + V1`。
- V0：核对候补名单去重逻辑、预填充守卫、5 语种 enhanced_pack 键结构一致性与 Footer 链接渲染。
- V1：`pnpm lint:i18n`、`pnpm exec nuxt typecheck`、`pnpm vitest run server/api/benefits/waitlist.post.test.ts utils/schemas/benefit-waitlist.test.ts pages/benefits.test.ts`。

### 已执行验证

- `pnpm lint:i18n`：通过，零错误。
- `pnpm exec nuxt typecheck`：通过，无新增类型错误。
- Vitest（3 文件 / 16 用例）：全部通过。
- JSON 语法校验（6 个修改文件）：全部合法。
- i18n 键结构一致性（5 语种 × 7 子模块）：完全一致。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；三条增强均已在代码、测试与翻译层面完成闭环，专项设计文档与回归记录已同步更新。

### 未覆盖边界

- 浏览器视觉验证（响应式 / 暗色模式 / CTA 跳转）未在本轮执行，后续由 `@ui-validator` 按需补跑。
- GitHub README CTA 入口为可选项，未在本轮实现。
- `benefitWaitlistService` 当前仅做应用层去重，未在 DB 层添加 unique index；若后续候补名单量级增长，可按需补入。

## 2026-05-01 第三十二阶段 Postgres P0 `/api/search` 热点读链路切片

### 范围

- 目标：继续推进第三十二阶段 `Postgres 查询、CPU 与连接生命周期平衡治理 (P0)` 的“公开热点读链路”切片，只收敛 `/api/search` 的匿名短 TTL 运行时缓存与定向断言。
- 本轮覆盖：`server/api/search/index.get.ts`、`tests/server/api/search/index.get.test.ts`、`docs/design/governance/cacheable-api-inventory.md` 与 `docs/plan/todo.md`。
- 非目标：不并行扩写到 `external posts` 或请求级入口治理，不把应用层缓存命中统计冒充为数据库级 `pg_stat_statements` 长窗口采样。

### 实施结论

- 匿名公开搜索结果已接入 `60s` 运行时缓存，缓存 key 覆盖 `q / language / category / tags / sortBy / page / limit`，并统一纳入 `search:public-results` namespace。
- 带会话搜索请求继续旁路共享缓存，响应头保持 `private, no-store`，避免订阅或可见性差异污染匿名共享结果。
- 定向测试现已同时锁定行为结果与应用层运行时样本：重复匿名搜索在 `search:public-results` 下形成 `requests=2 / misses=1 / hits=1 / writes=1 / bypasses=0`；带会话搜索形成 `requests=2 / bypasses=2 / hits=0 / misses=0 / writes=0`。
- 本轮只放行 `/api/search` 子切片，不关闭整条 Postgres 主线；数据库级 `pg_stat_statements` 或等价长窗口 live sample 仍待补齐。

### 最低验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：核对 `docs/plan/todo.md`、`docs/design/governance/cacheable-api-inventory.md` 与本回归记录对 `/api/search` 子切片、共享边界和“主线继续进行中”结论保持一致。
- V1：`pnpm exec eslint server/api/search/index.get.ts tests/server/api/search/index.get.test.ts`、`pnpm exec nuxt typecheck`、变更 Markdown 定向 lint。
- V2：`pnpm exec vitest run tests/server/api/search/index.get.test.ts`，并复核应用层运行时缓存统计样本。
- RG：本轮 Review Gate 结论为 `Pass`，且 todo 状态保持进行中。

### 已执行验证

- `pnpm exec vitest run tests/server/api/search/index.get.test.ts`
	- 结果：通过；`8` 个测试全部通过，已覆盖匿名重复请求命中缓存、带会话请求旁路共享缓存、多语言去重与正文字段裁剪。
- `pnpm exec eslint server/api/search/index.get.ts tests/server/api/search/index.get.test.ts`
	- 结果：通过；无输出。
- `pnpm exec nuxt typecheck`
	- 结果：通过；通过 VS Code 任务执行，终端无输出且无新增编辑器诊断。
- `pnpm exec lint-md docs/plan/todo.md docs/design/governance/cacheable-api-inventory.md docs/reports/regression/current.md`
	- 结果：通过；回归窗口、todo 与缓存清单文档结构合法。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮 search 切片的代码、测试与文档事实源一致，且未把主线状态提前标记为完成。

### 未覆盖边界

- 当前量化证据仍停留在应用层运行时缓存命中 / 旁路统计，不能替代数据库级 `pg_stat_statements` 或等价长窗口 live sample。
- `/api/search` 仍保留长关键词正文匹配语义；若后续要继续压降查询谓词压力，应以全文索引或外部搜索方案评估为前提，而不是在当前阶段静默下调搜索能力。
- 当前阶段的 Postgres 主线仍保持进行中；下一步应优先补同范围数据库级运行样本，再决定是否允许关闭主线。

## 2026-05-01 第三十二阶段 Postgres P0 主线关闭复核

### 范围

- 目标：基于 2026-05-01 Neon `query performance + system operations` 样本，复核第三十二阶段 Postgres P0 是否已满足“等价 live sample”关闭条件，并决定 `/api/search` 所属的当前公开热点读链路切片能否正式收口。
- 本轮覆盖：既有 `/api/search` 子切片记录、[docs/plan/todo.md](../../plan/todo.md)、[docs/plan/backlog.md](../../plan/backlog.md)，以及本次样本映射到的 `server/services/ai/media-task-monitor.ts`、`server/services/task.ts`、`server/api/posts/home.get.ts`、`server/services/friend-link.ts`、`server/api/settings/public.get.ts`。
- 非目标：不在本轮临时开启新的代码切片，不把 `AITask` stale compensation 或首页 posts public list 查询对顺手扩写为第二条并行治理线。

### 闭合结论

- 本次 Neon 样本可作为 roadmap 中要求的“等价 live sample”：它同时给出了热点 SQL、调用次数、平均耗时与 compute `start / suspend` 系统操作记录，足以支撑当前切片的关闭判断。
- 本轮 Top SQL 已能映射回稳定代码入口：`momei_ai_tasks` stale scan 对应 `scanAndCompensateTimedOutMediaTasks()`；首页 posts public list 的 `DISTINCT + IN (...)` 查询对对应 `server/api/posts/home.get.ts`；精选友链的 `DISTINCT + IN (...)` 查询对对应 `server/services/friend-link.ts`；批量 `momei_setting` `IN (...)` 查询对应 `server/api/settings/public.get.ts`。
- 当前公开热点读链路的收敛趋势已成立：`/api/settings/public` 只留下两组 batched `IN (...)` 读取（`5.8ms` 与 `5.4ms` 各 `1 call`），精选友链只留下 `4.3ms` 与 `4.1ms` 的一组跟进查询，`/api/search` 未继续停留在当前 Top SQL 列表中，说明本轮 search 缓存切片没有继续表现为显著热点。
- 当前仍偏重的样本已收敛到下一轮候选，而不是本轮阻塞：`AITask` stale compensation 查询为 `53.9ms / 1 call`，首页 posts public list 的 `DISTINCT + IN (...)` 查询对为 `53.3ms / 40.5ms`、各 `1 call`；它们分别属于定时补偿与首页公开列表链路，应在后续阶段单独选择其一继续推进。
- 系统操作窗口中 compute 持续出现成功的 `start / suspend` 交替，未观察到长期钉住 Active 或 suspend 失败堆积；结合当前查询样本，可判定本轮未再把数据库连接生命周期异常拉长。
- 综上，第三十二阶段 Postgres P0 当前这条“公开热点读链路”单路径切片已具备关闭条件，todo 可正式关闭；长期主线仍保留在 backlog 中，供后续阶段继续选择新切片。

### 运行期样本摘要

- `momei_ai_tasks` stale compensation 扫描：`53.9ms`，`1 call`；来源于 `scanAndCompensateTimedOutMediaTasks()` 对超时媒体任务的补偿扫描。
- 首页 posts public list 查询对：`53.3ms` 的 `DISTINCT` 预选查询 + `40.5ms` 的 `post.id IN (...)` 跟进查询，各 `1 call`；来源于首页公开文章列表读取。
- `settings/public` 批量设置读取：`32 key` batched `IN (...)` 查询 `5.8ms / 1 call`，`15 key` batched `IN (...)` 查询 `5.4ms / 1 call`，另有 `12` 次单 key 查询总计 `0.3ms`。
- 精选友链查询对：`4.3ms` 的 `DISTINCT` 预选查询 + `4.1ms` 的 `friendLink.id IN (...)` 跟进查询，各 `1 call`；来源于公开友链精选链路。
- 定时发布与营销扫描：最小字段 post 扫描 `2.1ms / 1 call`，scheduled campaign 扫描 `1.8ms / 1 call`。

### 最低验证矩阵

- 验证层级：`V0 + V1 + RG`。
- V0：核对 todo / backlog 的关闭口径，确认 Neon Top SQL 与代码入口映射一致，并确认当前切片仍符合“单路径”治理边界。
- V1：`pnpm exec lint-md docs/plan/todo.md docs/plan/backlog.md docs/reports/regression/current.md`，以及修改文档的编辑器诊断复核。
- RG：本轮关闭复核结论为 `Pass`。

### 已执行验证

- `pnpm exec lint-md docs/plan/todo.md docs/plan/backlog.md docs/reports/regression/current.md`
	- 结果：通过；本轮关闭记录与相关规划文档未引入 Markdown 结构错误。
- 编辑器诊断：`docs/plan/todo.md`、`docs/plan/backlog.md`、`docs/reports/regression/current.md`
	- 结果：通过；三份文档均无新增诊断错误。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前关闭判断建立在已完成的 `/api/search` 代码 / 测试闭环与新补齐的 Neon live sample 之上，剩余高成本样本已清晰转入后续候选，而不是继续阻塞本轮 todo。

### 未覆盖边界

- 当前 Neon 样本仍属于单日短窗口，不等价于长期连续 `pg_stat_statements` 基线；若下一阶段继续推进同一主线，仍建议补更长窗口的热点 SQL 分组与连接活跃窗口对比。
- 本轮没有顺手优化 `AITask` stale compensation 全字段扫描，也没有继续下探首页 posts public list 的 `DISTINCT + IN (...)` 查询对；这两条应在后续阶段二选一重新上收，不应在本轮关闭后被误判为已经治理完成。

## 2026-05-01 第三十二阶段 Postgres P0 `AITask` stale compensation 宽行扫描切片

### 范围

- 目标：基于同日 Neon live sample 中的 `momei_ai_tasks` stale compensation 热点 SQL，继续推进第三十二阶段 Postgres 主线的后续单路径派生切片，只收紧 `scanAndCompensateTimedOutMediaTasks()` 的首轮扫描字段集与定向断言。
- 本轮覆盖：`server/services/ai/media-task-monitor.ts`、`server/services/ai/media-task-monitor.test.ts`、[docs/plan/todo.md](../../plan/todo.md) 与 [docs/plan/backlog.md](../../plan/backlog.md)。
- 非目标：不并行扩写到首页 `posts public list` 查询对，不改 `TTSService` / `ImageService` 的补偿语义，也不把本轮代码改动冒充为新的 live sample 结论。

### 实施结论

- stale compensation 首轮扫描现已只选择 `id / type / status / result / startedAt / progress` 六组字段，足以覆盖数据库 claim 条件、补偿分发和进度回填，不再把整行 `AITask` 记录拉进热点查询。
- `claimTaskForCompensation()` 继续基于 `id + status + result` 做并发 claim，既保留原有 lease 语义，也允许在 claim 成功后原地补写 `startedAt / progress / result`，不需要恢复全字段读取。
- 定向测试新增 `taskRepo.find(select=...)` 断言，明确把“最小字段集扫描”纳入回归基线；其余 6 条既有测试继续覆盖锁竞争、单任务过滤、补偿结果聚合和 lease 窗口。
- 当前切片仅完成代码 / 测试 / 文档闭环，尚未补新的 Neon 或 `pg_stat_statements` 样本，因此 todo 保持进行中；首页 `posts public list` 查询对继续留在下一候选。

### 最低验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：核对 [docs/plan/todo.md](../../plan/todo.md)、[docs/plan/backlog.md](../../plan/backlog.md) 与本回归记录对“只推进 AITask 单路径派生切片、主线未关闭”的口径保持一致。
- V1：`pnpm exec eslint server/services/ai/media-task-monitor.ts server/services/ai/media-task-monitor.test.ts`、`nuxt typecheck targeted` 与 `pnpm exec lint-md docs/plan/todo.md docs/plan/backlog.md docs/reports/regression/current.md`。
- V2：`pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`。
- RG：本轮 Review Gate 结论为 `Pass`，但 todo 仍保持进行中，等待后续 live sample 复核。

### 已执行验证

- `pnpm exec eslint server/services/ai/media-task-monitor.ts server/services/ai/media-task-monitor.test.ts`
	- 结果：通过；无输出。
- `nuxt typecheck targeted`
	- 结果：通过；通过 VS Code 任务执行，终端无错误输出，且受影响文件无新增编辑器诊断。
- `pnpm exec lint-md docs/plan/todo.md docs/plan/backlog.md docs/reports/regression/current.md`
	- 结果：通过；本轮规划与回归文档结构合法。
- `pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`
	- 结果：通过；`7` 个测试全部通过，已覆盖最小字段集扫描、锁竞争、单任务过滤、补偿聚合与 lease 窗口。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前切片的查询边界、测试断言与规划事实源一致，且没有把“字段集收紧”夸大为“热点已从数据库窗口消失”。

### 未覆盖边界

- 本轮尚未补新的 Neon / `pg_stat_statements` 对比样本，因此只能证明“宽行读取已在代码层收紧”，不能直接量化证明该 SQL 已离开热点窗口。
- 首页 `posts public list` 的 `DISTINCT + IN (...)` 查询对仍未处理，后续若继续推进 Postgres 主线，应继续坚持单路径原则，不与本切片并行实现。

## 2026-05-01 第三十二阶段 P1 重复代码与纯函数复用收敛关闭记录

### 范围

- 目标：复核第三十二阶段 `重复代码与纯函数复用收敛 (P1)` 是否已满足关闭条件，并把本轮两组正式切片的原始重复点、抽象边界、收益、风险、回滚方式与剩余热点统一沉淀到活动回归窗口。
- 本轮覆盖：[pages/privacy-policy.vue](../../pages/privacy-policy.vue)、[pages/user-agreement.vue](../../pages/user-agreement.vue)、[components/legal-agreement-page.vue](../../components/legal-agreement-page.vue)、[composables/use-legal-agreement-page.ts](../../composables/use-legal-agreement-page.ts)、[server/api/categories/index.get.ts](../../server/api/categories/index.get.ts)、[server/api/tags/index.get.ts](../../server/api/tags/index.get.ts)、[server/utils/taxonomy-public-list.ts](../../server/utils/taxonomy-public-list.ts)，以及对应的页面 / 组件 / API / helper 测试。
- 非目标：不把本轮扩写为跨目录 UI 框架改造，不顺手收敛 `categories/[slug]` / `tags/[slug]` 等下一批页面热点，也不把读模型装配与公开列表查询继续扩写成新的数据库治理主线。

### 实施结论

- 公共页模板片段原始重复点：`privacy-policy` 与 `user-agreement` 两页此前各自重复维护整页模板、样式、SEO、异步取数、fallback agreement 构造与日期格式化，任何 legal page 结构变更都需要双写。
- 本轮抽象边界：新增 [components/legal-agreement-page.vue](../../components/legal-agreement-page.vue) 承担统一渲染结构与分支展示，新增 [composables/use-legal-agreement-page.ts](../../composables/use-legal-agreement-page.ts) 承担 SEO、asyncData、fallback agreement 与日期格式化；页面文件只保留 `agreementType / endpoint / defaultContent` 三处差异。为避免共享组件继续扩成动态 i18n key 工厂，有限集合翻译 key 继续在 composable 中显式解析为 `copy` 对象，再传给共享组件消费。
- 列表型查询 helper 原始重复点：`categories` / `tags` 公开列表端点此前分别重复拼接 runtime cache key、`search + translationId + language` 通用过滤，以及 `postCount` 与默认字段排序分支，后续再改 taxonomy 公开列表契约时需要双写。
- 本轮抽象边界：新增 [server/utils/taxonomy-public-list.ts](../../server/utils/taxonomy-public-list.ts) 只承接共享 cache key、通用过滤与排序逻辑，entity-specific 差异继续留在各自 handler 中，例如 `categories` 的 `parentId` 与 join/select 细节未被强行抽进通用 helper。
- 收益：共享 legal page 的结构与 copy 契约现在只需维护一处；taxonomy 公开列表后续继续调整公共过滤或 `postCount` 排序逻辑时也只需改一处；对应测试面已经从“每页 / 每 handler 各自覆盖相似行为”转为“共享 helper / 组件 + 端点回归”组合。
- 过度泛化风险与控制：legal page 共享层如果直接动态拼 key，容易破坏 i18n 治理可见性；taxonomy helper 如果继续吸收 join、select、translation attach 等实体差异，会把 categories / tags 特有语义抹平。本轮通过“共享组件只消费显式 copy”与“helper 只收公共过滤 / 排序 / cache key”两条边界保持了最小抽象。
- 回滚方式：若任一共享层后续被证明不再适合复用，可直接把页面或单个 handler 内联回本地实现；当前抽象没有改动数据库契约、接口 shape 或多目录公共 API，因此回滚不需要跨目录联动迁移。

### 重复代码基线与剩余热点

- `pnpm duplicate-code:check`
	- 结果：通过；review gate `Pass`。
	- 当前基线：`32 clones / 697 duplicated lines / 0.59%`。
	- 对比上一条 backlog 基线：此前长期主线记录为 `34 clones / 879 duplicated lines / 0.79%`，当前未反弹且继续下降。
	- 产物：`artifacts/review-gate/2026-05-01-duplicate-code.json`、`artifacts/review-gate/2026-05-01-duplicate-code.md`。
- 当前剩余热点（按下一轮切片优先级归并，不展开新实现）：
	- 公共页模板片段：`pages/categories/[slug].vue` vs `pages/tags/[slug].vue`。
	- 公开认证页模板：`pages/forgot-password.vue` vs `pages/reset-password.vue`。
	- 读模型 / 查询装配边界：首页与公开列表的读模型组装、taxonomy slug 页面数据装配，以及若干 AI / 邮件服务内部重复片段。

### 最低验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：核对 [docs/plan/todo.md](../../docs/plan/todo.md)、[docs/plan/backlog.md](../../docs/plan/backlog.md) 与本记录对“本轮只关闭公共页模板片段 + 列表型查询 helper 两组切片”的口径保持一致。
- V1：`nuxt typecheck targeted` 与重复代码基线检查。
- V2：共享 helper / 组件与受影响端点、页面的定向 Vitest。
- RG：本轮 Review Gate 结论为 `Pass`，当前阶段该条 P1 正式待办可关闭。

### 已执行验证

- 定向 Vitest：`server/utils/taxonomy-public-list.test.ts`、`tests/server/api/categories/index.get.test.ts`、`tests/server/api/tags/index.get.test.ts`、`pages/privacy-policy.test.ts`、`pages/user-agreement.test.ts`、`components/legal-agreement-page.test.ts`
	- 结果：通过；共 `32` 条断言通过，已覆盖共享 taxonomy helper、categories/tags 公开列表、legal page 页面主路径与共享 legal 组件分支。
- `nuxt typecheck targeted`
	- 结果：通过；共享组件 / composable 与 taxonomy helper 当前无新增类型错误。
- `pnpm duplicate-code:check`
	- 结果：通过；当前仓库重复代码基线为 `32 clones / 697 duplicated lines / 0.59%`，review gate 为 `Pass`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮两组重复区已完成代码、定向测试、类型验证与重复代码基线回写，且共享抽象边界没有外溢成跨目录大重构。

### 未覆盖边界

- 本轮没有继续覆盖 `categories/[slug]` / `tags/[slug]` 的重复模板，也没有继续下探首页 / 公开列表读模型装配边界；这些热点继续保留给后续阶段按单组切片推进。
- 当前 `duplicate-code:check` 仍会报告若干与本轮范围无关的仓库级历史热点，例如 AI TTS 路由、邮件服务和部分后台页面模板；它们不影响本轮 P1 关闭，但也不能被误判为已经治理完成。

## 近线窗口外历史入口

- 2026-04-21 至 2026-05-01 的第三十/三十一阶段回归记录（治理切片 + 归档复核）已整体迁移合并到 [archive/2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md)。

