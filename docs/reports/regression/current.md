# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:periodic-regression:phase-close:2026-11-09 -->
## 2026-11-09 阶段收口前周期性回归（自动回填 + 环境补装复跑）

- 执行入口: `pnpm regression:phase-close`（12 步中 11 步通过）+ 补齐 Playwright 浏览器后单独复跑 E2E
- 证据 artifact: `../../../artifacts/review-gate/2026-11-09-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-09-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=1（E2E 因本机 Playwright 浏览器版本落后于依赖升级后的 Playwright，补装后复跑通过）。
- 已执行验证: test:coverage=PASS（600 passed / 1 skipped，Statements 81.82%）、release:check:full 的 11/12 步 PASS（lint / lint:i18n / i18n:audit:missing / lint:css / lint:md / test / typecheck / docs:check:line-count / docs:check:source-of-truth / security:audit-deps / security:alerts）、docs:check:i18n=PASS、docs:check:line-count=PASS、test:perf:budget:strict=PASS、duplicate-code:check:strict=PASS（0.39%）、review-gate:generate:check=PASS（5/5）。
- 回归窗口: 25 行 / 1 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 补充证据: 补装 chromium / firefox 1572 / webkit 2388 后 `pnpm exec playwright test` **227 passed / 1 flaky / 58 skipped**（6.1m）；包体 `coreEntryJs` 331,206 B / 335KB、`keyCss` 60,482 B / 62KB、`maxAsyncChunkJs` 56,916 B / 130KB（依赖升级后重建产物复测，已刷新基线）。
- 环境说明: 本机 `~/.cache/ms-playwright` 缺少依赖升级后 Playwright 所需的 firefox 1572 / webkit 2388；CI 的浏览器安装步骤自带对应版本，不受影响。E2E 的 1 个 flaky 为既有 webkit 管理端用例（重试通过）。
<!-- regression-window:end:periodic-regression:phase-close:2026-11-09 -->
