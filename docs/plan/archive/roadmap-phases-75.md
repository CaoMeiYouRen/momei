# 第七十五阶段规划归档：依赖与静态规则收口、运行时基线升级与治理口径统一

> 本分片承接 `docs/plan/roadmap.md` 主窗口迁出的第七十五阶段完整规划正文（2026-11-14 阶段收口归档）。
> 条目执行明细、验收结论与证据见 [待办事项归档](../todo-archive.md) 的第七十五阶段归档块。

---

### 第七十五阶段：依赖与静态规则收口、运行时基线升级与治理口径统一（已审计归档）

**时间表**: 2026-11-13 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第七十四阶段把工具链与门禁转阻断之后，收口「残留的依赖安全告警、静态规则债、Node 运行时基线漂移、i18n 豁免台账与文档口径分歧」，让治理脚本成为单点事实源。本阶段不引入新功能面（字号归一已按容量约束移出至 backlog）。

**准入结论**: 用户于 2026-11-13 在候选页确认「方案 A：治理收口」6 条组合；其余候选（性能专项、功能类）留在 [backlog](../backlog.md)。ROI（Value+Alignment / Difficulty+Risk）：依赖安全 `1.25`、ESLint 第二批 `1.50`、字号归一 `1.50`、i18n 复核 `2.00`、覆盖率 `1.67`、文档口径 `2.50`；依赖安全低于 §3.3 准入线 `1.5`，因含 2 条 medium 告警且为发布门禁输入，经用户确认纳入并保留 kill-switch（仅评估后无法安全抬版时转台账豁免）。**插队变更（2026-11-14）**: 用户决策按「方案 B」把 Node 运行时基线升级到 26 并插队进本阶段；该事项严格分类属 C 类（非阻塞的基线漂移治理），按用户明确指示纳入，并以「进一出一」把条目 3（字号归一）移出至 backlog（长期主线 #11）。Node 26 的 ROI：Value 2 / Alignment 4 / Difficulty 3 / Risk 3 = `1.00`，低于准入线，属决策性纳入而非评分驱动。

**准入前置（已核对 2026-11-13）**: 第七十四阶段已审计归档（`todo.md` 清空、`roadmap.md` 已迁出正文、回归窗口已写入）；工作区干净、`master` 与 `origin/master` 同步于 `49e7a078`，该提交 CI（Test / Docker / VitePress / TODO）全绿；Dependabot open 告警 4 条（minimatch / glob medium，deepmerge / quill low），`@hono/node-server` 两条 medium 已随 2.1.8 关闭。阶段基线：statements 同源口径 `83.31%`（30,815 / 36,989）、`font-size` 声明 455 条（token 化 10.33%、口径内待替换 225 条、非字阶 149 条）、`i18n:audit:duplicates` 64 组 / 149 keys / 33 跨模块、`duplicate-code` 0.39%、`coreEntryJs` 280.63KB / 335KB、`keyCss` 59.12KB / 62KB。

**阶段容量与移出顺序**: 本阶段维持 6 条在办（1 / 2 / 4 / 5 / 6 / 7），条目 3 已于 2026-11-14 按「进一出一」移出至 backlog #11。条目 1 只动 override / 台账；条目 2 只动 ESLint 规则与 17 个文件；条目 4 动 i18n key 与 allowlist；条目 5 是测试批次；条目 6 只动文档与脚本阈值；条目 7 动 `.nvmrc` / `engines` / 7 个 workflow / `Dockerfile` / README 与原生模块冒烟。排程上先做条目 1（发布面阻断）与条目 7（运行时基线，影响后续所有构建与镜像），再做条目 5（收口需要干净基线），其余按编号。若阶段超时，按 6 → 4 → 5 的顺序移出。

1. **依赖安全收口（P1）**: **1a minimatch / glob**——GHSA #286（minimatch `>=7.0.0 <11.0.1`，修 11.0.1）与 #284（glob `>=9.0.0 <=14.0.1`，修 14.0.2）当前分别解析到 10.2.5 / 10.2.6 与 10.5.0 / 11.1.0 / 13.0.7 / 14.0.4：先用 `pnpm why` 列全消费链，按**父级 scoped override** 定向抬版；禁止裸名跨大版本强推（minimatch v3 的 `minimatch(str, pattern)` 与 v10+ 命名导出不兼容），确需裸名必须先证明全部消费者 API 兼容。**1b 无补丁项**——deepmerge 4.3.1（#275，无补丁）与 quill 2.0.3（#22，无补丁）登记 `.github/security/dependency-risk-allowlist.json` 或告警豁免台账，写明影响面、不可修原因、复核日期（≤6 个月），并确认 quill 仅经编辑器链路触达、不进入公开页运行时。**非目标**: 不做依赖全量升级；不为变绿关闭或放宽安全门禁；不连带其他 Dependabot 项。**验收标准**: 2 条 medium 关闭或按 [安全规范 §5.3](../../standards/security.md#53-发布前安全告警门禁-release-security-alert-gate) 受控豁免并留证据；`security:audit-deps` relevant risks 0（high+）与 `security:alerts` Pass；`pnpm install --frozen-lockfile`、`security:validate-overrides`、`lint` / `typecheck` / 定向测试通过；台账每条含理由与复核日期。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`pnpm why` 消费链清单、override diff、audit / alerts 输出写入 `artifacts/review-gate/`。**kill-switch**: 若定向 override 会破坏构建或工具链且一轮修不好，改为受控豁免 + backlog 记录上游修复跟踪，不强行抬版。**回滚边界**: override 与锁文件同批 revert；台账条目可单独回退。

2. **ESLint #262 第二批（P2）**: 按 `governance:inventory:eslint-rules` 全仓分桶结果，把 4 条「配置值 `[0]` 且未被 `strictTsRuleOverrides` 覆盖」的规则升档并清零：`prefer-reduce-type-parameter`（2 命中 / 2 文件）、`no-extraneous-class`（3 / 3，`server/services/adapters`）、`restrict-plus-operands`（6 / 4，`server/services`）、`non-nullable-type-assertion-style`（11 / 8，`server/api/posts`），合计 22 命中 / 17 文件；同步 `scripts/governance/eslint-debt-targets.mjs`、`eslint.config.js` 注释与 baseline，并在 issue #262 回写本批清单。**非目标**: 不启用 `no-unsafe-*` 系列（233 / 50 / 21 / 19 命中，需单列条目）；不为通过而放宽 `--max-warnings 10`；不动测试 / 脚本豁免边界。**验收标准**: 4 条规则命中清零且 effectiveSeverity=1；`pnpm lint` 0 error、warning ≤ 10；inventory 的「规则 × configured × effective × 命中数」表更新落盘；issue #262 附批次记录。**验证矩阵 / 证据落点**: V0 + V1 + RG；inventory 前后对照与 lint 输出写入 `artifacts/review-gate/`。**回滚边界**: 按规则独立回退（配置与代码修复同批）。

3. ~~**字号归一与字阶批量替换（P2）**~~ **【已移出，2026-11-14 移至 backlog #11】**: **A 评估**——对 149 条非字阶取值（`0.85rem` 17 / `1.1rem` 17 / `0.95rem` 16 / `0.8125rem` 13 / `0.8rem` 11 / `0.7rem` 10 / `0.9rem` 9 / `2rem` 8 / `2.5rem` 6 / `0.9em` 4 / `3rem` 4 等）产出「归一目标 → 受影响组件 / 版式」评估报告，只对实测 ±0 或经用户确认的档位执行归一，未确认的保留在报告内。**B 替换**——按目录分批把剩余 225 处口径内字面量改为 `var(--m-font-size-*)`（`components/admin/posts` 67 处优先），单批 ≤10 文件。**非目标**: 不新增字阶档（如 `2xs`）；不改 [界面自检清单](../../design/ui-review-checklist.md) U1–U6；不做暗色 tint；未评估的 `clamp()` / `em` 用法不动。**验收标准**: 评估报告落盘 `docs/design/governance/`；每批 `getComputedStyle` 逐元素对账 0 差异（浅色 / 深色）、`test:visual` 与 `parity` 通过且未归因差异 0、`lint:css` 0 error；`governance:inventory:font-sizes` 的 token 覆盖率单调上升且无未登记回退。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；分桶前后报告、对账 JSON 与截图写入 `artifacts/review-gate/`。**回滚边界**: 每批独立可回滚；token 定义与首批同批 revert。

4. **i18n allowlist 复核与公开页 runtime 审计（P2）**: 对剩余 64 组 / 149 keys / 33 跨模块按三类复核——① 动态 key 拼接（优先改为显式静态映射，不扩 allowlist）；② 模块内语义不同（保留并写理由）；③ 跨模块对象语义不同（评估是否上收 `common.*`）；allowlist 每条补「理由 + 复核日期」；把归档 / 分类 / 标签列表页纳入 `i18n:verify:runtime` 覆盖。**非目标**: 不重命名业务语义 key；不合并「值同义不同」组；不动原文级扫描口径；不新增语种。**验收标准**: 组数下降或 allowlist 100% 具备理由与日期；`i18n:check-sync` 五语一致、`i18n:audit:missing` 0、`i18n:verify:runtime` 通过；`i18n:audit:duplicates:gate` 对未登记新增仍判红。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`i18n:audit:duplicates` 前后输出与 allowlist diff 写入 `artifacts/review-gate/`。**回滚边界**: key 合并与 allowlist 变更独立回滚。

5. **覆盖率第十六批（P2）**: 按绝对未覆盖语句数取 4 模块且含 ≥1 大基数：`scripts/ai/check-governance.mjs`（284 未覆盖 / 341，16.7%）、`scripts/perf/check-bundle-budget.mjs`（242 / 258，6.2%）、`components/admin/posts/ai-image-generator.vue`（138 / 161，14.3%）、`composables/use-asr-direct.ts`（58 / 329，82.4%，剩余为重连时序与凭据降级分支）；目标同源口径 `+0.3pp` 或模块级 `+15pp / ≥85%`；同批把「分母变化时按同源文件比较」的口径写入 [测试规范](../../standards/testing.md) coverage 小节。**非目标**: 不为凑数测 getter / 模板分支；不重构测试结构；不新增测试依赖。**验收标准**: 干净全量跑（移 `.vitest-cache` + `--maxWorkers=4`）基线 / 收口，delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因记录；规范口径已更新。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

6. **文档与治理口径收敛（P2）**: ① 回归窗口阈值双口径（`docs/reports/regression/index.md` 的「300–400 行 / 6–8 条」与 `scripts/docs/check-line-count.mjs` 的 warn>500 / error>700）收敛为脚本单点，`index.md` 改为指针引用；② `todo-archive.md`（555 行，warning）按近线窗口拆分或给出提升阈值的实测依据；③ `docs/design/governance/` 过期报告巡检：列出 >180 天且已被后续结论取代者，迁入对应 archive 并在索引留链；④ coverage 同源口径与阶段收口的分母说明写入测试规范。**非目标**: 不做全站文档重写；不新增翻译件；不改 MUST-SYNC / SUMMARY-SYNC tier 阈值本身。**验收标准**: `docs:check:line-count` / `docs:check:source-of-truth` / `docs:check:links` / `docs:check:markers` 全 PASS；`index.md` 与脚本口径单点一致；巡检与归档清单落盘可查。**验证矩阵 / 证据落点**: V0 + V1 + RG；脚本输出与归档清单写入 `artifacts/review-gate/`。**回滚边界**: 按文件独立回滚。

7. **Node 26 运行时基线单点化（P1，插队）**: **7a 单点声明**——新增 `.nvmrc` = `26.13.1`，`engines.node` 改 `26.x`，7 个 workflow（`test` / `docker` / `release` / `docs` / `regression-weekly` / `dependency-risk-daily` / `visual-reference-refresh`，共 22 处）改 `node-version-file: .nvmrc` 并同步步骤名。**7b 生产镜像**——`Dockerfile` 的 `NODE_BUILD_IMAGE` / `NODE_RUNTIME_IMAGE` 默认值改 `node:26.13.1-alpine`，保留 `--build-arg` 覆盖与安全版校验白名单。**7c 原生模块与冒烟**——`pnpm rebuild better-sqlite3`，Node 26 构建 `.output` 后启动并验证 `/api/install/status` 与 DB 读写；`docker build` 后容器内复跑同一探针。**7d 文档**——README「依赖要求」改 Node.js 26.13.1+，`docs/standards/development.md` 补一行本地环境要求（指向 `.nvmrc`），`docs/design/governance/2026-11-14-node-26-runtime-baseline.md` 记录升级评估与回退路径。**非目标**: 不升 pnpm / Nuxt / Vite 大版本；不采纳 Node 26 新特性；不改 22 / 24 / 26 安全版校验白名单；不做双版本 CI 矩阵。**验收标准**: `nvm use` 读到 26.13.1；CI 日志 `node: v26.13.1` 且无 `Unsupported engine`；Node 26 下 `install --frozen-lockfile` / `build` / `.output` 探针 200 且 DB 读写正常；Docker 镜像构建成功、容器探针 200；`pnpm test`、`test:visual` 32、`test:visual:parity` 83、`test:perf:budget:strict` 全过；`engines` / `.nvmrc` / workflow / Dockerfile 无 `lts/*` 与版本残留不一致。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + V4 + RG；原生模块重建日志、本地与容器探针输出、CI run 链接、包体与视觉结论写入 `artifacts/review-gate/`。**回滚边界**: `.nvmrc` / `engines` / workflow / `Dockerfile` / README 同批 revert 回 24.22.1 并用旧镜像重建。**kill-switch**: `node:26.13.1-alpine` 不可用或容器冒烟失败时按治理文档 §6 执行（退到最近可用的 26.x 具体补丁标签并同步 `.nvmrc` 与 Dockerfile 双 ARG）；仍失败则回退 24 基线并把本项移回 backlog。

**回滚边界（阶段级）**:

- 条目 1：override 与锁文件同批 revert；台账条目独立回退。
- 条目 2：按 ESLint 规则独立回退。
- 条目 3：按替换批次独立回退；字阶 token 与首批同批 revert。
- 条目 4：key 合并与引用替换同批 revert；allowlist 独立回退。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：按文档 / 脚本文件独立回滚。

**风险提示**: ① minimatch / glob 的裸名 override 会同时改所有消费者，必须先列 `pnpm why` 再定向；② ESLint 升档后若发现规则与 typed lint 作用域冲突，按规则回退而不是放宽；③ 字号归一必然改变渲染，未确认档位不得替换，每批都要 `getComputedStyle` 而非截图对账；④ i18n 合并会改引用点位，必须先脚本列引用再替换；⑤ 覆盖率口径若不先写进规范，下一批仍会出现「百分比下降但实际变好」的误读；⑥ 文档阈值收敛会改变回归归档节奏，需与回归层同批说明；⑦ Node 26 升级会同时改变 CI、镜像与本地基线，必须一次性单点化并保留 `--build-arg` 覆盖能力，容器冒烟不通过时按 kill-switch 回退而不是逐点放宽；⑧ `visual-reference-refresh` 的 Node 版本变化会写进参考态 manifest，切版后首跑 parity 需确认无系统性差异。
