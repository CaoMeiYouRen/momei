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

**第七十五阶段：依赖与静态规则收口、运行时基线升级与治理口径统一（条目 3 已移出，条目 1 / 2 / 7 已完成，3 条待办）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-13，用户确认「方案 A：治理收口」；2026-11-14 用户决策插队加入条目 7（Node 26 运行时基线），并按「进一出一」把条目 3 移出至 backlog #11。开工前置：`HEAD=49e7a078` 的 CI 全绿（Test / Docker / VitePress / TODO）。

- [x] **1. 依赖安全收口（P1）**
    - **执行范围**: **1a minimatch / glob**——GHSA #286（minimatch `>=7.0.0 <11.0.1`，修 11.0.1）与 #284（glob `>=9.0.0 <=14.0.1`，修 14.0.2）当前解析到 10.2.5 / 10.2.6 与 10.5.0 / 11.1.0 / 13.0.7 / 14.0.4；先 `pnpm why` 列消费链，按父级 scoped override 定向抬版，禁止裸名跨大版本强推。**1b 无补丁项**——deepmerge 4.3.1（#275）登记安全 allowlist 台账，写明影响面、不可修原因与复核日期（≤6 个月）；quill 2.0.3（#22）执行时经全仓零引用确认后**直接移除依赖**（未登记台账），并移除 `nuxt.config.ts` 中两处针对 quill 的无效 Vite 配置。
    - **非目标**: 不做依赖全量升级；不为变绿关闭或放宽安全门禁；不连带其他 Dependabot 项。
    - **验收标准**: 2 条 medium 关闭或按 [安全规范 §5.3](../standards/security.md#53-发布前安全告警门禁-release-security-alert-gate) 受控豁免并留证据；`security:audit-deps` relevant risks 0 与 `security:alerts` Pass；`install --frozen-lockfile` / `security:validate-overrides` / `lint` / `typecheck` / 定向测试通过；台账每条含理由与复核日期。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`pnpm why` 清单、override diff、audit / alerts 输出写入 `artifacts/review-gate/`。
    - **回滚边界**: override 与锁文件同批 revert；台账条目可单独回退。**kill-switch**: 定向 override 破坏构建且一轮修不好时转受控豁免并登记上游跟踪。

- [x] **2. ESLint #262 第二批（P2）**
    - **执行范围**: 升档并清零 4 条规则（22 命中 / 17 文件）：`prefer-reduce-type-parameter`（2 / 2）、`no-extraneous-class`（3 / 3）、`restrict-plus-operands`（6 / 4）、`non-nullable-type-assertion-style`（11 / 8）；同步 `eslint-debt-targets.mjs`、`eslint.config.js` 注释、inventory baseline，并回写 issue #262。
    - **非目标**: 不启用 `no-unsafe-*` 系列（233 / 50 / 21 / 19 命中）；不放宽 `--max-warnings 10`；不动测试 / 脚本豁免边界。
    - **验收标准**: 4 条规则命中清零且 effectiveSeverity=1；`pnpm lint` 0 error、warning ≤ 10；inventory 表更新落盘。
    - **验证矩阵 / 证据落点**: V0 + V1 + RG；inventory 前后对照与 lint 输出写入 `artifacts/review-gate/`。
    - **回滚边界**: 按规则独立回退（配置与代码修复同批）。

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

- [x] **7. Node 26 运行时基线单点化（P1，插队）**
    - **插队原因**: 用户 2026-11-14 决策。现状三处不一致：`engines` 24.x、Docker 基础镜像 `node:24.22.1-alpine`、CI `lts/*` 实际解析 26.13.1（运行日志另带 `Unsupported engine` 警告）；本机默认 26 与仓库基线 24 混用已实测触发 `better-sqlite3` ABI 报错（`Module did not self-register`，`/api/*` 503）。严格分类属 C 类（非阻塞），按用户明确指示插队，并以「进一出一」把条目 3 移出到 backlog。
    - **执行范围**: **7a 单点声明**——新增 `.nvmrc` = `26.13.1`；`package.json` 的 `engines.node` 改 `26.x`；7 个 workflow（`test` / `docker` / `release` / `docs` / `regression-weekly` / `dependency-risk-daily` / `visual-reference-refresh`，共 22 处）的 `node-version: "lts/*"` 改 `node-version-file: .nvmrc`，并同步 `Setup Node.js@lts environment` 步骤名。**7b 生产镜像**——`Dockerfile` 的 `NODE_BUILD_IMAGE` / `NODE_RUNTIME_IMAGE` 默认值改 `node:26.13.1-alpine`（保留 `--build-arg` 覆盖能力与既存安全版校验）。**7c 原生模块与冒烟**——`pnpm rebuild better-sqlite3`，用 Node 26 构建 `.output` 并启动，验证 `/api/install/status` 与 DB 读写；`docker build` 后用容器跑同一探针。**7d 文档**——README「依赖要求」改为 Node.js 26.13.1+，`docs/standards/development.md` 增加一行本地环境要求（指向 `.nvmrc`），`docs/design/governance/2026-11-14-node-26-runtime-baseline.md` 记录本次运行时升级评估与回退路径。
    - **非目标**: 不升 pnpm / Nuxt / Vite 大版本；不采纳 Node 26 新特性；不改 Dockerfile 的 22 / 24 / 26 安全版校验白名单（仍需支持 `--build-arg` 覆盖）；不做 Node 26 与 24 的双版本 CI 矩阵。
    - **验收标准**: `nvm use`（无参数）读到 `.nvmrc` 的 26.13.1；CI 日志为 `node: v26.13.1` 且无 `Unsupported engine`；Node 26 下 `pnpm install --frozen-lockfile`、`pnpm build`、`.output` 启动后 `/api/install/status` 200 且 DB 读写正常；Docker 镜像构建成功、容器启动后同一探针 200；`pnpm test`、`test:visual`（32）、`test:visual:parity`（83）、`test:perf:budget:strict` 全通过；`engines` / `.nvmrc` / workflow / Dockerfile 四处版本单点一致（无 `lts/*` 残留）。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + V4 + RG；`node -v` 与原生模块重建日志、`.output` 与容器探针输出、CI run 链接、包体与视觉结论写入 `artifacts/review-gate/`。
    - **回滚边界**: `.nvmrc` / `engines` / 7 个 workflow / `Dockerfile` / README 同批 revert 回 24.22.1，并用旧基础镜像重建一次。**kill-switch**: `node:26.13.1-alpine` 拉取失败或容器冒烟不通过时，先退 `node:26-alpine` 并在证据中记录实际解析版本；仍失败则回退 24 基线，把本项移回 backlog 并登记阻塞原因。

> 上一阶段归档：第七十四阶段「工具链现代化、门禁转阻断与存量缺陷收口」已于 2026-11-13 完成全部 6 条条目并归档，正文见 [roadmap 归档分片](./archive/roadmap-phases-74.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十四阶段归档结论最近归档阶段)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
