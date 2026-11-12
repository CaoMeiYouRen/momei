# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 当前进行中阶段

**第七十四阶段：工具链现代化、门禁转阻断与存量缺陷收口（筹备中，6 条待开工）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-12，用户确认「方案 A + B 为基础」并额外纳入 i18n 重复键收敛与 UI 字阶治理首批。开工前置：`HEAD=e24d9c91` 的 CI `Test`（run `43143666740`）与 `Publish Docker Image` 需为 success（规划时仍在运行）；失败按 B 类插队先修。

- [x] **1. 依赖与静态规则现代化（P1）**
    - **执行范围**: **1a js-yaml 5**——定 override 归属（推荐裸名抬至 `^5.5.0`，`read-yaml-file>js-yaml: ^3.14.1` 保留），8 处默认导入改 `{ load, dump }`（`packages/cli/src/{hugo-parser,post-formatter,parser}.ts`、`server/services/post-export.ts`、`composables/use-post-editor-io.ts`、`scripts/ai-hooks/session-governance-shared.mjs`、`scripts/ai/check-governance.mjs`、`scripts/security/validate-override-patched-versions.mjs`），移除 `@types/js-yaml`，复核 `parser.ts` 自定义 YAML 引擎的 `load` 签名。**1b ESLint #262 首批**——扩 `governance:inventory:eslint-rules` 扫描面（全仓、目录分桶）产出「规则 × `configuredSeverity` × `effectiveSeverity` × 命中数」表；候选须同时满足「配置值 `[0]`」且「未被 `strictTsRuleOverrides` 覆盖」，首批取 `ban-ts-comment`（备选 `no-extraneous-class`），命中数落盘后升 `[1]` 并清零。**1c stylelint 18 配对升级**——`stylelint` 17.16.0 → `18.0.0` 必须与 `stylelint-config-cmyr` 1.0.0 → `^1.1.0`（peer `stylelint: ^18.0.0`，2026-11-11 发布）成对升级：18.0.0 已删除 `declaration-block-single-line-max-declarations`，单升主包会被 `stylelint-config-standard` 的旧配置命中 176 处 `Unknown rule`；且 `package.json` 声明的是 `^1.0.0`，已满足 `1.1.0`，Dependabot 不会自动带出配置包（PR #1008 即因此红）。该规则由上游删除，本项目不新增等价规则（属上游规则退役，非主动放宽）。同步复核 `stylelint.config.js` / `.stylelintignore` 口径，成对升级后合并或关闭 PR #1008。
    - **非目标**: 不一次性启用全部未覆盖规则（25 条 `[0]` 条目中除已 override 的 7 条外）；除 1c 的 stylelint 与配置包配对外的其他依赖升级不连带；不改 frontmatter 兼容策略；不为过规则放宽既有 `max-lines` / 测试豁免；不为通过 stylelint 18 新增或放宽样式规则。
    - **验收标准**: `js-yaml` 解析 5.5.0 且 `security:validate-overrides` Pass；hexo / hugo / wordpress frontmatter 与 CLI 导入导出定向测试通过；`typecheck` / `lint` 0 error、`build` 成功；ESLint 新规则命中清零，`pnpm lint` warning ≤ 10（不以放宽 `--max-warnings 10` 换绿）；`stylelint` 18.0.0 + `stylelint-config-cmyr` `^1.1.0` 下不带 `--fix` 的 `pnpm exec stylelint ./**/*.{html,css,scss,sass,vue}` 0 error（2026-11-12 已在本地以 18.0.0 + 1.1.0 验证全仓 0 error）且 `git diff --quiet -- '*.scss' '*.vue' '*.css' '*.sass' '*.html'` 证明无样式改写，CI `Test` 绿且 PR #1008 已合并或关闭。**kill-switch**: js-yaml 5 在 Nitro / CLI 双入口的 ESM-CJS 互操作失败且一轮修不好时回退 override 并写回 backlog。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；override 解析结果、inventory 前后计数、stylelint 18 前后不带 `--fix` 的全仓 `stylelint` 扫描结果与 PR #1008 合并 / 关闭结论、定向测试结论写入 `artifacts/review-gate/`。
    - **回滚边界**: js-yaml 的 override / 锁文件 / 8 处导入同批 revert；ESLint 规则与切片可单独回退；stylelint 与配置包 + 锁文件同批 revert（恢复 17.x + 1.0.0）。

- [ ] **2. 质量门禁硬化（P1/P2）**
    - **执行范围**: **2a 视觉 parity 转阻断**——在 ubuntu runner 以 CI 产物复采 41 路由 / 82 张参考态（含第二实例安装向导），刷新 `tests/visual/parity-budget.json`（未归因差异 0），移除 test.yml visual job 的 `continue-on-error`，同步 test.yml 注释、[门禁 §7](../design/governance/2026-10-13-visual-parity-gate.md) 与 [测试规范 §7.2](../standards/testing.md#72-视觉一致性门禁-visual-parity-gate)。**2b 入口包体护栏**——产出入口 chunk 构成清单（manifest entrypoints + preload 去重、按模块分桶、top consumers 落盘），至少 1 项可量化收敛（动态导入 / 预载裁剪 / 去重），或按实测重定标并写入 `bundle-baseline.json` 与 [性能规范](../standards/performance.md)。
    - **非目标**: 不放宽 `reader` 档 0.3% / 2000px；不做全站代码分割重构；不为压包体牺牲首屏可见内容；34 张迁移前原貌存档另案决策；不连带 CWV 全量治理。
    - **验收标准**: CI 在 master 连续 2 次 parity 与 baseline 层全绿、`continue-on-error` 已移除、未归因差异 0、预算刷新逐条可查；`test:perf:budget:strict` Pass，收敛后余量 ≥ 8%；重定标须经用户确认、给出「为何不能收敛」的证据，新余量下限 ≥ 5%。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + V4 + RG；参考态复采记录、预算 diff、入口构成清单与本阶段回归记录。
    - **回滚边界**: 参考态与预算刷新同批 revert（并恢复 `continue-on-error`）；入口收敛按文件组独立回滚，重定标可单独回退。

- [x] **3. 存量缺陷修复批（P1）**
    - **执行范围**: **3a** `server/api/admin/creator-stats.get.ts` 按 `dbType` 分支或改用可移植聚合（评估 `%G` / `%V` 或应用层聚合，`%W` 不是 ISO 周编号），补 SQLite 三档 `range` 与跨年边界测试。**3b** `styles/pages/_admin-dashboard.scss` 的 `respond-to("md")` 改 `respond-below("md")`，核对 1280 / 1024 / 768 / 375 四档。**3c** `server/database/typeorm-adapter.ts` 的 `transformOutput` 回写时跳过 `id` 或回写后 `transformedData.id ??= data._id`，补「只有 `_id` 时仍输出 id」断言。
    - **非目标**: 不改 creator-stats 聚合粒度与响应字段；不重做仪表盘信息架构；不重写适配器 id 映射策略。
    - **验收标准**: SQLite 下 `range=7/30/90` 均 200 且周 / 月分组正确（含跨年）；1440px 三卡同行、四档无回归；适配器 `_id` 回填有单测；`typecheck` / `lint` 0 error。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；接口响应、`getComputedStyle` / 截图与适配器断言写入 `artifacts/review-gate/`。
    - **回滚边界**: 三处修复按文件独立回滚。

- [x] **4. i18n 重复键收敛（P2）**
    - **执行范围**: 按分桶（跨模块 `status` / 通用动作 / 空态 / 时间）收敛 ≥25 组：跨模块同文案合并为 `common.*` 共享 key 并迁移全部引用与五语；剩余组登记 allowlist（组 id + 理由 + 复核日期），脚本读取并在误报时判红。
    - **非目标**: 不重命名业务语义 key；不合并「值相同但语义不同」的组；不动原文级扫描口径。
    - **验收标准**: 组数 ≤ 74；`i18n:check-sync` 五语一致、`i18n:audit:missing` 0、`i18n:verify:runtime` 通过；allowlist 落盘且有单测钉住读取 / 误报判红。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`i18n:audit:duplicates` 前后输出与 allowlist 文件。
    - **回滚边界**: key 合并与引用替换同批 revert；allowlist 可单独回退。

- [ ] **5. UI 字阶治理首批（P2）**
    - **执行范围**: 产出 `font-size:` 分桶报告（503 条 / 字号值 × 目录 × 文件），定义 `--m-font-size-*` 字阶（或复用 caomei 字阶 token），试点公开页 3–5 文件 + 管理端 3–5 文件，只做等价替换。
    - **非目标**: 不做全量替换；不做暗色 tint；不改 [界面自检清单](../design/ui-review-checklist.md) U1–U6 边界。
    - **验收标准**: 分桶报告落盘；试点文件 `getComputedStyle` 字号与治理前逐项一致；`test:visual` / `parity` 通过且未归因差异 0；`lint:css` 0 error。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；分桶报告、字号对账表与截图。
    - **回滚边界**: 字阶 token 与试点文件同批 revert；报告可单独撤出。

- [ ] **6. 覆盖率第十五批（P2）**
    - **执行范围**: 按绝对未覆盖语句数取 4 模块且含 ≥1 大基数（候选 `use-tts-volcengine-direct` 166 / `agreements-settings` 163 / `ai-image-generator` 138 / `use-asr-direct` 91 / `use-post-editor-voice` 87），目标单批 `+0.3pp`（约 111 条）或模块级 `+15pp / ≥85%`。
    - **非目标**: 不为凑数测 getter / 模板分支；不重构测试结构；不新增测试依赖。
    - **验收标准**: 干净全量跑（移走 `.vitest-cache` + `--maxWorkers=4`）基线 / 收口，statements delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因记录。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

> 上一阶段归档：第七十三阶段「迁移后质量收尾与门禁硬化」已于 2026-11-11 完成全部 6 条条目并归档，正文见 [roadmap 归档分片](./archive/roadmap-phases-73.md)、条目明细见 [待办事项归档](./todo-archive.md)、回归窗口见 [2026-11-10 至 2026-11-11 分片](../reports/regression/archive/2026-11-10-to-2026-11-11-phase73.md)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
