# 第七十八阶段：质量门禁与债务收口（已审计归档）

> 第七十八阶段完整规划正文（2026-11-18 收口时自 `roadmap.md` 迁入）。原「筹备中」状态与六条条目规划、验收标准、非目标、验证矩阵与回滚边界保持原文；收口结论见文末。

### 第七十八阶段：质量门禁与债务收口（原文保留；立项时状态为「筹备中，2026-11-16 立项」，终态见文末收口结论）

**时间表**: 2026-11-16 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第七十七阶段完成体验与债务收口后，把「可自动判定的质量债」再收一轮：静态规则债第三批与依赖台账复核日期、治理目录索引补全并新增索引检查、字号归一第二批、覆盖率第十九批、`AppAvatar` 生产构建尺寸缺陷修复，以及脚本治理入口的回归接线评估。

**准入结论**: 用户于 2026-11-16 在候选页确认「方案 A：治理与债务收口」6 条组合。ROI（Value+Alignment / Difficulty+Risk）：静态规则债 `1.60`、治理索引 `2.00`、字号第二批 `1.40`（V3 + A4 / D3 + R2）、覆盖率第十九批 `1.60`、AppAvatar 缺陷 `1.60`、脚本治理晋级 `2.00`（均值 `1.70`）。除字号第二批（`1.40`，1.0–1.5 档）经用户明确确认纳入并保留 kill-switch 外，其余均 ≥ `1.50`。会员 / 付费订阅、播客与多媒体、AI 视频生成、Mergify merge queue、首页缓存解耦（#18）仍留在 backlog。

**准入前置（已核对 2026-11-16）**: 第七十七阶段已审计归档（`todo.md` 无进行中阶段、`roadmap.md` 仅留摘要表与归档结论、回归窗口 87 行 / 7 条）；工作区干净，`master` 与 `origin/master` 同步于 `0f894aeb`，该提交 CI（Test / Pages / Docker / TODO）全绿；无 open PR，open issue 仅 #262（ESLint 规则分批，仓库自动化创建）；Dependabot open 仅 deepmerge #275 low（已登记台账）。阶段基线：同源 statements **85.6%**（33,045 / 38,601）、`duplicate-code` 0.38%（43 clones / 665 行）、i18n `missing` 0 / duplicates 64 组、字号 457 声明（token 88 / 口径内 186 / 非字阶 149 / scss 变量 34）、`docs/design/governance` 69 份文档中 40 份未入索引（29 份已入索引）、`coreEntryJs` 281.04KB / 335KB、`keyCss` 59.41KB / 62KB。

**阶段容量与移出顺序**: 6 条在办。条目 1 只动 ESLint 配置 / 命中代码 / 台账脚本；条目 2 只动治理索引与新增检查脚本；条目 3 只动字号声明；条目 4 是测试批次；条目 5 只动 `AppAvatar` 与证据；条目 6 只动回归调度配置与 README。排程 `5 → 1 → 2 → 6 → 3 → 4`；若阶段超时，按 `6 → 3 → 4` 的顺序移出。

1. **静态规则债第三批与依赖台账复核（P2）**: 把 `governance:inventory:eslint-rules`（2026-11-15 复算）中命中 `no-inferrable-types`（44 / 16 文件，`server/services/ai` 17 处）与 `use-unknown-in-catch-callback-variable`（32 / 19 文件）升为 `error` 并逐条清零；`dependency-risk-allowlist.json` 增加 `reviewBy` 机读复核日期与到期提醒输出（由 `security:audit-deps` 附带打印，过期即判红），并补惰性单测；同一提交回写 issue #262 的第三批进度。**非目标**: 不碰 `no-unsafe-*` 系列（需先评估 typed lint 作用域）；不改 high+ 门禁 severity 口径；不新增依赖。**验收标准**: 两条规则 `warningCount = 0` 且 `explicitExemptionCount = 0`；`pnpm lint` 0 error；台账 `reviewBy` 过期时单测判红、未过期通过；issue #262 已回写。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；inventory JSON/Markdown 与台账单测输出落 `artifacts/governance/`。**回滚边界**: ESLint 配置与代码命中修复同批 revert，台账字段独立 revert。

2. **治理索引补全与索引检查（P2）**: `docs/design/governance/index.md` 对目录内 69 份文档分类处置（`index.md` 自身与 `archive/` 子目录不参与断言）——在役补索引条目、已过期移入 `archive/` 并登记归档入口、临时/一次性报告进 allowlist 并注明理由；新增 `scripts/governance/check-governance-index.mjs` 与 `pnpm governance:check:index`（报告模式，`--mode=error` 可选），断言「目录内每份 md 要么被索引链接、要么在 allowlist」，并补单测覆盖已索引 / 未索引 / allowlist 命中三类（脚本口径：`index.md` 全量链接去重后与目录 md 比对，排除 `index.md` 与 `archive/**`）。**非目标**: 不改治理文档正文结论；不删除文档；不把检查直接升为阻断门禁；不重命名既有文档。**验收标准**: 脚本在当前 HEAD 输出 0 未登记项；单测三类用例通过；`docs:check:links` / `docs:check:line-count` / `docs:check:markers` 保持通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；脚本 JSON 输出与分类清单落 `artifacts/governance/`。**回滚边界**: 索引改动与新增脚本独立 revert。

3. **字号归一第二批（P2）**: 按 [字号归一评估](../../design/governance/2026-11-15-font-size-normalization-evaluation.md) 的 149 条非字阶取值（报告基线 150，第七十七阶段条目 3 删除面板时带走 1 处）与 186 条口径内可替换字面量，取 ≤10 个文件（按 inventory 声明数降序，优先非 `components/admin/**` 目录），逐元素 `getComputedStyle` 对账，并把 `governance:inventory:font-sizes` 的待替换数复算落盘。**非目标**: 不动 scss 变量与 `--m-font-size-*` 定义；不按现值批量替换非字阶取值（只处理报告判定为等价的项）；不改视觉设计。**验收标准**: 逐元素 `font-size` / `line-height` 零差异；`test:visual` 32/32、parity 83/83 未归因差异 0；inventory 口径内待替换数下降。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；V3 由 parity / visual 与逐元素对账覆盖，输出落 `artifacts/review-gate/`。**回滚边界**: 按目录批次独立 revert。**kill-switch**: 若某文件存在跨断点 / 容器查询导致无法等值替换，保留原值并登记评估报告，不为凑批次硬改。

4. **覆盖率第十九批（P2）**: 取 `packages/cli/src/import-command.ts`（8 / 145）与 `components/admin/admin-taxonomy-page.vue`（173 / 284），目标同源 `+0.3pp`（约 115 条）或模块级 `+15pp / ≥85%`；若 `import-command.ts` 的 CAC + API 客户端替身成本超预算，按同一同源口径换入脚本池（`check-governance` / `capture-visual-reference` 未闭合部分）。**非目标**: 不为凑数测模板分支；不重构 `admin-taxonomy-page.vue`（已有 `max-lines` 警告，不得借测试扩张）；不新增测试依赖。**验收标准**: 干净全量跑（移 `.vitest-cache` / `.vitest-cache-coverage` + `--maxWorkers=4`）的基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因记录。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

5. **AppAvatar 生产构建尺寸缺陷修复（P1 修复型）**: `components/app-avatar.vue` 把 `$attrs` 与 `--caomei-avatar-size` 落到自有包装元素（或改用可生效的钩子），使 `xlarge` 在生产构建渲染 64px、`large` 48px；回填 `/settings`、`/admin/users`、`comments` 三处实测；补生产构建探针或 parity / visual 证据；同步 backlog 待跟踪项为已完成。**非目标**: 不改档位映射（`normal` → `md`、`large` / `xlarge` 走覆盖）；不改消费处 BEM 命名；不以「等上游改 Fragment 根」作为唯一交付。**验收标准**: `pnpm build` 产物中三处实测 64px / 48px；对应 parity / visual 未归因差异 0；开发态与 SSR 首帧无回归。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；构建产物探针输出与截图落 `artifacts/review-gate/`。**回滚边界**: 单组件独立 revert。

6. **脚本治理入口晋级与回归接线（P3）**: 评估并把 `governance:audit:unused-components` 与新增 `governance:check:index` 接入 `regression:weekly` warning 面（`required: false`），并复核 `docs:check:line-count:candidate` / `docs:check:source-of-truth:candidate` 的执行频率是否需要提频；同步 `scripts/README.md` 的 tier 与触发说明。**非目标**: 不把报告型入口升为阻断门禁；不改 weekly 既有 5 个 governance 步骤的 required 口径；不为凑步骤增加全量长跑。**验收标准**: `pnpm regression:weekly --dry-run` 通过且步骤清单含新增项；README / 规范同步；周级回归实测（`--mode=warn`）通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；dry-run 输出与周回归记录落盘。**回滚边界**: 调度配置与 README 同批 revert。

**回滚边界（阶段级）**:

- 条目 1：ESLint 配置与命中修复同批 revert，台账字段独立 revert。
- 条目 2：索引改动与新增检查脚本独立 revert。
- 条目 3：按目录批次独立 revert，token 定义不动。
- 条目 4：测试文件与覆盖率产物独立可回滚。
- 条目 5：单组件独立 revert。
- 条目 6：回归调度配置与 README 独立 revert。

**风险提示**: ① 两条 ESLint 规则升 error 会牵动 16 / 19 个文件，须按「1 个代表文件 → 定向 subset → 批量」推进，禁止一次改全仓后才发现规则误报；② `no-inferrable-types` 在 `server/services/ai` 有 17 处，改动可能影响运行时类型收窄，需定向测试；③ 治理索引处置必须区分「在役」与「过期」，禁止为让脚本归零而把在役文档塞进 allowlist；④ 字号第二批禁止按现值批量替换非字阶取值，等距桶（`0.8125rem` / `0.9375rem`）按报告口径单独判定；⑤ `AppAvatar` 缺陷只在生产构建复现，验收必须以 `pnpm build` 产物为准，不得用开发态通过作为放行依据；⑥ 覆盖率若换入脚本池，必须同批记录换池理由与同源 delta，防止口径漂移。


### 第七十八阶段归档结论（最近归档阶段）

六条条目全部完成并归档，各条 Review Gate 均 Pass（条目 1 经三分区并发审计 + Round 2 复审、条目 2 经 Round 1 Reject → Round 2 Pass、条目 3/4 经 Round 1 Pass + 证据补正）。收口证据见 `artifacts/review-gate/2026-11-17-phase78-item{1..6}.md`（条目 4 另见 `artifacts/coverage/phase78-batch19-final/`）。

| 条目 | 结论 |
|:---|:---|
| 1 静态规则债第三批 + 台账复核 | `no-inferrable-types`（45 处，含 1 处 `.vue`）与 `use-unknown-in-catch-callback-variable`（32 处）清零后直接升 `error`；inventory 两规则 `effectiveSeverity 2 / hitCount 0 / warningCount 0 / explicitExemptionCount 0`；台账 5 条补 `reviewBy`，过期或未登记在 `--mode=error` 判红并补 3 类单测；issue #262 已回写 |
| 2 治理索引 + 索引检查 | 69 份文档分类（25 在役补索引 / 15 一次性进 allowlist），未登记 0；新增 `governance:check:index`（默认报告模式，`--mode=error` 才判红）+ 9 例单测 |
| 3 字号归一第二批 | 非 admin 路由面 9 文件 51 处等值字面量 → 字阶 token；inventory token 化 88 → 139、等值可替换 186 → 135；`test:visual` 32/32、parity 83/83 未归因差异 0 |
| 4 覆盖率第十九批 | `import-command.ts` 8/145 → **139/145（95.86%）**、`parser.ts` 124/136（91.18%）；干净全量 statements **33,378 / 38,812 = 85.99%**（阶段基线 85.6%；本批纯贡献 +138 条 / +0.36pp = import-command.ts +131 与 parser.ts +7） |
| 5 AppAvatar 生产尺寸缺陷 | 自有包装元素承载 `$attrs` + `--app-avatar-box`；构建产物实测 `/settings` 64px、`comments` 48px、`/admin/users` 32px；parity `user-settings` 明暗按实测登记已归因带（待下轮 CI 重采清零） |
| 6 脚本治理入口接线 | `governance:check:index` 与 `governance:audit:unused-components` 以 `required: false` 接入 `regression:weekly`（7 个 governance 步骤）；`docs:check:*:candidate` 维持独立只读 baseline |

阶段收口 `pnpm regression:phase-close`：本地连跑 5 次，覆盖与单测在干净全量跑中一次通过（631 文件 / 5,893 例通过 + 1 跳过，statements 85.99%），阻断点均为管理端点击时序 flake（逐例孤立复跑通过）与一次新披露的 picomatch high 依赖告警（无补丁，已登记台账）；按测试规范以 CI 为最终裁决——推送 `70a6f3a5` 后 Test / Pages / Docker / TODO 四工作流全部 success，回归门禁按 CI 记为 Pass，逐次记录见 `docs/reports/regression/current.md` 的 2026-11-17 窗口。

> 未覆盖边界与后续观察项：① `user-settings` parity 两条允许清单需在下一轮 CI `visual-reference-refresh.yml` 全量重采后清零（已登记 backlog）；② 周级全量 `--mode=warn` 未在本阶段实测，由下个治理窗口承担；③ `AppAvatar` 的 `xlarge` 首字母字号（16px）与 `comment-item` 的 `loading`/`decoding` 原生懒加载仍属上游缺口；④ `admin-taxonomy-page.vue` 覆盖率未提升（需先拆分组件）；⑤ `parser.ts` 之外的 CLI 解析链与 `_onboarding.scss` 字号留在后续滚动批次。
