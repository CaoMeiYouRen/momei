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
- **最近一次上收阶段**: 第七十五阶段（第十六批，2026-11-14 **已完成**：check-governance / check-bundle-budget / ai-image-generator / use-asr-direct，同源 +386 条 / +1.02pp）。上一阶段为第七十四阶段（第十五批，2026-11-13 **已完成**：tts / asr / voice / 协议设置，同源 +247 条 / +0.67pp）。再上一阶段为第七十三阶段（第十四批，2026-11-11 **已完成**：4 模块 171/74/59/22 → 6/3/6/1，全仓 81.79% → 82.63%，+311 条 / +0.84pp）。再上一阶段为第七十二阶段（第十三批，2026-11-09 **已完成**：`server/utils/logger.ts` 61→2 / `server/services/setting.ts` 25→3 / `server/services/post.ts` 23→0 / `server/database/logger.ts` 15→0，另补 `server/utils/post-metadata.ts` 8→0 / `server/api/ai/translate-name.post.ts` 4→0 / `utils/schemas/post.ts` 4→0 / `server/services/setting-audit.ts` 2→0 / `utils/shared/post-copyright.ts` 13→11 / `server/api/admin/marketing/campaigns.post.ts` 1→0；新增 4 个测试文件 + 8 处扩展、+68 例，全仓 statements **+140 条 / +0.3801pp**；上批 `agreement.ts` 26 → 1（剩 184 不可达防御分支），故以 `server/database/logger.ts` 顶替第 4 模块）。再上一阶段为第七十一阶段（第十二批，2026-11-08 **已完成**：`typeorm-adapter` 84→6 / `ai/quota-governance` 28→0 / `agreement` 26→1 / `post-hexo-repository-sync` 23→0，新增 50 例，statements **+154 条 / +0.42pp**）。再上一批为第七十阶段（第十一批：`server/services/migration-link-governance.ts` / `.helpers.ts` / `ai/tts.ts` 三模块补测，毛新增 33 例（5,169 → 5,202）；三模块 statements 分别达 100% / 98.87% / 100%，均越过「`+15pp` 或 `≥85%`」；全仓 Statements 本批 80.40% → 80.66%（+0.26pp，闭合 95 条），`+0.3pp` 容量目标未达的结构性原因为 **3 模块池上限仅 +0.25pp**（需 109 条而池仅 92 条），已在回归记录逐项量化）。再上一批为第六十九阶段（第十批：`setting.ts` / `ai/text-translation-task.ts` / `ai/post-automation.ts` 三模块补测，毛新增 36 例、删除 1 例重复后净增 35（5,084 → 5,119）；三模块 statements 分别达 90.31% / 95.27% / 93.18%；全仓 Statements 本批 80.98% → 81.17%（+0.19pp），相对第六十八阶段收口 81.04% 的阶段累计为 +0.13pp；Branches 70.83% → 70.90%，Lines 81.15% → 81.29%，Functions 80.07% → 79.98% 系新增函数稀释）。
- **当前基线**: 同源口径 Statements `83.28%`（`31,441 / 37,755`，2026-11-14 第十六批收口干净全量跑：613 文件 / 5,500 例，`--maxWorkers=4` + 运行前移走 `.vitest-cache`；源文件 774，分母与第十五批收口后的可比分母一致）。本批 +386 条 / +1.02pp；第十五批值 `30,815 / 36,989`（同源 83.31%）保留为历史。距 `90%+` 长期目标约 6.7pp。
- **下一次可切片方向**: 覆盖率同源复算挂接 `code-quality-auditor` review checklist（待补挂）；第十五批（已上收第七十四阶段条目 6）按同一口径（**绝对未覆盖语句数**）复算，并以 4 模块且含 ≥1 个大基数模块组池；2026-11-12 复算未覆盖 6,423 条 / 454 文件，单批 `+0.3pp` 约需 **111 条**（`0.003 × 36,996`），须优先保留「失败 / 边界优先」的断言标准；本批候选为 `composables/use-tts-volcengine-direct.ts`（166）/ `components/admin/settings/agreements-settings.vue`（163）/ `components/admin/posts/ai-image-generator.vue`（138）/ `composables/use-asr-direct.ts`（91）/ `composables/use-post-editor-voice.ts`（87）。第九批已把候选池（`friend-link` / `notification` / `post-distribution` / `upload`，合计 866 条语句）的未覆盖语句尽可能闭合，实际 +0.59pp ≈ 该池 100% 闭合上限（约 +0.66pp）的 89%，受池体量限制无法达到单批 +1pp。遗留治理项：`text.test.ts` 超 1000 行建议拆分、`tts.test.ts` beforeEach 对齐 `mockReset`。

### 2. 结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛

- **目标**: 压缩高频重复实现，补齐共享 helper / 纯函数抽象，并把零散类型与轻量响应壳层纳入受控复用；优先治理跨文件重复率高、适合稳定上收的候选，而不是把所有局部实现强行抽象。默认以 `pnpm duplicate-code:check` 作为事实源。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十六阶段（theme 颜色 model 工厂 + 预设值取值抽取到 `composables/use-theme-color-models.ts`，基线 0.31% → 0.30%）。
- **当前基线**: `duplicate-code` **0.39%**（680 行，2026-11-10 `pnpm duplicate-code:check` 实测；第六十六阶段记录的 0.30% 已过期）。
- **下一次可切片方向**: 基于 0.39% 基线继续收敛——剩余轻量 shared helper、表单元数据 / 表单控件的类型共享、`server/api/` 层请求上下文与参数校验的共性逻辑；结构性重复候选保留轻量壳层类型与“重复导入后轻包装”的纯函数。

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
- **最近一次上收阶段**: 第七十五阶段（条目 4：64 组 allowlist 三类复核 + 公开页 runtime 审计，2026-11-13 **进行中**）。上一阶段为第七十四阶段（条目 4：重复键 99 → 64 组、剩余 64 组 allowlist + gate，2026-11-13 **已完成**）。再上一阶段为第七十三阶段（条目 3：原文级重复键扫描 + PR 侧键漂移阻断，2026-11-10 **已完成**）。再上一阶段为第七十一阶段（部分切片：条目 6b 已完成 `admin-posts.json` 8 个重复键清理、20 组双源同键收敛、6 个死键删除与 1 处硬编码词条化；脚本的「原文级重复键扫描」能力仍未上收）。再上一阶段为第六十四阶段（ko-KR / ja-JP 文档治理：13 文件 `last_sync` 刷新、ja-JP 由 seo-ready 升格、补全 features / variables 翻译）。
- **当前基线**: `i18n:audit:missing = 0`、`i18n:audit:duplicates` **64 组 / 149 keys / 33 组跨模块**（2026-11-12 第七十四阶段条目 4 收敛后复算；合并 35 组至 `common.*` / `legal.*`，剩余组登记 `scripts/i18n/duplicate-group-allowlist.json` 并由 `i18n:audit:duplicates:gate` 阻断未登记新增 / 失效条目）、原文级重复键 0、`i18n:check-sync` 五语一致；缺失字段优先修复、重复键及时清理、`unused` 默认观察。
**已上收（2026-11-10）**：原文级重复键扫描（`JSON.parse` 会折叠同名键，审计只能看到解析后对象）与 PR 侧 `i18n:audit:missing` 阻断已随第七十三阶段条目 3 落地：独立入口 `pnpm i18n:audit:raw-duplicates`（默认 warning、`--mode=error` 可阻断）与 `test.yml` 的 `test` job 接线。

- **下一次可切片方向**: 剩余 64 组 allowlist 按「动态 key 拼接」「模块内字段语义不同」「跨模块对象语义不同」三类复核；动态拼接优先评估“是否为有限集合”，默认改显式静态 key 映射而非扩 allowlist。之后仍未纳入 runtime 回归的公开页装配链路（档案 / 分类 / 标签列表页 i18n 完整性审计）。

### 6. 文档事实源、翻译与分层归档治理

- **目标**: 统一维护全文档体系的分层边界、膨胀阈值与 freshness——`docs/design/` 的模块 vs 专项分层、`docs/plan/` 的行数阈值触发归档、`docs/i18n/*/` 的翻译 tier 与同步；清理无效 / 过时 / 漂移文档；保持 `docs:check:source-of-truth` 与 `docs:check:line-count` 可通过，不靠临时补 `last_sync` 应付检查。阈值被证明过宽时先回写脚本，再更新规范与阶段结论。
- **状态**: 观察中。
- **最近一次上收阶段**: 第七十五阶段（条目 6：回归窗口阈值单点化、`todo-archive` 拆分、governance 过期报告巡检、coverage 口径入规范，2026-11-13 **进行中**）。上一阶段为第六十四阶段（ko-KR / ja-JP 专项治理：freshness 审计报告 + 13 文档 `last_sync` 刷新 + ja-JP 升格 + features / variables 翻译补齐）。
- **当前基线**: `docs:check:line-count` 覆盖 README、plan 主文档与 `docs/reports/regression/current.md`；`docs:check:source-of-truth` 以 git 提交判定 hard blocker，tier 软上限 `must-sync 60 天 / summary-sync 120 天`（`candidate` profile 保留 21/30 天基线，仅作收敛评估）。
- **下一次可切片方向**: design 域审计 `docs/design/governance/` 中已过期评估 / 报告的归档状态；plan 域按阈值滚动归档（跟进 `roadmap.md` / `todo-archive.md` 行数）；翻译域评估进一步收紧 `must-sync` / `summary-sync` 的可执行性。**待跟踪（2026-10-24 更新）**：① **回归窗口阈值存在两套口径**——`docs/reports/regression/index.md` §3.1 为「300-400 行或 6-8 条记录」，`scripts/docs/check-line-count.mjs` 为 warn>500 / error>700；建议收敛为单点口径并把 `index.md` 改为指针引用（第六十八阶段收口按前一口径执行整窗归档：`current.md` 由 452 行 / 5 窗口降为 14 行 / 0 窗口，均为脚本 `docs:check:line-count` 口径）。② **迁移页跨批遗留形态**（责任人：迁移收尾）：页面 scoped 样式的幻影 token（`--surface-ground` / `--border-radius` / `--text-color-secondary` 等全仓未定义、恒为 `unset`）、`p-fluid` 与若干 `*__dialog` class 在构建产物中无对应规则，均与 PrimeVue 卸载同批清理；迁移页注释与测试注释中的阶段号 / 审计编号随 B4 统一清理。③ **视觉一致性门禁的跨环境基线治理**（责任人：迁移收尾）：移除 `visual` job 的 `continue-on-error` 前须先在 ubuntu runner 以 CI 产物复采参考态并刷新预算（见 [视觉一致性门禁](../design/governance/2026-10-13-visual-parity-gate.md) §7）；任何 `reader` 档路由上线前其 parity 未归因差异须为 0。④ **口径沉淀**：回归窗口归档与节名引用改写一并执行（第十三次归档已按该口径落地）。⑤ **en-US 规范翻译同步债务（2026-11-03 登记，2026-11-06 复核已消解）**：2026-11-03 时 `docs/check:source-of-truth` 有 4 项 blocker（`docs/i18n/en-US/standards/` 的 `ai-collaboration.md` / `documentation.md` / `security.md` / `testing.md` 自 `last_sync` 以来源文档有新提交）；2026-11-06 第七十一阶段准入复核时该入口已 **PASS**，仅余 4 项 soft warning（`docs/i18n/en-US/index.md`、`guide/deploy.md`、`guide/quick-start.md`、`guide/translation-governance.md` 超 60 天软上限），不再构成周回归红项。本条保留为「登记 → 消解」痕迹，后续若再次出现 hard blocker 按新记录处理。

### 7. Windows 本地 Dev / Build 性能治理

- **目标**: 为 Windows 本地 `nuxt dev` / `nuxt build` 建立统一量化口径，优先收敛首请求阻塞与构建尾耗时，不扩写为全平台构建重构。
- **状态**: 暂停（第四十三阶段确认平台级瓶颈：Linux CI 106s vs Windows >1800s，>17x 差距，非项目层面短期可收敛）。
- **最近一次上收阶段**: 第四十三阶段（Vite warmup + `resolve.extensions` 收窄 + Nitro inline 瘦身 + sourceMap 关闭 + `build:done` 跳过，确认平台级瓶颈后上收关闭）。
- **下一次可切片方向**: 暂停。仅在 Nuxt / Nitro 发布针对 Windows 的重大性能改进，或项目迁移到 WSL2 / Linux 开发环境时重新评估；历史数据见 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)。

### 8. 站点性能与 Core Web Vitals 持续优化

- **目标**: 持续追踪核心页面 Core Web Vitals，建立跨版本性能回归基线；优先级：公开首页 > 文章详情页 > 分类 / 标签列表 > 后台管理页。与 #7 的区别：本条聚焦生产环境用户体验性能。
- **状态**: 进行中（已有 Lighthouse CI + bundle budget 体系，尚未形成持续优化节奏）。
- **最近一次上收阶段**: 第七十四阶段（条目 2b：入口包体护栏，2026-11-12 **筹备中**）。上一阶段为第五十二阶段（移动端 CWV 基线采集与评估：首页 / 文章详情 / 分类标签列表页 LCP / CLS / INP 基线落盘）。
- **当前基线**: `coreEntryJs` 280.63KB / 335KB（2026-11-13 阶段收口实测；Sentry 客户端移出预载后收敛）；`maxAsyncChunkJs` 92.79KB / 130KB；`keyCss` 59.12KB / 62KB（余量 4.6%，为当前最紧的一项）。
- **下一次可切片方向**: 入口包体护栏已上收第七十四阶段条目 2b（入口 chunk 构成清单 + ≥1 项可量化收敛或重定标）；之后为文章详情页按需 hydration、评估收紧 `maxAsyncChunkJs` 并为 shared chunk 单列预算、移动端 LCP 超 3s 时启动专项治理。

### 9. 脚本资产、量化口径与回归入口治理

- **目标**: 把脚本作为长期治理主线的事实源，为 ESLint / 类型债、结构复用、注释治理、文档治理等建立可重复执行的计数、分桶与 delta 输出；治理 `scripts/**` 的长期入口、孤儿脚本、临时脚本残留与输出漂移；稳定后并入固定回归入口。
- **专项设计事实源**: [script-governance.md](../design/governance/script-governance.md)。
- **状态**: 进行中。
- **最近一次上收阶段**: 第六十五阶段（`governance:audit:simple-duplicates` 升格至 `regression:weekly` warning 面，结论 Go）。
- **当前基线**: `governance:check:scripts` 与 `audit:simple-duplicates`、`audit:eslint-debt`、`audit:comment-drift` 均已进入 `regression:weekly` warning 面；`docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 仍为独立 baseline。
- **下一次可切片方向**: 按周级回归趋势跟踪 comment-drift 的 TODO / 复述 / 漂移候选数，仅在数值异常反弹时治理；评估 docs candidate 入口是否进入更高频回归。

> 编号 #10 已于 2026-11-09 随 PrimeVue 迁移收口关闭；编号不复用。

### 10. 依赖与静态规则债治理

- **目标**: 把 Dependabot / Code Scanning 告警与 ESLint 未覆盖规则（issue #262）当作同一条可量化债务线：告警按严重级与可修性分流、无补丁项进受控台账；ESLint 规则按 `governance:inventory:eslint-rules` 的「命中数 × 目录」分桶逐批升档清零，不为变绿放宽门禁。
- **状态**: 进行中。
- **最近一次上收阶段**: 第七十五阶段（条目 1 依赖安全收口 + 条目 2 ESLint 第二批，2026-11-13 **进行中**）。上一阶段为第七十四阶段（条目 1：js-yaml 5 / ESLint `ban-ts-comment` 首批 / stylelint 18 配对，2026-11-13 **已完成**）。
- **当前基线（2026-11-14 条目 1 完成后）**: Dependabot open 仅 deepmerge #275 low（无补丁，登记 `dependency-risk-allowlist.json` 台账，仅追踪、不改门禁 severity，复核至 2027-05-14）；minimatch #286 / glob #284 已按父级 scoped override 定向抬版、quill #22 随依赖移除，三者于推送 `b649181e` 后由 Dependabot 重扫关闭；`@hono/node-server` 两条 medium 已随 2.1.8 关闭；`caomei-ui` 已于 2026-11-14 升级到 `^1.2.0` 并撤销 `ignore` / 人工批准守卫，回到常规依赖通道（迁移方案 §3.12）；台账治理下一轮切片：`dependency-risk-allowlist` 增加 `reviewBy` 机读复核日期与到期提醒输出；补 §5.3「仅追踪型低危条目」口径与 high 阈值惰性单测。ESLint 候选规则按命中数排序：`restrict-template-expressions` 251 / `no-unsafe-assignment` 233 / `no-confusing-void-expression` 80 / `no-unsafe-argument` 50 / `no-inferrable-types` 44 / `use-unknown-in-catch-callback-variable` 32。
- **下一次可切片方向**: 第二批（已上收）取 22 命中以下的 4 条规则；之后按命中数递增推进 `no-inferrable-types` / `use-unknown-in-catch-callback-variable`；`no-unsafe-*` 系列须单列条目并先评估 typed lint 作用域。

### 11. UI 视觉质量与界面自检治理

- **目标**: 把「界面是否合格」从审美讨论收敛为可判定检查项与可回归证据。维护一份只收真实命中、影响使用的界面自检清单（U1–U6），用它驱动视觉债清偿与视觉门禁扩容；不追求一次重做设计体系。
- **专项设计事实源**: [界面自检清单与视觉债治理计划](../design/governance/2026-10-26-ui-review-checklist-plan.md)；可执行判据见 [界面自检清单](../design/ui-review-checklist.md)。
- **状态**: 进行中（S1 已随第七十三阶段条目 1 收口；S2 字阶首批已上收第七十四阶段条目 5，暗色 tint 仍待切片）。
- **最近一次上收阶段**: 第七十五阶段条目 3 曾纳入「非字阶取值归一 + 剩余字阶字面量分批替换」，但**已于 2026-11-14 按「进一出一」移出**本阶段（未开工），切片内容见下方「下一次可切片方向」。上一阶段为第七十四阶段（条目 5：字阶试点，2026-11-13 **已完成**）。再上一阶段为第七十三阶段（条目 1：S1 空态 / 空表分页 / 三处层序失效，2026-11-11 **已完成**）。S0 为维护批次，未立正式阶段。
- **当前基线**: 455 条 `font-size:`（2026-11-13 `governance:inventory:font-sizes` 口径）/ 64 种取值 / token 化 10.33% / 口径内待替换 225 条 / 非字阶 149 条；状态色幻影 token（34 处）与迁移遗留 `--p-surface-border`（93 处）/ `--p-text-color-secondary`（15 处）已随第七十二阶段清零；「暂无文章」空态误用、空表分页与三处层序失效已随第七十三阶段条目 1 修复；扫描面 194 处 `border:`；视觉门禁 admin 23 条 + reader 18 条（41 路由 / 82 张参考态 + 1 条登记守卫，共 83 项比对）已全部迁移并校准，`PENDING_ROUTES` 为空；以 `tests/visual/parity/routes.ts` 为单点事实源；soft 8% 对比度实测 2.12 / 2.59 / 3.39。
- **下一次可切片方向**: **字号归一（2026-11-14 由第七十五阶段条目 3 移出）**——第一阶段对 149 条非字阶取值（`0.85rem` 17 / `1.1rem` 17 / `0.95rem` 16 / `0.8125rem` 13 / `0.8rem` 11 / `0.7rem` 10 / `0.9rem` 9 / `2rem` 8 / `2.5rem` 6 / `0.9em` 4 / `3rem` 4 等）产出「归一目标 → 受影响组件 / 版式」评估报告；第二阶段按目录分批替换剩余 225 处口径内字面量（`components/admin/posts` 67 处优先），单批 ≤10 文件；每批 `getComputedStyle` 逐元素对账 + `test:visual` / `parity` 未归因差异 0。之后才是原有的暗色 tint 与 U1–U6 扩展评估。
**已上收（2026-11-10，第七十三阶段条目 1）**：PrimeVue 卸载后复核发现三处**层序导致的既有样式失效**（均非条目 4 引入，`@layer momei-base` 内规则被 caomei-ui 未分层组件样式覆盖）：① 社交登录按钮品牌色与布局（`styles/main.scss` 的 `.caomei-button.social-btn`，实测退化为 secondary 按钮；视觉基线未渲染社交按钮故未覆盖）；② `admin-form-dialog` 宽度（实测 base 496px / compact 480px / wide 512px，声明为 576 / 544 / 608px；影响 placements / campaigns / external-links 三个弹窗）；③ `.translation-badge` 尺寸（`styles/_layout.scss` 的 padding / 字号被 `.caomei-badge[data-v]` 覆盖）。修复方向：移出 `@layer` 或改走 `--caomei-*` 钩子，并补浏览器人工验收。

**待跟踪（2026-11-01 新增，责任人：UI 视觉质量治理）**：字段文案同义检查已以 warning 面落地——`pnpm i18n:audit:field-copy`（`scripts/i18n/audit-field-copy.mjs`）已进入 `regression:weekly` 的 `required: false` 步骤，仅 `--fail-on-findings` 时非零退出。当前基线：183 个 Vue 文件，R1 标签与占位符同义 18 处、R2 占位符承载规则信息 11 处。观察两周后按「命中率 / 误报率 / 修复成本」决定是否收窄为 UI 自检 U7；在此之前**不改** `docs/design/ui-review-checklist.md` 的 U1–U6 边界，也不把该原则写入 `AGENTS.md` / `development.md`。已知漏报（不视为缺陷）：术语不一致型（如「推送标题」vs「请输入邮件标题」）与 `SettingFormField` 这类由父级 `field-key` 提供标签的形态。

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
| #11 UI 视觉质量治理 | — | —（S1 后纳入） | ✅ `test:visual`（admin 23 + reader 18 = 41 路由 / 83 比对） |

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
> 管理规则：一旦被正式上收到 roadmap / todo，必须从本区块删除（或改写为一行历史说明），避免与正式阶段正文重复。

### 延后新增能力保留池（当前不建议优先上收）

| # | 条目 | 说明 | 状态 |
|:---|:---|:---|:---|
| 1 | 桌面端应用 (Tauri) | 桌面客户端骨架，支持单站点 / 多站点管理 + 离线写作 | 休眠 |
| 2 | 极客技术增强 | Markdown 可执行代码块支持（JS / Python / Shell） | 休眠 |
| 3 | 主题生态系统 | 主题社区 / 发布平台 / 画廊 / 安全审核 | 休眠 |

### 待上收候选

9. **（已上收，2026-11-14）Node 26 运行时基线单点化** —— 已上收为第七十五阶段条目 7（插队，P1）：`.nvmrc` = 26.13.1、`engines.node` = `26.x`、7 个 workflow 改 `node-version-file`、`Dockerfile` 基础镜像 `node:26.13.1-alpine`，并做原生模块重建与本地 / 容器双探针。原登记问题：`engines` 24.x / Docker 24.22.1 / CI `lts/*`（实际 26.13.1）三处漂移，本机 26 与仓库 24 混用会触发 `better-sqlite3` ABI 报错（`Module did not self-register`）。

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
5. **（已上收，2026-11-12）js-yaml 升级到 5.x** —— 已上收为第七十四阶段条目 1a（override 归属 + 8 处命名导入 + 移除 `@types/js-yaml` + frontmatter 回归，含 kill-switch），执行范围与验收见 [项目计划](./roadmap.md)。原登记正文已随上收去重；2026-11-12 复核：`js-yaml@5.5.0` 已是 npm latest 且自带类型（`dist/js-yaml.d.ts`），根与 CLI 声明已到 `^5.5.0`，但裸名 override 仍锁 `^4.3.2`，实际解析 4.3.2。
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
11. **（已上收，2026-11-06）`useI18n()` 内联调用形态收敛** —— 已上收为第七十一阶段条目 6c（`snippet-aggregate-dialog` 2 处事件 / 异步内调用、`creator-stats-panel` 3 处 `computed` 内调用；含失败 / 边界断言与回归巡检口径），执行范围与验收见 [项目计划](./roadmap.md)。`pages/admin/submissions/index.vue` 的 1 处已于 2026-10-14 单独修复。原登记正文已随上收去重。
12. **（已闭合，2026-11-01）caomei-ui 状态色 tone 对比度修正** —— 原方案（把 tone 改为 light `-700` / dark `-400`）**已被上游取代**：`caomei-ui@1.0.0-rc.1` 新增 `--caomei-color-{*-text,control-border}` 角色，组件文本 / 边框改由该角色承载（上游 `tag` 样式注释明示 8% soft 底在 6 预设 × 明暗下均 ≥ 4.5:1），tone 仅用于 soft 底色。momei 侧把该角色接入并存桥接（`primary` 跟随 `--p-primary-700/-400`、`danger` 取 `--p-red-700/-400`、`success` / `warning` 取 `--p-{green,orange}-800/-400`、neutral 与 tone 分离），随第六十九阶段条目 1 落地（见 [待办归档](./todo-archive.md)）；**闭合证据**：soft 8% 底实测（内容面 / 次级面）浅色 primary 8.72 / 8.08、success 6.66 / 6.17、warning 6.74 / 6.24、danger 5.83 / 5.40、neutral 10.36 / 9.60；暗色 8.21 / 7.44、9.75 / 8.85、7.68 / 6.99、6.43 / 5.88、11.38 / 10.34，两态全部 ≥ 4.5，并由 `tests/visual/caomei-token-bridge.visual.test.ts` 的对比度契约长期守卫。原详细方案保留为问题取证记录：[2026-10-24-caomei-status-tone-contrast.md](../design/governance/2026-10-24-caomei-status-tone-contrast.md)。
13. **（已上收，2026-11-06）i18n 键层缺陷清理** —— 已上收为第七十一阶段条目 6b（`admin-posts.json` 8 个重复键、`admin.json` 与 20 个模块文件的 20 组双源同键、`system.fields.*` 6 个死键、`home.hero.*` 3 个死键、`pages/submit.vue` 1 处硬编码），执行范围与验收见 [项目计划](./roadmap.md)。原登记正文已随上收去重。
14. **（已上收，2026-11-12）依赖与工具链现代化** —— 五个子项已分别上收第七十四阶段：js-yaml 5 → 条目 1a、ESLint 严格规则批次（#262）→ 条目 1b、stylelint 18 与 `stylelint-config-cmyr` `^1.1.0` 配对升级 → 条目 1c、视觉门禁去 `continue-on-error` → 条目 2a、入口包体专项 → 条目 2b。执行范围与验收见 [项目计划](./roadmap.md)。原登记正文已随上收去重。
15. **首页 SWR 与 i18n 响应 cookie 冲突（nuxt 4.6.4 / nitropack 2.13.6 引入，待决策）**
    - **背景**: 第七十三阶段条目 6 的 nuxt 4.6.4 升级带来 nitropack 2.13.6，新增「响应带 `Set-Cookie` 或 `Cache-Control: private|no-store|no-cache` 时不进入缓存」的安全规则；而 `@nuxtjs/i18n` 的 `detectBrowserLanguage.useCookie` 让 `/` 每次 SSR 都写 `i18n_redirected`，导致首页 SWR 在 Nitro 侧不再生效。
    - **实测依据（2026-11-10）**: `/robots.txt`（swr 86400）与 `/sitemap_index.xml`（swr 3600）两次请求均返回 `cache-control: s-maxage=..., stale-while-revalidate` 且内容/`X-Sitemap-*` 一致（命中）；`/` 无论是否携带 cookie 都返回 `set-cookie: i18n_redirected=zh-CN` 且无 `cache-control`（不缓存）；`/posts/:slug` 无 cookie，`isr` 在 Node preset 本就不写 Nitro 缓存。升级前 nitropack 2.13.5 不校验 `Set-Cookie`，缓存生效但会把该 cookie 复制给所有访客。
    - **候选方案**: ① 保持现状（安全优先，另用边缘 / CDN 缓存兜底）；② 关闭 `detectBrowserLanguage.useCookie` 或改为仅在需要重定向时写 cookie（须评估语言偏好持久化与 `/` 根重定向行为）；③ 对 `/` 走独立边缘缓存键控（须先证明不泄漏 cookie）。
    - **非目标**: 不放宽 4.6.4 的缓存安全规则；不改 `routeRules` 的 swr / isr 时长；不为恢复缓存改动鉴权或会话链路。
    - **前置**: 确认生产侧首页缓存命中率与回源量；评估关闭 cookie 对五语用户的影响。
16. **（已闭合，2026-11-14）quill 上游补丁跟踪（GHSA-v3m3-f69x-jf25，low / 无 patched version）**
    - **闭合方式**: 全局检索确认 `quill` 在源码中零引用（仅 `package.json` 声明与 `nuxt.config.ts` 的 `vite.ssr.noExternal` / `vite.build.rolldownOptions.external` 两处针对 quill 的配置——配置项本身合法，但 quill 从未 import 故为 no-op；`.output` 无 Quill 产物），实际富文本 / Markdown 编辑器为 `mavon-editor`。条目 1 已删除该依赖与两处无效配置，本地依赖图不再包含 quill；推送 `b649181e` 后 Dependabot 重扫，告警 #22 已关闭。
    - **原背景**: Dependabot 告警 #22 为 low 且无官方 patched version，低于 `security:alerts` 的 `--min-severity=high`，不阻断发布；`security-alert-exceptions.json` 中对应过期条目已按台账治理移除。
    - **边界**: 若未来重新引入富文本编辑器并需要 quill，须先确认上游是否已修复该 XSS（HTML export）告警。

17. **devcontainer 运行时基线对齐（P3，候选）**
    - **背景**: 运行时基线已于第七十五阶段条目 7 收敛为 `.nvmrc = 26.13.1`，但 `devcontainer.json` 仍为 `typescript-node:24-bookworm`，其 `postCreateCommand` 依赖 `corepack enable`。镜像内 Node 与 pnpm 自洽，不会 ABI 断裂，仅产生根包 `engines` 告警。
    - **待办**: 升级到同线 `typescript-node:26-*` 镜像，并把 `corepack enable` 换成与 Node 26 兼容的 pnpm 引导（`npm i -g pnpm@11.17.0` 或 `packageManager` 驱动的等价方式）；升级后核对 Codespaces 内 `pnpm install` 无 `Unsupported engine`。
    - **非目标**: 不改动 `.nvmrc` 与 CI / Docker 基线；不为 Codespaces 引入双版本矩阵。

---

- **待跟踪（2026-10-15 新增，责任人：门禁 / E2E 收敛）**：`networkidle` 依赖外网可达性——① 视觉一致性门禁与 E2E 均以 `waitForLoadState('networkidle')` 判定就绪，而页面存在长期 pending 连接（`/api/notifications/stream` SSE、外部 gravatar 头像），无外网环境下永不空闲（本地实测：公开页 E2E 10 处失败、`/admin/users` 门禁需改用 `stable: lenient` 才可运行）；② CI（有外网）与本地（无外网）像素/就绪结果不可复现，与迁移方案 §8.2「跨环境差异」条款冲突；③ 建议后续按「阻断非本地请求」统一收敛门禁与 E2E 的等待口径，并与「以 CI 产物复采参考态」的前置条件同批执行。
- **待跟踪（2026-10-15 新增，责任人：迁移收尾）**：上游反馈 §2.6（`lazy` 只关分页、不关排序）待上游确认；`/admin/users` 本批按「不绑定受控排序 prop」保持与迁移前一致的形态，若上游提供 `manualSorting` 或确认现状，需同步 `use-admin-list.ts` 的 `onSort` 口径与回归记录。

- **待跟踪（2026-11-04 登记，责任人：认证 / 会话）**：会话数据的 SSR / CSR 单一来源。`app.vue` 只在客户端 `primeHydratedAuthSession()` 把会话种入 better-auth atom，服务端不种；`/settings` 等页面读该 atom，导致首帧头像 / 表单值 / 角色可见性与 SSR 解析结果不一致（迁移后 Reka `Avatar` 在该 mismatch 下会触发 `insertBefore` 崩溃，条目 4 用 `ClientOnly` 窄化兜底）。收口方向：让服务端把 `useState('auth:route-session:data')` 作为唯一来源注入 atom，随后移除 `settings-profile` 的 `ClientOnly`。**收尾必办**：① 该兜底不得扩散到更多路由；② 修复后同步删除 `ClientOnly` 与占位。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：上游反馈 §2.7（`DataTable` 无「列最小宽」契约，`DataTableColumn.width` 只落 `th` 且只有 `px` 宽度参与冻结偏移；**选择列宽度不可配置**——PrimeVue 52px vs caomei 34px，使 `/admin/posts` 整表左移 18px）待上游确认；若上游提供选择列宽度钩子或列 `minWidth`，须重跑 `/admin/posts` parity 并按实测重校准允许清单。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾 / 阶段收口）**：`tests/visual/parity/reference/*.reference.png`（**34 张**：10 条 admin 数据列表路由 + `/admin/comments` 共 11 路由 × 2 主题 = 22 张，分类 / 标签 2 路由 × 2 = 4 张，`/admin/ai` 2 个对照面 × 2 = 4 张，`/admin/marketing` 2 个对照面 × 2 = 4 张）中，前 22 张（11 路由）在数据列表路由全部迁移后**已失去运行时职责**（`PENDING_ROUTES` 清空），但它们与随后各批次新增的 12 张（分类 / 标签 4 张 + `/admin/ai` 两对照面 4 张 + `/admin/marketing` 两对照面 4 张）同为「PrimeVue 原貌」的唯一存档；`PENDING_ROUTES` 已空 ⇒ 全量 34 张均已转为「迁移前原貌存档」，不再承担「待迁移参考态」的运行时对照职责（已迁移路线的对照仍用于漂移检出）——PrimeVue 卸载（B4）后无法重采。收尾时须显式决策保留方式（就地归档 / 迁入设计证据目录 / 另存 release 资产），**不得直接删除**；同时须同步 `playwright.visual-parity.config.ts` 的 `snapshotPathTemplate` 与采集脚本口径。**已知附带失败模式（2026-10-16 已缓解）**：参考态齐备后，`capture-visual-reference.mjs` 的保护口径会把全部用例排除，HEAD 全量采集因此无候选用例——Playwright 默认以 `No tests found` 退出码 1 使 `pnpm test:visual:reference` 硬失败；本批已就地采集块补 `--pass-with-no-tests`（「无待采目标 = 成功」，专刷某条仍用 `--only=<name>`），并有静态守卫锁定该 flag（`tests/scripts/capture-visual-reference.test.ts`）。保留方式决策落地时须一并复核该行为。

- **待跟踪（2026-10-16 新增，责任人：B3 / B4 批次）**：迁移前 PrimeVue `DatePicker` 的 `id` **未声明为 prop**（只声明 `inputId`），故 `<label for="scheduledAt">` 实际落在外层 `<span>` 上、未关联到输入框——全仓多处同一写法（`pages/admin/ad/campaigns.vue`、`components/admin/posts/publish-push-dialog*.vue`、`components/admin/marketing-campaign-form.vue`），属**既有缺陷**（非迁移引入）。迁到 caomei `DatePicker`（`id` 落内层 input）时自然修复；建议在 B3 / B4 批次的验收点显式校验「`label for` → 内层可聚焦元素」。
- **待跟踪（2026-10-16 新增，责任人：AI 资产治理）**：`pnpm ai:check` 在 master 上为红——`code-quality-auditor/SKILL.md` 的 2 处与 `full-stack-master/SKILL.md` 的 1 处相对链接携带锚点（`documentation.md#35-…`、`review-checklist.md#46-…`）命中 `skill-anchor-link` 规则且无豁免登记；该入口未接入任何 workflow，故长期未被发现。**最小范围**：去掉 3 处锚点，或为该规则补白名单豁免口径并登记理由。**非目标**：不改两个 skill 的正文语义与镜像结构。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：守卫的「在册族零残留」扫描口径自第三批次起**剥离 `<script>` / `<style>` 块**，且该收窄**不作用于**子路由例外页面的「路由择库标记」扫描（后者 token 不含尖括号，无假阳性动机，收窄反而会丢掉脚本块内 `import` 的覆盖）（`stripNonTemplateBlocks`，修复 TS 泛型实参假阳性）——已知边界是脚本内以字符串形式出现的旧标签名不再计入；若后续出现「把组件名写进脚本字符串」的写法，须先复核该口径再判定是否残留。
- **已闭环（2026-11-06）**：`components/admin/ai/task-detail-content.vue` 随 `/admin/ai/tasks/[id]` 整路由迁移一并迁完，并纳入 `AI_ROUTE_SCOPE.ownedFiles`；子路由由 `primeVueSubRoutes` 例外转为 `migratedSubRoutes`。选择「子路由整迁」而非 V2 分支：列表弹窗与详情页两端均已迁完，无需双版本。**同时待上游补**：caomei `DataTable` **无 `#header` / `#footer` 插槽**——任务列表的刷新按钮因此从表格容器内移到表格之上（已登记偏差处置表），后续页若依赖该插槽需走包装元素。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾 / 结构复用）**：`components/admin/admin-taxonomy-page.vue` 迁移后 **904 行**（迁移前 732 行），越过 ESLint `max-lines` **warn>800** 线（`pnpm lint` 实测 8/10 warning，仍通过但已消耗预算）。增量来源：lucide 图标用法 12 处（其中 `#icon` 插槽 10 处，每处 3 行）、弹窗焦点交接机制、以及迁移依据注释。**处置方向**：把「多语言列定义」（`columns` computed，约 70 行）与「多语言弹窗表单」抽为路由自有 composable / 子组件（本仓暂无「列定义外置」先例，须先在结构复用主线上评估口径）；抽取后须同步 `CAOMEI_UI_ROUTE_SCOPES` 的 `ownedFiles` 登记，避免守卫扫描面漏掉新文件。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾，随浮层批次）**：`/admin/categories` + `/admin/tags` 弹窗的**初始焦点**在迁移后由「名称输入框」变为「浮层关闭按钮」——迁移前 PrimeVue `Dialog` 的 `onAfterEnter` → `focus()` 会命中默认插槽内的 `[autofocus]`（名称 `InputText`）；迁移后 caomei `CaomeiInput` 无 `autofocus` 契约（透传属性落在不可聚焦的字段外壳），命中项消失。**本批已用「事件交接」修复**：`@show` 置位 + 捕获浮层第一次 `focusin`（即 focus trap 落到关闭按钮的那次）后把焦点交回名称字段（实测 `document.activeElement === input#name_zh-CN`）。**遗留**：切换语言页签时焦点留在触发器上（Reka Tabs 的标准行为），与迁移前「逐页签重挂载触发原生 autofocus」不同；浮层本体迁到 caomei（第六十九阶段）后须按新的 `autofocus` / 焦点契约复核并决定是否统一。
- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：`CAOMEI_UI_ROUTE_PREFIXES` 的**前缀语义连带子路由**与「已迁移路由」事实之间的落差——登记 `/admin/posts` 后，未迁移的编辑器子路由 `/admin/posts/[id]` 对**路由择库型**过渡组件（`AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`）同样解析为 caomei-ui；本批逐处核对确认该子路由**当时未触达**这三者（无路由内混用）；其后（见本条末）已补守卫兜底。收尾/后续批次应补结构守卫：断言「已登记前缀下**非 `index.vue` 的子路由页面**及其 `components/<prefix>/**` 子树不得渲染组件内择库型过渡组件」，或在编辑器路由迁移后自然消解。事实源侧已把该例外写入 `lib/ui-library.ts` 的常量注释（含可达性核对结论）。**部分机制已就绪（2026-10-16 条目 3 首路由批次）**：`CAOMEI_UI_ROUTE_SCOPES` 已支持 `ownedFiles`（路由自有实体文件并入守卫扫描面），并在同一处登记 `/admin/categories` + `/admin/tags`；**该维度已于 2026-10-16 闭环**：`primeVueSubRoutes` 例外登记落地（`/admin/ai` → `pages/admin/ai/tasks/[id].vue`，并回溯登记 `/admin/posts` → `pages/admin/posts/[id].vue`），守卫新增 4 条断言（未登记响亮失败 / 例外路径存在 / 例外页面不得含路由择库标记 / 每条须有理由）。**剩余缺口收窄为**：例外背后的「`components/<prefix>/**` 子树」尚未被标记扫描（漏登记某路由自有组件时仍只能靠该批清单发现，非薄包装页无响亮失败）。**2026-11-07 追记**：`/admin` 以树根前缀登记后，管理端全部页面（含两个原例外子路由）均已纳入扫描面，`primeVueSubRoutes` 例外清零；本条剩余缺口对管理端不再存在，公开页仍适用。

- **已上收并完成（2026-10-22 登记 / 2026-11-06 上收 / 2026-11-08 完成）**：`server/services/friend-link.ts` 的 `name` / `url` 归一化缺陷已并入第七十一阶段条目 6d——`createFriendLink` / `updateFriendLink` 的 `trim()` 会被 `saveFriendLinkEntity` 内 `assignDefined(entity, input, [...])` 用未清洗的原始 input 覆盖；最小范围是把归一化收敛到 `saveFriendLinkEntity`（或 `assignDefined` 后统一 `trim`），补「首尾空白不落库」失败断言，并与 `ensureUniqueFriendLinkUrl` 共用同一次清洗结果。执行范围见 [项目计划](./roadmap.md)。
- **待跟踪（2026-10-22 新增，责任人：测试工程）**：本地 Nuxt 测试环境存在 `vitest` 转换缓存（`node_modules/.vitest-cache`）热命中后 `utils/shared/post-copyright.ts` 等文件报 `Cannot find module '/@id/virtual:intlify-i18n-N'` 的问题（冷缓存可正常加载，CI 未复现）；`tests/server/notification*.test.ts` 与 `post-distribution*.test.ts` 受影响。建议后续评估 `test:coverage` 入口是否需要显式 `--no-cache` 或隔离缓存目录，避免本地验证被环境噪声阻断。
- **已上收（2026-11-12，第七十四阶段条目 3a）**：`server/api/admin/creator-stats.get.ts` 的周 / 月聚合直接使用 `DATE_TRUNC('week' | 'month', post.publishedAt)`——该函数是 PostgreSQL 专有，SQLite（默认自部署库）下 `range=30/90` 返回 500。已并入第七十四阶段条目 3a，执行范围与验收见 [项目计划](./roadmap.md)；原取证正文已随上收去重（`%W` 非 ISO 周编号等关键约束已写入条目 3a）。
- **已上收（2026-11-12，第七十四阶段条目 3b）**：`styles/pages/_admin-dashboard.scss` 末尾 `@include respond-to("md")`（`min-width: $breakpoint-md`）把 `.admin-dashboard__{hero,rankings,metrics}` 的 `grid-template-columns` 置为 `1fr`（1440px 下三卡纵向堆叠，语义应为 `respond-below`）。已并入第七十四阶段条目 3b，执行范围与验收见 [项目计划](./roadmap.md)；原取证正文已随上收去重。


- **已上收（2026-11-12，第七十四阶段条目 3c）**：`server/database/typeorm-adapter.ts` 的 `transformOutput`（约 283–307 行）在字段回写循环把已由 `_id` 落位的 `id` 覆盖为 `undefined`（仅 `_id` 的记录会丢主键）。已并入第七十四阶段条目 3c，执行范围与验收见 [项目计划](./roadmap.md)；原取证正文已随上收去重。


## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [项目规划规范](../standards/planning.md)
