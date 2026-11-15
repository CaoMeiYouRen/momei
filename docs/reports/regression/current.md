# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:ui:consolidated-review:2026-11-15 -->
## 2026-11-15 编辑器 AI 审校合并（Phase C）

- 执行入口: 第七十六阶段条目 3；单按钮并行调用 `/api/ai/review` + `/api/ai/perspective-check`
- 证据 artifact: `artifacts/review-gate/2026-11-15-consolidated-review.md` / `artifacts/review-gate/2026-11-15-consolidated-review-v3.json`
- 结果摘要: `Pass`；新面板 `PostEditorConsolidatedReviewPanel` 双 Tab（问题修正 / 视角建议）+ editor/reader 切换；旧两个侧面板零引用但保留至验收（回滚边界）。
- 已执行验证: 相关 4 套件 79 例通过；V3 浏览器探针 6/6（并行调用、Tab 计数、视角结果、读者视角刷新、关闭）；`typecheck` 0、定向 `eslint` / `stylelint` 0、`i18n:check-sync` / `audit:missing` 通过、`pnpm build` 成功。
- 回归窗口: 缓存键纳入 `language` + mode，零结果也参与缓存；部分失败降级 warning 并在面板内提示，重试成功清除失败分段；双失败不新开面板。
- Review Gate: 见证据文件；生产改动集中在编排 / 面板 / 入口 3 个文件，i18n 五语 + 测试同批。
- 未覆盖边界: 旧面板组件的删除、单段 retry 按钮、移动端视觉回归；真实 AI 配额与延迟未测（接口由探针伪造）。
<!-- regression-window:end:ui:consolidated-review:2026-11-15 -->

<!-- regression-window:start:coverage:batch17:2026-11-15 -->
## 2026-11-15 覆盖率第十七批（脚本四模块）

- 执行入口: 第七十六阶段条目 5；干净全量口径（移 `.vitest-cache` / `.vitest-cache-coverage` + `--maxWorkers=4`）
- 证据 artifact: `artifacts/coverage/phase76-batch17-baseline/coverage-final.json` / `artifacts/coverage/phase76-batch17-final/coverage-final.json`
- 结果摘要: 全仓 statements `31,597 / 38,076 = 82.98%` → `32,484 / 38,103 = 85.25%`（`+887` 覆盖，分母 `+27`，`+2.27pp`，远超 `+0.3pp` 目标）；四模块 `scripts/i18n/audit-duplicate-messages.mjs` 50→288/291、`scripts/ai/check-governance.mjs` 108→351/352、`scripts/governance/inventory-eslint-rules.mjs` 16→230/231、`scripts/testing/capture-visual-reference.mjs` 39→226/229；`vitest list` 口径 622 文件 / 5,644 例。
- 已执行验证: 9 个相关套件 193 例通过；新增 4 个测试文件（155 例，连跑 3 轮 155/155 无 flaky）；本批 8 文件 `eslint` 0 error / 0 warning、全仓 `eslint .` 0 error / 10 warning（均为既有文件的既有规则：`max-lines` 3 / `max-lines-per-function` 1 / `max-statements-per-line` 3 / `no-misused-promises` 2 / `no-misused-spread` 1）、`typecheck` 0；本批四模块均 ≥98% statements。
- 回归窗口: 分母 `+27` 来自四个脚本为测试注入新增可选参默认值（check-governance `+11` / capture `+15` / audit `+1`），文件集合不变（779）；同集合比较 `+2.27pp`。四模块增量合计 `+882`，其余 `5` 条为新增用例确定性触达的共享模块（`scripts/shared/cli.mjs` +4、`scripts/governance/check-script-governance.mjs` +1），非随机波动。
- Review Gate: 见本轮审计结论；生产改动均为 `export` + 带默认值的依赖注入，CLI 入口行为不变。
- 未覆盖边界: 四模块剩余 8 条未覆盖语句均为入口/加载器——`audit-duplicate-messages.mjs` 的 `isDirectExecution` 入口块 3 条，`check-governance.mjs` / `inventory-eslint-rules.mjs` / `capture-visual-reference.mjs` 的入口各 1 条，以及 capture 默认 `loadPlaywrightChromium` 动态导入 2 条；import 场景不可达。Windows `cmd.exe` 分支属平台不可达（仅分支未覆盖，不计入语句）。
<!-- regression-window:end:coverage:batch17:2026-11-15 -->

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

