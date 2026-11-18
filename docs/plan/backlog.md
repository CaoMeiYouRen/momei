# 墨梅博客 长期规划与积压项 (Backlog)

本文档用于维护尚未进入正式阶段执行面的统一候选池，并按“长期主线任务”与“短期 / 一次性候选任务”双轨区分。当前阶段执行面请参阅 [项目计划](./roadmap.md)、[待办事项](./todo.md) 与 [待办归档](./todo-archive.md)；已上收 / 已闭合的候选见 [短期候选解决归档](./archive/backlog-resolved-candidates.md)。

> **维护规则**:
> 1. 新功能需求、非阻塞优化与长期治理事项优先写入本文件，而不是直接写入 `todo.md`。
> 2. backlog 必须区分“长期主线任务”“周期性回归验证层”和“短期 / 一次性候选任务”：长期主线可跨阶段保留，回归验证层有固定节奏不参与阶段排队，短期 / 一次性候选在正式上收后必须去重。
> 3. 长期主线被某阶段抽取后，不删除主线卡片，只补记最近一次上收阶段、当前状态与下一次可切片方向；主线**已关闭**时整条移除，不在本文件留痕。
> 4. 周期性回归验证层不是“一个任务”，而是所有长期主线的健康检查层。它按固定日历节奏执行（周级 / 发版前 / 阶段收口），不参与阶段切片容量竞争。
> 5. 当前仓库的 backlog 以中文为唯一事实源；翻译文档只保留摘要或跳转说明。
> 6. 已上收、已闭合或已完成的条目整条迁入 [短期候选解决归档](./archive/backlog-resolved-candidates.md)，本文件不保留“已上收”摘要。编号仅用于本文件内定位；历史文档中的长期主线 / 短期候选编号曾多次重排，跨文档引用请按条目名称检索。

## 长期主线任务（可跨阶段保留）

> 状态口径统一使用：进行中 / 观察中 / 暂停 / 已关闭；**已关闭的条目即整条移除，故本区不会出现「已关闭」状态**。
> 本区**只保留可跨阶段反复切片的主线**；已关闭的主线已整条移除，不保留任何摘要或历史叙述。

### 1. 测试覆盖率与有效性治理

- **目标**: 在全仓 coverage 越过 `80%+` 的基础上分批渐进推进至 `90%+`（每批 1-2 个百分点），覆盖率提升与测试有效性并行，避免单一数字冲刺；失败 / 边界断言优先，不做低价值铺量。
- **状态**: 进行中。
- **最近一次上收阶段**: 第七十九阶段（第二十批，2026-11-18 **筹备中**：`scripts/governance/check-script-governance.mjs` 与 `scripts/testing/capture-visual-reference.mjs` 的未闭合部分，必要时换入 `run-periodic-regression.mjs`）。上一批为第七十八阶段（第十九批，2026-11-18 **已完成**：`packages/cli/src/import-command.ts` 8/145 → **139/145（95.86%）**，`packages/cli/src/parser.ts` 的 `parseHexoFiles` 补 2 例至 **124/136（91.18%）**）。
- **当前基线**: 同源口径 Statements **`85.99%`**（`33,378 / 38,812`，2026-11-18 第七十八阶段收口；干净全量跑口径为「运行前移走 `.vitest-cache` + `--maxWorkers=4`」）。距 `90%+` 长期目标约 4.0pp。
- **下一次可切片方向**: 覆盖率同源复算挂接 `code-quality-auditor` review checklist（待补挂）；单批 `+0.3pp` 约需 **115 条**，下一批优先从剩余脚本池（`check-governance` / `capture-visual-reference` 等未闭合部分）与组件池中选取，须保留「失败 / 边界优先」的断言标准；`components/admin/admin-taxonomy-page.vue` 需先拆分组件。遗留治理项：`text.test.ts` 超 1000 行建议拆分、`tts.test.ts` beforeEach 对齐 `mockReset`。

### 2. 结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛

- **目标**: 压缩高频重复实现，补齐共享 helper / 纯函数抽象，并把零散类型与轻量响应壳层纳入受控复用；优先治理跨文件重复率高、适合稳定上收的候选，而不是把所有局部实现强行抽象。默认以 `pnpm duplicate-code:check` 作为事实源。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十六阶段（theme 颜色 model 工厂 + 预设值取值抽取到 `composables/use-theme-color-models.ts`）。
- **当前基线**: `duplicate-code` **0.38%**（43 clones / 665 行，2026-11-18 第七十九阶段立项复算；第六十六阶段记录的 0.30% 与 2026-11-10 的 0.39% 均已过期）。
- **下一次可切片方向**: 基于 0.38% 基线继续收敛——剩余轻量 shared helper、表单元数据 / 表单控件的类型共享、`server/api/` 层请求上下文与参数校验的共性逻辑；结构性重复候选保留轻量壳层类型与“重复导入后轻包装”的纯函数。

### 3. 存量代码注释治理与注释漂移收敛

- **目标**: 为存量代码补高价值注释（复杂逻辑、兼容性兜底、跨层契约、关键副作用、核心导出函数），同步清理失效 / 误导 / 逐行复述注释；以 `pnpm governance:audit:comment-drift` 为事实源，每轮保留受影响范围、注释类型、未覆盖边界与漂移检查结论。
- **状态**: 暂停（自第三十九阶段后未上收切片，注释盘点脚本仍未补齐）。
- **最近一次上收阶段**: 第三十九阶段（首轮：`server/services/ai/text.ts` 等）。
- **下一次可切片方向**: 首个切片前先补注释盘点脚本；候选组 A/B/C 方向不变，首轮最多选 1 组。

### 4. Postgres 查询、CPU 与连接生命周期平衡治理

- **目标**: 在公开页面、鉴权与安装体验不回退的前提下平衡 PostgreSQL 查询体量、CPU 与连接生命周期；闭环“哪些请求不该碰库 → 必须查库请求如何瘦身 → `pg_stat_statements` 或等价 live sample 复核”。
- **状态**: 进行中。
- **最近一次上收阶段**: 第五十三阶段（Vercel CDN 缓存 Tier 2 架构：`routeRules` ISR/SWR + Upstash Redis，从源头阻断 Bot → SSR → DB 连锁反应）。
- **当前基线**: 2026-06-23 跨 Vercel 函数日志 + Neon 操作日志联合分析确认——compute 频繁启停（约 40 次/天）根因不是 SQL，而是 `100% Cache MISS + 76% Bot 流量` 持续触发 SSR 冷启动；治理文档 [Vercel 缓存穿透与 Bot 流量治理](../design/governance/vercel-cache-bot-governance.md)。
- **下一次可切片方向**: 优先 Tier 3（Bot 分级缓存 + Vercel KV，评估中）；缓存层部署后重新评估网络传输配额消耗速度；SQL 瘦身候选（首页 posts public list 的 `DISTINCT + IN (...)` 查询对）。

### 5. 国际化运行时加载与文案复用治理

- **目标**: 建立“翻译字段定义 → locale 模块注册 → 路由动态加载 → 运行时命中 → 回退 / raw key 暴露 → 重复键审计”的周期性闭环；`pnpm i18n:audit:duplicates` 与 `i18n:audit:missing`、`i18n:verify:runtime` 同步定期执行并保留证据。跨页面相同组件文案的复用只在职责、语义与模块归属都稳定一致时上收。
- **状态**: 进行中。
- **最近一次上收阶段**: 第七十五阶段（条目 4：64 组 allowlist 三类复核 + 公开页 runtime 审计，2026-11-13 **已完成**）。
- **当前基线**: `i18n:audit:missing = 0`、`i18n:audit:duplicates` **64 组 / 149 keys / 33 组跨模块**（2026-11-12 第七十四阶段条目 4 收敛后复算；合并 35 组至 `common.*` / `legal.*`，剩余组登记 `scripts/i18n/duplicate-group-allowlist.json` 并由 `i18n:audit:duplicates:gate` 阻断未登记新增 / 失效条目）、原文级重复键 0、`i18n:check-sync` 五语一致；缺失字段优先修复、重复键及时清理、`unused` 默认观察。原文级重复键扫描（`pnpm i18n:audit:raw-duplicates`，默认 warning、`--mode=error` 可阻断）与 PR 侧 `i18n:audit:missing` 阻断已随第七十三阶段条目 3 落地。
- **下一次可切片方向**: 剩余 64 组 allowlist 按「动态 key 拼接」「模块内字段语义不同」「跨模块对象语义不同」三类复核；动态拼接优先评估“是否为有限集合”，默认改显式静态 key 映射而非扩 allowlist。之后仍未纳入 runtime 回归的公开页装配链路（档案 / 分类 / 标签列表页 i18n 完整性审计）。

### 6. 文档事实源、翻译与分层归档治理

- **目标**: 统一维护全文档体系的分层边界、膨胀阈值与 freshness——`docs/design/` 的模块 vs 专项分层、`docs/plan/` 的行数阈值触发归档、`docs/i18n/*/` 的翻译 tier 与同步；清理无效 / 过时 / 漂移文档；保持 `docs:check:source-of-truth` 与 `docs:check:line-count` 可通过，不靠临时补 `last_sync` 应付检查。阈值被证明过宽时先回写脚本，再更新规范与阶段结论。
- **状态**: 观察中。
- **最近一次上收阶段**: 第七十八阶段（条目 2：治理索引补全与索引检查，2026-11-18 **已完成**：69 份治理文档分类处置——25 份在役补索引、15 份一次性进 allowlist，未登记归零；新增 `governance:check:index` 报告型入口 + 9 例单测）。
- **当前基线**: `docs:check:line-count` 覆盖 README、plan 主文档与 `docs/reports/regression/current.md`；`docs:check:source-of-truth` 以 git 提交判定 hard blocker，tier 软上限 `must-sync 60 天 / summary-sync 120 天`（`candidate` profile 保留 21/30 天基线，仅作收敛评估）。
- **下一次可切片方向**: design 域审计 `docs/design/governance/` 中已过期评估 / 报告的归档状态；plan 域按阈值滚动归档（跟进 `roadmap.md` / `todo-archive.md` 与本文件行数）；翻译域评估进一步收紧 `must-sync` / `summary-sync` 的可执行性。
- **待跟踪**: ① 迁移页跨批遗留形态——`--surface-ground` 幻影 token 仍有 3 处（`pages/goto/[code].vue` 1 处、`pages/admin/external-links/index.vue` 2 处；全仓未定义、恒为 `unset`），`p-fluid` 已清零；迁移页注释与测试注释中的阶段号 / 审计编号清理随 B4 收尾复核。② 视觉一致性门禁的跨环境基线——参考态刷新与预算调整固定走 `visual-reference-refresh.yml` 的 CI 重采，任何 `reader` 档路由上线前 parity 未归因差异须为 0；`capture-visual-reference.mjs` 在「无待采目标」时以 `--pass-with-no-tests` 视为成功，由 `tests/scripts/capture-visual-reference.test.ts` 静态守卫锁定，改动采集口径须同步复核该行为。

### 7. Windows 本地 Dev / Build 性能治理

- **目标**: 为 Windows 本地 `nuxt dev` / `nuxt build` 建立统一量化口径，优先收敛首请求阻塞与构建尾耗时，不扩写为全平台构建重构。
- **状态**: 暂停（第四十三阶段确认平台级瓶颈：Linux CI 106s vs Windows >1800s，>17x 差距，非项目层面短期可收敛）。
- **最近一次上收阶段**: 第四十三阶段（Vite warmup + `resolve.extensions` 收窄 + Nitro inline 瘦身 + sourceMap 关闭 + `build:done` 跳过，确认平台级瓶颈后上收关闭）。
- **下一次可切片方向**: 暂停。仅在 Nuxt / Nitro 发布针对 Windows 的重大性能改进，或项目迁移到 WSL2 / Linux 开发环境时重新评估；历史数据见 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)。

### 8. 站点性能与 Core Web Vitals 持续优化

- **目标**: 持续追踪核心页面 Core Web Vitals，建立跨版本性能回归基线；优先级：公开首页 > 文章详情页 > 分类 / 标签列表 > 后台管理页。与 #7 的区别：本条聚焦生产环境用户体验性能。
- **状态**: 进行中（已有 Lighthouse CI + bundle budget 体系，尚未形成持续优化节奏）。
- **最近一次上收阶段**: 第七十四阶段（条目 2b：入口包体护栏，2026-11-12 **已完成**）。上一阶段为第五十二阶段（移动端 CWV 基线采集与评估：首页 / 文章详情 / 分类标签列表页 LCP / CLS / INP 基线落盘）。
- **当前基线**: `coreEntryJs` **281.07KB / 335KB**、`keyCss` **59.44KB / 62KB**（2026-11-18 第七十九阶段立项复算；`keyCss` 余量 4.4%，为当前最紧的一项）；`maxAsyncChunkJs` 92.79KB / 130KB（2026-11-13 第七十八阶段收口实测）。
- **下一次可切片方向**: 文章详情页按需 hydration、评估收紧 `maxAsyncChunkJs` 并为 shared chunk 单列预算、移动端 LCP 超 3s 时启动专项治理。

### 9. 脚本资产、量化口径与回归入口治理

- **目标**: 把脚本作为长期治理主线的事实源，为 ESLint / 类型债、结构复用、注释治理、文档治理等建立可重复执行的计数、分桶与 delta 输出；治理 `scripts/**` 的长期入口、孤儿脚本、临时脚本残留与输出漂移；稳定后并入固定回归入口。
- **专项设计事实源**: [script-governance.md](../design/governance/script-governance.md)。
- **状态**: 进行中。
- **最近一次上收阶段**: 第七十九阶段（条目 2：构建产物尺寸探针常驻并接入 weekly；条目 4：parity 允许清单清零脚本化，2026-11-18 **筹备中**）。上一阶段为第七十八阶段（条目 6：`governance:audit:unused-components` 与 `governance:check:index` 接入 `regression:weekly` warning 面，2026-11-18 **已完成**：governance 面 5 → 7 步、均 `required: false`，并补断言锁住 warning 面）。
- **当前基线**: `governance:check:scripts` 与 `audit:simple-duplicates`、`audit:eslint-debt`、`audit:comment-drift` 均已进入 `regression:weekly` warning 面；`docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 仍为独立 baseline。
- **下一次可切片方向**: 按周级回归趋势跟踪 comment-drift 的 TODO / 复述 / 漂移候选数，仅在数值异常反弹时治理；评估 docs candidate 入口是否进入更高频回归；零引用组件扫描在报告模式稳定运行 2 个阶段后，再评估是否并入 `regression:weekly` warning 面。

### 10. 依赖与静态规则债治理

- **目标**: 把 Dependabot / Code Scanning 告警与 ESLint 未覆盖规则（issue #262）当作同一条可量化债务线：告警按严重级与可修性分流、无补丁项进受控台账；ESLint 规则按 `governance:inventory:eslint-rules` 的「命中数 × 目录」分桶逐批升档清零，不为变绿放宽门禁。
- **状态**: 进行中。
- **最近一次上收阶段**: 第七十八阶段（条目 1：静态规则债第三批 `no-inferrable-types` / `use-unknown-in-catch-callback-variable` + `dependency-risk-allowlist` 复核日期与到期提醒，2026-11-18 **已完成**：两规则 77 处清零后直接升 `error`，inventory / debt 双产物 0 命中 / 0 豁免；台账 5 条 `reviewBy` 2027-05-14，过期或未登记在 `--mode=error` 判红；issue #262 已回写）。
- **当前基线（2026-11-18 复算）**: `pnpm audit`（release 门禁）6 条豁免全部登记 `dependency-risk-allowlist.json` 且均带 `reviewBy: 2027-05-14`：extract-zip ×2（high，无补丁）、braces（high，无补丁）、zod 3（high，LHCI 锁定链）、deepmerge（low，仅追踪）、**picomatch（high，GHSA-fc5q-39xc-vjpf，2026-11-17 新披露，`first_patched_version` 为空、npm 最新即 4.0.7，165 条构建期链）**；Dependabot open 仅 deepmerge #275 low（无补丁，仅追踪、不改门禁 severity）；minimatch #286 / glob #284 已按父级 scoped override 定向抬版、quill #22 随依赖移除，三者于推送 `b649181e` 后由 Dependabot 重扫关闭；`@hono/node-server` 两条 medium 已随 2.1.8 关闭；`caomei-ui` 已于 2026-11-14 升级到 `^1.2.0` 并撤销 `ignore` / 人工批准守卫，回到常规依赖通道（迁移方案 §3.12）。ESLint 候选规则（`governance:inventory:eslint-rules` 2026-11-17 复算，warning 0 / 显式豁免 0）按命中数排序：`explicit-function-return-type` 1411 / `prefer-nullish-coalescing` 1380 / `no-unnecessary-condition` 308 / `no-unsafe-member-access` 289 / `restrict-template-expressions` 250 / `no-unsafe-assignment` 230 / `no-confusing-void-expression` 80 / `no-unsafe-argument` 50（`no-inferrable-types` 与 `use-unknown-in-catch-callback-variable` 已于第七十八阶段条目 1 清零并升 `error`，不再计入候选）；`no-non-null-assertion` 仍为 warning 且命中 24。Code Scanning open 已归零（2026-11-15 浮层守卫 4 条 fixed）。
- **待跟踪（2026-11-18 新增，责任人：依赖与静态规则债治理）**: 依赖 PR 的 rebase 自动合并会在连续合并时产生坏锁文件（`ae73996f` 实证：`@lucide/vue@1.73.0` 重复映射键使 master 的 Test / Pages / Docker / Daily 全红），并会让 major 升级绕过评估静默落地（`@vite-pwa/nuxt` 2.0.1）。系统性解法候选：① 把 major 升级排除出自动合并（draft 或人工合并）；② 引入 merge queue + `conflict_resolvers`（见短期候选「Mergify 合并策略与 merge queue 采用」的详细方案 §4，需先闭环 §7 的 6 项验证）。两项均须用户确认后另立条目。**追溯评估已落地（2026-11-18，第七十九阶段条目 6）**：`@vite-pwa/nuxt` 2.0.1 结论为**保留**（构建产物 / client plugin 注册链 / Workbox 8 均按预期生效，无行为回退）；上游 v2.0.2 已修复 SW 与 manifest route rules 的重建问题，下次依赖窗口抬到 `^2.0.2`，`workbox` → `generateSW` 迁移单独立项。详见 [追溯评估](../design/governance/2026-11-18-vite-pwa-nuxt-2-retrospective.md)。另：若未来重新引入 quill 富文本编辑器，须先确认上游已修复 HTML 导出的 XSS（原依赖已移除，见 [短期候选解决归档](./archive/backlog-resolved-candidates.md)）。
- **下一次可切片方向**: 第三批已收口；下一批按命中数递增取 `no-confusing-void-expression`（80 命中 / 29 文件）与 `no-unsafe-argument`（50 命中 / 23 文件）；`no-unsafe-*` 系列须单列条目并先评估 typed lint 作用域；`explicit-function-return-type` / `prefer-nullish-coalescing` 等千级命中项保持 `[0]` 直到有专项批次。

### 11. UI 视觉质量与界面自检治理

- **目标**: 把「界面是否合格」从审美讨论收敛为可判定检查项与可回归证据。维护一份只收真实命中、影响使用的界面自检清单（U1–U6），用它驱动视觉债清偿与视觉门禁扩容；不追求一次重做设计体系。
- **专项设计事实源**: [界面自检清单与视觉债治理计划](../design/governance/2026-10-26-ui-review-checklist-plan.md)；可执行判据见 [界面自检清单](../design/ui-review-checklist.md)。
- **状态**: 进行中（S1 已随第七十三阶段条目 1 收口；S2 字阶首批已上收第七十四阶段条目 5；字号归一第一 / 第二批已随第七十七 / 第七十八阶段完成，剩余 admin 路由面与暗色 tint 仍待切片）。
- **最近一次上收阶段**: 第七十八阶段（条目 5 `AppAvatar` 生产尺寸缺陷修复 2026-11-17 **已完成**：自有包装元素承载 `$attrs` 与 `--app-avatar-box`，构建产物实测 64 / 48 / 32px；条目 3 字号归一第二批 2026-11-18 **已完成**：非 admin 路由面 9 文件 51 处等值 token，零视觉差异）。
- **当前基线**: 457 条 `font-size:`（2026-11-17 `governance:inventory:font-sizes` 复算，128 文件 / 64 种取值）/ token 化 **139 条（30.42%）** / 可等价替换 274 条（59.96%）/ 口径内待替换 **135 条** / 非字阶 149 条 / scss 变量 34 条；状态色幻影 token（34 处）与迁移遗留 `--p-surface-border`（93 处）/ `--p-text-color-secondary`（15 处）已随第七十二阶段清零；「暂无文章」空态误用、空表分页与三处层序失效已随第七十三阶段条目 1 修复；扫描面 194 处 `border:`；视觉门禁 admin 23 条 + reader 18 条（41 路由 / 82 张参考态 + 1 条登记守卫，共 83 项比对）已全部迁移并校准，`PENDING_ROUTES` 为空；以 `tests/visual/parity/routes.ts` 为单点事实源；soft 8% 对比度实测 2.12 / 2.59 / 3.39。
- **下一次可切片方向**: **字号归一第三批**——剩余 135 条口径内待替换集中在 admin 路由面（`components/admin/settings` 35 处为最大单点）与 `styles/_onboarding.scss`（需「启动 tour 后截图」取证），单批 ≤10 文件。每批仍按评估报告处理剩余口径内字面量与归纳后的非字阶取值（不得直接按现值批量替换），并做 `getComputedStyle` 逐元素对账 + `test:visual` / `parity` 未归因差异 0。之后才是原有的暗色 tint 与 U1–U6 扩展评估。
- **待跟踪（2026-11-01 新增，责任人：UI 视觉质量治理）**: 字段文案同义检查已以 warning 面落地——`pnpm i18n:audit:field-copy` 已进入 `regression:weekly` 的 `required: false` 步骤，仅 `--fail-on-findings` 时非零退出。2026-11-18 复算：181 个 Vue 文件，R1 标签与占位符同义 11 处、R2 占位符承载规则信息 10 处，合计 **21 处**（原登记 183 文件 / 18 + 11 = 29 处）。两周观察期已满，待按「命中率 / 误报率 / 修复成本」决定是否收窄为 UI 自检 U7；在此之前**不改** `docs/design/ui-review-checklist.md` 的 U1–U6 边界，也不把该原则写入 `AGENTS.md` / `development.md`。已知漏报（不视为缺陷）：术语不一致型（如「推送标题」vs「请输入邮件标题」）与 `SettingFormField` 这类由父级 `field-key` 提供标签的形态。

## 周期性回归验证层

> **定位**：本层不是“一个任务”，而是所有长期主线的健康检查层。它不产生直接改进，只验证“没有回退”。按固定日历节奏执行，不参与阶段切片容量竞争。

### 固定执行入口

三条入口及其命令组合在 [项目规划规范 §4.2 固定调度入口](../standards/planning.md) 中完整定义，此处仅列出摘要：

| 节奏 | 入口 | 最小固定组合 | 触发条件 |
|:---|:---|:---|:---|
| 周级 | `pnpm regression:weekly` | coverage + deps audit + source-of-truth + i18n + duplicate-code + script-governance | 每周一次 |
| 发版前 | `pnpm regression:pre-release` | release:check:full + i18n + perf:budget:strict + duplicate-code | 每次发版前 |
| 阶段收口前 | `pnpm regression:phase-close` | coverage + release:check:full + i18n + perf:budget:strict + duplicate-code:strict + review-gate | 阶段归档前 |

### 覆盖矩阵（每条长期主线的回归覆盖状态）

| 长期主线 | 周级覆盖 | 发版前覆盖 | 阶段收口覆盖 |
|:---|:---|:---|:---|
| #1 测试覆盖率治理 | ✅ `test:coverage` | — | ✅ `test:coverage` |
| #2 结构复用治理 | ✅ `duplicate-code:check` | ✅ `duplicate-code:check` | ✅ `duplicate-code:check:strict` |
| #3 注释治理 | — | — | —（暂无自动检查，待补盘点脚本） |
| #4 Postgres 治理 | — | — | —（依赖 live sample，非自动） |
| #5 国际化治理 | ✅ `i18n:audit:missing` + `i18n:audit:duplicates` + `docs:check:i18n` | ✅ `docs:check:i18n` | ✅ `docs:check:i18n` |
| #6 文档治理 | ✅ `docs:check:source-of-truth` + `docs:check:line-count` | ✅ `docs:check:source-of-truth` | ✅ `docs:check:source-of-truth` |
| #7 Windows 性能治理 | — | ✅ `test:perf:budget:strict` | ✅ `test:perf:budget:strict` |
| #8 站点性能治理 | — | ✅ `test:perf:budget:strict` | ✅ `test:perf:budget:strict` |
| #9 脚本治理 | ✅ `governance:check:scripts` + `audit:simple-duplicates` + `audit:eslint-debt` + `audit:comment-drift` | — | —（docs candidate 暂保持独立 baseline） |
| #10 依赖与静态规则债治理 | ✅ deps audit + `security:alerts` | ✅ `release:check:full` | ✅ `release:check:full` |
| #11 UI 视觉质量治理 | — | — | ✅ `test:visual`（admin 23 + reader 18 = 41 路由 / 83 比对） |

> 标注 `—` 的条目表示当前缺少自动化回归覆盖，是后续回归层扩面的候选方向。

### 漂移路由规则

回归验证发现的问题不自行修复，而是按以下规则路由到对应长期主线的下一次切片候选：

| 回归发现问题 | 路由目标 |
|:---|:---|
| coverage 下降或测试有效性退化 | → 长期主线 #1（测试覆盖率治理） |
| duplicate-code 基线反弹 | → 长期主线 #2（结构复用治理） |
| i18n missing / duplicate keys / raw key 暴露 | → 长期主线 #5（国际化治理） |
| 文档事实源 stale 或行数超阈值 | → 长期主线 #6（文档治理） |
| 性能预算超标（bundle / Lighthouse） | → 长期主线 #8（站点性能治理） |
| Windows Dev / Build 性能退化 | → 长期主线 #7（Windows 性能治理） |
| 孤儿脚本、临时脚本残留、脚本入口漂移或治理脚本缺失 | → 长期主线 #9（脚本治理） |
| 空态 / 控件主次 / 对比度 / 可读性等界面质量问题 | → 长期主线 #11（UI 视觉质量治理） |
| 依赖安全 high+ 漏洞 | → 直接 blocker，在当前阶段修复 |
| 跨多条主线的问题 | → 取最匹配的一条路由，其他在路由备注中引用 |

### 回归记录管理

- 每次回归执行后，结果写入 `docs/reports/regression/current.md`。
- 当 `current.md` 超过 500-700 行 warning、700+ 行 blocker 时，触发滚动归档：将旧记录整体迁移到 `docs/reports/regression/archive/`，主窗口仅保留近线记录。
- 滚动归档的执行由回归层在阶段收口时统一触发，不另设独立的长期主线。

## 短期 / 一次性候选任务（上收后去重）

> 共享说明：除非单项另有说明，本区块条目当前均处于“候选评估中”，默认尚未满足正式上收前置条件；只有当条目内约束、门槛或预研结论闭环后，才允许写入 roadmap / todo。
> 管理规则：一旦被正式上收到 roadmap / todo，整条迁入 [短期候选解决归档](./archive/backlog-resolved-candidates.md)，本区块不保留历史说明。

### 延后新增能力保留池（当前不建议优先上收）

| # | 条目 | 说明 | 状态 |
|:---|:---|:---|:---|
| 1 | 桌面端应用 (Tauri) | 桌面客户端骨架，支持单站点 / 多站点管理 + 离线写作 | 休眠 |
| 2 | 极客技术增强 | Markdown 可执行代码块支持（JS / Python / Shell） | 休眠 |
| 3 | 主题生态系统 | 主题社区 / 发布平台 / 画廊 / 安全审核 | 休眠 |

### 待上收候选

1. **会员 / 付费订阅体系 (P2, 长期)**
    - **背景**: Ghost 的核心差异化在会员付费闭环；墨梅已有订阅者管理、邮件推送与 Better-Auth 用户体系，差距在支付集成与内容付费墙。
    - **最小范围**: 会员等级（Free / Supporter / Premium）、文章级付费墙（公开 / 订阅者可见 / 付费可见）、Stripe 支付集成、会员管理后台、收入仪表盘。
    - **非目标**: 不建课程 / 数字产品商城、不做复杂定价 / 折扣 / 优惠券引擎、不与 Patreon 模式竞争。
    - **前置条件**: 先确认候补名单的转化信号是否支持继续投入；评估 Stripe 在目标区域（含中国大陆）的可用性并预留支付宝 / 微信支付扩展点；确认 Better-Auth 角色扩展模型足以支撑会员等级。
2. **播客与多媒体扩展 (Podcast & Multimedia)**
    - **全站沉浸式播放**: 全站悬浮播放器，支持跨页面断点续播与内容同步。
3. **AI 视频生成与增强 (AI Video Generation & Enhancement)**
    - **多模态内容产出**: 探索集成视频生成模型（如 Seedance 2.0 等），支持基于文章内容或脚本生成动态视频素材，并实现“文章转视频”工作流。
4. **国际化语种扩展留档（西语 / 葡语 / 法语 / 俄语 / 德语）**
    - **留档范围**: 记录未来可扩展语种候选（es / pt / fr / ru / de），仅用于前置评估，不代表承诺上线。
    - **当前结论**: 短期内不规划新增语种，继续优先保障现有语言链路稳定性、翻译质量与性能基线；若后续上收，需先补齐 locale 注册、路由策略、SEO 元信息、翻译资源拆分与回归预算评估。
5. **迁移进度可视化与断点续传 (P3, 候选)**
    - **背景**: CLI 支持 `--concurrency` 并发导入，但大型博客（数百篇）中途失败需从头开始；断点续传可显著改善体验。
    - **技术方案**: CLI 本地维护迁移状态文件（`.momei-migration-state.json`），记录每篇 pending / success / failed / skipped；导入前检查并跳过已成功项；支持 `--resume` / `--clean`；显示进度（成功 / 失败 / 待处理 / 总数）。
    - **非目标**: 不做分布式迁移、不做跨机器续传、不做失败项自动重试。
    - **前置条件**: 评估状态文件格式与兼容性；确认存放位置（源目录 vs 当前目录）。
    - **验收标准**: 中断后重跑可跳过已成功项；`--resume` 正确启用续传；进度实时更新；状态文件格式清晰可读。
6. **Mergify 合并策略与 merge queue 采用（候选评估）**
    - **背景**: `.github/mergify.yml` 目前只有一条「立即合并」规则（`actions: merge` / `method: rebase`），依赖 PR 逐个独立落库、每次都改写 `pnpm-lock.yaml`。实测近 20 分钟内有 6 个依赖 PR 相继被自动合并，导致任何同样修改 lockfile 的维护者 PR 反复冲突（#890 连续三次重定基后仍 `behind 3`，一次观测 #877 已 `behind 18`），形成「必须抢在下次依赖合并前完成合并」的不对称拉锯。
    - **要点**: merge queue 能把「自动 update base + 基于最新 base 重测 + 批处理」从人工转为机制，但**队列本身不是冲突解决器**（与 base 的真实冲突会立即 dequeue）；对症的是 `conflict_resolvers`（官方明确覆盖 pnpm-lock.yaml 的包管理器感知形式），而它**只在 `merge_method` 为 `fast-forward` / `merge-batch` 时生效**——即必须放弃现有 `rebase` 语义。取舍与历史形态对照见详细方案 §4。
    - **最小范围**: 分两步——第一步仅引入队列并保留 `rebase`（拿到自动 update + 重测，不改历史形态与冲突语义），同时验证队列在本仓的实际行为；第二步再评估以 `conflict_resolvers` 换取 `merge-batch` / `fast-forward`。
    - **非目标**: 不引入 GitHub 原生 merge queue（无 batch、无 `conflict_resolvers`，对 lockfile 反复冲突场景不对症）；不改变依赖升级节奏、override 体系与 `security:audit-deps` 门禁口径；不借本次调整改动分支保护策略。
    - **上收前置**: 先闭环详细方案 §7 的 6 项待验证——尤其是「当前套餐是否覆盖 Batch / `conflict_resolvers`」「`conflict_resolvers` 对与 base 冲突是否生效」「机械消解后 lockfile 是否内部自洽」。必须在测试仓库用真实 `pnpm-lock.yaml` 冲突跑通一轮后再动生产配置。
    - **详细方案**: [2026-10-12-mergify-merge-queue-adoption-evaluation.md](../design/governance/2026-10-12-mergify-merge-queue-adoption-evaluation.md)
7. **首页缓存与语言检测解耦（② + ③ 组合，P2 候选）**
    - **背景**: 第七十六阶段条目 4 的决策记录确认 `/` 因 `Set-Cookie: i18n_redirected` + 无 `cache-control` 被 Cloudflare 判为 `DYNAMIC`；SSR 返回的是语言中立 200（`Accept-Language` / 偏好 cookie 都不改变 HTML，重定向在客户端）。
    - **待办**: 关闭或条件化 `detectBrowserLanguage.useCookie`（仅在显式切换语言时写偏好，例如客户端写入），让 `/` 去掉 `Set-Cookie` 并进入 SWR 缓存；补五语重定向与语言持久化 E2E；与运维配合配置 Cloudflare Cache Key / Vary（Accept-Language 或偏好 cookie）并验证 `cf-cache-status` 命中与不串语言。
    - **非目标**: 不放宽 nitropack 2.13.6 缓存安全规则；不改鉴权 / 会话链路；不为缓存牺牲无 JS 场景的默认语言正确性。
    - **验收标准**: `/` 响应无 `Set-Cookie` 且带 `s-maxage`；边缘命中可复跑；五语重定向与显式切换持久化不回退；决策与探针落 `artifacts/review-gate/`。

## 待跟踪与上游反馈登记（跨主线）

> 本区收录不属于任何单一阶段、也无法直接上收的事项：上游组件库缺口、门禁口径边界与既有缺陷的长期观察。已消解或已过期的跟踪项迁入 [短期候选解决归档](./archive/backlog-resolved-candidates.md)。

### 门禁与回归

- **`networkidle` 依赖外网可达性（2026-10-15 登记，责任人：门禁 / E2E 收敛）**: 视觉一致性门禁与 E2E 均以 `waitForLoadState('networkidle')` 判定就绪，而页面存在长期 pending 连接（`/api/notifications/stream` SSE、外部 gravatar 头像），无外网环境下永不空闲（本地实测：公开页 E2E 10 处失败、`/admin/users` 门禁需改用 `stable: lenient` 才可运行）；CI（有外网）与本地（无外网）像素 / 就绪结果不可复现，与迁移方案 §8.2「跨环境差异」条款冲突。**处置结论（2026-11-18，第七十九阶段条目 1）：明确保留**——`networkidle` 只影响 E2E / 视觉层的就绪判定，CI（有外网 + 单 worker）为最终裁决；本地无外网已有 `stable: 'lenient'`、水合后交互、业务锚点等降级路径，收窄为「阻断非本地请求」需改动全部基线就绪语义且收益不足。重新评估条件：CI 出现 `networkidle` 超时类失败连续 2 次，或 `lenient` 豁免面超过 3 条。详见 [等待口径与处置结论](../design/governance/2026-11-18-test-flake-waiting-and-networkidle.md)。
- **vitest 转换缓存导致本地模块解析失败（2026-10-22 登记，责任人：测试工程）**: 本地 Nuxt 测试环境存在 `node_modules/.vitest-cache` 热命中后 `utils/shared/post-copyright.ts` 等文件报 `Cannot find module '/@id/virtual:intlify-i18n-N'` 的问题（冷缓存可正常加载，CI 未复现），`tests/server/notification*.test.ts` 与 `post-distribution*.test.ts` 受影响。当前口径：干净全量跑前移走 `.vitest-cache`；`test:coverage` 是否需要显式 `--no-cache` 或隔离缓存目录仍待评估。

### 迁移收尾与视觉门禁

- **`components/admin/admin-taxonomy-page.vue` 越过 `max-lines` warn 线（2026-10-16 登记，责任人：迁移收尾 / 结构复用）**: 现为 **917 行**（迁移前 732 行，2026-11-18 复核），`pnpm lint` 实测 8/10 warning，仍通过但已消耗预算。增量来源：lucide 图标用法 12 处（其中 `#icon` 插槽 10 处）、弹窗焦点交接机制与迁移依据注释。**处置方向**：把「多语言列定义」（`columns` computed，约 70 行）与「多语言弹窗表单」抽为路由自有 composable / 子组件（本仓暂无「列定义外置」先例，须先在结构复用主线上评估口径）；抽取后须同步 `CAOMEI_UI_ROUTE_SCOPES` 的 `ownedFiles`，避免守卫扫描面漏掉新文件。
- **分类 / 标签弹窗初始焦点形态（2026-10-16 登记，责任人：迁移收尾）**: 迁移后浮层焦点曾由名称输入框变为关闭按钮，本批以「事件交接」修复（`@show` 置位 + 捕获第一次 `focusin` 后把焦点交回名称字段，实测 `document.activeElement === input#name_zh-CN`）。**遗留**：切换语言页签时焦点留在触发器上（Reka Tabs 标准行为），与迁移前「逐页签重挂载触发原生 autofocus」不同；`CaomeiInput` 仍无 `autofocus` 契约，后续是否统一由上游焦点契约决定。
- **`CAOMEI_UI_ROUTE_PREFIXES` 前缀语义的剩余缺口（2026-10-16 登记，责任人：迁移收尾）**: 管理端已以 `/admin` 树根前缀全量纳入扫描面，`primeVueSubRoutes` 例外清零；**公开页仍适用**——已登记前缀下非 `index.vue` 的子路由页面及其 `components/<prefix>/**` 子树是否渲染组件内择库型过渡组件，仍只能靠逐批清单发现，尚无响亮失败。
- **守卫「在册族零残留」扫描口径收窄（2026-10-16 登记，责任人：迁移收尾）**: 自第三批次起扫描剥离 `<script>` / `<style>` 块（`stripNonTemplateBlocks`，修复 TS 泛型实参假阳性），且该收窄**不作用于**子路由例外页面的「路由择库标记」扫描。已知边界：脚本内以字符串形式出现的旧标签名不再计入；若后续出现「把组件名写进脚本字符串」的写法，须先复核该口径再判定是否残留。

### 上游组件库反馈（caomei-ui）

- **§2.1 `Avatar` 档位与透传残差**: `xlarge` 的首字母字号仍取 caomei `lg` 的 16px（几何已由 `AppAvatar` 包装元素修正到 64px）；`comment-item` 的 `loading` / `decoding` 现落在包装 `<span>` 上，对 `span` 无原生语义，评论头像的**原生懒加载仍未生效**。需上游把 attrs 透传到内部 `<img>` 或把根改为单元素。
- **§2.6 `lazy` 只关分页、不关排序**: caomei-ui `1.3.0` 产物仍无 `manualSorting`（2026-11-18 复核），`/admin/users` 继续按「不绑定受控排序 prop」保持与迁移前一致的形态；若上游提供 `manualSorting` 或确认现状，须同步 `use-admin-list.ts` 的 `onSort` 口径与回归记录。
- **§2.7 `DataTable` 无「列最小宽」契约，且选择列宽度不可配置**: `DataTableColumn.width` 只落 `th` 且只有 `px` 宽度参与冻结偏移；PrimeVue 选择列 52px vs caomei 34px，使 `/admin/posts` 整表左移 18px。待上游提供选择列宽度钩子或列 `minWidth` 后重跑 parity 并重校准允许清单。
- **§2.8 `DataTable` 缺 `#header` / `#footer` 插槽**: caomei 插槽面为 `cell-{key}` / `header-{key}` / `empty` / `groupheader` / `expansion`，表格容器内的工具条与汇总行无落点；任务列表的刷新按钮因此移到表格之上（已登记偏差处置表）。若上游不补，后续页面须走包装元素。

## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [短期候选解决归档](./archive/backlog-resolved-candidates.md)
- [项目规划规范](../standards/planning.md)
