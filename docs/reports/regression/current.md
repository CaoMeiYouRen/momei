# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:periodic-regression:phase-close:2026-11-21 -->
## 2026-11-21 阶段收口前周期性回归（自动回填）

- 执行入口: `E2E_PORT=3101 E2E_INSTALLATION_PORT=3102 pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-21-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-21-phase-close-regression.json`；映射说明 `../../../artifacts/review-gate/2026-11-21-phase81-close.md`
- 结果摘要: 本机首跑 `test:coverage` 被 2 个既有并发 flake 阻断（`components/app-header.test.ts` drawer 点击、`pages/admin/comments/index.test.ts` 筛选后 fetch 次数）；两文件孤立复跑 24/24 通过。CI Test run `44869703295` 的 Coverage job 通过，作为最终裁决。
- 已执行验证: test:coverage=CI PASS（本地 `--retry=2` 全量 640 passed / 1 skipped）；release:check=11/11 PASS；docs:check:i18n / line-count PASS；test:perf:budget:strict PASS；duplicate-code:check:strict PASS；review-gate:generate:check PASS
- 回归窗口: 52 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass`（本机 flake 已逐例证伪，CI 兜底）。
- 未覆盖边界: 本机 `user-settings-dark` parity 头像差异为本机 TEST_MODE 数据态（CI 83/83），不登记 allowlist；ALS 注入失效为既有缺陷，登记 backlog 国际化主线。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-21 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-19 -->
## 2026-11-19 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-19-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-19-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 46 行 / 2 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 本机运行记录: 第 1 次在 `test:e2e` 被 webkit 管理端导航层 flake（`Frame load interrupted`）与本阶段新增 E2E 的菜单点击时序阻断；第 2 次在 `test (Vitest)` 被 `pages/admin/posts/index.test.ts`「翻译徽标点击」的「点击后立即断言」flake 阻断；第 3 次 `Pass`。前者已给菜单点击加有界重试，后者按第七十九阶段口径补 `settleUi`（该文件连跑 3 次 24/24 通过）。
- 未覆盖边界: 本机 `user-settings-dark` parity 仍有 1 条头像兜底数据态差异（CI 通过，已在偏差处置表登记）；边缘 `cf-cache-status` 未在仓库内验证。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-19 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-18 -->

## 2026-11-18 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-18-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-18-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 39 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-18 -->