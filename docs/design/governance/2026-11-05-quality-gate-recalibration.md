# 质量门阈值重定标（2026-11-05）

> 第七十阶段收口时，`regression:phase-close` 暴露两项既有阈值越线（首屏包体、重复代码 clone 数）与一项环境性 E2E 失败。经用户 2026-11-05 确认采用「重新定标并记录依据」方案（选项 A），本文件为单点依据；规范与脚本只保留当前口径与回链。

## 1. 触发与结论

| 门禁 | 收口实测 | 原阈值 / 允许值 | 处置 |
| :--- | ---: | ---: | :--- |
| `test:perf:budget:strict`（首屏 JS） | 369,212 B（360.56KB） | 360KB（368,640 B），越线 572 B | 配额上调为 **365KB（373,760 B）**，余量 4,548 B |
| `duplicate-code:check:strict` | 48 clones / 877 行 / 0.5% | 1.22% / 45 clones（允许 1.37% / 47） | 基线重取为 **0.5% / 48 clones**，保留 tolerance（0.15% / 2） |
| `test:e2e`（本地全量） | `seo-regression` 文章详情 `page.goto` 等待 `load` 超时 | required | 改为 `waitUntil: 'domcontentloaded'`；以 CI E2E 4/4 分片为终裁 |

## 2. 首屏包体

- 口径：Nuxt 客户端 manifest 的 `entrypoints` + `preload` JS 去重（`scripts/perf/check-bundle-budget.mjs` 的 `manifest-entry-preload`）。
- 实测：coreEntryJs **369,212 B**（360.56KB）、maxAsyncChunk **56,781 B**（55.45KB）、keyCss **63,336 B**（61.85KB）。
- 增量归因：相对 2026-11-02 基线 365,988 B 增 **3,224 B**；B3 新增均为路由级页面与共享壳，入口增量分散在多个 preload 共享 chunk，未识别到单点可延迟加载目标，故本批不做拆包优化，按「重新定标」处理。
- 新配额：**365KB = 373,760 B**，余量 4,548 B（约 1.2%）。B4 卸载 PrimeVue 后必须复测；若入口未下降或继续增长，先做拆包评估，再决定是否再次重定标。
- 三处同步：`scripts/perf/check-bundle-budget.mjs` 的 `BUDGETS`、`.github/perf/bundle-baseline.json`（metrics + note）、`docs/standards/performance.md` §4.1。
- 回滚：还原上述三处至 2026-11-02 口径（360KB / 365,988 B）即可；不影响业务代码。

## 3. 重复代码

- 扫描：jscpd，1,264 个源文件、48 clones、877 重复行、**0.5%**；原基线 1.22% / 45 clones，允许 1.37% / 47。
- 越线项仅 clone 数 +1（0.5% 远低于原允许上限）；新增重复主要来自 B3 登录 / 注册页的整段结构重复（`login.vue` ↔ `register.vue`，140 行）。
- 处置：基线重取为 `0.5% / 48 clones`，保留 `tolerancePercentage: 0.15` 与 `toleranceClones: 2`（允许 0.65% / 50），并把 `generatedFrom` 指向本次 artifact。
- 复评触发：clone 数达到 50 或重复率达到 0.65% 时，先评估合并共享壳（登录 / 注册优先），再决定是否重定标；不得为过线直接放宽。

## 4. 本地 E2E

- 本地全量 E2E（并行与 `--workers=1`）仅 `seo-regression` 的文章详情用例失败：`page.goto` 默认等待 `load`，页面已渲染但外部资源（封面 / 音频等）悬挂导致 30s 超时。
- 修复：该用例改为 `waitUntil: 'domcontentloaded'`，后续断言仍用 `expect.poll` 等待 meta 就绪，不降低断言强度。
- 终裁证据：CI `Test` run `42016033169`（提交 `49e33066`）全部 job success，E2E 1/4–4/4 分片全部 success。

## 5. 证据

- `artifacts/review-gate/2026-11-05-phase-close-regression.json` / `.md`、`2026-11-05-pre-release.md`、`2026-11-05-security-alerts.json`
- `.lighthouseci/bundle-budget-report.json`（2026-11-05 重跑）
- `artifacts/review-gate/2026-11-05-duplicate-code.json`
- 回归记录窗口「2026-11-05 阶段收口前周期性回归」

## 6. 相关文档

- 当前配额与门禁口径：[性能规范 §4.1](../../standards/performance.md#41-jscss-预算)
- 包体口径与批次轨迹：[迁移方案 §8.4.1](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)
- 阶段证据：[回归记录](../../reports/regression/current.md)
