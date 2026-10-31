# 墨梅博客 长期规划与积压项 (Backlog)

本文档用于维护尚未进入正式阶段执行面的统一候选池，并按“长期主线任务”与“短期 / 一次性候选任务”双轨区分。当前阶段执行面请参阅 [项目计划](./roadmap.md)、[待办事项](./todo.md) 与 [待办归档](./todo-archive.md)。

> **维护规则**:
> 1. 新功能需求、非阻塞优化与长期治理事项优先写入本文件，而不是直接写入 `todo.md`。
> 2. backlog 必须区分“长期主线任务”“周期性回归验证层”和“短期 / 一次性候选任务”：长期主线可跨阶段保留，回归验证层有固定节奏不参与阶段排队，短期 / 一次性候选在正式上收后必须去重。
> 3. 长期主线被某阶段抽取后，不删除主线卡片，只补记最近一次上收阶段、当前状态与下一次可切片方向；主线**已关闭**时整条移除，不在本文件留痕。
> 4. 周期性回归验证层不是“一个任务”，而是所有长期主线的健康检查层。它按固定日历节奏执行（周级 / 发版前 / 阶段收口），不参与阶段切片容量竞争。回归发现的问题回灌到对应长期主线。
> 5. 当前仓库的 backlog 以中文为唯一事实源；翻译文档只保留摘要或跳转说明。

## 长期主线任务（可跨阶段保留）

> 状态口径统一使用：进行中 / 观察中 / 暂停 / 已关闭；**已关闭的条目即整条移除，故本区不会出现「已关闭」状态**。
> 本区**只保留可跨阶段反复切片的主线**；已关闭的主线已整条移除，不保留任何摘要或历史叙述。

### 1. 测试覆盖率与有效性治理

- **目标**: 在全仓 coverage 越过 `80%+` 的基础上分批渐进推进至 `90%+`（每批 1-2 个百分点），覆盖率提升与测试有效性并行，避免单一数字冲刺；失败 / 边界断言优先，不做低价值铺量。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十八阶段（第九批：`server/services/` 4 个低覆盖模块补测，新增 6 个测试文件 / 116 例 + 既有文件补 6 例；全仓 Statements 80.45% → 81.04%，Branches 69.81% → 70.83%，Lines 80.54% → 81.15%）。
- **当前基线**: Statements `81.04%` / Branches `70.83%` / Lines `81.15%`（距 `90%+` 长期目标约 9.0%）。
- **下一次可切片方向**: 按**绝对未覆盖语句数**而非百分比排序选模（当前 `server/services/` 前列：`setting.ts` 43 / `ai/text-translation-task.ts` 34 / `migration-link-governance.ts` 32 / `ai/post-automation.ts` 32 / `ai/tts.ts` 30）。第九批已把候选池（`friend-link` / `notification` / `post-distribution` / `upload`，合计 866 条语句）的未覆盖语句尽可能闭合，实际 +0.59pp ≈ 该池 100% 闭合上限（约 +0.66pp）的 89%，但受池体量限制无法达到单批 +1pp——后续批次应优先纳入语句基数更大的模块，并继续坚持“失败 / 边界优先”。**第九批（已于第六十八阶段完成并归档，见 [todo-archive.md](./todo-archive.md) 第六十八阶段条目 4）**。遗留治理项：`text.test.ts` 超 1000 行建议拆分、`tts.test.ts` beforeEach 对齐 `mockReset`、`friend-link` 的 name/url 归一化缺陷（见下方待跟踪）。

### 2. 结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛

- **目标**: 压缩高频重复实现，补齐共享 helper / 纯函数抽象，并把零散类型与轻量响应壳层纳入受控复用；优先治理跨文件重复率高、适合稳定上收的候选，而不是把所有局部实现强行抽象。默认以 `pnpm duplicate-code:check` 作为事实源。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十六阶段（theme 颜色 model 工厂 + 预设值取值抽取到 `composables/use-theme-color-models.ts`，基线 0.31% → 0.30%）。
- **当前基线**: `duplicate-code` 0.30%（jscpd 行级口径）。
- **下一次可切片方向**: 基于 0.30% 基线继续收敛——剩余轻量 shared helper、表单元数据 / 表单控件的类型共享、`server/api/` 层请求上下文与参数校验的共性逻辑；结构性重复候选保留轻量壳层类型与“重复导入后轻包装”的纯函数。

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
- **最近一次上收阶段**: 第六十四阶段（ko-KR / ja-JP 文档治理：13 文件 `last_sync` 刷新、ja-JP 由 seo-ready 升格、补全 features / variables 翻译）。
- **当前基线**: `i18n:audit:missing = 0`；缺失字段优先修复、重复键及时清理、`unused` 默认观察。
**待跟踪（2026-10-14 新增，责任人：国际化治理）**：跨语种键集合漂移在 **per-PR CI 无阻断**——PR 侧只跑 `pnpm lint:i18n`（eslint `@intlify/*` 规则），实测「仅删 `en-US` 一个键」时 `lint:i18n` EXIT 0、`pnpm i18n:check-sync`（默认 `failOnDiff=false`）EXIT 0；只有 `pnpm i18n:audit:missing`（`--fail-on-missing`，在 `regression:weekly` profile 内）与 `i18n:check-sync --fail-on-diff` 才 EXIT 1。收敛方向：把 `i18n:audit:missing`（或 `i18n:check-sync --fail-on-diff`）加入 PR 侧 test job，使五语种键漂移在合并前即被拦下。

- **下一次可切片方向**: 尚未纳入 runtime 回归的公开页装配链路（档案 / 分类 / 标签列表页 i18n 完整性审计）；仍需动态拼接 key 的场景优先评估“是否为有限集合”，默认改显式静态 key 映射而非扩 allowlist。

### 6. 文档事实源、翻译与分层归档治理

- **目标**: 统一维护全文档体系的分层边界、膨胀阈值与 freshness——`docs/design/` 的模块 vs 专项分层、`docs/plan/` 的行数阈值触发归档、`docs/i18n/*/` 的翻译 tier 与同步；清理无效 / 过时 / 漂移文档；保持 `docs:check:source-of-truth` 与 `docs:check:line-count` 可通过，不靠临时补 `last_sync` 应付检查。阈值被证明过宽时先回写脚本，再更新规范与阶段结论。
- **状态**: 观察中。
- **最近一次上收阶段**: 第六十四阶段（ko-KR / ja-JP 专项治理：freshness 审计报告 + 13 文档 `last_sync` 刷新 + ja-JP 升格 + features / variables 翻译补齐）。
- **当前基线**: `docs:check:line-count` 覆盖 README、plan 主文档与 `docs/reports/regression/current.md`；`docs:check:source-of-truth` 以 git 提交判定 hard blocker，tier 软上限 `must-sync 60 天 / summary-sync 120 天`（`candidate` profile 保留 21/30 天基线，仅作收敛评估）。
- **下一次可切片方向**: design 域审计 `docs/design/governance/` 中已过期评估 / 报告的归档状态；plan 域按阈值滚动归档（跟进 `roadmap.md` / `todo-archive.md` 行数）；翻译域评估进一步收紧 `must-sync` / `summary-sync` 的可执行性。**待跟踪（2026-10-24 更新）**：① **回归窗口阈值存在两套口径**——`docs/reports/regression/index.md` §3.1 为「300-400 行或 6-8 条记录」，`scripts/docs/check-line-count.mjs` 为 warn>500 / error>700；建议收敛为单点口径并把 `index.md` 改为指针引用（第六十八阶段收口按前一口径执行整窗归档：`current.md` 由 452 行 / 5 窗口降为 14 行 / 0 窗口，均为脚本 `docs:check:line-count` 口径）。② **迁移页跨批遗留形态**（责任人：迁移收尾）：页面 scoped 样式的幻影 token（`--surface-ground` / `--border-radius` / `--text-color-secondary` 等全仓未定义、恒为 `unset`）、`p-fluid` 与若干 `*__dialog` class 在构建产物中无对应规则，均与 PrimeVue 卸载同批清理；迁移页注释与测试注释中的阶段号 / 审计编号随 B4 统一清理。③ **视觉一致性门禁的跨环境基线治理**（责任人：迁移收尾）：移除 `visual` job 的 `continue-on-error` 前须先在 ubuntu runner 以 CI 产物复采参考态并刷新预算（见 [视觉一致性门禁](../design/governance/2026-10-13-visual-parity-gate.md) §7）；任何 `reader` 档路由上线前其 parity 未归因差异须为 0。④ **口径沉淀**：回归窗口归档与节名引用改写一并执行（第十三次归档已按该口径落地）。

### 7. Windows 本地 Dev / Build 性能治理

- **目标**: 为 Windows 本地 `nuxt dev` / `nuxt build` 建立统一量化口径，优先收敛首请求阻塞与构建尾耗时，不扩写为全平台构建重构。
- **状态**: 暂停（第四十三阶段确认平台级瓶颈：Linux CI 106s vs Windows >1800s，>17x 差距，非项目层面短期可收敛）。
- **最近一次上收阶段**: 第四十三阶段（Vite warmup + `resolve.extensions` 收窄 + Nitro inline 瘦身 + sourceMap 关闭 + `build:done` 跳过，确认平台级瓶颈后上收关闭）。
- **下一次可切片方向**: 暂停。仅在 Nuxt / Nitro 发布针对 Windows 的重大性能改进，或项目迁移到 WSL2 / Linux 开发环境时重新评估；历史数据见 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)。

### 8. 站点性能与 Core Web Vitals 持续优化

- **目标**: 持续追踪核心页面 Core Web Vitals，建立跨版本性能回归基线；优先级：公开首页 > 文章详情页 > 分类 / 标签列表 > 后台管理页。与 #7 的区别：本条聚焦生产环境用户体验性能。
- **状态**: 进行中（已有 Lighthouse CI + bundle budget 体系，尚未形成持续优化节奏）。
- **最近一次上收阶段**: 第五十二阶段（移动端 CWV 基线采集与评估：首页 / 文章详情 / 分类标签列表页 LCP / CLS / INP 基线落盘）。
- **当前基线**: `coreEntryJs` 329.11KB / 360KB；`maxAsyncChunkJs` 48.00KB / 130KB；`keyCss` 59.47KB / 70KB（并存期配额已随 caomei-ui 重锚回落）。
- **下一次可切片方向**: 文章详情页按需 hydration；入口启动载荷专项分析（Sentry / PrimeVue / 依赖预载）；评估收紧 `maxAsyncChunkJs` 并为 shared chunk 单列预算；移动端 LCP 超 3s 时启动专项治理。

### 9. 脚本资产、量化口径与回归入口治理

- **目标**: 把脚本作为长期治理主线的事实源，为 ESLint / 类型债、结构复用、注释治理、文档治理等建立可重复执行的计数、分桶与 delta 输出；治理 `scripts/**` 的长期入口、孤儿脚本、临时脚本残留与输出漂移；稳定后并入固定回归入口。
- **专项设计事实源**: [script-governance.md](../design/governance/script-governance.md)。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十五阶段（`governance:audit:simple-duplicates` 升格至 `regression:weekly` warning 面，结论 Go）。
- **当前基线**: `governance:check:scripts` 与 `audit:simple-duplicates`、`audit:eslint-debt`、`audit:comment-drift` 均已进入 `regression:weekly` warning 面；`docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 仍为独立 baseline。
- **下一次可切片方向**: 按周级回归趋势跟踪 comment-drift 的 TODO / 复述 / 漂移候选数，仅在数值异常反弹时治理；评估 docs candidate 入口是否进入更高频回归。

### 10. UI 组件库许可证风险与迁移可行性治理

- **目标**: 消除 PrimeVue 锁定在 MIT 终点版本（4.x）后形成的许可证与维护风险，按已评估方案迁移到许可证可控的 caomei-ui，而不是在依赖升级 PR 中被动决策。
- **专项设计事实源**: [PrimeVue 5 许可证变更评估](../design/governance/2026-08-29-primevue-5-license-change-evaluation.md)；[PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（批次编排、消费路径、视觉验证回归与验收口径）。
- **状态**: 进行中（方案 A 轨迹为第六十七 ~ 第七十阶段四段；**第六十八阶段（`0.3.0` 基线复测 + B2 剩余数据页全量）已审计归档**，下一阶段为 B3 + 浮层类，待阶段准入评估；当前锁定目标依赖为 `0.7.0`）。
- **最近一次上收阶段**: 第六十八阶段（`caomei-ui` 0.3.0 升级与基线复测 + 版本口径校正至 `0.6.0` + B2 剩余 10 个数据列表路由与 3 个组件型目标 host 路由全量迁移，已审计归档）。
- **当前基线**: `primevue@4.5.5` 锁定并在 `.github/dependabot.yml` 按版本屏蔽；**`caomei-ui@0.7.0` 精确锁定**（2026-10-24 维护批次升级：`0.7.0` 无运行时破坏面，唯一 BREAKING 为 locale 预注册 + 子路径化，而 momei 尚未接线 `provideLocale` 故无行为变化；基础层 sha256 与 0.6.0 相同、依赖解析零漂移、`keyCss` 59.84KB / 70KB 未反弹；详见迁移方案 §3.9 与回归记录窗口）；`keyCss` 配额 70KB（组件样式随消费方 chunk 归属）；组件清单 `0.7.0` 口径 **95 项**（0.6.0 为 81 项，+14 个新增组件名），上游反馈清单 1.3 / 1.4 / 1.5 三条真实缺口已由 `0.4.0` 交付闭合。
- **下一次可切片方向**: 承接第六十八阶段已归档成果，按迁移方案 §7 推进——B3 表单与设置并入浮层类（Dialog / Drawer / Popover / DropdownMenu）为第六十九阶段，B4 展示、浮层收尾与 PrimeVue 卸载为第七十阶段；共享壳过渡组件替换清单见迁移方案 §5.5，上游反馈清单见 [2026-09-25-caomei-ui-upstream-feedback.md](../design/governance/2026-09-25-caomei-ui-upstream-feedback.md)。待上收小切片：① 状态色 tone 对比度修正（short 候选 #12，建议并入第六十九阶段前的独立切片）；② **locale 接线**——`0.7.0` 起 `zh-TW` / `ja-JP` / `ko-KR` 须经 `caomei-ui/locale/<code>` + `registerLocale()` 注册，接入 `CaomeiConfigProvider` 后后台内建文案才会跟随应用语言（当前回落 `zh-CN`，属既有缺口，建议并入第六十九阶段）。**已闭环（2026-10-28）**：`admin-marketing-form-dialog` 的 parity 失败根因不是参考态漂移，而是 `pages/admin/marketing/index.vue` 的 `&__dialog` 写在 scoped 块内——`Dialog` 由 PrimeVue 渲染到 body，作用域属性落不到 `.p-dialog`，规则长期失效使弹窗宽度随内容固有宽度漂移（caomei 字段更窄 → 542px，参考态 679px，整窗错位 8.81%，与 0.6.0 / 0.7.0 无关）。已改用 `:style="{ width: 'min(90vw, 680px)' }"` 归位，并按归位后实测重新登记允许清单；门禁 34/34 回绿。**收尾必办**：① B4 只需确认 `keyCss` 未反弹；② 第七十阶段前须为 `caomei-ui` 配置 Dependabot `ignore`（或改走人工升级），阻断「精确锁定仍被单包抬版」的静默漂移路径（见迁移方案 §3.8 / §5.6）。

### 11. UI 视觉质量与界面自检治理

- **目标**: 把「界面是否合格」从审美讨论收敛为可判定检查项与可回归证据。维护一份只收真实命中、影响使用的界面自检清单（U1–U6），用它驱动视觉债清偿与视觉门禁扩容；不追求一次重做设计体系。
- **专项设计事实源**: [界面自检清单与视觉债治理计划](../design/governance/2026-10-26-ui-review-checklist-plan.md)；可执行判据见 [界面自检清单](../design/ui-review-checklist.md)。
- **状态**: 观察中（S0 已落盘并接入 V / A 阶段；S1 未开工）。
- **最近一次上收阶段**: 无（S0 为维护批次，尚未立正式阶段）。
- **当前基线**: 478 条 `font-size:` / 60 种写法 / token 化 6.3%；34 处状态色幻影 token（24 处 `$color-*` + 7 处 `--p-warning-color` + 2 处 `--p-error-color` + 1 处 `--p-text-secondary-color`）；另有迁移遗留的 `--p-surface-border` 95 处 / `--p-text-color-secondary` 15 处，随 B3 / B4 清理；4 个文件覆盖 5 个页面误用「暂无文章」空态；扫描面 194 处 `border:`；视觉门禁 17 条 admin 路由 / 0 条 reader；soft 8% 对比度实测 2.12 / 2.59 / 3.39。
- **下一次可切片方向**: 直接做 S1：状态色幻影 token 清零（34 处）+ 空态组件与文案（4 个文件 / 5 页）+ 空表不渲染分页，6–8 文件。S1 优先于暗色 tint 与字阶治理：先让颜色「存在」，再谈颜色「好看」。S1 建议作为第六十九阶段前的独立小切片，不并入 caomei-ui B3 批次。

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
| #10 UI 组件库迁移治理 | ✅ `test`（含路由迁移守卫单测） | ✅ `release:check:full`（内含 lint / typecheck） | ✅ `test:visual`（初期非阻断）+ `review-gate` |
| #11 UI 视觉质量治理 | — | —（S1 后纳入） | ✅ `test:visual`（现状 17 条 admin；reader 待 S4） |

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
| caomei-ui 迁移相关视觉 / 路由结构回归失败 | → 长期主线 #10（UI 组件库迁移治理） |
| 空态 / 控件主次 / 对比度 / 可读性等界面质量问题 | → 长期主线 #11（UI 视觉质量治理） |
| 依赖安全 high+ 漏洞 | → 直接 blocker，在当前阶段修复 |
| 跨多条主线的问题 | → 取最匹配的一条路由，其他在路由备注中引用 |

### 回归记录管理

- 每次回归执行后，结果写入 `docs/reports/regression/current.md`。
- 当 `current.md` 超过 500-700 行 warning、700+ 行 blocker 时，触发滚动归档：将旧记录整体迁移到 `docs/reports/regression/archive/`，主窗口仅保留近线记录。
- 滚动归档的执行由回归层在阶段收口时统一触发，不另设独立的长期主线。

## 短期 / 一次性候选任务（上收后去重）

> 共享说明：除非单项另有说明，本区块条目当前均处于“候选评估中”，默认尚未满足正式上收前置条件；只有当条目内约束、门槛或预研结论闭环后，才允许写入 roadmap / todo。
> 管理规则：一旦被正式上收到 roadmap / todo，必须从本区块删除（或改写为一行历史说明），避免与正式阶段正文重复。

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
5. **js-yaml 升级到 5.x（依赖现代化，候选）**
    - **背景**: `js-yaml@5.4.2` 已是 npm `latest`（4.x 标记 `v4-legacy`，无安全更新预期）；`pnpm-workspace.yaml` 存在裸名 override `js-yaml: ^4.3.2` 压制 dependabot 的 `^5.4.2` bump，造成声明与解析不一致（2026-09-24 已回退声明至 `^4.3.2`）。
    - **不可直接升级的实测依据（2026-09-24）**: override 改到 `^5.4.2` 后 `pnpm run security:validate-overrides` 抛 `SyntaxError: The requested module 'js-yaml' does not provide an export named 'default'`——js-yaml 5 的 ESM 构建不再提供 default 导出，而仓库有 8 处 `import yaml from 'js-yaml'` 默认导入。
    - **最小范围**: ① 8 处改为命名导入（`load` / `dump`）并核对 API 兼容（`packages/cli/src/parser.ts` 有 v4 移除 `safeLoad` 的历史包袱，hexo frontmatter 需重点回归）→ ② CLI / server / composable 定向测试 → ③ 评估裸名 override 是否改为定向 override → ④ 更新 override 并跑 `security:validate-overrides`。
    - **非目标**: 不连带其他依赖升级；不改动 frontmatter 兼容策略。
    - **上收前置**: 定 override 归属（裸名 vs 定向）并列出 js-yaml 5 的 API 差异清单。
6. **多平台迁移适配器 — JekyllParser（剩余部分）**
    - **背景**: 迁移 CLI 已支持 Hexo / Hugo / WordPress（`ContentParser` 接口 + 三个适配器 + `--format` 参数，均已有单测），仅剩 Jekyll。
    - **最小范围**: 新增 `JekyllParser`（解析 Jekyll Front-matter），复用现有导入链路与 `--format` 参数。
    - **非目标**: 不支持在线 API 导入（如 WordPress REST API）、不做自动格式检测、不做平台特定的插件 / 主题迁移。
    - **前置条件**: 评估 Jekyll Front-matter 差异与兼容性（YAML 为主）。
    - **验收标准**: 各平台 title / date / tags / categories / content 正确映射；`--format` 正确选择解析器；新增适配器有单测；现有 Hexo / Hugo / WordPress 行为无回归。
7. **迁移进度可视化与断点续传 (P3, 候选)**
    - **背景**: CLI 支持 `--concurrency` 并发导入，但大型博客（数百篇）中途失败需从头开始；断点续传可显著改善体验。
    - **技术方案**: CLI 本地维护迁移状态文件（`.momei-migration-state.json`），记录每篇 pending / success / failed / skipped；导入前检查并跳过已成功项；支持 `--resume` / `--clean`；显示进度（成功 / 失败 / 待处理 / 总数）。
    - **非目标**: 不做分布式迁移、不做跨机器续传、不做失败项自动重试。
    - **前置条件**: 评估状态文件格式与兼容性；确认存放位置（源目录 vs 当前目录）。
    - **验收标准**: 中断后重跑可跳过已成功项；`--resume` 正确启用续传；进度实时更新；状态文件格式清晰可读。
8. **设置表单 UI — AI Image Fallback 4 项（剩余部分）**
    - **背景**: 设置表单 UI 主线已分四批交付（Phase 1 盘点映射、Phase 2-4 共 15 个控件 + 五语种翻译）；剩余 `AI_IMAGE_FALLBACK_PROVIDER` / `API_KEY` / `MODEL` / `ENDPOINT` 4 项。
    - **最小范围**: 补齐 4 项 `SETTING_ENV_MAP` 映射、`.env.full.example` 注释示例、`ai-settings.vue` 表单控件（涉及 `ai_image_enabled` 二级嵌套 group 扩展）与五语种翻译。
    - **非目标**: 不暴露基础设施密钥到后台；不改变 `FORCED_ENV_LOCKED_KEYS` 安全锁定策略。
    - **详细方案**: [settings-form-ui-phase1-gap-inventory.md](../design/governance/settings-form-ui-phase1-gap-inventory.md)
9. **编辑器工具栏收敛 Phase C — 审查 + 视角合并 (P2, 剩余部分)**
    - **背景**: Phase A（5 入口分组，第六十五阶段）与 Phase B（续写 / 扩写 / 缩写风格扩展，第六十六阶段）已交付；Phase C 为审查与视角检查合并。
    - **最小范围**: 新建双 Tab 合并侧面板 `PostEditorConsolidatedReviewPanel`，双 API 并行调用。
    - **非目标**: 不改动 MavonEditor 原生工具栏；不改动编辑器页面整体布局；不改动 AI 计费 / 配额逻辑；不新增 AI Provider。
    - **详细方案**: [editor-toolbar-consolidation-eval.md](../design/governance/editor-toolbar-consolidation-eval.md)
10. **Mergify 合并策略与 merge queue 采用（候选评估）**
    - **背景**: `.github/mergify.yml` 目前只有一条「立即合并」规则（`actions: merge` / `method: rebase`），依赖 PR 逐个独立落库、每次都改写 `pnpm-lock.yaml`。实测近 20 分钟内有 6 个依赖 PR 相继被自动合并，导致任何同样修改 lockfile 的维护者 PR 反复冲突（#890 连续三次重定基后仍 `behind 3`，一次观测 #877 已 `behind 18`），形成「必须抢在下次依赖合并前完成合并」的不对称拉锯。
    - **要点**: merge queue 能把「自动 update base + 基于最新 base 重测 + 批处理」从人工转为机制，但**队列本身不是冲突解决器**（与 base 的真实冲突会立即 dequeue）；对症的是 `conflict_resolvers`（官方明确覆盖 pnpm-lock.yaml 的包管理器感知形式），而它**只在 `merge_method` 为 `fast-forward` / `merge-batch` 时生效**——即必须放弃现有 `rebase` 语义。取舍与历史形态对照见详细方案 §4。
    - **最小范围**: 分两步——第一步仅引入队列并保留 `rebase`（拿到自动 update + 重测，不改历史形态与冲突语义），同时验证队列在本仓的实际行为；第二步再评估以 `conflict_resolvers` 换取 `merge-batch` / `fast-forward`。
    - **非目标**: 不引入 GitHub 原生 merge queue（无 batch、无 `conflict_resolvers`，对 lockfile 反复冲突场景不对症）；不改变依赖升级节奏、override 体系与 `security:audit-deps` 门禁口径；不借本次调整改动分支保护策略。
    - **上收前置**: 先闭环详细方案 §7 的 6 项待验证——尤其是「当前套餐是否覆盖 Batch / `conflict_resolvers`」「`conflict_resolvers` 对与 base 冲突是否生效」「机械消解后 lockfile 是否内部自洽」。必须在测试仓库用真实 `pnpm-lock.yaml` 冲突跑通一轮后再动生产配置。
    - **详细方案**: [2026-10-12-mergify-merge-queue-adoption-evaluation.md](../design/governance/2026-10-12-mergify-merge-queue-adoption-evaluation.md)
11. **`useI18n()` 内联调用形态收敛（正确性治理，2026-10-14 登记）**
    - **背景**: `vue-i18n@11` 的 `useI18n()` 在 `getCurrentInstance() === null` 时**抛错**（`MUST_BE_CALL_SETUP_TOP`）。在**事件处理器 / 异步函数**内内联调用（而非使用 setup 顶层解构的 `t` / `locale`）会静默失效——`/admin/submissions` 的 `openReview` 即因此让「审核」按钮点击后弹窗永不打开（2026-10-14 修复可见文案时发现，已单独修复该一处）。
    - **现状盘点（2026-10-14）**: `pages/admin/submissions/index.vue` 的 1 处已修复；`components/admin/dashboard/creator-stats-panel.vue` 3 处位于 `computed` 内（模板渲染期求值，当前可用但不稳健）；`components/admin/snippets/snippet-aggregate-dialog.vue` 2 处位于事件处理器 / 异步函数内，**同属会抛错的形态**。
    - **最小范围**: ① 全仓检索「`useI18n()` 非 setup 顶层调用」，逐处改为使用顶层解构的 `t` / `locale` / `locales`；② 为 `snippet-aggregate-dialog` 的两处补失败 / 边界断言（点击即触发路径）；③ 评估加一条 lint 规则或治理脚本防回归（若规则成本过高，至少纳入 `governance:audit:*` 巡检清单）。
    - **非目标**: 不重构 i18n 装配方式；不改 vue-i18n 版本；不动 `useI18nDate` 等自有 composable。
    - **验收标准**: 全仓无「非 setup 顶层」的 `useI18n()` 调用；涉及页面 / 组件的交互路径有单测覆盖；`pnpm typecheck` + `pnpm lint` + 定向测试通过。
12. **caomei-ui 状态色 tone 对比度修正（2026-10-24 登记）**
    - **背景**: token 桥接把状态 tone 取在 500 档，而 caomei 的 soft / outline / simple 变体把 tone 直接当文字 / 边框色；浅色 soft 8% 底上 success / warning / danger 仅 2.12 / 2.59 / 3.39，低于 WCAG AA 4.5，也是迁移后 success / warning 观感差异最大的直接来源。暗色 tone 亦未跟随上游 400 档。
    - **最小范围**: 桥接状态 tone 改为模式感知——light 取 `-700`、dark 取 `-400`，solid 保持 `-700`；新增 unlayered `html.dark` 覆盖块；同步契约测试与迁移方案 §5.2 / 偏差处置表。
    - **非目标**: 不改 solid（上游规范值且白字达标）、不改主色 / surface / 圆角 / 字体、不做选择器覆盖、不升级 `caomei-ui`、不重做状态色体系。
    - **上收前置**: 视觉基线需覆盖带数据行与状态标签的页面（现状多为空态基线，本差异正是因此漏出）；确认浅色 `tone == solid` 的层次收敛可接受，并明确错误边框是否跟随变深。
    - **验收标准**: light / dark 计算值分别等于对应 `-700` / `-400`，solid 恒 `-700`；soft 8% 底文字对比度两态均 ≥ 4.5；视觉差异仅限状态色区域且逐项归因；`keyCss` 不越线。
    - **详细方案**: [2026-10-24-caomei-status-tone-contrast.md](../design/governance/2026-10-24-caomei-status-tone-contrast.md)

---

- **待跟踪（2026-10-15 新增，责任人：门禁 / E2E 收敛）**：`networkidle` 依赖外网可达性——① 视觉一致性门禁与 E2E 均以 `waitForLoadState('networkidle')` 判定就绪，而页面存在长期 pending 连接（`/api/notifications/stream` SSE、外部 gravatar 头像），无外网环境下永不空闲（本地实测：公开页 E2E 10 处失败、`/admin/users` 门禁需改用 `stable: lenient` 才可运行）；② CI（有外网）与本地（无外网）像素/就绪结果不可复现，与迁移方案 §8.2「跨环境差异」条款冲突；③ 建议后续按「阻断非本地请求」统一收敛门禁与 E2E 的等待口径，并与「以 CI 产物复采参考态」的前置条件同批执行。
- **待跟踪（2026-10-15 新增，责任人：迁移收尾）**：上游反馈 §2.6（`lazy` 只关分页、不关排序）待上游确认；`/admin/users` 本批按「不绑定受控排序 prop」保持与迁移前一致的形态，若上游提供 `manualSorting` 或确认现状，需同步 `use-admin-list.ts` 的 `onSort` 口径与回归记录。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：上游反馈 §2.7（`DataTable` 无「列最小宽」契约，`DataTableColumn.width` 只落 `th` 且只有 `px` 宽度参与冻结偏移；**选择列宽度不可配置**——PrimeVue 52px vs caomei 34px，使 `/admin/posts` 整表左移 18px）待上游确认；若上游提供选择列宽度钩子或列 `minWidth`，须重跑 `/admin/posts` parity 并按实测重校准允许清单。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾 / 阶段收口）**：`tests/visual/parity/reference/*.reference.png`（**34 张**：10 条 admin 数据列表路由 + `/admin/comments` 共 11 路由 × 2 主题 = 22 张，分类 / 标签 2 路由 × 2 = 4 张，`/admin/ai` 2 个对照面 × 2 = 4 张，`/admin/marketing` 2 个对照面 × 2 = 4 张）中，前 22 张（11 路由）在数据列表路由全部迁移后**已失去运行时职责**（`PENDING_ROUTES` 清空），但它们与随后各批次新增的 12 张（分类 / 标签 4 张 + `/admin/ai` 两对照面 4 张 + `/admin/marketing` 两对照面 4 张）同为「PrimeVue 原貌」的唯一存档；`PENDING_ROUTES` 已空 ⇒ 全量 34 张均已转为「迁移前原貌存档」，不再承担「待迁移参考态」的运行时对照职责（已迁移路线的对照仍用于漂移检出）——PrimeVue 卸载（B4）后无法重采。收尾时须显式决策保留方式（就地归档 / 迁入设计证据目录 / 另存 release 资产），**不得直接删除**；同时须同步 `playwright.visual-parity.config.ts` 的 `snapshotPathTemplate` 与采集脚本口径。**已知附带失败模式（2026-10-16 已缓解）**：参考态齐备后，`capture-visual-reference.mjs` 的保护口径会把全部用例排除，HEAD 全量采集因此无候选用例——Playwright 默认以 `No tests found` 退出码 1 使 `pnpm test:visual:reference` 硬失败；本批已就地采集块补 `--pass-with-no-tests`（「无待采目标 = 成功」，专刷某条仍用 `--only=<name>`），并有静态守卫锁定该 flag（`tests/scripts/capture-visual-reference.test.ts`）。保留方式决策落地时须一并复核该行为。

- **待跟踪（2026-10-16 新增，责任人：B3 / B4 批次）**：迁移前 PrimeVue `DatePicker` 的 `id` **未声明为 prop**（只声明 `inputId`），故 `<label for="scheduledAt">` 实际落在外层 `<span>` 上、未关联到输入框——全仓多处同一写法（`pages/admin/ad/campaigns.vue`、`components/admin/posts/publish-push-dialog*.vue`、`components/admin/marketing-campaign-form.vue`），属**既有缺陷**（非迁移引入）。迁到 caomei `DatePicker`（`id` 落内层 input）时自然修复；建议在 B3 / B4 批次的验收点显式校验「`label for` → 内层可聚焦元素」。
- **待跟踪（2026-10-16 新增，责任人：AI 资产治理）**：`pnpm ai:check` 在 master 上为红——`code-quality-auditor/SKILL.md` 的 2 处与 `full-stack-master/SKILL.md` 的 1 处相对链接携带锚点（`documentation.md#35-…`、`review-checklist.md#46-…`）命中 `skill-anchor-link` 规则且无豁免登记；该入口未接入任何 workflow，故长期未被发现。**最小范围**：去掉 3 处锚点，或为该规则补白名单豁免口径并登记理由。**非目标**：不改两个 skill 的正文语义与镜像结构。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：守卫的「在册族零残留」扫描口径自第三批次起**剥离 `<script>` / `<style>` 块**，且该收窄**不作用于**子路由例外页面的「路由择库标记」扫描（后者 token 不含尖括号，无假阳性动机，收窄反而会丢掉脚本块内 `import` 的覆盖）（`stripNonTemplateBlocks`，修复 TS 泛型实参假阳性）——已知边界是脚本内以字符串形式出现的旧标签名不再计入；若后续出现「把组件名写进脚本字符串」的写法，须先复核该口径再判定是否残留。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：`components/admin/ai/task-detail-content.vue` 因**与豁免子路由 `/admin/ai/tasks/[id]` 共享**而在 `/admin/ai` 批次**延后迁移**（迁移会在子路由内造成库间混用；消费处静态择库需另立 V2 分支）。当前副作用：`/admin/ai` 的详情弹窗内容维持 PrimeVue（与弹窗本体的浮层豁免一致，无混排）。随 `/admin/ai/tasks/[id]`（B4 展示族）批次一并处理，届时应评估「V2 分支 vs 子路由整迁」两条路径。**同时待上游补**：caomei `DataTable` **无 `#header` / `#footer` 插槽**——任务列表的刷新按钮因此从表格容器内移到表格之上（已登记偏差处置表），后续页若依赖该插槽需走包装元素。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾 / 结构复用）**：`components/admin/admin-taxonomy-page.vue` 迁移后 **904 行**（迁移前 732 行），越过 ESLint `max-lines` **warn>800** 线（`pnpm lint` 实测 8/10 warning，仍通过但已消耗预算）。增量来源：lucide 图标用法 12 处（其中 `#icon` 插槽 10 处，每处 3 行）、弹窗焦点交接机制、以及迁移依据注释。**处置方向**：把「多语言列定义」（`columns` computed，约 70 行）与「多语言弹窗表单」抽为路由自有 composable / 子组件（本仓暂无「列定义外置」先例，须先在结构复用主线上评估口径）；抽取后须同步 `CAOMEI_UI_ROUTE_SCOPES` 的 `ownedFiles` 登记，避免守卫扫描面漏掉新文件。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾，随浮层批次）**：`/admin/categories` + `/admin/tags` 弹窗的**初始焦点**在迁移后由「名称输入框」变为「浮层关闭按钮」——迁移前 PrimeVue `Dialog` 的 `onAfterEnter` → `focus()` 会命中默认插槽内的 `[autofocus]`（名称 `InputText`）；迁移后 caomei `CaomeiInput` 无 `autofocus` 契约（透传属性落在不可聚焦的字段外壳），命中项消失。**本批已用「事件交接」修复**：`@show` 置位 + 捕获浮层第一次 `focusin`（即 focus trap 落到关闭按钮的那次）后把焦点交回名称字段（实测 `document.activeElement === input#name_zh-CN`）。**遗留**：切换语言页签时焦点留在触发器上（Reka Tabs 的标准行为），与迁移前「逐页签重挂载触发原生 autofocus」不同；浮层本体迁到 caomei（第六十九阶段）后须按新的 `autofocus` / 焦点契约复核并决定是否统一。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：`CAOMEI_UI_ROUTE_PREFIXES` 的**前缀语义连带子路由**与「已迁移路由」事实之间的落差——登记 `/admin/posts` 后，未迁移的编辑器子路由 `/admin/posts/[id]` 对**路由择库型**过渡组件（`AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`）同样解析为 caomei-ui；本批逐处核对确认该子路由**当时未触达**这三者（无路由内混用）；其后（见本条末）已补守卫兜底。收尾/后续批次应补结构守卫：断言「已登记前缀下**非 `index.vue` 的子路由页面**及其 `components/<prefix>/**` 子树不得渲染组件内择库型过渡组件」，或在编辑器路由迁移后自然消解。事实源侧已把该例外写入 `lib/ui-library.ts` 的常量注释（含可达性核对结论）。**部分机制已就绪（2026-10-16 条目 3 首路由批次）**：`CAOMEI_UI_ROUTE_SCOPES` 已支持 `ownedFiles`（路由自有实体文件并入守卫扫描面），并在同一处登记 `/admin/categories` + `/admin/tags`；**该维度已于 2026-10-16 闭环**：`primeVueSubRoutes` 例外登记落地（`/admin/ai` → `pages/admin/ai/tasks/[id].vue`，并回溯登记 `/admin/posts` → `pages/admin/posts/[id].vue`），守卫新增 4 条断言（未登记响亮失败 / 例外路径存在 / 例外页面不得含路由择库标记 / 每条须有理由）。**剩余缺口收窄为**：例外背后的「`components/<prefix>/**` 子树」尚未被标记扫描（漏登记某路由自有组件时仍只能靠该批清单发现，非薄包装页无响亮失败）。

- **待跟踪（2026-10-22 新增，责任人：友链服务）**：`server/services/friend-link.ts` 的 `createFriendLink` / `updateFriendLink` 先对 `name` / `url` 做 `trim()`，随后 `saveFriendLinkEntity` 的 `assignDefined(entity, input, [...])` 用**未清洗的原始 input** 覆盖同名字段，导致首尾空白最终仍可能落库（例如传入 `url: '  https://x.example.com  '` 时持久化值保留空格）。最小范围：把 `name` / `url` 的归一化收敛到 `saveFriendLinkEntity`（或在 `assignDefined` 后统一 `trim`），并补「首尾空白不落库」的失败断言；注意与 `ensureUniqueFriendLinkUrl` 的去重口径保持同一次清洗结果。非目标：不改动友链其他字段的 `null` / `空串` 归一化语义。
- **待跟踪（2026-10-22 新增，责任人：测试工程）**：本地 Nuxt 测试环境存在 `vitest` 转换缓存（`node_modules/.vitest-cache`）热命中后 `utils/shared/post-copyright.ts` 等文件报 `Cannot find module '/@id/virtual:intlify-i18n-N'` 的问题（冷缓存可正常加载，CI 未复现）；`tests/server/notification*.test.ts` 与 `post-distribution*.test.ts` 受影响。建议后续评估 `test:coverage` 入口是否需要显式 `--no-cache` 或隔离缓存目录，避免本地验证被环境噪声阻断。

## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [项目规划规范](../standards/planning.md)
