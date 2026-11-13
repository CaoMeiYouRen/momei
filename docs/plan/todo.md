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

**第七十五阶段：依赖与静态规则收口、字号归一与治理口径统一（6 条待开工）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-13，用户确认「方案 A：治理收口」。开工前置：`HEAD=49e7a078` 的 CI 全绿（Test / Docker / VitePress / TODO）。

- [ ] **1. 依赖安全收口（P1）**
    - **执行范围**: **1a minimatch / glob**——GHSA #286（minimatch `>=7.0.0 <11.0.1`，修 11.0.1）与 #284（glob `>=9.0.0 <=14.0.1`，修 14.0.2）当前解析到 10.2.5 / 10.2.6 与 10.5.0 / 11.1.0 / 13.0.7 / 14.0.4；先 `pnpm why` 列消费链，按父级 scoped override 定向抬版，禁止裸名跨大版本强推。**1b 无补丁项**——deepmerge 4.3.1（#275）与 quill 2.0.3（#22）登记安全 allowlist / 告警豁免台账，写明影响面、不可修原因与复核日期（≤6 个月）。
    - **非目标**: 不做依赖全量升级；不为变绿关闭或放宽安全门禁；不连带其他 Dependabot 项。
    - **验收标准**: 2 条 medium 关闭或按 [安全规范 §5.3](../standards/security.md#53-发布前安全告警门禁-release-security-alert-gate) 受控豁免并留证据；`security:audit-deps` relevant risks 0 与 `security:alerts` Pass；`install --frozen-lockfile` / `security:validate-overrides` / `lint` / `typecheck` / 定向测试通过；台账每条含理由与复核日期。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`pnpm why` 清单、override diff、audit / alerts 输出写入 `artifacts/review-gate/`。
    - **回滚边界**: override 与锁文件同批 revert；台账条目可单独回退。**kill-switch**: 定向 override 破坏构建且一轮修不好时转受控豁免并登记上游跟踪。

- [ ] **2. ESLint #262 第二批（P2）**
    - **执行范围**: 升档并清零 4 条规则（22 命中 / 17 文件）：`prefer-reduce-type-parameter`（2 / 2）、`no-extraneous-class`（3 / 3）、`restrict-plus-operands`（6 / 4）、`non-nullable-type-assertion-style`（11 / 8）；同步 `eslint-debt-targets.mjs`、`eslint.config.js` 注释、inventory baseline，并回写 issue #262。
    - **非目标**: 不启用 `no-unsafe-*` 系列（233 / 50 / 21 / 19 命中）；不放宽 `--max-warnings 10`；不动测试 / 脚本豁免边界。
    - **验收标准**: 4 条规则命中清零且 effectiveSeverity=1；`pnpm lint` 0 error、warning ≤ 10；inventory 表更新落盘。
    - **验证矩阵 / 证据落点**: V0 + V1 + RG；inventory 前后对照与 lint 输出写入 `artifacts/review-gate/`。
    - **回滚边界**: 按规则独立回退（配置与代码修复同批）。

- [ ] **3. 字号归一与字阶批量替换（P2）**
    - **执行范围**: **A 评估**——149 条非字阶取值（0.85/1.1/0.95/0.8125/0.8/0.7/0.9rem、2rem、2.5rem、0.9em、3rem 等）产出「归一目标 → 受影响组件 / 版式」报告，只对实测 ±0 或经用户确认的档位执行。**B 替换**——剩余 225 处口径内字面量按目录分批改 `var(--m-font-size-*)`（`components/admin/posts` 67 处优先），单批 ≤10 文件。
    - **非目标**: 不新增字阶档；不改 U1–U6；不做暗色 tint；未评估的 `clamp()` / `em` 不动。
    - **验收标准**: 评估报告落盘 `docs/design/governance/`；每批 `getComputedStyle` 逐元素对账 0 差异（浅 / 深）、`test:visual` / `parity` 通过且未归因差异 0、`lint:css` 0 error；token 覆盖率单调上升。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；分桶前后报告、对账 JSON 与截图写入 `artifacts/review-gate/`。
    - **回滚边界**: 每批独立可回滚；token 定义与首批同批 revert。

- [ ] **4. i18n allowlist 复核与公开页 runtime 审计（P2）**
    - **执行范围**: 64 组 / 149 keys / 33 跨模块按三类复核（动态拼接改显式静态映射、模块内语义不同保留、跨模块对象语义不同评估上收 `common.*`）；allowlist 每条补理由 + 复核日期；归档 / 分类 / 标签列表页纳入 `i18n:verify:runtime`。
    - **非目标**: 不重命名业务语义 key；不合并「值同义不同」组；不动原文级扫描口径；不新增语种。
    - **验收标准**: 组数下降或 allowlist 100% 有理由与日期；`i18n:check-sync`、`i18n:audit:missing` 0、`i18n:verify:runtime` 通过；未登记新增仍判红。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；前后输出与 allowlist diff 写入 `artifacts/review-gate/`。
    - **回滚边界**: key 合并与 allowlist 独立回滚。

- [ ] **5. 覆盖率第十六批（P2）**
    - **执行范围**: 4 模块含 ≥1 大基数：`scripts/ai/check-governance.mjs`（284/341）、`scripts/perf/check-bundle-budget.mjs`（242/258）、`components/admin/posts/ai-image-generator.vue`（138/161）、`composables/use-asr-direct.ts`（58/329 重连时序）；目标同源 `+0.3pp` 或模块级 `+15pp / ≥85%`；同批把「同源文件比较」口径写入 [测试规范](../standards/testing.md)。
    - **非目标**: 不为凑数测 getter / 模板分支；不重构测试结构；不新增测试依赖。
    - **验收标准**: 干净全量跑（移 `.vitest-cache` + `--maxWorkers=4`）基线 / 收口，delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因；规范口径更新。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [ ] **6. 文档与治理口径收敛（P2）**
    - **执行范围**: ① 回归窗口阈值双口径（`index.md` 300–400 行 / 6–8 条 vs 脚本 warn>500 / error>700）收敛为脚本单点，`index.md` 改指针；② `todo-archive.md`（555 行 warning）按近线窗口拆分或给出提升阈值的实测依据；③ `docs/design/governance/` 过期报告巡检（>180 天且已被取代者迁 archive）；④ coverage 同源口径与阶段收口分母说明写入测试规范。
    - **非目标**: 不做全站文档重写；不新增翻译件；不改翻译 tier 阈值。
    - **验收标准**: `docs:check:{line-count,source-of-truth,links,markers}` 全 PASS；`index.md` 与脚本单点一致；巡检与归档清单落盘可查。
    - **验证矩阵 / 证据落点**: V0 + V1 + RG；脚本输出与归档清单写入 `artifacts/review-gate/`。
    - **回滚边界**: 按文件独立回滚。

> 上一阶段归档：第七十四阶段「工具链现代化、门禁转阻断与存量缺陷收口」已于 2026-11-13 完成全部 6 条条目并归档，正文见 [roadmap 归档分片](./archive/roadmap-phases-74.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十四阶段归档结论最近归档阶段)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
