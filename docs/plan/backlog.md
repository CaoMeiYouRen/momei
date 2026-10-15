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
- **最近一次上收阶段**: 第六十六阶段（第八批：5 个高价值模块补测 58 用例，全仓 Statements 79.55% → 80.63%）。
- **当前基线**: Statements `80.63%` / Branches `69.26%` / Lines `80.68%`（距 `90%+` 长期目标约 9.4%）。
- **下一次可切片方向**: 优先选代码量大、分支多的 `server/services/` 层模块（低覆盖候选：`ai/task-detail.ts` 28.57%、`external-feed/cache.ts` 50.00%、`friend-link.ts` 73.06%、`notification.ts` 70.10%、`post-distribution.ts` 75.31%、`upload.ts` 74.85%）；测试有效性延续“已有测试基座 + 失败 / 边界优先”。**第九批（`server/services/` 低覆盖 3-5 模块）已上收至第六十八阶段，见 [todo.md](./todo.md)**。遗留治理项：`text.test.ts` 超 1000 行建议拆分、`tts.test.ts` beforeEach 对齐 `mockReset`。

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
- **下一次可切片方向**: design 域审计 `docs/design/governance/` 中已过期评估 / 报告的归档状态；plan 域按阈值滚动归档（跟进 `roadmap.md` / `todo-archive.md` 行数）；翻译域评估进一步收紧 `must-sync` / `summary-sync` 的可执行性。**待跟踪（2026-10-13 新增，责任人：阶段收口）**：回归窗口行数存在两套口径——`docs/reports/regression/index.md` §3.1 为「300-400 行或 6-8 条记录」，而 `scripts/docs/check-line-count.mjs` 为 warn>500 / error>700；第六十八阶段条目 2 首路由写入前已按前者完成一次滚动归档（第四十二 ~ 第四十九阶段窗口迁入 `archive/2026-06-04-to-2026-06-13.md`）；此后又完成第二次滚动归档（2026-06-04 ~ 2026-09-11 共 6 个窗口迁入 `archive/2026-06-04-to-2026-09-11.md`，见 `c7fd82e7`）。**当前实测（2026-10-16，第十路由写入后）**：`current.md` **269 行 / 5 个窗口**（行数取 `pnpm docs:check:line-count` 口径；`wc -l` 为 268，差 1 为末行计法）——**在 warn>500 线以下**，距 error 700 余量 **431 行**。归档轨迹（第七 / 第八次，均 2026-10-16）：第七次迁出第六路由窗口至 `archive/2026-10-15-phase68-b2-link-governance.md`（无外部节名短语引用）；第八次迁出条目 2 第三批次 4 个窗口（`phase68-b2-ad-placements` / `phase68-transition-shells` / `phase68-b2-subscribers` / `phase68-b2-users`）至 `archive/2026-10-14-to-2026-10-15-phase68-b2-batch3.md`，并**同步改写** `docs/plan/todo.md` 中「过渡组件基建窗口」的节名短语引用为「过渡组件基建节」（第四次归档后「窗口归档与锚点改写一并执行」的口径第二次落地）。**已完成（原「下批开工第一步」待办，两批累计）**：第五次归档迁出早期 3 窗口（submissions / external-links / fix-comments-pagination）至 `archive/2026-10-13-phase68-early-windows.md`；第六次归档于 2026-10-15 迁出第二批次 3 窗口（`phase68-b2-waitlist` / `phase68-fix-button-visible-label` / `phase68-b2-ad-campaigns`）至 `archive/2026-10-14-phase68-b2-batch2.md`，并同步改写 `docs/plan/todo.md` 中「第六十八阶段 `CaomeiButton` 可见文案回归修复节」的节名引用（第六次归档是首次在归档时改写**指向 current.md 的节名短语**而非仅窗口 id 的场景）。**本次未先归档的原因**：第四次归档已迁出第六十七阶段 **5 个**窗口（M1 / M1b / M2 / M3 / M4，故它们不在现存 8 个之内）；现存 8 个窗口中，`phase68-caomei-drift-060` / `phase68-item1-upgrade-030` 被 `docs/plan/**`、`docs/design/**`、`.github/perf/bundle-baseline.json` 与 `docs/reports/regression/archive/2026-09-21-pg-types-hotfix.md` 以节名引用，其余为 **4 条第六十八阶段近线记录 + 1 条 `workflow-precheck`（非阶段记录）**（本阶段尚在进行，按「只保留最近 1–2 个阶段」不应迁出）。故本阶段内允许在 warning 区间写入；**阶段收口时必须整体归档第六十八阶段记录并改写上述节名引用**（届时与锚点改写一并执行）。**当前生效口径声明**：以 `scripts/docs/check-line-count.mjs` 的 **warn>500 / error>700 为阻断口径**（记录数 6-8 条为收敛目标，非阻断条件）；第四次归档（含锚点改写）后已回到 warning 线以下，后续按「写入前若将越过 warning 线则先归档」执行。收敛方向：以 `backlog.md`「回归记录管理」的 500-700 / 700+ 为单点口径，把 `index.md` §3.1 改为指针引用。**归档约束（2026-10-14 补记，责任人：阶段收口）**：`current.md` 的 `phase67-m1-integration`（M1）/ `phase67-m1b-reanchor`（M1b）/ `phase67-m2-visual-base`（M2）/ `phase67-m3-token-bridge`（M3）/ `phase67-m4-pilot-comments`（M4）**五个**窗口被 `docs/plan/todo-archive.md` 等文档以「回归记录 M1 节 / M1b 节 / M2 节 / M3 节 / M4 节」的**节名锚点**引用（改写前形态即指向 `current.md`，现已失效）——归档这些窗口前必须先改写上述引用为归档分片路径，否则「整体迁移」会留下失效锚点；2026-10-14 的第二次（2026-06-04 ~ 2026-09-11，6 个窗口）与第三次（2026-09-21 pg-types 热修复，1 个窗口）滚动归档均按此约束只迁出**无锚点引用**的窗口；**第四次归档已完成该改写**（2026-09-20 ~ 2026-09-25 的第六十七阶段 M1 / M1b / M2 / M3 / M4 五个窗口迁入 `archive/2026-09-20-to-2026-09-25-phase67-migration.md`，同步改写 3 个跟踪文档共 **12 处（11 行）**节名锚点——`docs/plan/todo-archive.md` 6 处、`docs/plan/archive/roadmap-phases-54-67.md` 2 处、迁移方案 4 处；另本机 `.session/wisdom.md` 2 处（未跟踪））。**后续口径**：窗口归档与锚点改写一并执行即可，不再需要「只迁出无锚点引用窗口」的限制。**待跟踪（2026-10-13 新增，责任人：迁移收尾）**：B2 迁移页中两类**跨批**遗留形态——① 页面 scoped 样式的**幻影 token**（`--surface-ground` / `--border-radius` / `--text-color-secondary` 等在全仓应用源码中从未定义、恒为 `unset`），迁移期保留以免首次显现底色/圆角（超出「不改观感」），收尾时与 PrimeVue 卸载同批清理——其中 `p-fluid` 与若干页面 `*__dialog` class 经实测在构建产物中**无对应规则**（PrimeVue 4 的 `fluid` 只注册类名不产样式，全宽由 `styles/main.scss` 提供），同属该收尾项；② 迁移页注释与视觉测试注释中的**阶段号 / 审计编号**（如「第六十九阶段」「第六十八阶段条目 2」，以及守卫与 E2E 测试注释里的孤立 `S-2` / `S-3`、`审计提示` 字样），属 `development.md` §2.2.1 应清理形态；其中测试名内的编号已随本批清理，注释内孤立编号登记为收尾统一清理项。**待跟踪（2026-10-14 新增，责任人：迁移收尾 / 阶段收口）**：视觉一致性门禁的跨环境基线治理——① **前置条件（非可选）**：迁移方案 §8.2 第 18 行口径要求「跨环境差异若无法消除则以 CI 生成为唯一基线来源，不采用本地快照作为判定依据」，移除 `visual` job 的 `continue-on-error` 前须先在 ubuntu runner 以 CI 产物复采参考态（`pnpm test:visual:reference`）并刷新预算（见 [视觉一致性门禁](../design/governance/2026-10-13-visual-parity-gate.md) §7 与 `.github/workflows/test.yml` visual job 注释）；② **reader 档上线前必须清零未归因差异**：任何 `reader` 档（面向读者 / 公开页）路由上线前，其 parity 未归因差异须为 0。

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
- **状态**: 进行中（方案 A 轨迹经第六十八阶段准入重划为第六十七 ~ 第七十阶段四段，本阶段已立项执行 `0.3.0` 复测与 B2 切片；目标依赖于 2026-10-13 对齐为 `0.6.0`）。
- **最近一次上收阶段**: 第六十七阶段（接入基座 + 三层视觉验证回归基座 + 全局 token 语义层 + B2 试点页，已审计归档）。
- **当前基线**: `primevue@4.5.5` 锁定并在 `.github/dependabot.yml` 按版本屏蔽；`caomei-ui@0.6.0` 精确锁定（第六十八阶段条目 1 已于 2026-09-26 完成 `0.3.0` 升级与基线复测；其后经 Dependabot 单包路径抬版到 `0.5.0` / `0.6.0`，**已于 2026-10-13 按升级纪律补做 `0.4.0~0.6.0` 的 `BREAKING CHANGES` 阅读、三层视觉回归与包体复测、文档对齐**——基础层新增 `field-shell.css` 使 `keyCss` +415 字节至 61,311 字节）；`keyCss` 配额 70KB（组件样式随消费方 chunk 归属）；组件清单 `0.6.0` 口径 81 项，上游反馈清单 1.3 / 1.4 / 1.5 三条真实缺口已由 `0.4.0` 交付闭合。
- **下一次可切片方向**: 0.3.0 升级复测与 B2 剩余数据页（10 个数据列表路由 + 组件型目标 host 路由 + 共享壳过渡组件）已上收至第六十八阶段，见 [todo.md](./todo.md)；后续按迁移方案 §7 推进——B3 表单与设置并入浮层类（Dialog / Drawer / Popover / DropdownMenu）为第六十九阶段，B4 展示、浮层收尾与 PrimeVue 卸载为第七十阶段；共享壳过渡组件替换清单见迁移方案 §5.5，上游反馈清单见 [2026-09-25-caomei-ui-upstream-feedback.md](../design/governance/2026-09-25-caomei-ui-upstream-feedback.md)。**收尾必办**：① B4 只需确认 `keyCss` 未反弹；② 第七十阶段前须为 `caomei-ui` 配置 Dependabot `ignore`（或改走人工升级），阻断「精确锁定仍被单包抬版」的静默漂移路径（见迁移方案 §3.8 / §5.6）。

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

---

- **待跟踪（2026-10-15 新增，责任人：门禁 / E2E 收敛）**：`networkidle` 依赖外网可达性——① 视觉一致性门禁与 E2E 均以 `waitForLoadState('networkidle')` 判定就绪，而页面存在长期 pending 连接（`/api/notifications/stream` SSE、外部 gravatar 头像），无外网环境下永不空闲（本地实测：公开页 E2E 10 处失败、`/admin/users` 门禁需改用 `stable: lenient` 才可运行）；② CI（有外网）与本地（无外网）像素/就绪结果不可复现，与迁移方案 §8.2「跨环境差异」条款冲突；③ 建议后续按「阻断非本地请求」统一收敛门禁与 E2E 的等待口径，并与「以 CI 产物复采参考态」的前置条件同批执行。
- **待跟踪（2026-10-15 新增，责任人：迁移收尾）**：上游反馈 §2.6（`lazy` 只关分页、不关排序）待上游确认；`/admin/users` 本批按「不绑定受控排序 prop」保持与迁移前一致的形态，若上游提供 `manualSorting` 或确认现状，需同步 `use-admin-list.ts` 的 `onSort` 口径与回归记录。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：上游反馈 §2.7（`DataTable` 无「列最小宽」契约，`DataTableColumn.width` 只落 `th` 且只有 `px` 宽度参与冻结偏移；**选择列宽度不可配置**——PrimeVue 52px vs caomei 34px，使 `/admin/posts` 整表左移 18px）待上游确认；若上游提供选择列宽度钩子或列 `minWidth`，须重跑 `/admin/posts` parity 并按实测重校准允许清单。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾 / 阶段收口）**：`tests/visual/parity/reference/*.reference.png`（22 张迁移前 PrimeVue 原貌参考态）在 10 条 admin 数据列表路由全部迁移后**已失去运行时职责**（`PENDING_ROUTES` 清空），但它们是「PrimeVue 原貌」的唯一存档——PrimeVue 卸载（B4）后无法重采。收尾时须显式决策保留方式（就地归档 / 迁入设计证据目录 / 另存 release 资产），**不得直接删除**；同时须同步 `playwright.visual-parity.config.ts` 的 `snapshotPathTemplate` 与采集脚本口径。**已知附带失败模式（2026-10-16 已缓解）**：参考态齐备后，`capture-visual-reference.mjs` 的保护口径会把全部用例排除，HEAD 全量采集因此无候选用例——Playwright 默认以 `No tests found` 退出码 1 使 `pnpm test:visual:reference` 硬失败；本批已就地采集块补 `--pass-with-no-tests`（「无待采目标 = 成功」，专刷某条仍用 `--only=<name>`），并有静态守卫锁定该 flag（`tests/scripts/capture-visual-reference.test.ts`）。保留方式决策落地时须一并复核该行为。

- **待跟踪（2026-10-16 新增，责任人：迁移收尾）**：`CAOMEI_UI_ROUTE_PREFIXES` 的**前缀语义连带子路由**与「已迁移路由」事实之间的落差——登记 `/admin/posts` 后，未迁移的编辑器子路由 `/admin/posts/[id]` 对**路由择库型**过渡组件（`AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`）同样解析为 caomei-ui；本批逐处核对确认该子路由**当前未触达**这三者（无路由内混用），但该性质**无守卫兜底**。收尾/后续批次应补结构守卫：断言「已登记前缀下**非 `index.vue` 的子路由页面**及其 `components/<prefix>/**` 子树不得渲染组件内择库型过渡组件」，或在编辑器路由迁移后自然消解。事实源侧已把该例外写入 `lib/ui-library.ts` 的常量注释（含可达性核对结论）。

## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [项目规划规范](../standards/planning.md)
