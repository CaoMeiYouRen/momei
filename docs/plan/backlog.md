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
- **下一次可切片方向**: 优先选代码量大、分支多的 `server/services/` 层模块（低覆盖候选：`ai/task-detail.ts` 28.57%、`external-feed/cache.ts` 50.00%、`friend-link.ts` 73.06%、`notification.ts` 70.10%、`post-distribution.ts` 75.31%、`upload.ts` 74.85%）；测试有效性延续“已有测试基座 + 失败 / 边界优先”。遗留治理项：`text.test.ts` 超 1000 行建议拆分、`tts.test.ts` beforeEach 对齐 `mockReset`。

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
- **下一次可切片方向**: 尚未纳入 runtime 回归的公开页装配链路（档案 / 分类 / 标签列表页 i18n 完整性审计）；仍需动态拼接 key 的场景优先评估“是否为有限集合”，默认改显式静态 key 映射而非扩 allowlist。

### 6. 文档事实源、翻译与分层归档治理

- **目标**: 统一维护全文档体系的分层边界、膨胀阈值与 freshness——`docs/design/` 的模块 vs 专项分层、`docs/plan/` 的行数阈值触发归档、`docs/i18n/*/` 的翻译 tier 与同步；清理无效 / 过时 / 漂移文档；保持 `docs:check:source-of-truth` 与 `docs:check:line-count` 可通过，不靠临时补 `last_sync` 应付检查。阈值被证明过宽时先回写脚本，再更新规范与阶段结论。
- **状态**: 观察中。
- **最近一次上收阶段**: 第六十四阶段（ko-KR / ja-JP 专项治理：freshness 审计报告 + 13 文档 `last_sync` 刷新 + ja-JP 升格 + features / variables 翻译补齐）。
- **当前基线**: `docs:check:line-count` 覆盖 README、plan 主文档与 `docs/reports/regression/current.md`；`docs:check:source-of-truth` 以 git 提交判定 hard blocker，tier 软上限 `must-sync 60 天 / summary-sync 120 天`（`candidate` profile 保留 21/30 天基线，仅作收敛评估）。
- **下一次可切片方向**: design 域审计 `docs/design/governance/` 中已过期评估 / 报告的归档状态；plan 域按阈值滚动归档（跟进 `roadmap.md` / `todo-archive.md` 行数）；翻译域评估进一步收紧 `must-sync` / `summary-sync` 的可执行性。

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
- **状态**: 进行中（方案 A 三阶段轨迹，第一阶段已归档）。
- **最近一次上收阶段**: 第六十七阶段（接入基座 + 三层视觉验证回归基座 + 全局 token 语义层 + B2 试点页，已审计归档）。
- **当前基线**: `primevue@4.5.5` 锁定并在 `.github/dependabot.yml` 按版本屏蔽；`caomei-ui@0.2.0` 精确锁定，升级尚未执行；`caomei-ui@0.3.0` 已于 2026-09-24 发布且无 `BREAKING CHANGES`，为下一目标基线；`keyCss` 配额已回落 70KB 并刷新基线（实测 60,684 字节，口径待复测）。
- **下一次可切片方向**: 按迁移方案 §7 分批计划继续（B2 剩余数据页 / B3 表单与设置 / B4 展示、浮层与收尾）；共享壳过渡组件替换清单见迁移方案 §5.5，上游反馈清单见 [2026-09-25-caomei-ui-upstream-feedback.md](../design/governance/2026-09-25-caomei-ui-upstream-feedback.md)。**收尾必办**：B4 只需确认 `keyCss` 未反弹。
- **待执行条目**: `caomei-ui` `0.2.0` → `0.3.0` 升级与基线复测——升级依赖（保持精确锁定）→ 读 `0.3.0` `BREAKING CHANGES`（已知无）→ 重跑该批视觉回归与定向测试（0.x 不承诺语义化兼容，不得静默升级）→ 重测 `keyCss` 并按需刷新 `.github/perf/bundle-baseline.json`（含下条基线口径漂移的澄清）→ 组件消费清单按 `0.3.0` 口径重数。
- **基线口径待复测指针**: `.github/perf/bundle-baseline.json` 的「零 caomei 组件消费」表述与 B2 试点页已消费 5 个组件的事实冲突，待升级批次实测澄清。

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

---

## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [项目规划规范](../standards/planning.md)
