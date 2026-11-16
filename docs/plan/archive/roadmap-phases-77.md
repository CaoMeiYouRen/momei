# 项目计划归档：第七十七阶段

> 本分片收录第七十七阶段「体验与债务收口」的完整规划正文与收口结论（2026-11-15 立项，2026-11-16 收口）。

### 第七十七阶段：体验与债务收口（已审计归档）

**时间表**: 2026-11-15 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第七十六阶段完成内容与编辑体验闭环后，收口四类可直接验收的存量债务——把字号（字阶）token 化剩余的口径内字面量按目录分批归一（并给出非字阶取值评估报告）、把认证会话的 SSR / CSR 收敛为单一来源并移除头像的 `ClientOnly` 兜底、清理第七十六阶段保留的零引用 AI 审校面板并补零引用组件扫描、修复归档文档 791 处失效相对链接并把 `archive` 纳入链接门禁；同时以覆盖率第十八批（+0.3pp）与 devcontainer 运行时对齐守住质量与开发环境基线。

**准入结论**: 用户于 2026-11-15 在候选页确认「方案 A：体验与债务收口」6 条组合。ROI（Value+Alignment / Difficulty+Risk）：字号归一第一批 `1.60`、认证会话 SSR/CSR 单一来源 `1.40`、零引用面板清理 `2.50`、归档文档链接治理 `1.75`、覆盖率第十八批 `1.75`、devcontainer 运行时对齐 `2.00`（均值 `1.83`，子项评分见 `artifacts/review-gate/2026-11-15-phase77-planning.md`）。全部 ≥ `1.40`，其余五项满足 §3.3「Score > 1.5 优先进入阶段」；条目 2 落在 1.0–1.5 档，经用户明确确认纳入并保留 kill-switch。会员 / 付费订阅、播客与多媒体、AI 视频生成仍留在 backlog。

**准入前置（已核对 2026-11-15）**: 第七十六阶段已审计归档（`todo.md` 清空、`roadmap.md` 已迁出正文、回归窗口 74 行 / 5 条）；工作区干净，`master` 与 `origin/master` 同步于 `c877bf38`，该提交 CI（Test / Docker / Pages / CodeQL / TODO）全绿；Code Scanning open `0`，Dependabot open 仅 deepmerge #275 low（已登记台账）。阶段基线：同源 statements **85.34%**（32,568 / 38,163）、`duplicate-code` 0.47%（48 clones / 811 行）、i18n `missing` 0 / duplicates 64 组、字号 **460** 声明 / 64 种取值 / 130 文件（token 47 / 口径内 229 / 非字阶 150 / scss 变量 34）、归档失效链接 **791 处 / 163 文件**（plan 231 / regression 421 / governance 139）、`coreEntryJs` 280.63KB / 335KB、`keyCss` 59.12KB / 62KB。

**阶段容量与移出顺序**: 6 条在办。条目 3 只删零引用面板并新增扫描脚本；条目 2 只动会话解析判定、SSR 种子与头像兜底；条目 1 只动样式字号与评估报告；条目 6 只动 `devcontainer.json` 与既有守卫；条目 5 是测试批次；条目 4 是本阶段最大文档 diff。排程 `3 → 2 → 1 → 6 → 5 → 4`；若阶段超时，按 `4 → 6 → 1` 的顺序移出。

1. **字号归一第一批（P2）**: 按 `governance:inventory:font-sizes` 基线（460 声明 / 口径内 229 / 非字阶 150 / scss 变量 34 / token 47），首批取 `components/admin/posts` 的前 ≤10 个文件（按 inventory JSON 声明数降序；目录内 72 处声明，逐文件筛出口径内字面量），完成后按目录滚动至 `components/admin/settings`（35 处声明）；同时产出 150 条非字阶取值的「归一目标 → 受影响组件 / 版式」评估报告（只评估、不改值）。目录声明数会随条目 3 删除面板而变化，开工前须复算。**非目标**: 不动 34 处 scss 变量与已 token 化的 47 处；不一次性替换全仓 229 处；不改视觉设计，也不改 `--m-font-size-*` 定义。**验收标准**: 首批替换后逐元素 `getComputedStyle` 的 `font-size` / `line-height` 零差异；`test:visual` 32/32、parity 83/83 未归因差异 0；`inventory-font-sizes` 的口径内待替换数按批次下降并落盘；评估报告位于 `docs/design/governance/`。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；V3 由 parity / visual / 逐元素对账覆盖，差异不可归因时再补 `@ui-validator` 浏览器探针；对账脚本输出、视觉与 parity 结果写入 `artifacts/review-gate/`。**回滚边界**: 按目录批次独立 revert，token 定义不动。

2. **认证会话 SSR/CSR 单一来源（P2）**: 把 `server/middleware/1-auth.ts` 的会话解析从「API 路径」扩展到「带会话 cookie 的页面 GET」（沿用 cookie 痕迹判定，不无差别拉库），SSR 期间把会话种入 `auth:route-session:*`（data / resolved / timestamp / version）；客户端仍以 `primeHydratedAuthSession` 为唯一入口；移除 `components/settings/settings-profile.vue` 的 `ClientOnly` 与同尺寸占位，并新增「会话驱动型 `ClientOnly` 不得扩散」守卫（会话驱动型用法计数为 0；白名单仅保留非会话原因项并需写明理由）。**非目标**: 不改 Better-Auth 配置与登录 / 注销 / 刷新语义；不改头像上传；不为页面 SSR 新增额外 session 查询（复用中间件已解析结果）；不动主题 / 协议等非会话原因的 `ClientOnly`。**验收标准**: `/settings` SSR HTML 首帧含头像 / 昵称 / 角色；无 hydration mismatch 警告，切换设置页签不再触发 `insertBefore`；会话驱动型 `ClientOnly` 计数为 0 且被守卫锁定；同机同构建下已登录页面 SSR 响应时间增幅 ≤10%。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3；浏览器探针（首帧 + 页签切换）与响应时间对比写入 `artifacts/review-gate/`。**回滚边界**: 中间件判定与种子注入同批 revert，`ClientOnly` 恢复原状。**kill-switch**: 若 SSR 响应时间增幅 >10% 且无法在不新增查询的前提下消除，退回客户端种子并对残余 mismatch 登记 backlog，不为一致性硬扛性能。

3. **零引用面板清理与组件扫描守卫（P3）**: 删除第七十六阶段条目 3 保留的 `components/admin/posts/post-editor-review-panel.vue`（212 行）与 `post-editor-perspective-panel.vue`（257 行）——全仓零引用，且 `.nuxt` 生成物之外的检索命中为 0；新增 `scripts/governance/find-unused-components.mjs` 与 `pnpm governance:audit:unused-components` 报告型入口（报告模式 + allowlist）扫描 `components/**/*.vue` 的零引用项，并补单测覆盖动态组件名 / 大小写 / 别名等假阳性场景。**非目标**: 不清理第三方组件；不把脚本直接升为阻断门禁；不改编辑器 AI 能力与 `/api/ai/review`、`/api/ai/perspective-check`。**验收标准**: 两文件删除后 `build` / `typecheck` / 编辑器定向测试通过；扫描脚本在当前 HEAD 上输出 0 未登记项；单测含「动态解析不误报」负向用例。**验证矩阵 / 证据落点**: V0 + V1 + RG；删除前后引用计数与脚本输出写入证据文件。**回滚边界**: 两文件删除与新脚本独立 revert。

4. **归档文档链接治理（P2）**: 处理归档目录的失效相对链接，基数以本阶段入库的扫描脚本为单点——自写存在性口径（含 fenced block、含嵌套 `archive`、不校验锚点）当前为 **791 处 / 163 文件**（`docs/plan/archive` 231、`docs/reports/regression/archive` 421、`docs/design/governance` 139）；`docs:check:links` 同款存在性口径复算为 **765 处**（plan 230 / regression 405 / governance 130），差值 26 处须在脚本入库时逐条归因（fenced block 与相对基准差异）并写入口径说明。脚本路径与入口定为 `scripts/docs/scan-archive-links.mjs`（`pnpm docs:scan:archive-links`，报告模式）；完成判据只认 `docs:check:links` 覆盖 archive 后 0 失效，扫描脚本仅用于基线复现与差量归因，不要求归零。按四类处置——同级 `./x.md` 上跳一级（124）、指向已迁移文档按新路径重写（含 180 处目标已删除的历史文档映射）、代码路径链接改为可解析相对路径或行内代码（445）、其余逐条判定（42）；分三批（plan / regression / governance）落地，完成后把 `archive` 从 `docs:check:links` 的排除目录移除并纳入门禁。**非目标**: 不改归档正文语义与阶段结论；不删除归档文件；不为通过门禁伪造目标文件或空壳。**验收标准**: 扫描脚本入库并能复现申报基数（或输出与申报的逐条差量）；`docs:check:links` 覆盖 archive 后 0 失效；每类抽样 5 处（共 20 处）人工复核目标存在；diff 仅涉及链接目标与反引号化；`docs:check:markers` / `docs:check:line-count` 保持通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；修复脚本输出与抽样清单写入 `artifacts/review-gate/`。**回滚边界**: 按目录三批独立 revert；门禁改动单独提交位。

5. **覆盖率第十八批（P2）**: 按最近一次可比的未覆盖排序（`artifacts/coverage/phase76-batch17-final/coverage-final.json`，85.25%；阶段收口复跑为 85.34%）取 4 个模块：`packages/cli/src/import-command.ts`（137 / 145）、`components/admin/admin-taxonomy-page.vue`（111 / 284）、`scripts/security/security-alert-gate-shared.mjs`（98 / 263）、`packages/mcp-server/src/lib/api.ts`（73 / 73）；目标同源 `+0.3pp`（约 115 条）或模块级 `+15pp / ≥85%`。**非目标**: 不为凑数测模板分支；不重构 `admin-taxonomy-page.vue`（已有 `max-lines` 警告，不得借机扩张）；不新增测试依赖。**验收标准**: 干净全量跑（移 `.vitest-cache` / `.vitest-cache-coverage` + `--maxWorkers=4`）的基线与收口 delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因记录。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

6. **devcontainer 运行时对齐（P3）**: 把 `devcontainer.json` 基础镜像从 `typescript-node:24-bookworm` 升到与 `.nvmrc` 同主版本的 `typescript-node:26-*`，并把 `corepack enable` 换成 Node 26 兼容的 pnpm 引导（`npm i -g pnpm@<packageManager 版本>` 或 `packageManager` 驱动）；同步注释与 backlog 状态；扩展 `tests/scripts/node-runtime-baseline.test.ts`，钉住「镜像主版本 = `.nvmrc` 主版本」且 `corepack` 不再出现。**开工前置**: 先确认 mcr 上存在 Node 26 变体 tag；不存在则保留 backlog 并改用可自证的替代基线，不得以不存在的 tag 落盘。**非目标**: 不改 `.nvmrc` / `engines` / CI / Docker 基线；不引入双版本矩阵；不为 Codespaces 改造仓库结构。**验收标准**: `devcontainer.json` 以 JSONC 解析通过；守卫单测对「镜像降级」「corepack 回流」判红；Codespaces 内 `pnpm install` 无 `Unsupported engine`（无法实测时在证据中标注「未实测」并以静态守卫为验收下限）。**验证矩阵 / 证据落点**: V0 + V1；守卫单测与核对记录。**回滚边界**: 单文件与守卫扩展独立 revert。

**回滚边界（阶段级）**:

- 条目 1：按目录批次独立 revert，`--m-font-size-*` 定义不动。
- 条目 2：中间件判定与 SSR 种子同批 revert，`ClientOnly` 恢复原状。
- 条目 3：两个零引用面板与新扫描脚本独立回滚。
- 条目 4：三批文档链接修复独立回滚，门禁改动单独提交位。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：`devcontainer.json` 与守卫扩展独立回滚。

**风险提示**: ① 字号替换必须逐元素对账，禁止仅凭视觉近似或「看起来一样」放行；② SSR 会话种子会让已登录页面多一次鉴权解析，必须复用中间件结果，禁止新增 DB 往返，增幅超线按 kill-switch 退回；③ 删除面板前须确认无动态解析引用（`resolveComponent` / 字符串组件名），扫描脚本本身也要能判红；④ 归档链接修复禁止改写正文语义，代码路径一律行内代码化，避免为通过门禁伪造目标文件；⑤ 覆盖率批次中 `admin-taxonomy-page.vue` 已有 `max-lines` 警告，不得借测试补强扩张文件；⑥ devcontainer 无法在本地实测 Codespaces 时，只能在证据中标注「未实测」，不得写成已验证。

---

### 第七十七阶段归档结论（最近归档阶段）

**审计结论**: 第七十七阶段六条条目全部完成并归档（2026-11-15 立项，2026-11-16 收口）。条目 1 把 `components/admin/posts` 与 `components/admin/settings` 的口径内字号字面量归一到字阶 token（41 处字面量与 token 逐字节等值），`test:visual` 32/32、parity 83/83 未归因差异 0，并产出 150 条非字阶取值评估报告；条目 2 把认证会话扩展为「带会话 cookie 的页面 GET」SSR 单点，移除 `settings-profile` 的 `ClientOnly` 兜底并新增会话驱动型 `ClientOnly` 守卫；条目 3 删除两个零引用 AI 审校面板（469 行）并新增 `governance:audit:unused-components` 报告型扫描与假阳性单测；条目 4 把 `archive` 纳入 `docs:check:links`（扫描面 260 → 354 个 md），修复 45 个归档分片中的 739 处失效链接并新增 `docs:scan:archive-links` 快照复现脚本（立项提交 `c877bf38`：链接 740 / 门禁可见 734 + 仅扫描口径可见 6 + 正文机器路径 6），门禁覆盖后 0 失效；条目 5 覆盖率第十八批补测 `packages/mcp-server/src/lib/api.ts`（0% → 100%）与 `security-alert-gate-shared.mjs`（62.7% → 94.67%），同源 statements 32,484 / 38,103 → 32,904 / 38,432 = **+420 条 / +0.37pp（85.62%）**；条目 6 把 devcontainer 基础镜像对齐 Node 26 并把 `corepack` 引导换成 pnpm 直装，运行时基线守卫钉住镜像主版本与 `corepack` 不回流。各条 Review Gate 均 Pass（条目 4 经分区审计 Round 1–4 收敛）。

阶段收口 `regression:phase-close` **Pass**：coverage **85.6%**（33,045 / 38,601，630 文件 / 5,866 例通过 + 1 跳过）、`release:check:full` 12/12（E2E 286 例中 224 passed / 4 flaky retry 通过 / 58 skipped）、docs 五项、perf budget strict（`coreEntryJs` 281.04KB / 335KB、`keyCss` 59.41KB / 62KB）、duplicate 0.38%（43 clones / 665 行，低于 0.5% 基线）、Review Gate 生成检查全 PASS。

> 未覆盖边界与后续观察项：① 归档中 8 处失效锚点改为指向归档索引页，深链精度下降；② 归档中 6 处 fenced / 行内代码示例链接按扫描口径保留；③ 立项申报的 791 处基数来自未入库的工作区快照，脚本以 `--ref` 可复现快照为单点，差量按目录 / 分类与逐条清单输出；④ URL 编码 `%5Bid%5D` 形式的归档链接保持原样；⑤ 本机 3001 / 3002 端口被外部进程占用时，阶段收口 E2E 以 `E2E_PORT=3011` / `E2E_INSTALLATION_PORT=3012` 跑通，CI 仍用默认端口。

---
