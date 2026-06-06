# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

<!-- regression-window:start:phase42-close:第四十二阶段:2026-06-04 -->
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

<!-- regression-window:start:typeorm-assessment:第四十阶段:2026-06-02 -->
## 2026-06-02 第四十阶段 TypeORM 1.0.0 升级评估（自动回填）

- 执行入口: `pnpm regression:typeorm-assessment`
- 事实源: [docs/design/governance/typeorm-v1-upgrade-assessment.md](../../design/governance/typeorm-v1-upgrade-assessment.md)
- 结果摘要: 当前建议：`NO-GO（直接升级）`。截至 2026-05-27，第二轮 probe 已证明最小运行矩阵可通过：适配层 `11/11`、数据库初始化 `2/2`、公开热点读链路 `41/41` 均为绿色；但 `pnpm run typecheck` 仍有 `13` 个 TypeORM 直接相关静态错误分布在 `11` 个服务端文件，尚不足以支持真实升级实施。；当前建议：`GO（评估任务上收）`。当前阶段关于 TypeORM 的兼容性探针、失败分桶、回滚锚点与 closeout 证据已经闭环，可关闭本轮评估待办，但不意味着允许把依赖版本直接提升到主工作区。；下一触发点：先迁移剩余 `FindOptionsSelect` / `FindOptionsRelations` 旧语法（含 `server/database/typeorm-adapter.ts`、`10` 个 API / route 热点文件，以及 `server/utils/translation.test.ts` / `server/utils/post-list-query.test.ts` 两处测试桩），再隔离 `packages/**` 的类型噪音并重跑 `pnpm run typecheck`、适配层测试、数据库初始化测试、公开热点读链路测试与依赖审计；待这些证据全绿后，再决定是否把“真实升级实施”写入后续阶段。
- 已执行验证: 已同步设计文档中的 6 条 probe 记录。
- Review Gate: `Pass` / `warning`；主要问题=直接升级仍为 `NO-GO`，需先完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移并隔离 `packages/**` typecheck 噪音。
- 未覆盖边界: 本回填仅同步评估结论与 probe 摘要；更细的 failure buckets、回滚说明与后续触发条件仍以设计文档为准。

<!-- regression-window:end:typeorm-assessment:第四十阶段:2026-06-02 -->

## 2026-06-01 第四十一阶段 ESLint / 类型债治理：广告配置类型组 + 文本/广告目标断言组（P1）

### 范围

- 目标：继续沿“单规则 + 单文件 / 双文件”节奏推进两组新切片，分别收敛广告域共享配置类型中的 `@typescript-eslint/no-explicit-any`，以及低风险工具 / 服务文件中的 `@typescript-eslint/no-non-null-assertion`。
- 本轮覆盖：[scripts/governance/eslint-debt-targets.mjs](../../../scripts/governance/eslint-debt-targets.mjs)、[types/ad.ts](../../../types/ad.ts)、[server/services/adapters/base.ts](../../../server/services/adapters/base.ts)、[server/services/ad.ts](../../../server/services/ad.ts)、[utils/shared/citable-content.ts](../../../utils/shared/citable-content.ts)、[server/services/adapters/base.test.ts](../../../server/services/adapters/base.test.ts)、[server/services/adapters/index.test.ts](../../../server/services/adapters/index.test.ts)、[server/services/ad.test.ts](../../../server/services/ad.test.ts)、[utils/shared/citable-content.test.ts](../../../utils/shared/citable-content.test.ts)、[docs/design/governance/eslint-type-debt-tightening.md](../../design/governance/eslint-type-debt-tightening.md) 与 [docs/plan/todo.md](../../plan/todo.md)。
- 非目标：不把 `no-explicit-any` 直接外溢到整个 `server/services/adapters/**`；不把 `no-non-null-assertion` 扩写为 `server/services/**` 或 `utils/shared/**` 目录级提级；不顺手清理测试中的 `as any` / 非空断言。

### 实施结论

- 已将 `types/ad.ts` 与 `server/services/adapters/base.ts` 并入现有 `no-explicit-any` 聚合切片，并把重复的 `AdAdapterConfig = Record<string, any>` 统一收窄为 `Record<string, unknown>`，保持广告适配器工厂、基类和子类桥接契约不变。
- 已将 `server/services/ad.ts` 与 `utils/shared/citable-content.ts` 并入 `no-non-null-assertion` 窄切片，分别用局部 `categories/tags` 守卫和正则捕获守卫替代 `context.categories!` / `context.tags!` / `match[1]!` / `match[2]!`。
- 重跑 `pnpm governance:audit:eslint-debt` 后，当前治理切片仍保持 `warning=0 / explicit exemptions=0`，说明新增两组切片后基线未反弹。

### 已执行验证

- `pnpm exec eslint types/ad.ts server/services/adapters/base.ts server/services/ad.ts utils/shared/citable-content.ts --max-warnings 0`
	- 结果：通过；四个受影响文件未新增 ESLint warning。
- `pnpm governance:audit:eslint-debt`
	- 结果：通过；当前 `warning 总数: 0`、`显式豁免总数: 0`。
- `pnpm exec vitest run server/services/adapters/base.test.ts server/services/adapters/index.test.ts server/services/ad.test.ts utils/shared/citable-content.test.ts`
	- 结果：通过；`4` 个文件、`15` 个测试全部通过。
- `pnpm typecheck`
	- 结果：通过；本轮广告配置类型组与断言组未引入新的类型错误。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；ESLint / 类型债主线已继续推进两组新切片，但仍需维持单文件 / 双文件节奏选择下一刀。

### 未覆盖边界

- 本轮没有继续处理广告适配器子类中的显式类型断言，也没有扩展到 `notification.ts`、`avatar.post.ts`、`app-captcha.vue` 等其它非空断言候选。
- 当前回归只覆盖广告配置共享契约和两个低风险 `no-non-null-assertion` 文件；测试中的同类断言保持豁免。

## 2026-06-01 第四十一阶段 ESLint / 类型债治理：公开列表 API 子组 `no-explicit-any` 切片（P1）

### 范围

- 目标：继续沿 `@typescript-eslint/no-explicit-any` 的窄切片策略，把公开列表 API 子组中剩余的 `attachTranslations(... as any)` 收敛到实体泛型调用，不扩写成 `server/api/**` 目录级治理。
- 本轮覆盖：[scripts/governance/eslint-debt-targets.mjs](../../../scripts/governance/eslint-debt-targets.mjs)、[server/api/tags/index.get.ts](../../../server/api/tags/index.get.ts)、[server/api/posts/index.get.ts](../../../server/api/posts/index.get.ts)、[tests/server/api/tags/index.get.test.ts](../../../tests/server/api/tags/index.get.test.ts)、[tests/server/api/posts/index.get.test.ts](../../../tests/server/api/posts/index.get.test.ts) 与 [docs/design/governance/eslint-type-debt-tightening.md](../../design/governance/eslint-type-debt-tightening.md)。
- 非目标：不把 `no-explicit-any` 外溢到整个 `server/api/**`；不顺手清理测试桩里的 `as any`；不并行开启 `no-non-null-assertion` 或 `no-unused-vars` 新规则族。

### 实施结论

- 已把 `server/api/tags/index.get.ts` 与 `server/api/posts/index.get.ts` 并入现有 `no-explicit-any` API 子组，保持与 `server/api/categories/index.get.ts` 相同的治理口径。
- 两个入口中的 `attachTranslations(items as any, ...)` 已分别收敛为 `attachTranslations<Tag>(items, ...)` 与 `attachTranslations<Post>(items, ...)`，不改动查询、分页、缓存与翻译附着契约。
- 重跑 `pnpm governance:audit:eslint-debt` 后，当前治理切片仍保持 `warning=0 / explicit exemptions=0`，说明这次扩面没有引入新的 residual warnings。

### 已执行验证

- `pnpm exec eslint server/api/posts/index.get.ts server/api/tags/index.get.ts --max-warnings 0`
	- 结果：通过；受影响 API 入口未新增 ESLint warning。
- `pnpm governance:audit:eslint-debt`
	- 结果：通过；当前 `warning 总数: 0`、`显式豁免总数: 0`。
- `pnpm exec vitest run tests/server/api/posts/index.get.test.ts tests/server/api/tags/index.get.test.ts`
	- 结果：通过；`2` 个文件、`29` 个测试全部通过。
- `pnpm typecheck`
	- 结果：通过；本轮 API 子组切片未引入新的类型错误。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前仅完成公开列表 API 子组的一刀，整条 ESLint / 类型债主线仍需继续按单文件 / 双文件节奏推进。

### 未覆盖边界

- 本轮没有把同类治理扩展到其它 `server/api/**` 入口，也没有触碰测试文件中的 `as any`；这些仍保留为后续候选。
- 当前回归只覆盖 tags / posts 两个受影响入口；`categories` 作为同组既有切片未在本轮重复补跑。

<!-- regression-window:start:typeorm-assessment:第四十阶段:2026-05-27 -->

<!-- regression-window:start:workflow-precheck:test:2026-05-27 -->
## 2026-05-27 workflow pre-check（test，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=test`
- 证据 artifact: [md](../../../artifacts/review-gate/2026-05-27-ci-precheck-test.md) / [json](../../../artifacts/review-gate/2026-05-27-ci-precheck-test.json)
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test critical files=PASS，test environment=PASS，security:audit-deps=PASS
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:test:2026-05-27 -->

## 2026-05-27 第四十阶段 TypeORM 1.0.0 升级评估（自动回填）

- 执行入口: `pnpm regression:typeorm-assessment`
- 事实源: [docs/design/governance/typeorm-v1-upgrade-assessment.md](../../design/governance/typeorm-v1-upgrade-assessment.md)
- 结果摘要: 当前建议：`NO-GO（直接升级）`。截至 2026-05-27，第二轮 probe 已证明最小运行矩阵可通过：适配层 `11/11`、数据库初始化 `2/2`、公开热点读链路 `41/41` 均为绿色；但 `pnpm run typecheck` 仍有 `13` 个 TypeORM 直接相关静态错误分布在 `11` 个服务端文件，尚不足以支持真实升级实施。；当前建议：`GO（评估任务上收）`。当前阶段关于 TypeORM 的兼容性探针、失败分桶、回滚锚点与 closeout 证据已经闭环，可关闭本轮评估待办，但不意味着允许把依赖版本直接提升到主工作区。；下一触发点：先迁移剩余 `FindOptionsSelect` / `FindOptionsRelations` 旧语法（含 `server/database/typeorm-adapter.ts`、`10` 个 API / route 热点文件，以及 `server/utils/translation.test.ts` / `server/utils/post-list-query.test.ts` 两处测试桩），再隔离 `packages/**` 的类型噪音并重跑 `pnpm run typecheck`、适配层测试、数据库初始化测试、公开热点读链路测试与依赖审计；待这些证据全绿后，再决定是否把“真实升级实施”写入后续阶段。
- 已执行验证: 已同步设计文档中的 6 条 probe 记录。
- Review Gate: `Pass` / `warning`；主要问题=直接升级仍为 `NO-GO`，需先完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移并隔离 `packages/**` typecheck 噪音。
- 未覆盖边界: 本回填仅同步评估结论与 probe 摘要；更细的 failure buckets、回滚说明与后续触发条件仍以设计文档为准。

<!-- regression-window:end:typeorm-assessment:第四十阶段:2026-05-27 -->

<!-- regression-window:start:typeorm-assessment:第四十阶段:2026-05-25 -->
## 2026-05-25 第四十阶段 TypeORM 1.0.0 升级评估（自动回填）

- 执行入口: `pnpm regression:typeorm-assessment`
- 事实源: [docs/design/governance/typeorm-v1-upgrade-assessment.md](../../design/governance/typeorm-v1-upgrade-assessment.md)
- 结果摘要: 当前建议：`NO-GO（直接升级）`。首轮 probe 已证明适配层与初始化层不是首个 blocker，但 `typecheck` 仍显示 `select` / `relations` 旧语法迁移面较大，主工作区剩余基线为 `22` 处字符串数组 `select` 与 `38` 处字符串数组 `relations`。；当前建议：`GO（评估任务上收）`。；下一触发点：先完成 `FindOptionsSelect` / `FindOptionsRelations` 语法迁移、隔离 `packages/**` 的 typecheck 噪音并重跑 `pnpm run typecheck`；待最小验证矩阵全绿后，再决定是否把“真实升级实施”写入后续阶段。
- 已执行验证: 已同步设计文档中的 7 条首轮 probe 记录。
- Review Gate: `Pass` / `warning`；主要问题=直接升级仍为 `NO-GO`，需先完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移并隔离 `packages/**` typecheck 噪音。
- 未覆盖边界: 本回填仅同步评估结论与 probe 摘要；更细的 failure buckets、回滚说明与后续触发条件仍以设计文档为准。

<!-- regression-window:end:typeorm-assessment:第四十阶段:2026-05-25 -->

## 2026-05-25 第四十阶段守护策略分级与依赖风险口径对齐（P2）

### 范围

- 目标：把 dependency risk 的 blocker / warning 口径收敛到共享策略表，并确认 `security:audit-deps` 与 `security:audit-deps:daily` 在同一类风险上输出一致结论，差异只保留在触发时机与告警收口。
- 本轮覆盖：[scripts/shared/guard-strategy.mjs](../../../scripts/shared/guard-strategy.mjs)、[scripts/security/dependency-risk-policy.mjs](../../../scripts/security/dependency-risk-policy.mjs)、[scripts/security/check-dependency-risk.mjs](../../../scripts/security/check-dependency-risk.mjs)、[scripts/security/run-daily-dependency-audit.mjs](../../../scripts/security/run-daily-dependency-audit.mjs)、[scripts/security/daily-dependency-risk-issue.mjs](../../../scripts/security/daily-dependency-risk-issue.mjs)、[scripts/ci/workflow-precheck.mjs](../../../scripts/ci/workflow-precheck.mjs)、[.github/workflows/dependency-risk-daily.yml](../../../.github/workflows/dependency-risk-daily.yml)、[tests/scripts/check-dependency-risk.test.ts](../../../tests/scripts/check-dependency-risk.test.ts)、[tests/scripts/run-daily-dependency-audit.test.ts](../../../tests/scripts/run-daily-dependency-audit.test.ts)、[tests/scripts/daily-dependency-risk-issue.test.ts](../../../tests/scripts/daily-dependency-risk-issue.test.ts) 与 [tests/scripts/workflow-precheck.test.ts](../../../tests/scripts/workflow-precheck.test.ts)。
- 非目标：不把 daily 告警策略扩写成第三套独立入口；不在本轮重构所有 precheck / regression 子项的分级语义；不要求本地模拟一次完整 GitHub issue 同步链路。

### 实施结论

- 已新增共享策略表 [scripts/security/dependency-risk-policy.mjs](../../../scripts/security/dependency-risk-policy.mjs)，统一维护 release / daily 两个 dependency-risk 场景的最小严重级别、finding level、默认 mode 与 issue 阈值；[scripts/shared/guard-strategy.mjs](../../../scripts/shared/guard-strategy.mjs) 提供可复用的 finding level 归一化与比较能力。
- `security:audit-deps`、`security:audit-deps:daily` 与 [scripts/ci/workflow-precheck.mjs](../../../scripts/ci/workflow-precheck.mjs) 已改为消费同一套 dependency-risk finding level，不再分别硬编码 `--mode`、`--min-severity` 与 workflow 失败条件。
- daily 审计摘要现在会额外输出 `reviewGate`、`requiresAttention` 与 `shouldOpenIssue`；[.github/workflows/dependency-risk-daily.yml](../../../.github/workflows/dependency-risk-daily.yml) 直接读取这些结构化字段决定是否告警、是否 fail workflow，而不是重复维护第二套条件分支。
- 本地 closeout 实测表明当前依赖树上的 `high+` 风险为 `0`，release 与 daily 两条入口都给出 `Pass (none)`：`security:audit-deps` 输出 `relevant risks: 0` 与 `review gate: Pass (none)`，`security:audit-deps:daily` 输出 `无高危风险` 与 `Review Gate: Pass (none)`，满足“同一类风险结论一致，只有时机差异”的最小验收。

### 已执行验证

- `pnpm exec vitest run tests/scripts/workflow-precheck.test.ts tests/scripts/check-dependency-risk.test.ts tests/scripts/run-daily-dependency-audit.test.ts tests/scripts/daily-dependency-risk-issue.test.ts`
	- 结果：通过；`4` 个文件、`32` 个测试全部通过，覆盖共享策略默认值、release / daily 口径一致性、daily issue 正文与 workflow precheck 证据输出。
- `pnpm security:audit-deps`
	- 结果：通过；当前 `relevant risks: 0`，`review gate: Pass (none)`。
- `pnpm security:audit-deps:daily -- --output-json=artifacts/security/daily-dependency-audit/manual-closeout/summary.json --output-markdown=artifacts/security/daily-dependency-audit/manual-closeout/summary.md --run-url=local-manual-closeout`
	- 结果：通过；`summary.json` 与 `summary.md` 已落到 [artifacts/security/daily-dependency-audit/manual-closeout/summary.json](../../../artifacts/security/daily-dependency-audit/manual-closeout/summary.json) 和 [artifacts/security/daily-dependency-audit/manual-closeout/summary.md](../../../artifacts/security/daily-dependency-audit/manual-closeout/summary.md)，当前 `status=clean`、`reviewGate=Pass / none`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮验收点已收口。

### 未覆盖边界

- 本轮没有在 GitHub Actions 真实运行时补跑一次 `dependency-risk-daily` workflow，因此 issue 同步与 artifact 上传仍以后续 CI 实跑为准；但这不影响当前“策略口径对齐 + 本地入口实测一致”的关闭条件。
- 若后续要把 dependency-risk 的 `auditFailure` 与 `blockingRisk` 细分成不同 finding level，还需要继续把这种差异向更广的 precheck / regression 子项传播；当前策略表已提供事实源，但本轮不把它扩写成全仓统一分级框架。

## 2026-05-27 第四十阶段 TypeORM 1.0.0 第二轮兼容性探针 closeout（P1）

### 范围

- 目标：基于当前主工作区候选代码，重新在隔离 worktree 中执行 `typeorm@1.0.0` probe，确认第一轮 runtime blocker 收敛后，最小验证矩阵是否已足以关闭“兼容性探针与分桶验证”待办。
- 本轮覆盖：[docs/design/governance/typeorm-v1-upgrade-assessment.md](../../design/governance/typeorm-v1-upgrade-assessment.md)、[server/database/typeorm-adapter.ts](../../../server/database/typeorm-adapter.ts)、[tests/server/database/init-boundary.test.ts](../../../tests/server/database/init-boundary.test.ts)、[tests/server/api/categories/index.get.test.ts](../../../tests/server/api/categories/index.get.test.ts)、[tests/server/api/posts/index.get.test.ts](../../../tests/server/api/posts/index.get.test.ts) 与 [tests/server/api/tags/index.get.test.ts](../../../tests/server/api/tags/index.get.test.ts)。
- 非目标：不在本轮直接修完剩余 `FindOptionsSelect` / `FindOptionsRelations` 旧语法；不把 `packages/**` 的缺依赖类型声明一并扩写成新任务实施。

### 实施结论

- 第二轮 probe 下，最小运行矩阵已转绿：`server/database/typeorm-adapter.test.ts` 在 `--hookTimeout=180000` 下通过（`11/11`），`tests/server/database/init-boundary.test.ts` 在同样的 hook budget 下通过（`2/2`），公开热点读链路 `categories + posts + tags` 继续通过（`41/41`）。
- 当前 `NO-GO（直接升级）` 结论保持不变，但 blocker 已从“运行时首个断点”收敛为“静态迁移面 + 外部噪音”：`pnpm run typecheck` 仍剩 `13` 个 TypeORM 直接相关错误，分布在 `11` 个服务端文件；另有 `packages/cli` 与 `packages/mcp-server` 的 `22` 个类型噪音错误需要单独隔离。
- 第二轮 `pnpm security:audit-deps` 两次都因 `pnpm audit` 返回 `fetch failed` 中断，当前仅记录为 registry / 网络侧噪音，不作为 TypeORM 兼容 blocker；最近一次成功的安全口径仍以前一轮 probe 为准。
- 以上证据已足以关闭“兼容性探针与分桶验证 (P1)”待办，但不构成真实升级实施放行条件。

### 已执行验证

- `cd D:\Projects\typescript-projects\momei-typeorm-probe-20260527 && pnpm run typecheck`
	- 结果：失败；`35 errors / 25 files`，其中 TypeORM 直接相关为 `13` 个错误 / `11` 个服务端文件。
- `cd D:\Projects\typescript-projects\momei-typeorm-probe-20260527 && pnpm exec vitest run server/database/typeorm-adapter.test.ts --hookTimeout=180000`
	- 结果：通过；`1` 个文件、`11` 个测试全部通过。
- `cd D:\Projects\typescript-projects\momei-typeorm-probe-20260527 && pnpm exec vitest run tests/server/database/init-boundary.test.ts --hookTimeout=180000`
	- 结果：通过；`1` 个文件、`2` 个测试全部通过。
- `cd D:\Projects\typescript-projects\momei-typeorm-probe-20260527 && pnpm exec vitest run tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts tests/server/api/tags/index.get.test.ts`
	- 结果：通过；`3` 个文件、`41` 个测试全部通过。
- `cd D:\Projects\typescript-projects\momei-typeorm-probe-20260527 && pnpm security:audit-deps`
	- 结果：连续两次失败；`pnpm audit` 返回 `fetch failed`，当前记录为外部依赖源噪音。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：P1 评估收口已满足关闭条件，但真实升级实施仍为 `NO-GO`；剩余 blocker 已集中到 `11` 个服务端文件的旧语法迁移与 `packages/**` 类型噪音隔离。

### 未覆盖边界

- 本轮仍未补跑独立实体层测试，因此实体装饰器 / metadata 级断点继续保持“未单独验证”状态。
- `security:audit-deps` 在本轮未能拿到新的成功样本；若后续要把真实升级实施上收到下一阶段，仍需补一条成功的依赖审计记录。

## 2026-05-25 第四十阶段 TypeORM 1.0.0 首轮兼容性探针（P1）

### 范围

- 目标：在不升级主工作区依赖版本的前提下，用隔离 worktree 将 `typeorm` 临时切到 `1.0.0`，验证适配层、数据库初始化、公开热点读链路、类型层与依赖风险的首轮兼容性。
- 本轮覆盖：[docs/design/governance/typeorm-v1-upgrade-assessment.md](../../design/governance/typeorm-v1-upgrade-assessment.md)、[server/database/typeorm-adapter.ts](../../../server/database/typeorm-adapter.ts)、[tests/server/database/init-boundary.test.ts](../../../tests/server/database/init-boundary.test.ts)、[tests/server/api/categories/index.get.test.ts](../../../tests/server/api/categories/index.get.test.ts)、[tests/server/api/posts/index.get.test.ts](../../../tests/server/api/posts/index.get.test.ts)、[tests/server/api/tags/index.get.test.ts](../../../tests/server/api/tags/index.get.test.ts)、[server/utils/translation.ts](../../../server/utils/translation.ts) 与 [server/utils/translation.test.ts](../../../server/utils/translation.test.ts)。
- 非目标：不在本轮把主工作区依赖真正升级到 `typeorm@1.0.0`；不顺手迁移所有 TypeORM mock / 桩；不把真实升级实施并入当前阶段交付。

### 实施结论

- 隔离 probe 下，[server/database/typeorm-adapter.ts](../../../server/database/typeorm-adapter.ts) 的定向测试与 [tests/server/database/init-boundary.test.ts](../../../tests/server/database/init-boundary.test.ts) 全部通过，说明 `better-auth` 适配层与数据库初始化边界不是首个 runtime blocker。
- 公开热点读链路的首个真实 blocker 收敛到 [server/utils/translation.ts](../../../server/utils/translation.ts)：TypeORM 1.0.0 移除了字符串数组 `select` 语法，导致 `attachTranslations()` 在 categories / posts 公共读路径上直接抛错。该 helper 已在主工作区改为对象语法，并补了对应断言；当前主工作区的 translation + categories + posts + tags 定向回归为 `52/52` 通过。
- probe worktree 下的 `pnpm run typecheck` 仍失败（`76 errors / 49 files`）。与 TypeORM 1.0.0 直接相关的主因是字符串数组 `select` / `relations` 旧语法，以及个别 `dataSource.options.type` narrowing 差异；当前主工作区剩余基线为 `22` 处 `select: [...]` 与 `38` 处 `relations: [...]`。
- `pnpm security:audit-deps` 在 probe worktree 下通过，`relevant risks: 0`；当前没有证据表明 TypeORM 1.0.0 探针同时引入新的 `high+` 依赖风险。
- 阶段建议保持为：`NO-GO（直接升级）`，但允许继续推进兼容性收敛与分桶验证。

### 已执行验证

- `cd /workspaces/momei-typeorm-probe && pnpm exec vitest run server/database/typeorm-adapter.test.ts`
	- 结果：通过；`1` 个文件、`11` 个测试全部通过。
- `cd /workspaces/momei-typeorm-probe && pnpm exec vitest run tests/server/database/init-boundary.test.ts`
	- 结果：通过；`1` 个文件、`2` 个测试全部通过。
- `cd /workspaces/momei-typeorm-probe && pnpm exec vitest run tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts`
	- 结果：首次失败；共同错误为 `String-array "select" syntax has been removed`，调用栈统一落在 [server/utils/translation.ts](../../../server/utils/translation.ts) 的 `attachTranslations()`。
- `cd /workspaces/momei-typeorm-probe && pnpm exec vitest run tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts tests/server/api/tags/index.get.test.ts`
	- 结果：在 translation helper 兼容补丁后通过；`3` 个文件、`41` 个测试全部通过。
- `cd /workspaces/momei-typeorm-probe && pnpm run typecheck`
	- 结果：失败；`76 errors / 49 files`，主要分布在 API / service / test 中的 `FindOptionsSelect` 与 `FindOptionsRelations` 旧语法。
- `cd /workspaces/momei-typeorm-probe && pnpm security:audit-deps`
	- 结果：通过；`relevant risks: 0`。
- `cd /workspaces/momei && pnpm exec vitest run server/utils/translation.test.ts tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts tests/server/api/tags/index.get.test.ts`
	- 结果：通过；`4` 个文件、`52` 个测试全部通过，确认主工作区前向兼容补丁无回归。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：直接升级仍不满足放行条件。当前虽然已收敛首个 runtime blocker，但 `typecheck` 仍显示大量 `select` / `relations` 旧语法需要迁移，且 `packages/**` 的依赖类型噪音还未完全隔离。

### 未覆盖边界

- 本轮没有在 probe 下补跑实体约束测试（如 `post.entity`）与更广的服务层 / 导出链路定向集，因此“实体层是否存在独立 blocker”仍需下一轮补跑确认。
- 本轮没有迁移剩余 `22` 处字符串数组 `select` 与 `38` 处字符串数组 `relations`，因此 `pnpm run typecheck` 仍不能作为升级已可执行的证据。
- probe worktree 的 `packages/cli` / `packages/mcp-server` 缺依赖类型声明问题尚未独立隔离，当前只把它们标为非 runtime blocker 的环境噪音。

## 2026-05-25 第四十阶段发布链路最小回归闸门收紧（P0）

### 范围

- 目标：把本地 `pnpm release` 与 [.github/workflows/release.yml](../../../.github/workflows/release.yml) 的发版前回归顺序收敛到同一条主线，并让 `release:check:full` 的内部失败子项能直接出现在 regression summary 中。
- 本轮覆盖：[package.json](../../../package.json)、[.github/workflows/release.yml](../../../.github/workflows/release.yml)、[scripts/regression/run-periodic-regression.mjs](../../../scripts/regression/run-periodic-regression.mjs)、[tests/scripts/run-periodic-regression.test.ts](../../../tests/scripts/run-periodic-regression.test.ts) 与 [docs/plan/todo.md](../../plan/todo.md)。
- 非目标：不新增第二套回归入口；不把 `phase-close` 级命令并入日常默认发布链路；不在本轮直接触发一次真实 GitHub Actions release run。

### 实施结论

- 本地发布入口已改为先执行 `pnpm regression:pre-release`，再进入 `pnpm release:semantic`；不再绕开固定回归入口直接调用 `release:check`。
- 发布 workflow 已从分散的 `qa / unit / e2e` 检查收敛为 `precheck -> regression -> release` 的单一守门顺序，其中 `Regression Gate` job 直接执行 `pnpm run regression:pre-release` 并上传标准化 artifact。
- [scripts/regression/run-periodic-regression.mjs](../../../scripts/regression/run-periodic-regression.mjs) 现在会解析 `pre-release-check` 的致命输出，把类似 `lint:i18n`、`security:alerts` 这类内部失败子项直接上浮为 `release:check:full failed -> <sub-step>`，满足“失败日志可直接定位到守护子项”的最小验收。
- 本轮标准化摘要已落盘为 `artifacts/review-gate/2026-05-25-pre-release-regression.md` 与 `artifacts/review-gate/2026-05-25-pre-release-regression.json`；CI 侧也会沿用同一组 artifact 模式继续保留近线证据。

### 已执行验证

- `pnpm exec eslint scripts/regression/run-periodic-regression.mjs tests/scripts/run-periodic-regression.test.ts`
	- 结果：通过；受影响的回归编排脚本与定向测试文件未报告 ESLint 问题，补齐了本轮配置 / 脚本切片所需的静态层 lint 证据。
- `pnpm run typecheck`
	- 结果：通过；`nuxt typecheck` 正常结束，说明本轮发布链路改动未引入新的类型层回归。
- `pnpm exec vitest run tests/scripts/run-periodic-regression.test.ts`
	- 结果：通过；`1` 个文件、`8` 个测试全部通过，覆盖固定 profile、日志窗口分级、嵌套失败定位与证据输出。
- `pnpm run regression:pre-release -- --dry-run`
	- 结果：`Prepared`；固定顺序成功输出为 `release:check:full -> docs:check:i18n -> docs:check:line-count -> test:perf:budget:strict -> duplicate-code:check`，并生成标准化 Markdown + JSON 摘要。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮没有直接触发一次携带 GitHub Actions secrets 的真实 release workflow，因此 CI 运行时凭据注入、`semantic-release` 发布侧行为与 artifact 上传链路仍以仓库后续 workflow 实跑结果为准；但这不影响当前 P0 的“顺序统一 + 摘要标准化 + 失败定位上浮”收口。

### 未覆盖边界

- 本轮只执行了 `regression:pre-release` 的 dry-run，没有在本地补跑一次完整非 dry-run 的发版前回归，因此 `release:check:full` 的全量耗时与本地令牌依赖未在本 session 重新量测。
- GitHub Actions 的真实 `Release` workflow 尚未在本轮改动后实跑，CI 侧仍需下一次调度或手动触发来完成最终运行时闭环。

## 2026-05-25 第四十阶段 CI 前置守护脚本接入首轮落地（P0）

### 范围

- 目标：确认共享 `ci:precheck` 入口已经被 `release / test / docker` 三条 workflow 复用，并补齐首轮执行证据与失败样本定位记录；本轮不重写 workflow 主体，也不并行推进第二条 P0 的回归顺序收紧。
- 本轮覆盖：[package.json](../../../package.json)、[.github/workflows/release.yml](../../../.github/workflows/release.yml)、[.github/workflows/test.yml](../../../.github/workflows/test.yml)、[.github/workflows/docker.yml](../../../.github/workflows/docker.yml)、[scripts/ci/workflow-precheck.mjs](../../../scripts/ci/workflow-precheck.mjs)、[tests/scripts/workflow-precheck.test.ts](../../../tests/scripts/workflow-precheck.test.ts) 与 [docs/plan/todo.md](../../plan/todo.md)。
- 非目标：不把所有 warning 一次性升级为 blocker，不改写 [scripts/release/pre-release-check.mjs](../../../scripts/release/pre-release-check.mjs) 的发布前校验矩阵，也不把其他 workflow 一并接入本轮范围。

### 实施结论

- 共享入口已经就位：[.github/workflows/release.yml](../../../.github/workflows/release.yml)、[.github/workflows/test.yml](../../../.github/workflows/test.yml) 与 [.github/workflows/docker.yml](../../../.github/workflows/docker.yml) 均在主体 job 之前执行 `pnpm run ci:precheck -- --profile=<workflow>`，并统一指向 [scripts/ci/workflow-precheck.mjs](../../../scripts/ci/workflow-precheck.mjs)。
- `test` profile 的真实执行样本已经通过：本轮验证了 `8` 个关键文件、`5` 个 GitHub Actions 必需环境变量，并在执行 `security:audit-deps` 后确认 `high+` 依赖风险为 `0`。
- `release` profile 的失败样本已能在主体命令前稳定定位到凭据缺失：当只提供通用 CI 变量与占位 `GITHUB_TOKEN` 时，入口会在 `release environment` 步骤直接给出 `DOCKER_USERNAME / DOCKER_PASSWORD / ALIYUN_USERNAME / ALIYUN_PASSWORD` 缺失结论，而不会继续进入后续命令。
- 本轮同时生成了本地 Review Gate artifact：`artifacts/review-gate/2026-05-25-ci-precheck-test.{md,json}` 与 `artifacts/review-gate/2026-05-25-ci-precheck-release.{md,json}`；由于 `artifacts/` 目录默认被 Git 忽略，正式近线结论回写到本文件作为可追溯事实源。

### 已执行验证

- `pnpm exec vitest run tests/scripts/workflow-precheck.test.ts`
	- 结果：通过；`1` 个文件、`7` 个测试全部通过，覆盖 profile 暴露、环境 / 文件检查、证据生成与 dry-run artifact 落盘。
- `CI=true GITHUB_ACTIONS=true GITHUB_WORKFLOW=test GITHUB_SHA=local-precheck-pass GITHUB_REF=refs/heads/master pnpm run ci:precheck -- --profile=test`
	- 结果：通过；`test critical files`、`test environment` 与 `security:audit-deps` 全部通过，其中依赖风险检查返回 `relevant risks: 0`。
- `CI=true GITHUB_ACTIONS=true GITHUB_WORKFLOW=release GITHUB_SHA=local-precheck-fail GITHUB_REF=refs/heads/master GITHUB_TOKEN=dummy pnpm run ci:precheck -- --profile=release`
	- 结果：按预期失败；入口在 `release environment` 步骤阻断，失败信息可直接定位到缺失的 Docker / Aliyun 发布凭据，满足“至少一条失败样本定位记录”的最小验收。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮在本地只能验证 `test` profile 的真实成功样本，以及 `release` profile 的失败定位样本；`release` / `docker` 的真实发布凭据路径仍需依赖 GitHub Actions 运行时 secrets 做最终闭环，但这不阻塞当前 P0 的首轮落地判定。

### 未覆盖边界

- 本轮没有在本地复现携带真实 secrets 的 `release` / `docker` 成功路径，因此发布侧凭据注入与 registry 登录仍以 workflow 运行时为准。
- 本轮只关闭“统一 pre-check 入口接入”这一条 P0，尚未并行处理“发布链路最小回归闸门收紧 (P0)”的固定顺序与标准化摘要收口。

## 2026-05-23 第三十九阶段归档对账与文档同步

### 范围

- 目标：核对第三十九阶段 5 条主线与实际代码改动的一致性，完成 `todo.md` 清理、`todo-archive.md` 归档、`roadmap.md` 状态同步，以及 4 份多语路线图摘要更新；本轮不把下一阶段直接写入正式规划。
- 本轮覆盖：[docs/plan/todo.md](../../plan/todo.md)、[docs/plan/todo-archive.md](../../plan/todo-archive.md)、[docs/plan/roadmap.md](../../plan/roadmap.md)、[docs/i18n/en-US/plan/roadmap.md](../../i18n/en-US/plan/roadmap.md)、[docs/i18n/zh-TW/plan/roadmap.md](../../i18n/zh-TW/plan/roadmap.md)、[docs/i18n/ko-KR/plan/roadmap.md](../../i18n/ko-KR/plan/roadmap.md)、[docs/i18n/ja-JP/plan/roadmap.md](../../i18n/ja-JP/plan/roadmap.md)。
- 对账依据：`feat(wechat_mp)` 与相关收口提交（`3f0989d8`、`9c7a5eb2`、`a08adbd7`、`a1395e29`、`5179a5ff`、`b9bfb3bb`）及其受影响文件清单。

### 实施结论

- 第三十九阶段在规划文档中的 5 项待办均可映射到已落地代码与文档证据，当前阶段可判定为“已完成且可归档”。
- `todo.md` 已清空当前执行面并明确“下一阶段仅候选分析”；`todo-archive.md` 已新增第三十九阶段完整归档块。
- `roadmap.md` 已将第三十九阶段状态改为“已审计归档”并补充审计结论；`en-US` / `zh-TW` / `ko-KR` / `ja-JP` 路线图摘要已同步状态与 `last_sync`。

### 已执行验证

- `pnpm exec lint-md docs/plan/todo.md docs/plan/todo-archive.md docs/plan/roadmap.md docs/i18n/en-US/plan/roadmap.md docs/i18n/zh-TW/plan/roadmap.md docs/i18n/ko-KR/plan/roadmap.md docs/i18n/ja-JP/plan/roadmap.md`
- `pnpm docs:check:source-of-truth`
- `pnpm docs:check:i18n`
- `pnpm docs:check:line-count`

验证结果：全部通过；`docs/plan/todo-archive.md` 当前 `514` 行，落在 warning 区间但未触发 error 阻断。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：归档主窗口行数已进入 warning 区间，后续若继续增长应按深度归档规则滚动迁移，避免主窗口再次膨胀。

### 未覆盖边界

- 本轮为规划与文档收口，不包含新一轮全量 `phase-close` 复跑；放行依据为既有阶段实现证据 + 本轮文档质量门校验。
- 下一阶段当前仍仅保留候选分析，尚未执行正式上收与容量切片。

## 2026-05-19 第三十八阶段归档对账与 Review Gate

### 范围

- 目标：对账第三十八阶段 5 条主线在实现代码、定向测试、live sample、活动回归窗口与规划文档中的实际落地情况，并完成 `todo.md` 清理、`todo-archive.md` 归档、`roadmap.md` 与 4 份多语路线图摘要同步；本轮明确不把下一阶段直接写入正式规划。
- 本轮覆盖：[docs/plan/todo.md](../../plan/todo.md)、[docs/plan/todo-archive.md](../../plan/todo-archive.md)、[docs/plan/roadmap.md](../../plan/roadmap.md)、4 份多语 roadmap 摘要、[server/api/posts/home.get.ts](../../../server/api/posts/home.get.ts)、[server/database/index.ts](../../../server/database/index.ts)、[tests/server/api/posts/home.get.test.ts](../../../tests/server/api/posts/home.get.test.ts)、[tests/server/database/init-boundary.test.ts](../../../tests/server/database/init-boundary.test.ts) 与本文件近线证据窗口。
- 非目标：不重新补一轮新的数据库长窗口采样，不重跑全套 `pnpm regression:phase-close`，也不在本轮直接上收下一阶段的“1 个新功能 + 若干优化”正式规划。

### 实施结论

- 第三十八阶段中，分发一致性修补、测试有效性第二轮、结构复用第二轮与 ESLint / 类型债窄切片四条主线，已分别在对应实现、定向测试与中文规划事实源中闭环，可直接回链到当前仓库与 2026-05-18 的活动回归记录。
- Postgres P0 条目当前已完成本阶段最小目标：`posts/home`、`categories` 与 `tags` 公开链路已切到 connection-only 初始化边界，首页响应已去掉未消费的作者邮箱字段，且 `2026-05-19` 的 Neon live sample 已把根因进一步收敛到“公开热读 + 稀疏公共流量反复打醒 compute”而不是初始化误触主导成本。
- 由于当前仍缺同口径前后对照样本来直接证明 `rows / mean time / 网络体量` 的下降趋势，本轮不把长期 Postgres 治理误写成“已彻底收口”；阶段归档结论改为“当前切片已止损并完成根因收敛，剩余缓存侧继续优化回到 backlog 长期主线”，不再把该残余视为第三十八阶段的阻塞项。
- [docs/plan/todo.md](../../plan/todo.md) 已清理当前执行面，[docs/plan/todo-archive.md](../../plan/todo-archive.md) 与 [docs/plan/roadmap.md](../../plan/roadmap.md) 已统一改写为“第三十八阶段已审计归档”，4 份多语路线图摘要也已同步为相同口径；下一阶段当前仍只保留候选分析。

### 已执行验证

- 既有阶段证据复核：
	- [docs/reports/regression/current.md](./current.md) 中 2026-05-18 的第三十八阶段测试有效性第二轮切片关闭记录。
	- [server/api/posts/home.get.ts](../../../server/api/posts/home.get.ts)、[server/database/index.ts](../../../server/database/index.ts)、[tests/server/api/posts/home.get.test.ts](../../../tests/server/api/posts/home.get.test.ts) 与 [tests/server/database/init-boundary.test.ts](../../../tests/server/database/init-boundary.test.ts) 的当前实现 / 守线入口。
	- [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md) 中的现状结论、止损口径与候选转移说明。
- 本轮归档文档验证：
	- `pnpm exec lint-md docs/plan/todo.md docs/plan/todo-archive.md docs/plan/roadmap.md docs/reports/regression/current.md docs/i18n/en-US/plan/roadmap.md docs/i18n/zh-TW/plan/roadmap.md docs/i18n/ko-KR/plan/roadmap.md docs/i18n/ja-JP/plan/roadmap.md`
	- `pnpm docs:check:i18n`
	- `pnpm docs:check:source-of-truth`
	- `pnpm docs:check:line-count`

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮放行依赖的是第三十八阶段既有的定向测试、live sample 与本次规划文档同步，而不是重新执行一次统一 `pnpm regression:phase-close`。考虑到本轮改动以归档、状态对账与翻译同步为主，这一证据组合足以支撑归档；但若后续要把“阶段归档必须附带固定入口回归”收紧为硬门槛，仍需先在规范与脚本入口中明确。

### 未覆盖边界

- 本轮没有补新的同口径 `pg_stat_statements` 前后对照采样，因此 Postgres 长期主线只能判定为“当前切片止损完成”，不能据此宣称公共热读成本已经得到长期证明式收口。
- 下一阶段当前仍只停留在候选分析；若要把新的长期治理事项上收到正式待办，仍应先补对应脚本 baseline，而不是直接把叙述性目标写进 `todo.md` 或 `roadmap.md`。

## 2026-05-18 第三十八阶段测试有效性第二轮切片（P0）关闭

### 范围

- 目标：围绕第三十八阶段 `测试有效性第二轮切片 (P0)`，补齐组件层 direct TTS 失败映射、页面级 auth degradation，以及 `settings public` 或 friend-links 公开失败口径中的最小高风险缺口，并把本轮命中的入口沉淀为可复用定向回归矩阵。
- 本轮覆盖：[components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts)、[pages/login.vue](../../pages/login.vue)、[pages/login.test.ts](../../pages/login.test.ts)、[tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把页面级 auth degradation 扩到 register 页，不重开 friend-links 第二条失败口径，也不把本轮放大成新的 coverage 冲刺。

### 实施结论

- [components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 已补齐 `/api/ai/tts/task` 创建失败后的用户可见错误映射，验证 direct TTS 在真正进入浏览器直连前若任务创建失败，会通过对话框 error Message 暴露 fallback 文案，而不是静默失败或只留内部异常。
- [pages/login.test.ts](../../pages/login.test.ts) 与 [pages/login.vue](../../pages/login.vue) 已补齐登录页 logical failure 后的 auth degradation 守线：当 `refreshAuthSession` 作为失败后的补偿步骤再次退化时，页面继续保留原始 `Unauthorized` 错误提示并记录 warning，而不会二次掉进 catch 把用户可见结果抹成 `Unexpected error`。
- [tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 已补齐 `settings public` 的失败缓存边界：第一次 bootstrap `503` 不会污染 `settings:public` 的短 TTL runtime cache，随后恢复的请求会重新查库并返回 `200`，避免公开热点读链路在短时间内被错误结果钉死。
- 本轮可复用的定向回归矩阵已固定为：`pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts pages/login.test.ts tests/server/api/settings/public.get.test.ts`。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts pages/login.test.ts tests/server/api/settings/public.get.test.ts`
	- 结果：通过；`3` 个文件、`17` 个测试全部通过（`0` 失败）。
- 受影响文件类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；命令正常结束且未返回类型错误输出，且 [pages/login.vue](../../pages/login.vue)、[pages/login.test.ts](../../pages/login.test.ts)、[components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts)、[tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 的编辑器诊断均为 `No errors found`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已经满足 todo 中 `3` 组高风险切片的验收要求，但 register 页仍保留与 login 页相同的“失败后补刷 session”形态，friend-links 公开链路也仍只有既有失败守线；二者应保留为下一轮候选，而不是误写成认证退化与公开失败口径已经全域收口。

### 未覆盖边界

- 本轮页面级 auth degradation 只落在 login 页；[pages/register.vue](../../pages/register.vue) 的同构失败补偿链路尚未补同级守线。
- 本轮没有继续扩写 friend-links 公开页失败口径；[pages/friend-links.test.ts](../../pages/friend-links.test.ts) 的现有加载失败与提交失败断言继续沿用，但未新增本轮专属切片。
- direct TTS 当前只补到“任务创建失败”的可见映射；若后续继续推进，可再考虑浏览器直连上传阶段失败与进度中断的更细 UI 归因。

## 2026-05-18 第三十七阶段归档对账与 Review Gate

### 范围

- 目标：对账第三十七阶段 5 条主线在实现代码、性能 / 长窗口事实源、活动回归窗口与规划文档中的实际落地情况，并完成 `todo.md` 清理、`todo-archive.md` 归档、`roadmap.md` 与多语路线图摘要同步；本轮明确不把下一阶段直接写入正式规划。
- 本轮覆盖：[docs/plan/todo.md](../../docs/plan/todo.md)、[docs/plan/todo-archive.md](../../docs/plan/todo-archive.md)、[docs/plan/roadmap.md](../../docs/plan/roadmap.md)、4 份多语 roadmap 摘要、[docs/i18n/ja-JP/guide/translation-governance.md](../../docs/i18n/ja-JP/guide/translation-governance.md)、[windows-dev-build-performance-governance.md](../../docs/design/governance/windows-dev-build-performance-governance.md) 与本文件近线证据窗口。
- 非目标：不重跑整个第三十七阶段全部历史实现命令，不提前上收下一阶段 Phase 38，也不借归档动作改写 backlog 候选优先级。

### 实施结论

- 第三十七阶段五条主线已具备可追溯证据：Windows 本地性能治理可回链到 [windows-dev-build-performance-governance.md](../../docs/design/governance/windows-dev-build-performance-governance.md) 与相关 `artifacts/nuxt-*-performance.json`；测试有效性与 Postgres 长窗口复核已在本窗口留有 2026-05-18、2026-05-14 与 2026-05-12 的正式记录；ESLint / 类型债与结构复用治理则已在中文规划事实源与对应实现文件中完成闭环。
- [docs/plan/todo.md](../../docs/plan/todo.md) 已清理当前执行面，并明确写出“下一阶段当前仅保留候选分析与准入评估”；没有出现偷写下一阶段正式规划的问题。
- [docs/plan/todo-archive.md](../../docs/plan/todo-archive.md) 与 [docs/plan/roadmap.md](../../docs/plan/roadmap.md) 已统一改写为“第三十七阶段已审计归档”，且多语摘要同步改为相同口径；`ja-JP` 翻译治理页的 freshness 也已同步恢复。

### 已执行验证

- 既有阶段证据复核：
	- [docs/reports/regression/current.md](../../docs/reports/regression/current.md) 中 2026-05-18 第三十七阶段测试有效性切片关闭记录。
	- [docs/reports/regression/current.md](../../docs/reports/regression/current.md) 中 2026-05-14 / 2026-05-12 第三十七阶段 Postgres 长窗口复核记录。
	- [windows-dev-build-performance-governance.md](../../docs/design/governance/windows-dev-build-performance-governance.md) 与相关性能 artifact。
- 本轮归档文档验证：
	- `pnpm lint:md docs/plan/todo.md docs/plan/todo-archive.md docs/plan/roadmap.md docs/i18n/en-US/plan/roadmap.md docs/i18n/zh-TW/plan/roadmap.md docs/i18n/ko-KR/plan/roadmap.md docs/i18n/ja-JP/plan/roadmap.md docs/i18n/ja-JP/guide/translation-governance.md`
	- `pnpm docs:check:i18n`
	- `pnpm docs:check:source-of-truth`
	- 结果：全部通过。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮归档放行依赖的是第三十七阶段已有的切片级回归、性能 / 长窗口事实源与本次文档验证，而不是重新执行一轮统一 `pnpm regression:phase-close`。考虑到当前任务是阶段收口与事实源同步，这一证据组合足以支撑归档，但后续若要统一收紧“归档必须附带固定入口回归”的门槛，需要在规范中先明确豁免边界。

### 未覆盖边界

- 本轮没有重新全量复跑第三十七阶段内所有历史定向测试、性能脚本与数据库 live sample；放行依据继续以既有近线证据和事实源文档为准。
- 下一阶段当前仍只停留在候选分析，没有在中文或翻译 roadmap 中写入正式 Phase 38；后续若上收，仍需单独完成 backlog 去重、ROI 评分与最小验证矩阵设计。

## 2026-05-18 第三十七阶段测试有效性切片（P0）关闭

### 范围

- 目标：围绕第三十七阶段 `测试有效性切片 (P0)`，从前端直连 TTS、AI task `estimated / actual` 口径一致性、认证退化与公开热点读链路中，选择已有测试基座且回归风险最高的 `3` 组路径补失败断言或边界断言，并把新增入口纳入可复用的定向回归矩阵。
- 本轮覆盖：[server/api/ai/tts/task.post.test.ts](../../server/api/ai/tts/task.post.test.ts)、[server/api/admin/ai/stats.get.test.ts](../../server/api/admin/ai/stats.get.test.ts)、[tests/server/api/posts/access-error-mapping.test.ts](../../tests/server/api/posts/access-error-mapping.test.ts) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把本轮退化为 coverage 铺量，不并行扩写组件层 front-end direct TTS 可见错误映射，也不重复补已经由 [tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts) 守住的认证退化基础边界。

### 实施结论

- [server/api/ai/tts/task.post.test.ts](../../server/api/ai/tts/task.post.test.ts) 现已补齐 post-backed 内容与翻译元信息透传边界，以及“文章不存在 `404`”与“作者越权访问他人文章 `403`”两条失败断言，避免前端直连 TTS 与后台任务共用入口在 postId 分支上只剩 happy path 守线。
- [server/api/admin/ai/stats.get.test.ts](../../server/api/admin/ai/stats.get.test.ts) 新增 `estimatedCost / estimatedQuotaUnits` 与 `actualCost / quotaUnits` 独立聚合守线，并验证“全部任务仍处于 pending 时 `successRate / failureRate` 保持 `0` 而不是漂移或算出异常比例”，满足本轮“至少一组统计一致性回归”的验收要求。
- [tests/server/api/posts/access-error-mapping.test.ts](../../tests/server/api/posts/access-error-mapping.test.ts) 已把 `/api/posts/home` 纳入统一 `503 POST_ACCESS_STATE_UNAVAILABLE` 错误映射矩阵，补齐公开热点读链路里此前缺失的 home 入口，与 `/api/posts`、`/api/posts/archive`、`/api/search` 及详情接口保持一致。
- 认证退化路径本轮没有继续扩写，因为 [tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts) 已覆盖 targeted public routes、connection-only 初始化与 session lookup failure swallow；相较之下，本轮新增的三处缺口更能直接区分高回归风险。
- 本轮可复用的定向回归矩阵已固定为：`pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`
	- 结果：通过；`3` 个文件、`14` 个测试全部通过（`0` 失败）。
- Markdown lint：`pnpm exec lint-md docs/reports/regression/current.md docs/plan/todo.md`
	- 结果：通过；[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md) 无新增格式或链接告警。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已完成 todo 要求的 `3` 组高风险切片，但认证退化的页面级联动、前端直连 TTS 组件层错误映射与 `settings/public` / friend-links 公开链路的更细失败口径仍未纳入本轮范围，需要保留为下一轮候选，而不是误写成“测试有效性已全域收口”。

### 未覆盖边界

- 组件层 front-end direct TTS 仍只守成功直连与 confirm 提交流程，`/api/ai/tts/task` 创建失败后的可见错误映射没有在 [components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 里重新落地。
- 认证退化当前只守住 server middleware 的边界；登录、注册与 header/profile 等页面级 session 刷新退化联动没有并入这轮定向矩阵。
- 公开热点读链路本轮只补齐了 `/api/posts/home` 的访问状态错误映射，不等于 [tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 或 friend-links 公开入口的失败口径已经完成统一治理。

## 2026-05-14 第三十七阶段 Postgres P1 长窗口复核关闭：Neon 样本确认无持续占用窗口

### 范围

- 目标：使用用户补充的 2026-05-14 Neon query performance 与 system operations 长窗口样本，判断第三十七阶段 Postgres P1 是否已经满足关闭条件，并把剩余候选收敛回 [docs/plan/backlog.md](../../docs/plan/backlog.md)。
- 本轮覆盖：[docs/plan/todo.md](../../docs/plan/todo.md)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/backlog.md](../../docs/plan/backlog.md)。
- 非目标：不新增数据库连接池参数调优，不继续扩写新的公开读链路改造，也不在本轮重拆 `initializeDB()` 维护职责。

### 实施结论

- 2026-05-14 的 Neon query performance 样本里，当前最重 SQL 仍以一次性 TypeORM metadata introspection 为主，包括 `information_schema.columns`、`pg_index`、table comment / constraint 探测与单次 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`。这说明现阶段最显著的 CPU 热点仍然是冷启动初始化探测，而不是某条持续运行的业务读查询。
- 业务查询热点已经明显收敛：首页 posts public list 的 `DISTINCT + IN (...)` 查询对仍是当前最重的业务组，但 tags slug、posts 列表、精选友链与 `settings/public` batched `IN (...)` 读取都落在低毫秒级，不再支持“有某条常驻业务 SQL 持续把连接窗口拉长”的判断。
- 同日 System Operations 记录显示，在 `5` 分钟 autosuspend 延迟下，compute 全天持续发生成功的 `start / suspend` 交替，没有出现长时间维持 Active、不进入 suspend，或 suspend 失败持续堆积的现象。这直接否定了“当前仍存在数据库连接长时间不释放”的阻塞级结论。
- 结合 2026-05-12 已落地的两步最小治理，即 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 的非生产环境 Cron 默认门禁收紧，以及 [server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) / [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 的连接级初始化收紧，本条第三十七阶段 Postgres P1 已完成“长窗口样本复核 -> 最小治理动作 -> 可追溯关闭结论”的闭环。
- 剩余候选已回收至 backlog：请求入口组只保留“继续审计剩余显式 `initializeDB()` 调用点”这一更窄的后续方向；公开热点读链路组则继续聚焦首页 posts public list 查询对及其相邻装配路径，而不是继续把本条已关闭的 P1 主线扩写成新的全站治理。

### 已执行验证

- 长窗口证据复核：用户提供的 2026-05-14 Neon query performance 与 system operations 样本。
	- 结果：通过；最重热点已收敛为冷启动 metadata introspection 与首页 posts public list 查询对，compute 活跃窗口恢复为正常 `start / suspend` 交替。
- 既有实现验证：沿用 2026-05-12 已通过的定向测试与类型检查。
	- 结果：通过；`pnpm exec vitest run server/plugins/task-scheduler.test.ts`、`pnpm exec vitest run tests/server/middleware/db-ready.test.ts tests/server/middleware/auth-optional-session.test.ts` 与 `pnpm exec nuxt typecheck` 已在前一轮实现收口中全部通过。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：当前仍能在冷启动窗口看到 TypeORM metadata introspection 的一次性成本，首页 posts public list 查询对也仍是下一轮最值得继续瘦身的业务组；但这些都已退回 backlog，不再阻塞第三十七阶段这条 P1 主线关闭。

### 未覆盖边界

- 本轮关闭依据的是托管侧 Neon 长窗口观测，不是同窗口的自建 `pg_stat_statements` 采样；它足以回答“是否仍存在长期不释放连接”的问题，但不等价于对所有 SQL 指纹做更细的 rows / calls / plan 级分析。
- 本轮不会移除首次真正需要数据库时出现的初始化探测成本，也不意味着首页 posts public list 查询对已经完成下一阶段瘦身；如果后续样本重新出现异常长活跃窗口，仍需按 backlog 候选重新切一轮更小的实现或采样任务。

## 2026-05-12 第三十七阶段 Postgres P1 长窗口复核：自部署 Cron 与请求入口连接级初始化收紧

### 范围

- 目标：基于用户提供的 Neon compute operations 与 Top SQL 长窗口样本，先解释“为何数据库连接窗口被持续拉长”，并只落地一组最小、可回退的治理切片。
- 本轮覆盖：[server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts)、[server/plugins/task-scheduler.test.ts](../../server/plugins/task-scheduler.test.ts)、[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts)、[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts)、[tests/server/middleware/db-ready.test.ts](../../tests/server/middleware/db-ready.test.ts)、[tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts)、[docs/plan/todo.md](../../docs/plan/todo.md)、[docs/guide/variables.md](../../docs/guide/variables.md) 与 [docs/guide/deploy.md](../../docs/guide/deploy.md)。
- 非目标：不并行扩写为全站数据库连接池重构，不在同一轮同时改动更多公开热点读链路，也不继续拆分 `initializeDB()` 的维护职责。

### 实施结论

- 长窗口样本里最重的一组 SQL 以 TypeORM metadata introspection、`information_schema` / `pg_catalog` 探测与 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` 为主，说明压力核心更接近“初始化 / 维护链”而不是某条公开读接口的普通查询体量。
- 结合 compute operations 的时间节奏复核后，本轮首先锁定到 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts)：自部署 Cron 默认主任务频率为每 `5` 分钟一次，且过去在非 serverless 环境下会直接注册。对于“本地 dev 连远端 Neon”这类场景，这会持续周期性唤醒数据库，并把 compute 活跃窗口拉长，外观上接近“连接一直没有释放”。
- 当前已落地最小治理：内置 Cron 改为“仅生产环境自动注册；开发/测试环境需要显式设置 `ENABLE_CRON_JOB=true` 才启用”。这样不会影响生产调度闭环，但能直接切断本地联调场景下默认的 `5` 分钟数据库唤醒源。
- 随后沿请求入口组继续审计后，[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) 与 [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 已从完整 `initializeDB()` 收紧为 `initializeDatabaseConnection()`：请求级数据库预热与可选 session 解析现在只确保连接与实体元数据可用，不再把 `syncAdminRoles()` 与 `repairLegacyPostVersionRecords()` 维护链拖进公开请求首跳。
- 这次收紧与 [server/database/index.ts](../../server/database/index.ts) 现有职责注释保持一致：连接级初始化继续服务安装态探针、请求预热与鉴权自保，完整 `initializeDB()` 仍由定时任务、seed 插件或显式调用入口承担维护型动作，不会因为这轮请求级收紧而变成死路径。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run server/plugins/task-scheduler.test.ts`
	- 结果：通过；`4` 个测试全部通过，覆盖生产默认启用、非生产默认跳过、serverless 禁用与生产 eager health check 四条边界。
- 定向 Vitest：`pnpm exec vitest run tests/server/middleware/db-ready.test.ts tests/server/middleware/auth-optional-session.test.ts`
	- 结果：通过；`13` 个测试全部通过，确认请求级数据库预热与可选 session 解析已经改为连接级初始化，且不再误触完整 `initializeDB()`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已切断一个高概率周期性唤醒源，并收紧了当前已确认的请求入口误触面；但是否还存在其它首次请求或后台路径会把完整 `initializeDB()` 维护链放大到长窗口样本中，仍需下一轮 live sample 继续确认。

### 未覆盖边界

- 本轮没有改动 PostgreSQL pool 的 `idleTimeoutMillis` / `maxLifetimeSeconds` 等连接池参数，也没有引入 `DataSource.destroy()` 生命周期钩子；如果后续证据表明仍存在非 Cron 场景的活跃连接拖尾，需要再单独评估这条切片。
- 本轮没有继续改造 `initializeDatabaseConnection()` 与 `initializeDB()` 的职责边界，因此 Top SQL 中与完整初始化维护链相关的 metadata introspection 仍可能在首次真正需要数据库的路径上出现，但不会再被本地默认 Cron 或当前这两条请求级中间件重复放大。

## 2026-05-04 至 2026-05-06 历史窗口归档

- 2026-05-04 至 2026-05-06 的第三十四 / 三十五阶段回归记录已滚动迁移到 [archive/2026-05-04-to-2026-05-06.md](./archive/2026-05-04-to-2026-05-06.md)。
- 迁移后本文件仅保留近线窗口记录，历史窗口继续通过 archive 分片检索。


## 近线窗口外历史入口

- 2026-05-04 至 2026-05-06 的第三十四 / 三十五阶段回归记录已归档到 [archive/2026-05-04-to-2026-05-06.md](./archive/2026-05-04-to-2026-05-06.md)。
- 2026-05-01 至 2026-05-02 的第三十二阶段收口与阶段切片记录已滚动归档到 [archive/2026-05-01-to-2026-05-02.md](./archive/2026-05-01-to-2026-05-02.md)。
- 2026-04-21 至 2026-05-01 的第三十/三十一阶段回归记录（治理切片 + 归档复核）已整体迁移合并到 [archive/2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md)。