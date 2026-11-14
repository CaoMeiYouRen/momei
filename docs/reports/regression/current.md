# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:maintenance:node26-runtime-baseline:2026-11-14 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-14 -->
## 2026-11-14 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-14-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-14-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 89 行 / 7 条（生成时快照），归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-14 -->

## 2026-11-14 Node 26 运行时基线单点化

- 执行入口: 第七十五阶段条目 7（插队）；`.nvmrc` 单点 + `engines` / CI / Docker 同源
- 证据 artifact: `../../../artifacts/review-gate/2026-11-14-node26-runtime-baseline.md`
- 结果摘要: `Pass`；Node 26.13.1 下 `build` 1m52s、全量单测 609 文件 / 5,456 例通过（1 跳过）、`test:visual` 32/32、`test:visual:parity` 83/83、`test:perf:budget:strict` PASS（coreEntryJs 280.87/335KB、keyCss 59.41/62KB）。
- 已执行验证: `install --frozen-lockfile`（无 `Unsupported engine`）、`pnpm rebuild better-sqlite3`（node-v147 prebuild）、`.output` 与容器双探针（`/api/install/status` 200、DB 36 表可读写）、`lint` 0 error / 10 warning、`lint:css` / `lint:i18n` / `typecheck` 0、`docs:check` 五项 PASS。
- 回归窗口: 运行时基线从「engines 24.x / Docker 24.22.1 / CI `lts/*`」三处漂移收敛为 `.nvmrc` 单点；视觉 / parity / 包体结论均在 Node 26 产物上复测。
- Review Gate: `Pass`（standard 档，并发双审）；首轮 audit B 为 `Reject`（治理文档链接指向未入库的 `artifacts/`），修复后 Round 2 双 `Pass`；已接受口径差异与环境性偏差见证据文件。
- 未覆盖边界: CI run（`node: v26.13.1` 且无 `Unsupported engine`）待推送回填；`devcontainer.json` 仍为 Node 24 镜像，升级需同批替换 corepack 引导，另立条目。
<!-- regression-window:end:maintenance:node26-runtime-baseline:2026-11-14 -->

<!-- regression-window:start:maintenance:caomei-ui-upgrade:2026-11-14 -->
## 2026-11-14 caomei-ui 1.0.0 → 1.2.0 维护批次

- 执行入口: 人工升级（迁移期纪律），升级后撤销人工通道
- 证据 artifact: `../../../artifacts/review-gate/2026-11-14-caomei-ui-1.2.0.md`
- 结果摘要: `Pass`；blocker=0，warning=1（`caomei-hit-target` 引入的 `position: relative` 对依赖外层定位上下文的页面存在潜在影响，当前无差异）。
- 已执行验证: typecheck=0 error、build=success、`test:visual`=32/32、`test:visual:parity`=83/83（残差与升级前同序）、全量单测=608 文件通过 / 1 跳过（共 609）、5,451 例通过、包体 `coreEntryJs` 280.85/335KB（+0.22KB）、`keyCss` 59.41/62KB（+0.29KB）、`maxAsyncChunkJs` 92.79/130KB 不变。
- 回归窗口: 本窗口只记依赖升级；palette / token 桥接与视觉基线均无改写。
- Review Gate: `Pass`（standard 档）；上游 1.1.0 / 1.2.0 无 BREAKING，0 个 prop 移除。
- 未覆盖边界: 新增能力（Form 组合层 / DatePicker range / Toast 逐语气钩子 / data-density）未采纳；依赖通道由人工改为 Dependabot 常规更新，下一轮自动升级首次验证在对应 PR 上进行。
<!-- regression-window:end:maintenance:caomei-ui-upgrade:2026-11-14 -->

