# 第七十九阶段：质量稳定性与门禁可信度（已审计归档）

> 第七十九阶段完整规划正文（2026-11-18 收口时自 `roadmap.md` 迁入）。原文的条目规划、验收标准、非目标、验证矩阵与回滚边界保持原样；终态与收口结论见文末。

### 第七十九阶段：质量稳定性与门禁可信度（筹备中，2026-11-18 立项）

**时间表**: 2026-11-18 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 把「门禁能不能稳定跑出可信结论」当成质量债来还。第七十八阶段收口时 `regression:phase-close` 在本机连跑 5 次均被不同阻断点拦下（4 次管理端点击时序 flake、1 次新披露依赖告警、1 次 E2E 端口占用），暴露出「测试稳定性」与「门禁信号可信度」两类缺口；本阶段收口 flake 根因、把一次性探针与台账复核接入日常巡检、并让 parity 允许清单可脚本化清零。

**准入结论**: 用户于 2026-11-18 在候选页确认「方案 A：质量稳定性与门禁可信度」6 条组合，容量 6 条。ROI（Value+Alignment / Difficulty+Risk）：测试 flake 收敛 `1.67`（P1 修复型，按 Value 5+5 / Difficulty 3+3 计入并作为唯一修复型条目上收）、构建产物探针常驻 `3.00`、`reviewBy` 接入日常巡检 `2.67`、依赖 PR 处置与 major 评估 `2.00`、覆盖率第二十批 `1.60`、parity 允许清单清零脚本化 `2.33`（均值 `2.21`，为当轮三方案最高）。未选方案 B（债务收口 II，`1.64`）与 C（功能与体验，`1.12`）留在 backlog。

**准入前置（已核对 2026-11-18，含当日红灯处置）**: 第七十八阶段已审计归档（`todo.md` 无进行中阶段、`roadmap.md` 仅留摘要表与归档结论、回归窗口已滚动归档）；`893301e6` 的 29 项 check-runs 全绿。当日 `git fetch` 后发现远端 tip 已推进到 `ae73996f`（连续 3 个依赖 PR rebase 合并），其 Test / Pages / Docker / Daily 四个工作流因 `pnpm-lock.yaml` 重复映射键（`ERR_PNPM_BROKEN_LOCKFILE`）全红——该确定性故障已在立项同批以 `d92e271f` 修复（删除 `@lucide/vue@1.73.0` 的重复条目，本地 `pnpm i --frozen-lockfile` 通过）。同批还发现：连续自动合并把 `caomei-ui` 推到 1.3.0（分页器 6rem → 5rem、新增 `__report`、字段高度钉 32px），使 `admin-posts-list` 视觉基线产生 1115px 差异——已按上游变更归因并重采两条基线（`4a6efc75`），`test:visual` 32/32、parity 83/83 复跑通过；该事件与上面的坏锁文件共同构成本阶段条目 1 / 6 的现实依据。**两层视觉门禁的现状不同，须分开读**：`test:visual` 层实测 1115px 差异（约占 1440×900 视口 0.09%），已按上游变更归因并重采两条基线（`4a6efc75`）；parity 层**未重采**——`tests/visual/parity/reference/admin-posts-list-{light,dark}.reference.png` 仍为 `ccd69454`（2026-11-13 CI 复采），该两条 `allowlist` 为空、`maxDiffPixels: 3000`，只能断言「未归因差异在 admin 预算内通过」，不能断言具体像素值；该事件已在 [视觉一致性偏差处置表](../../design/governance/visual-parity-deviation-register.md) 登记为「未归因·预算内吸收」，**待办的是 parity 层重采与归因补全**（随条目 4 的 CI `visual-reference-refresh.yml` 流程），不是登记本身。open issue 仅 #262（ESLint 规则分批，仓库自动化创建，第三批进度已回写）；open PR 仅 **#1068 `sanitize-html` 2.18.2（patch）** 一个；其余依赖 PR 已在 2026-11-18 上午由 Mergify 依次自动合并（`@lhci/cli` 0.16.1、`sass` 1.108.2、`@vite-pwa/nuxt` **2.0.1 major**），全部来自 `app/dependabot`，按 [Git 规范 §6](../../standards/git.md) 属可信来源。**`@vite-pwa/nuxt` 2.0.1 的自动合并先于评估落地**（`package.json` 已为 `^2.0.1`，CI 26/26 绿于 `4a6efc75`），故条目 6 的口径由「转 draft 跟踪」改为「对已合并的 2.0.1 做追溯评估并给出去留结论」。阶段基线：同源 statements **85.99%**（33,378 / 38,812，631 文件 / 5,893 例通过 + 1 跳过）、`duplicate-code` 0.38%（43 clones / 665 行）、i18n `missing` 0 / duplicates 64 组（预算 74）、字号 457 声明（token 139 / 口径内待替换 135 / 非字阶 149 / scss 变量 34）、`coreEntryJs` 281.07KB / 335KB、`keyCss` 59.44KB / 62KB、依赖台账 6 条豁免（均 `reviewBy 2027-05-14`）。

**阶段容量与移出顺序**: 6 条在办。条目 1 只动测试用例与测试工具；条目 2 只新增探针脚本与调度接线；条目 3 只动安全脚本输出面；条目 4 只新增 parity 脚本与文档；条目 5 是测试批次；条目 6 只动依赖声明与评估文档。排程 `1 → 2 → 3 → 5 → 6 → 4`（条目 4 依赖 CI 重采时机、条目 6 依赖外部 PR 合并，故排后）；若阶段超时，按 `4 → 6 → 5` 的顺序移出——该顺序按**外部依赖阻塞度**而非 ROI 排序（条目 4 的 ROI 2.33 为次高，但清零时点取决于 CI 重采，最不可控）。

1. **测试 flake 收敛与门禁可信度（P1 修复型）**: 定位并修复管理端「交互后立即断言」的时序 flake——已知 6 处（5 处来自第七十八阶段收口连跑记录，`agreements-settings` 来自第十九批干净全量跑，均见 `docs/reports/regression/current.md` 与 `artifacts/coverage/phase78-batch19-final/README.md`）：`pages/admin/users/index.test.ts`（`@page` / `onFilterChange`）、`components/admin/snippets/snippet-edit-dialog.test.ts`（保存载荷）、`pages/admin/external-links/index.test.ts`（统计弹窗）、`components/admin/settings/commercial-settings.test.ts`（脏状态与保存）、`components/admin/settings/agreements-settings.test.ts`（翻译模式切换）、`components/app-uploader.test.ts`（file input）。统一「交互 → 等待可观测状态 → 断言」的等待口径（`flushPromises` / `nextTick` 链 / `waitFor` 谓词），并评估 `networkidle` 依赖与重试策略是否需要收窄（同步给出 backlog「`networkidle` 依赖外网可达性」待跟踪项的处置结论：上收为后续条目或明确保留）；不得用 `--retry` 掩盖。**非目标**: 不改业务逻辑与组件契约；不降低断言强度或删除断言；不放宽覆盖率阈值；不新增 `.skip` / `.only`；不改 CI 工作流的 required 口径。**验收标准**: 6 个已知用例各连跑 20 次 0 失败；`pnpm test:coverage` 连跑 3 次全绿且无 retry；`pnpm regression:phase-close` 本地一次 Pass（3001 被占用时以 `E2E_PORT=3011` 跑通并登记）。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；连跑日志与 flake 前后对比落 `artifacts/review-gate/`。**回滚边界**: 按测试文件独立 revert。

2. **构建产物尺寸探针常驻（P2）**: 把第七十八阶段的一次性探针沉淀为 `scripts/testing/probe-build-geometry.mjs`（在 `.output` 产物上以 Playwright `getComputedStyle` 实测几何，清单可配置），接入 `regression:weekly` 的 `required: false`，并同步 `scripts/README.md`；补单测覆盖解析、缺元素与失败路径。**非目标**: 不引入新的浏览器依赖（复用既有 Playwright）；不把探针升为阻断门禁；不扩成全站视觉回归。**验收标准**: `pnpm probe:build-geometry --dry-run` 与真实产物跑均通过；weekly dry-run 步骤清单含该步骤；AppAvatar 三档实测 64 / 48 / 32px 复现；单测覆盖三类路径。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；探针 JSON 落 `artifacts/review-gate/`。**回滚边界**: 脚本、调度与 README 同批 revert。

3. **`reviewBy` 复核日期接入日常巡检（P2）**: 把 `evaluateAllowlistReviewDates` 接入 `security:audit-deps:daily` 的 summary / JSON 产物与 `security:alerts` 的输出行（只增加可见性，不改变 severity 口径与退出码语义），并补测试。**非目标**: 不改 release 门禁的判红逻辑；不让 daily / alerts 因台账到期而整体变红；不改 `readAllowlist` 对既有字段的校验。**验收标准**: daily 产物含 review 段（过期 / 即将到期 / 计划内 / 未登记）；alerts 打印过期行且退出码不变；单测覆盖四类分桶与缺登记。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；daily 与 alerts 产物落 `artifacts/security/`。**回滚边界**: 两个脚本独立 revert。

4. **parity 允许清单清零脚本化（P3）**: 新增 `scripts/testing/prune-parity-allowlist.mjs`（按 testName 清零 `tests/visual/parity-budget.json` 的 `allowlist` 并保留 note 历史），文档化「CI `visual-reference-refresh.yml` 重采 → 运行 prune → 复跑 parity」的流程；补单测。**非目标**: 不自动重采参考态；不改预算阈值；不删除 note 中的历史校准记录。**验收标准**: `--dry-run` 输出待清零条目；单测覆盖命中 / 未命中 / 幂等三类；文档含完整流程与失败回退；流程文档显式区分「重采后的绿」与「预算内吸收的绿」，并要求把后者登记到偏差处置表。**验证矩阵 / 证据落点**: V0 + V1 + RG；dry-run 输出落 `artifacts/review-gate/`。**回滚边界**: 脚本与文档独立 revert。

5. **覆盖率第二十批（P2）**: 取 `scripts/governance/check-script-governance.mjs` 与 `scripts/testing/capture-visual-reference.mjs` 的未闭合部分（必要时换入 `scripts/regression/run-periodic-regression.mjs`），目标同源 `+0.3pp` 或模块级 `+15pp / ≥85%`；`components/admin/admin-taxonomy-page.vue` 的补测须先评估组件拆分，不在本批硬做。**非目标**: 不为凑数测模板分支；不重构被测脚本的公开行为；不新增测试依赖。**验收标准**: 干净全量跑基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因记录。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

6. **依赖 PR 处置与已合并 major 的追溯评估（P2）**: ①处置唯一 open PR #1068（`sanitize-html` patch），CI 绿后合并并**本地 `pnpm i --frozen-lockfile` 校验锁文件**（PR 分支绿不足以放行，`ae73996f` 即反例）；②对**已被 Mergify 自动合并**的 `@vite-pwa/nuxt` 2.0.1（`cedcc241`，`package.json` 已为 `^2.0.1`）做追溯评估——PWA 配置兼容、Workbox 7 行为差异、离线与 SW 更新语义、构建产物与 SW 注册实测，给出「保留 / 回滚到 1.1.1」结论与回滚步骤；③把「依赖 PR 连续 rebase 自动合并 → 坏锁文件 + major 静默落地」写入 backlog 长期主线 §10 的系统性解法候选（merge queue / major 排除规则），结论报用户确认后再动配置。**非目标**: 不在本阶段新增 major 迁移（已落地的 2.0.1 只做追溯评估与去留结论）；不改 PWA 的运行时策略；不改依赖告警 severity 口径；不直接修改 `.github/mergify.yml`（排除规则属结论项，须用户确认后另立条目）。**验收标准**: #1068 已合并、锁文件 `--frozen-lockfile` 本地通过且 CI 绿；`@vite-pwa/nuxt` 2.0.1 追溯评估文档含影响面 / 实测 / 保留或回滚结论与回滚步骤；`security:audit-deps` 与 `security:alerts` 仍 Pass。**验证矩阵 / 证据落点**: V0 + V1 + RG；评估文档落 `docs/design/governance/`，PR 结论落 Review Gate 证据。**回滚边界**: 每个依赖升级独立 revert；评估文档独立。

**回滚边界（阶段级）**:

- 条目 1：按测试文件独立 revert，禁止整批回退测试工具改动。
- 条目 2：脚本、weekly 调度与 README 同批 revert。
- 条目 3：`run-daily-dependency-audit` 与 `check-github-security-alerts` 各自独立 revert。
- 条目 4：prune 脚本与流程文档独立 revert。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：每个依赖升级独立 revert；major 评估文档独立。

**风险提示**: ① flake 收敛必须先复现再修，禁止「加 `waitForTimeout` 了事」——统一为「等待可观测状态」谓词，否则只是把抖动换了个地方；② 探针脚本必须容忍 `.output` 缺失（跳过并给出可读原因），否则 weekly 会在无构建产物的机器上误红；③ `reviewBy` 接入 daily / alerts 时不得改变其退出码，否则会与「日常巡检只报告」的既有定位冲突；④ prune 脚本必须在重采后运行，否则会把「参考态仍是旧态」的差异当成已归因；⑤ 覆盖率若换池，须同批记录换池理由与同源 delta；⑥ major 依赖升级不得在评估完成前合并——**该口径在立项当日已被破坏一次**（`@vite-pwa/nuxt` 2.0.1 被 Mergify 自动合并），本阶段以追溯评估收口并在 backlog 长期主线 §10 记录系统性解法；⑦ 依赖 PR 的 rebase 自动合并会在连续合并时产生坏锁文件（`ae73996f` 实证），每次合并后必须跑 `pnpm i --frozen-lockfile`，与 backlog 短期候选「Mergify 合并策略与 merge queue 采用」显式挂钩；⑧ 视觉门禁的「绿」有两种含义——`test:visual` 重采后的通过，与 parity 靠 admin 预算吸收的通过，条目 4 必须区分并登记。

---

## 收口结论（2026-11-18）

**审计结论**: 第七十九阶段 6 条条目全部完成并归档（2026-11-18 立项，同日收口）。条目 1 定位到三类确定性缺陷（`?.trigger` 静默跳过、单次 `nextTick` 不覆盖 async 处理器、`onMounted` 拉取未落地），新增 `tests/helpers/ui-interaction.ts`（`settleUi` / `clickWhenReady` / `expectEventually`）并统一 6 个已知用例；6 文件连跑 20 次 0 失败，`pnpm test:coverage` 连跑 3 次全绿无 retry，`regression:phase-close` 本机一次 Pass。条目 2 新增 `scripts/testing/probe-build-geometry.mjs` 与 `pnpm probe:build-geometry`，真实产物 3/3 通过（64 / 48 / 32px），以 `required: false` 接入 `regression:weekly`。条目 3 把 `evaluateAllowlistReviewDates` 接入 daily JSON / Markdown 与 alerts 输出行，四类分桶落地且退出码语义不变。条目 5 补 `check-script-governance` 输出面与 `main` 用例，模块 statements **74.90% → 95.69%**、branches 85.93%；`capture-visual-reference` 维持 statements 98.69% / branches 88.11%。条目 6 确认 #1068（`sanitize-html` 2.18.2）已合并、CI 全绿、`pnpm i --frozen-lockfile` 通过；`@vite-pwa/nuxt` 2.0.1 追溯评估结论为 **保留**（构建产物 / SW 注册链 / Workbox 8 均按预期），并登记 2.0.2 与 `generateSW` 后续项。条目 4 新增 `prune-parity-allowlist` 与「重采 → prune → 复跑」流程，dry-run 已列出 `user-settings` 两条待清零。各条 Review Gate 均 Pass。

**阶段收口**: `pnpm regression:phase-close`（`E2E_PORT=3011` / `E2E_INSTALLATION_PORT=3012`）一次 **Pass**，blocker=0 / warning=0，7/7 步骤通过（test:coverage / release:check:full / docs:check:i18n / docs:check:line-count / test:perf:budget:strict / duplicate-code:check:strict / review-gate:generate:check）。同源 statements **33,622 / 39,105 = 85.97%**（阶段基线 85.99%，覆盖语句 +244 / 分母 +293，差异来自新增探针与 prune 脚本源码面）；证据见 `artifacts/review-gate/2026-11-18-phase-close-regression.{md,json}` 与 `docs/reports/regression/current.md` 的 2026-11-18 窗口。

**未覆盖边界与后续观察项**: ① `user-settings` parity 允许清单仍需下一轮 CI `visual-reference-refresh.yml` 全量重采后执行 prune 清零；② `@vite-pwa/nuxt` 待升 `^2.0.2`（上游 #241），`workbox` → `generateSW` 迁移单独立项；③ 全量 coverage 并发下原始 flake 的触发条件未在文件级定向运行复现，后续按「目标存在性 → await 链 → 渲染 flush」三段排查；④ Windows 本地 E2E / 视觉层未在本轮执行，CI 为最终裁决。
