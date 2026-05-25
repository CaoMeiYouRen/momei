# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

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
