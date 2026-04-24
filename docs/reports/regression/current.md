# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

兼容期内，既有历史正文仍可通过 [docs/plan/regression-log.md](../../plan/regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-04-24 第三十一阶段国际化运行时加载与文案复用治理切片

### 范围

- 目标：完成第三十一阶段 `国际化运行时加载与文案复用治理 (P0)` 的当前切片，确认缺词 blocker 继续为 `0`，并把运行时回归入口正式扩到一条公开页装配链路和一组跨公开页 / 后台共享字段场景。
- 本轮覆盖：`package.json` 中 `i18n:verify:runtime` 的定向测试矩阵、`pages/about.test.ts` 的公开页真实文案装配断言，以及既有 `pages/friend-links.test.ts`、`pages/admin/friend-links/index.test.ts` 共享字段场景纳入固定回归入口。
- 非目标：不调整 `locale-runtime-loader` 实现，不发起全仓 locale 模块重构，不把 `unused` 审计提升为 blocker，也不继续扩大为更多公开页的铺量补测。

### 实施结论

- `i18n:verify:runtime` 现在除了 locale 模块解析、运行时加载器、后台壳层、登录页和商业化设置组件外，还固定覆盖 About 公开页与友链公开页 / 后台页共享字段链路。
- About 页测试已从“页面结构存在”升级为“真实翻译装配命中”，会直接拦截 `pages.about.*` raw key 泄漏到公开页 UI。
- 友链共享字段链路继续沿用 `components.friend_links.fields.*` 作为领域共享命名空间，固定验证公开页与后台页不会回退到页面私有 key。
- 共享 key 上收准入标准、`missing` 优先于 `unused` 的缺词定级口径，以及长期热点切片顺序，继续以 `docs/design/governance/i18n-field-governance.md` 与 `docs/plan/backlog.md` 为事实源。

### 已执行验证

- `pnpm i18n:audit:missing -- --summary-limit=12`
	- 结果：通过；`Missing parity summary: total: 0`。
- `pnpm i18n:verify:runtime`
	- 结果：通过；`8` 个测试文件、`55` 条断言全部通过，覆盖公开页装配链路、共享字段链路与既有运行时加载边界。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮新增验证面直接命中当前阶段验收要求，且未引入新的运行时加载实现分叉。

### 未覆盖边界

- `pnpm i18n:verify:runtime` 当前公开页只新增了 About 链路；后续若继续上收，优先补 `app-footer` 友链区域与 `archives` / `categories` / `tags` 等公开列表页装配链路，而不是继续增加同类静态页面结构断言。
- 共享组件命名空间当前继续聚焦友链字段与商业化设置场景；下一批高风险历史热点仍优先观察 `admin-settings`、`admin-ai`、`admin-snippets` 与未来新增的跨模块共享字段，而不是回头做全仓 `unused` 清扫。

## 2026-04-22 第三十阶段归档放行复核

### 范围

- 目标：为第三十阶段“远程仓库同步与治理基线细化推进（Hexo 风格导出）”补齐阶段归档动作本身的独立放行证据，确保规划状态从“执行中”切换到“已审计归档”时，具备可直接引用的 phase-close 记录。
- 本轮覆盖：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/plan/backlog.md` 的阶段状态一致性；`docs/i18n/*/plan/roadmap.md` 的摘要同步；以及 `docs/reports/regression/current.md` 与 `docs/reports/regression/archive/**` 的证据链挂接完整性。
- 非目标：不重做第三十阶段六条主线的实现级 review；各主线实现、验证矩阵与 Review Gate 结论仍以上述 2026-04-21 近线记录及历史归档记录为准。

### 归档结论

- 第三十阶段六条主线均已具备独立收口证据：远程仓库同步（Hexo 风格 / GitHub / Gitee）候选落地、文档翻译 freshness 清偿、国际化字段治理、重复代码与纯函数复用治理、存量代码注释治理，以及 ESLint / 类型债与规则收紧治理，均已在本文件近线窗口或历史归档分片中形成实现结论、最小验证矩阵、Review Gate 与未覆盖边界。
- 中文事实源已完成阶段切换：`todo.md` 已清理第三十阶段执行正文，`todo-archive.md` 已追加完整归档块，`roadmap.md` 已改为“已审计归档”，`backlog.md` 已同步更新长期主线的最近一次上收阶段与状态说明。
- 多语摘要已同步：`en-US`、`zh-TW`、`ko-KR`、`ja-JP` 的 roadmap 摘要已改为第三十阶段“已审计归档”，并与中文事实源对齐“存量代码注释治理”主线表述。
- 回归证据链已闭环：活动窗口维持在可控规模内，历史归档分片的日期窗口与正文内容已重新对齐，第三十阶段归档动作本身现可由本条记录直接放行引用。

### 最低验证矩阵

- 验证层级：`V0 + V1 + RG`。
- V0：核对阶段归档最小清单，包括中文事实源、backlog、多语 roadmap 摘要，以及阶段主线证据链与历史归档索引。
- V1：执行规划 / 回归文档的编辑器诊断检查、`pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n`、`pnpm lint:md`，并复核活动回归窗口未超过当前归档阈值。
- RG：本轮 Review Gate 结论为 `Pass`。

### 已执行验证

- 编辑器诊断：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/plan/backlog.md`、`docs/reports/regression/current.md`、`docs/reports/regression/archive/index.md`、`docs/reports/regression/archive/2026-04-18-to-2026-04-21.md`、`docs/i18n/*/plan/roadmap.md`
	- 结果：通过；上述文件无新增错误。
- `pnpm docs:check:source-of-truth`
	- 结果：通过；中文事实源与多语摘要 freshness / source-only 契约保持一致。
- `pnpm docs:check:i18n`
	- 结果：通过；未发现旧目录回流或重复翻译页。
- `pnpm lint:md`
	- 结果：通过；阶段归档与回归分片调整未引入 Markdown 结构错误。
- 活动窗口体量复核：`docs/reports/regression/current.md`
	- 结果：当前窗口为 `254` 行（补档前测量），维持在健康范围内；本轮仅补充阶段放行记录，不涉及旧正文回流。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：此前唯一 blocker 是“第三十阶段归档动作缺少独立 phase-close 放行证据”；当前已由本条记录补齐，规划状态切换与证据链挂接可以正式闭环。

### 未覆盖边界

- 本条记录只为第三十阶段归档动作提供统一放行入口，不替代六条主线各自的实现级回归记录；后续复查具体链路时，仍应回到对应的 2026-04-21 主线条目或历史归档切片。
- 第三十一阶段尚未正式落盘；后续只允许以候选方案形式评估“一个新功能 + 若干优化”，不得引用本条记录直接替代下一阶段准入。

## 2026-04-21 文档翻译 freshness 清偿与文档翻译治理

### 范围

- 目标：完成第三十阶段 `文档翻译 freshness 清偿与文档翻译治理 (P0)` 的首轮收口，解决 `docs:check:source-of-truth` 长期失效问题，并把翻译承诺范围从“全量翻译默认持续维护”收敛为分层治理。
- 本轮覆盖：`docs/design/governance/docs-translation-freshness-governance.md` 专项设计文档；`docs/guide/translation-governance.md` 与 `docs/standards/documentation.md` 的规则上收；`scripts/docs/check-source-of-truth.mjs` 的 tier 化校验；`docs/.vitepress/config.ts` 的 locale 导航收窄；`docs/i18n/en-US`、`docs/i18n/zh-TW`、`docs/i18n/ko-KR`、`docs/i18n/ja-JP` 的公共入口页同步与 source-only 降级页显式声明。
- 非目标：不在本轮恢复所有深层翻译页的正文同步；深层 design / standards / guide 页优先通过 `source-only` 明示中文事实源，而不是继续假装为完整维护翻译。

### 治理决议与同步范围

- 已正式固化三层口径：`must-sync`（30 天）、`summary-sync`（45 天）、`source-only`（无天数 SLA，但必须显式回链中文原文）。
- `en-US`：同步首页、快速开始、部署、翻译治理、开发指南，以及 `planning` / `documentation` / `security` / `testing` 高频规范页；将 design 页、`guide/ai-development`、`guide/comparison`、`standards/api` 降为 `source-only`。
- `zh-TW` / `ko-KR`：同步首页、快速开始、部署、翻译治理等公共入口；深层 guide / standards / design 页统一降为 `source-only`，并补齐 locale URL 保留说明与中文事实源回链。
- `ja-JP`：同步首页摘要，使其与当前第三十阶段 roadmap 口径保持一致。
- 导航与目录范围已同步收窄，避免 sidebar / nav 继续暴露已降级的深层翻译页。

### 已执行验证

- `pnpm docs:check:source-of-truth`
	- 结果：通过；翻译页 freshness、tier 与 source-only frontmatter 契约已恢复到可通过状态。
- `pnpm docs:check:i18n`
	- 结果：通过；未发现 legacy `docs/<locale>/` 与 `docs/i18n/<locale>/` 的重复翻译页。
- `pnpm lint:md`
	- 结果：通过；本轮新增与修改的治理文档、翻译页与回归记录未引入 Markdown 规范错误。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：本轮唯一实现期 blocker 是 `docs/i18n/en-US/guide/ai-development.md` 的 `translation_tier` / `source_origin` 一度落在 frontmatter 之外，已在同轮修正并复跑通过。

### 未覆盖边界

- `source-only` 降级并不意味着恢复了深层翻译页正文同步；后续若决定重新扩大 locale 承诺范围，必须先更新规范、脚本映射与导航，再恢复正文维护。
- `zh-TW` / `ko-KR` / `ja-JP` 目前仍以公共入口摘要为主，未扩展到全量 standards / design 正文 parity。
- 后续若新增翻译页或调整 tier，必须同步修改 frontmatter、页面提示文案、`docs/.vitepress/config.ts` 与 `scripts/docs/check-source-of-truth.mjs`，否则最容易再次出现“脚本豁免范围”和“站点导航承诺”漂移。

## 2026-04-21 存量代码注释治理与注释漂移治理首轮切片

### 范围

- 目标：完成第三十阶段 `存量代码注释治理与注释漂移治理 (P1)` 的首轮窄切片，只覆盖 `1` 组高复杂度链路，不扩写为全仓补注释工程。
- 本轮覆盖：候选组 A，即 `server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts` 与 `server/middleware/i18n.ts`。
- 非目标：不触碰上传存储解析、文章访问控制、AI 服务治理与公开查询裁剪链路；不改任何运行时行为，只治理注释质量与漂移风险。

### 注释补强与清理结论

- 设置来源判定：已补齐 localized setting 的结构化 locale 回退链、legacy 单值兼容、`env > db > default` 统一决议点，以及 `setSettings()` 中脱敏占位符保值与 legacy alias 清理的契约说明。
- locale 归一化：已补齐 auth boundary locale 到 `AppLocaleCode` 的映射边界、`default -> en-US` 的内部折叠口径，以及 H3 请求与 Better Auth `Request` 场景必须共享同一优先级链的原因。
- 鉴权上下文挂载：已补齐 `shouldResolveSession()` 的准入边界，明确 `/api/auth` 始终进入 session 解析，其余情况下只在特定公开接口且已带会话痕迹时才触发，避免匿名热点请求被无意义地拖入鉴权初始化。
- i18n 上下文注入：已补齐 `event.context.locale` 与 `AsyncLocalStorage` 双写入的原因，并明确当前白名单只跳过内部构建产物与 favicon，没有把局部跳过策略误写成“所有静态资源都不进入链路”。
- 低价值注释清理：移除了 `setting.ts` 与 `locale.ts` 中多处只复述函数名 / 参数含义的通用 JSDoc，改为解释来源优先级、兼容边界与副作用的窄注释。
- 收口补充：已把“导出函数 / 复用函数 / 复杂函数优先保留简短 JSDoc”的方向固化为模板，避免后续同类治理把函数前注释再次一刀切删除。

### 设计与证据事实源

- 设计文档：`docs/design/governance/comment-drift-governance.md`
- 当前阶段状态：`docs/plan/todo.md`
- 收口模板：`docs/design/governance/comment-drift-governance.md#44-函数级-jsdoc-模板`

### 已执行验证

- 受影响文件错误检查：编辑器诊断复核 `server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts`、`server/middleware/i18n.ts`
	- 结果：无新增错误。
- 定向 ESLint：`server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts`、`server/middleware/i18n.ts`
	- 结果：通过。
- 定向 Markdown lint：`docs/design/governance/comment-drift-governance.md`、`docs/design/governance/index.md`、`docs/plan/todo.md`、`docs/reports/regression/current.md`
	- 结果：通过。
- 定向 Vitest：`server/services/setting.test.ts`、`server/utils/locale.test.ts`
	- 结果：通过；设置回退链与 locale 归一化语义保持不变。
- 类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；无新增诊断。
- 注释自检：逐文件复核“注释是否准确、是否过量、是否与实现同步”，并按审计意见修正 `1-auth.ts` 与 `i18n.ts` 的边界描述
	- 结果：通过；修正后未发现仍与实现冲突的新增注释。
- 收口复核：补充检查函数级 JSDoc 保留策略是否重新引入机械复述型注释
	- 结果：通过；导出与复杂函数保留简短 JSDoc，简单函数不强行补注释。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：首轮审计曾指出 `1-auth.ts` 与 `i18n.ts` 的边界注释写得过宽，已在同轮修正并复核；当前无剩余 blocker。

### 未覆盖边界

- 本轮没有继续处理候选组 B 的上传存储解析、文章访问控制与 AI 服务治理；这些链路仍保留为下一轮高复杂度切片入口。
- 本轮没有扩到候选组 C 的公开查询热点接口与 query helper，因为它们更适合与行为级回归一起评估，而不是单独做注释补强。
- 若后续调整 `resolveSettingEnvEntry()`、Better Auth locale 支持集、`/api/auth` 会话准入或 i18n 白名单路径，必须同步更新本轮新增注释，否则最容易在 `setting.ts`、`locale.ts`、`1-auth.ts` 与 `i18n.ts` 上再次出现注释漂移。
- 若后续继续推进候选组 B/C，应沿用本轮沉淀的 JSDoc 模板重新评估“哪些函数前注释该保留、哪些应删除”，而不是沿用一次性的主观判断。

## 2026-04-21 重复代码与纯函数复用治理首轮切片

### 范围

- 目标：按第三十阶段 `重复代码与纯函数复用治理 (P1)` 的准入边界，只处理 `2` 组高收益重复区，不扩写为全仓重构。
- 本轮覆盖：`server/api/admin/ai/tasks.get.ts` 与 `server/services/ai/task-detail.ts` 的 AI 管理任务读模型装配重复；`server/api/admin/notifications/delivery-logs.get.ts`、`server/api/admin/settings/audit-logs.get.ts`、`server/api/admin/migrations/link-governance/reports.get.ts` 的分页 query `safeParse + 默认回退` 模板重复；以及 `scripts/review-gate/check-duplicate-code.mjs` 的 Windows 运行入口恢复。
- 非目标：不处理仍然使用 `Number(query.page || 1)` / `Number(query.limit || x)` 的后台分页接口，因为这些入口对非法值的既有语义并不完全一致；本轮只收敛完全同构的分页回退模板。

### 原始重复点与抽象边界

- 重复点 1：AI 任务列表接口与任务详情服务各自维护同一组 `task.* + user.*` 字段选择和同一组数字字段归一化。
- 抽象边界 1：把共享的 QueryBuilder 装配与读模型归一化统一收到 `server/services/ai/task-detail.ts`，由列表接口复用 `createAIAdminTaskReadModelQuery` 与 `normalizeAIAdminTaskListItem`，不额外引入新的跨模块 service surface。
- 重复点 2：多个后台分页接口重复书写 `querySchema.safeParse(getQuery(event))` 失败后回退 `{ page: 1, limit: 10 }` 的模板。
- 抽象边界 2：在 `server/utils/pagination.ts` 中新增 `safeParsePaginatedQuery`，只抽取“schema-safeParse + 分页默认值回退”这一个纯函数，不吞并各接口自己的过滤字段、demo 分支或 service 调用。

### 收益、风险与回滚边界

- 复用收益：AI 管理任务读模型后续再扩字段时，只需维护一处字段选择和一处数字归一化，避免列表和详情继续漂移。
- 复用收益：分页 query 回退口径统一后，后台 demo 预览和报表接口不再各自维护完全相同的 fallback 模板。
- 风险控制：`safeParsePaginatedQuery` 只替换原本就使用同一 fallback 的三条链路，不触碰手写 `Number(...)` 的历史接口，避免改变非法 query 值的运行时语义。
- 回滚边界：若本轮出现回归，回滚只需撤销 `server/services/ai/task-detail.ts`、`server/api/admin/ai/tasks.get.ts`、`server/utils/pagination.ts` 与 3 个后台分页接口；不涉及数据库、前端渲染层或公共 API 契约重写。

### 当前基线与剩余热点

- `pnpm duplicate-code:check`
	- 结果：通过；`34 clones / 868 duplicated lines / 0.73%`，低于既有 baseline 容差，Review Gate 结论仍为 `Pass`。
- 读模型 / 路由层剩余热点：`server/api/posts/home.get.ts` <-> `server/api/posts/index.get.ts`、`server/api/ai/translate.post.ts` <-> `server/api/ai/translate.stream.post.ts`、`server/routes/fed/actor/[username].ts` <-> `server/routes/fed/outbox/[username].ts`。
- 页面 / 模板层剩余热点：`pages/privacy-policy.vue` <-> `pages/user-agreement.vue`、`pages/forgot-password.vue` <-> `pages/reset-password.vue`、`pages/categories/[slug].vue` <-> `pages/tags/[slug].vue`。
- 手写分页热点保留：`server/api/admin/friend-link-applications/index.get.ts`、`server/api/admin/friend-links/index.get.ts`、`server/api/admin/submissions/index.get.ts` 仍属于下一轮候选，但需要先明确非法 query 语义后再收敛。

### 已执行验证

- 定向 ESLint：`pnpm exec eslint server/utils/pagination.ts server/utils/pagination.test.ts server/api/admin/notifications/delivery-logs.get.ts server/api/admin/settings/audit-logs.get.ts server/api/admin/migrations/link-governance/reports.get.ts server/services/ai/task-detail.ts server/api/admin/ai/tasks.get.ts scripts/review-gate/check-duplicate-code.mjs tests/server/api/admin/settings/audit-logs.get.test.ts --max-warnings 0`
	- 结果：通过；无输出。
- 定向 Vitest：`server/utils/pagination.test.ts`、`server/api/admin/ai/tasks.get.test.ts`、`tests/server/api/admin/notifications/delivery-logs.get.test.ts`、`tests/server/api/admin/link-governance-reports.test.ts`、`server/api/ai/tasks/[id].get.test.ts`
	- 结果：通过；`18` 个测试全部通过。
- 补充 Vitest：`tests/server/api/admin/settings/audit-logs.get.test.ts`
	- 结果：通过；`2` 个测试通过，覆盖合法参数透传与非法分页参数回退到 `page=1 / limit=10`。
- 类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；无输出、无新增诊断。
- 重复代码基线：`pnpm duplicate-code:check`
	- 结果：通过；最新 artifact 已写入 `artifacts/review-gate/2026-04-21-duplicate-code.json` 与 `artifacts/review-gate/2026-04-21-duplicate-code.md`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮收敛保持在既定的 `2` 组重复区内，且 lint、typecheck、定向测试与重复代码基线均已补齐。

### 未覆盖边界

- `scripts/review-gate/check-duplicate-code.mjs` 在 Windows 下已恢复可运行，但当前实现仍依赖 shell 模式拉起 `pnpm`；后续若要继续治理该脚本，可再评估更稳妥的跨平台子进程封装。
- `safeParsePaginatedQuery` 目前只服务于 `page/limit` 默认回退模板；如果后续要统一 `pageSize`、排序或非法值兼容口径，应另开切片，不要把本 helper 继续膨胀成“大一统 query parser”。
- `server/api/admin/settings/audit-logs.get.ts` 的 `demoMode` 预览分支本轮未补直接 handler 级回归；当前只覆盖了正常 service 路径与非法分页参数回退，后续若继续收紧该链路，再单独为 demo 分支补测。

## 2026-04-21 重复代码与纯函数复用治理第二轮收口

### 范围

- 目标：在首轮 `2` 组切片通过后，再收敛一组高收益且有现成 handler 测试兜底的公开查询重复区，为第三十阶段 `重复代码与纯函数复用治理 (P1)` 提供可关闭的收口证据。
- 本轮覆盖：`server/api/posts/home.get.ts` 与 `server/api/posts/index.get.ts` 中完全同构的公开文章多语言 fallback 过滤 SQL 片段。
- 非目标：不把 `server/api/posts/archive.get.ts`、`server/api/search/index.get.ts` 一并强行并入当前 helper；虽然存在相邻相似逻辑，但其目标语言语义与验证护栏并不完全同构，本轮不做过度泛化。

### 原始重复点与抽象边界

- 重复点：首页最新文章接口与公开文章列表接口都内联了同一套“translationId 为空直接放行；按 locale fallbackChain 逐级选语言；若前序语言已存在已发布版本则排除后序语言版本”的 SQL 过滤逻辑。
- 抽象边界：在 `server/utils/post-list-query.ts` 中新增 `applyPublishedPostLanguageFallbackFilter`，只承接“公开已发布文章的语言 fallback 过滤”这一段 QueryBuilder 装配，不吞并可见性过滤、排序、分页或管理态聚合逻辑。

### 收益、风险与回滚边界

- 复用收益：公开文章列表相关接口后续再调整 locale fallback 口径时，只需维护一处查询构造，避免首页和列表页再度漂移。
- 复用收益：文章列表查询工具层现在同时承接字段选择与公开语言过滤两类高频重复装配，读查询边界更清晰。
- 风险控制：helper 仅在 `query.scope !== 'manage'` 的公开链路调用，不触碰管理态 `aggregate` 聚合与翻译附带媒体装配，避免把不同语义的翻译聚合策略误合并。
- 回滚边界：若出现回归，只需撤回 `server/utils/post-list-query.ts`、`server/utils/post-list-query.test.ts`、`server/api/posts/home.get.ts`、`server/api/posts/index.get.ts`；不涉及数据库结构、页面模板或外部 API 契约。

### 当前基线与剩余热点

- `pnpm duplicate-code:check`
	- 结果：通过；最新基线为 `33 clones / 830 duplicated lines / 0.70%`，较首轮进一步下降，Review Gate 结论仍为 `Pass`。
- 读模型 / 路由层剩余热点：`server/api/ai/translate.post.ts` <-> `server/api/ai/translate.stream.post.ts`、`server/routes/fed/actor/[username].ts` <-> `server/routes/fed/outbox/[username].ts`。
- 页面 / 模板层剩余热点：`pages/privacy-policy.vue` <-> `pages/user-agreement.vue`、`pages/forgot-password.vue` <-> `pages/reset-password.vue`、`pages/categories/[slug].vue` <-> `pages/tags/[slug].vue`。
- 保留原因：上述热点要么缺少同级别回归护栏，要么已接近页面壳层/协议层重组，不适合作为当前阶段的继续切片。

### 已执行验证

- 定向 Vitest：`server/utils/post-list-query.test.ts`、`tests/server/api/posts/home.get.test.ts`、`tests/server/api/posts/index.get.test.ts`
	- 结果：通过；`25` 个测试全部通过。
- 定向 ESLint：`pnpm exec eslint server/utils/post-list-query.ts server/utils/post-list-query.test.ts server/api/posts/home.get.ts server/api/posts/index.get.ts`
	- 结果：通过；无输出。
- 类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；无输出、无新增诊断。
- 重复代码基线：`pnpm duplicate-code:check`
	- 结果：通过；最新 artifact 已写入 `artifacts/review-gate/2026-04-21-duplicate-code.json` 与 `artifacts/review-gate/2026-04-21-duplicate-code.md`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；第二轮继续保持在单组高收益重复区内，且公开查询行为已由 util 单测与现有 handler 回归共同兜底。

### 未覆盖边界

- `applyPublishedPostLanguageFallbackFilter` 当前固定服务于 `Post` 公开已发布查询；如果后续要让 `archive`、`search` 或其他非公开列表复用，应先重新定义目标语言语义和最小测试矩阵，而不是继续给当前 helper 加开关。
- 本轮没有继续处理 `translate.post` / `translate.stream.post` 与 ActivityPub actor/outbox 这两组重复；它们仍是下一轮候选，但需要先补齐测试或协议边界说明。

## 2026-04-21 国际化字段治理关闭复核

### 范围

- 目标：完成第三十阶段 `国际化字段治理 (P1)` 的正式关闭复核，确认本轮已不再停留在“散点补词”，而是已经形成可复核的 blocker 矩阵、运行时边界与共享文案上收口径。
- 本轮收口：覆盖后台壳层导航运行时加载边界、公开友链元信息显式 locale 覆盖、友链公开页 / 后台页共享字段标签上收，以及缺词 / parity / runtime 三类验证基线。
- 证据事实源：`docs/design/governance/i18n-field-governance.md`、`components/app-header.test.ts`、`tests/server/api/friend-links/meta.get.test.ts`、`pages/friend-links.test.ts`、`pages/admin/friend-links/index.test.ts`、`i18n/config/locale-modules.test.ts`、`i18n/config/locale-runtime-loader.test.ts`、`components/commercial-link-manager.test.ts`。

### 基线对比

- 本轮前：长期治理主线已经明确 `missing` 优先于 `unused`，也已把 `i18n:audit:missing` 上收到固定入口，但第三十阶段 `todo` 仍缺一份正式的共享 key 准入标准、覆盖模块清单与关闭口径说明。
- 本轮后：第三十阶段的国际化字段治理已具备明确的字段归属规则、运行时加载边界、blocker 矩阵与已覆盖链路说明，可从当前阶段 `todo` 关闭；长期 i18n 主线继续保留在 backlog。
- 当前仓库基线：`pnpm i18n:audit:missing -- --summary-limit=12` 返回 `total: 0`，仓库级缺词 blocker 已清零。

### 实施说明

- 新增专项治理文档 `docs/design/governance/i18n-field-governance.md`，正式固化页面私有 key、模块级共享 key、组件 / 领域共享 key 与 `common` 级公共文案四层准入标准。
- 友链链路已完成一轮跨公开页与后台页的共享字段上收：`site_url`、`logo`、`rss_url`、`contact_email` 统一迁移到 `components.friend_links.fields.*`，旧的 `public` / `admin-friend-links` 模块仅保留页面私有 placeholder 与 hint。
- 后台壳层导航继续锁定只依赖 `admin` 核心词条，不跨到 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 等可选模块。
- 公开友链元信息接口继续锁定 query 显式覆盖 locale 的行为，避免客户端切换语言时误回退到 cookie / header。

### 已执行验证

- `pnpm i18n:audit:missing -- --summary-limit=12`
	- 结果：通过；`Missing parity summary: total: 0`。
- `pnpm i18n:verify:runtime`
	- 结果：通过；`5` 个测试文件、`45` 个测试全部通过。
- `pnpm i18n:check-sync -- --locale=en-US --module=components --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=en-US --module=public --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=en-US --module=admin-friend-links --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- 定向友链回归：`pnpm exec vitest run pages/friend-links.test.ts pages/admin/friend-links/index.test.ts components/app-header.test.ts tests/server/api/friend-links/meta.get.test.ts server/utils/locale.test.ts`
	- 结果：通过；`5` 个测试文件、`62` 个测试全部通过。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余内容已降为长期主线的下一轮候选切片，不再阻塞第三十阶段当前 `todo` 关闭。

### 未覆盖边界

- 本轮没有继续把友链 placeholder / hint 类页面私有文案上收到共享命名空间；这属于后续语义复核问题，不是当前关闭 blocker。
- 本轮没有展开 `unused` 字段清理；当前仍坚持 `missing` blocker 优先、`unused` 分级观察的治理策略。
- 长期主线仍需继续守线：后续新增字段或跨模块复用场景，仍必须重新跑 `i18n:audit:missing`、runtime 命中验证与定向 parity。

## 2026-04-21 远程仓库同步（Hexo 风格）候选链路收口

### 范围

- 目标：完成第三十阶段唯一新增功能“远程仓库同步（Hexo 风格 / GitHub / Gitee）能力评估与候选落地”的正式收口，确认该能力已从专项设计进入可复验的最小闭环。
- 本轮覆盖：`docs/design/governance/hexo-repository-sync.md` 专项设计；`server/services/post-hexo-repository-sync.ts` 与 `server/api/admin/posts/[id]/hexo-repository-sync.post.ts` 的手动同步链路；`server/services/post-distribution.ts` 的统一分发摘要派生；以及 `HEXO_SYNC_*` 设置项与相关说明文档。
- 非目标：不扩写为双向同步、SSH / Git push、定时批量同步、媒体二进制镜像或新的通用 Git 发布平台。

### 实施结论

- 已完成 GitHub / Gitee 两类 provider 契约评估，并将差异收敛到统一 provider 抽象：GitHub 使用 `PUT /contents/{path}`，Gitee 按“新建 `POST`、更新 `PUT`”分支处理。
- 已落地“已发布文章 -> Hexo 风格 Markdown + Front-matter + 媒体绝对 URL 改写 -> 单仓库 Contents API 推送”的最小闭环，并把最近一次同步结果写回 `Post.metadata.integration.hexoRepositorySync`。
- 后台已提供统一触发入口 `POST /api/admin/posts/:id/hexo-repository-sync`，并在文章分发摘要中暴露 `hexoRepositorySync` 最近状态、目标文件路径、远端链接与失败原因。
- `HEXO_SYNC_*` 配置项已进入系统设置第三方集成分组，敏感令牌字段维持脱敏展示与 ENV 锁定优先级；说明文档已同步到 `docs/guide/variables.md` 与 `docs/guide/features.md`。

### 最小验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：专项设计文档、配置契约、provider 差异与回滚边界已在 `docs/design/governance/hexo-repository-sync.md` 固化。
- V1：受影响文档与设置契约已同步到 Guide 与规划文档，不再只停留在实现代码。
- V2：定向单测覆盖文件路径生成、GitHub / Gitee Contents API、媒体 URL 绝对化、鉴权失败分类、重试失败保留远端状态，以及分发摘要中的 `hexoRepositorySync` 派生状态。
- RG：本轮 Review Gate 结论为 `Pass`。

### 已执行验证

- 定向 Vitest：`server/services/post-hexo-repository-sync.test.ts`
	- 结果：通过；覆盖 GitHub / Gitee provider、媒体地址改写、鉴权失败分类、状态持久化与重试失败保留远端状态。
- 定向 Vitest：`server/services/post-distribution.test.ts`
	- 结果：通过；统一分发摘要中的 `hexoRepositorySync` 派生状态与最近同步元数据输出正常。
- 定向 Vitest：`tests/server/services/setting-read.test.ts`、`tests/server/api/admin/settings/demo-mode-security.test.ts`
	- 结果：通过；确认 `HEXO_SYNC_*` 字段保持 env-only / 脱敏边界，不会被通用设置写入口径误覆盖。
- 文档与事实源检查：`docs/design/governance/hexo-repository-sync.md`、`docs/guide/features.md`、`docs/guide/variables.md`
	- 结果：已对齐；设计、配置说明与对外功能描述具备一致口径。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余工作均属于下一阶段是否继续扩容该能力的规划问题，而不是第三十阶段收口阻塞。

### 未覆盖边界

- 本轮仍停留在单篇手动同步，不包含批量 / 定时 / webhook 回推。
- Gitee 首版读取接口仍需在查询参数中带 `access_token`；部署侧需继续保证访问日志与 APM 不落完整查询串。
- 媒体策略当前只做绝对 URL 改写，不负责把二进制资源镜像到远端仓库；若后续要做离站媒体自治，必须单独开切片。

## 2026-04-21 server/utils ESLint / 类型债第二轮收紧

### 范围

- 目标：在 `utils/shared` 首轮收紧之后，再完成一轮可回滚的 `@typescript-eslint/no-explicit-any` 窄切片，并同步为 `@typescript-eslint/no-non-null-assertion` 做三桶采样，作为第三十阶段该待办的最终收口依据。
- 本轮上收：仅在 `server/utils/object.ts` 与 `server/utils/pagination.ts` 两个生产文件上启用 `@typescript-eslint/no-explicit-any`。
- 回滚边界：仅涉及 `eslint.config.js`、`server/utils/object.ts`、`server/utils/pagination.ts` 与当前阶段的治理 / 规划文档；未触碰整个 `server/utils` 目录、`composables/**`、前端表单链路或测试豁免边界。

### 命中清单

- `@typescript-eslint/no-explicit-any` 下一候选筛选：`server/utils/object.ts` 与 `server/utils/pagination.ts` 当前生产命中共 `2` 处，分别是 `assignDefined()` 的赋值桥接和 `parsePagination()` 的未收紧输入参数。
- 两文件都属于底层工具层，且有同级测试文件 `server/utils/object.test.ts` 与 `server/utils/pagination.test.ts`，符合“命中继续集中、验证便宜、回滚清晰”的准入要求。
- `@typescript-eslint/no-non-null-assertion` 分桶采样：`server` 约 `15` 处，集中在设置读取、鉴权上下文和服务层链路；`composables` 约 `8` 处，集中在广告注入与后台 AI 管理链路；前端表单组约 `25+` 处，集中在设置管理器、编辑器和后台表单组件。
- 分桶结论：`server` 与前端表单组当前都不适合直接上收，前者风险偏向运行时边界，后者噪音显著偏高；`composables` 更适合作为下一轮单模块再拆桶，而不是在本待办末尾直接提级。

### 最小验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：记录两文件组命中清单、`no-non-null-assertion` 三桶采样和最终收口结论。
- V1：执行受影响文件定向 ESLint、编辑器诊断与 Nuxt typecheck。
- V2：执行 `server/utils/object.test.ts` 与 `server/utils/pagination.test.ts`，确认对象同步与分页解析行为未回归。
- RG：本轮 Review Gate 结论为 `Pass`。

### 实施说明

- `eslint.config.js` 新增对 `server/utils/object.ts` 与 `server/utils/pagination.ts` 的窄 override，只对这两个生产文件启用 `@typescript-eslint/no-explicit-any`。
- `server/utils/object.ts` 用 `Record<keyof S & keyof T, unknown>` 视图替代了 `assignDefined()` 中的显式 `any` 赋值桥接。
- `server/utils/pagination.ts` 将 `parsePagination()` 的输入从 `any` 收紧为 `unknown`，继续依赖 `paginationSchema.safeParse()` 处理合法性。
- 本轮只记录 `@typescript-eslint/no-non-null-assertion` 的采样结论，不正式上收该规则，避免在待办收口前引入新的大范围行为噪音。

### 已执行验证

- 编辑器诊断：`eslint.config.js`、`server/utils/object.ts`、`server/utils/pagination.ts`
	- 结果：均无新增错误。
- 定向 ESLint：`pnpm exec eslint server/utils/object.ts server/utils/pagination.ts eslint.config.js`
	- 结果：通过，无输出。
- 定向 Vitest：`server/utils/object.test.ts`、`server/utils/pagination.test.ts`
	- 结果：通过，`19` 个测试全部通过。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过，无输出。
- 文档构建：`pnpm docs:build`
	- 结果：通过；`docs:check:i18n` 与 VitePress build 均通过，本轮文档与规划改动未引入新的站点构建问题。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮规则上收仍保持两文件窄边界，且 `no-non-null-assertion` 已完成分桶采样但未越权直接提级，符合当前待办的收口口径。

### 未覆盖边界

- 本轮没有把 `@typescript-eslint/no-explicit-any` 扩到整个 `server/utils` 或更高层业务目录，避免把最后一轮切片扩成大范围服务端清理。
- `@typescript-eslint/no-non-null-assertion` 当前只完成了 `server / composables / 前端表单` 三桶采样；若后续继续推进，优先从 `composables` 再拆成单一 composable 或单一后台管理模块。
