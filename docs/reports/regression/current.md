# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-05-18 第三十七阶段测试有效性切片（P0）关闭

### 范围

- 目标：围绕第三十七阶段 `测试有效性切片 (P0)`，从前端直连 TTS、AI task `estimated / actual` 口径一致性、认证退化与公开热点读链路中，选择已有测试基座且回归风险最高的 `3` 组路径补失败断言或边界断言，并把新增入口纳入可复用的定向回归矩阵。
- 本轮覆盖：[server/api/ai/tts/task.post.test.ts](../../server/api/ai/tts/task.post.test.ts)、[server/api/admin/ai/stats.get.test.ts](../../server/api/admin/ai/stats.get.test.ts)、[tests/server/api/posts/access-error-mapping.test.ts](../../tests/server/api/posts/access-error-mapping.test.ts) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把本轮退化为 coverage 铺量，不并行扩写组件层 front-end direct TTS 可见错误映射，也不重复补已经由 [tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts) 守住的认证退化基础边界。

### 实施结论

- [server/api/ai/tts/task.post.test.ts](../../server/api/ai/tts/task.post.test.ts) 现已补齐 post-backed 内容与翻译元信息透传边界，以及“文章不存在 `404`”与“作者越权访问他人文章 `403`”两条失败断言，避免前端直连 TTS 与后台任务共用入口在 postId 分支上只剩 happy path 守线。
- [server/api/admin/ai/stats.get.test.ts](../../server/api/admin/ai/stats.get.test.ts) 新增 `estimatedCost / estimatedQuotaUnits` 与 `actualCost / quotaUnits` 独立聚合守线，并验证“全部任务仍处于 pending 时 `successRate / failureRate` 保持 `0` 而不是漂移或算出异常比例”，满足本轮“至少一组统计一致性回归”的验收要求。
- [tests/server/api/posts/access-error-mapping.test.ts](../../tests/server/api/posts/access-error-mapping.test.ts) 已把 `/api/posts/home` 纳入统一 `503 POST_ACCESS_STATE_UNAVAILABLE` 错误映射矩阵，补齐公开热点读链路里此前缺失的 home 入口，与 `/api/posts`、`/api/posts/archive`、`/api/search` 及详情接口保持一致。
- 认证退化路径本轮没有继续扩写，因为 [tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts) 已覆盖 targeted public routes、connection-only 初始化与 session lookup failure swallow；相较之下，本轮新增的三处缺口更能直接区分高回归风险。
- 本轮可复用的定向回归矩阵已固定为：`pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`
	- 结果：通过；`3` 个文件、`14` 个测试全部通过（`0` 失败）。
- Markdown lint：`pnpm exec lint-md docs/reports/regression/current.md docs/plan/todo.md`
	- 结果：通过；[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md) 无新增格式或链接告警。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已完成 todo 要求的 `3` 组高风险切片，但认证退化的页面级联动、前端直连 TTS 组件层错误映射与 `settings/public` / friend-links 公开链路的更细失败口径仍未纳入本轮范围，需要保留为下一轮候选，而不是误写成“测试有效性已全域收口”。

### 未覆盖边界

- 组件层 front-end direct TTS 仍只守成功直连与 confirm 提交流程，`/api/ai/tts/task` 创建失败后的可见错误映射没有在 [components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 里重新落地。
- 认证退化当前只守住 server middleware 的边界；登录、注册与 header/profile 等页面级 session 刷新退化联动没有并入这轮定向矩阵。
- 公开热点读链路本轮只补齐了 `/api/posts/home` 的访问状态错误映射，不等于 [tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 或 friend-links 公开入口的失败口径已经完成统一治理。

## 2026-05-14 第三十七阶段 Postgres P1 长窗口复核关闭：Neon 样本确认无持续占用窗口

### 范围

- 目标：使用用户补充的 2026-05-14 Neon query performance 与 system operations 长窗口样本，判断第三十七阶段 Postgres P1 是否已经满足关闭条件，并把剩余候选收敛回 [docs/plan/backlog.md](../../docs/plan/backlog.md)。
- 本轮覆盖：[docs/plan/todo.md](../../docs/plan/todo.md)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/backlog.md](../../docs/plan/backlog.md)。
- 非目标：不新增数据库连接池参数调优，不继续扩写新的公开读链路改造，也不在本轮重拆 `initializeDB()` 维护职责。

### 实施结论

- 2026-05-14 的 Neon query performance 样本里，当前最重 SQL 仍以一次性 TypeORM metadata introspection 为主，包括 `information_schema.columns`、`pg_index`、table comment / constraint 探测与单次 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`。这说明现阶段最显著的 CPU 热点仍然是冷启动初始化探测，而不是某条持续运行的业务读查询。
- 业务查询热点已经明显收敛：首页 posts public list 的 `DISTINCT + IN (...)` 查询对仍是当前最重的业务组，但 tags slug、posts 列表、精选友链与 `settings/public` batched `IN (...)` 读取都落在低毫秒级，不再支持“有某条常驻业务 SQL 持续把连接窗口拉长”的判断。
- 同日 System Operations 记录显示，在 `5` 分钟 autosuspend 延迟下，compute 全天持续发生成功的 `start / suspend` 交替，没有出现长时间维持 Active、不进入 suspend，或 suspend 失败持续堆积的现象。这直接否定了“当前仍存在数据库连接长时间不释放”的阻塞级结论。
- 结合 2026-05-12 已落地的两步最小治理，即 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 的非生产环境 Cron 默认门禁收紧，以及 [server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) / [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 的连接级初始化收紧，本条第三十七阶段 Postgres P1 已完成“长窗口样本复核 -> 最小治理动作 -> 可追溯关闭结论”的闭环。
- 剩余候选已回收至 backlog：请求入口组只保留“继续审计剩余显式 `initializeDB()` 调用点”这一更窄的后续方向；公开热点读链路组则继续聚焦首页 posts public list 查询对及其相邻装配路径，而不是继续把本条已关闭的 P1 主线扩写成新的全站治理。

### 已执行验证

- 长窗口证据复核：用户提供的 2026-05-14 Neon query performance 与 system operations 样本。
	- 结果：通过；最重热点已收敛为冷启动 metadata introspection 与首页 posts public list 查询对，compute 活跃窗口恢复为正常 `start / suspend` 交替。
- 既有实现验证：沿用 2026-05-12 已通过的定向测试与类型检查。
	- 结果：通过；`pnpm exec vitest run server/plugins/task-scheduler.test.ts`、`pnpm exec vitest run tests/server/middleware/db-ready.test.ts tests/server/middleware/auth-optional-session.test.ts` 与 `pnpm exec nuxt typecheck` 已在前一轮实现收口中全部通过。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：当前仍能在冷启动窗口看到 TypeORM metadata introspection 的一次性成本，首页 posts public list 查询对也仍是下一轮最值得继续瘦身的业务组；但这些都已退回 backlog，不再阻塞第三十七阶段这条 P1 主线关闭。

### 未覆盖边界

- 本轮关闭依据的是托管侧 Neon 长窗口观测，不是同窗口的自建 `pg_stat_statements` 采样；它足以回答“是否仍存在长期不释放连接”的问题，但不等价于对所有 SQL 指纹做更细的 rows / calls / plan 级分析。
- 本轮不会移除首次真正需要数据库时出现的初始化探测成本，也不意味着首页 posts public list 查询对已经完成下一阶段瘦身；如果后续样本重新出现异常长活跃窗口，仍需按 backlog 候选重新切一轮更小的实现或采样任务。

## 2026-05-12 第三十七阶段 Postgres P1 长窗口复核：自部署 Cron 与请求入口连接级初始化收紧

### 范围

- 目标：基于用户提供的 Neon compute operations 与 Top SQL 长窗口样本，先解释“为何数据库连接窗口被持续拉长”，并只落地一组最小、可回退的治理切片。
- 本轮覆盖：[server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts)、[server/plugins/task-scheduler.test.ts](../../server/plugins/task-scheduler.test.ts)、[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts)、[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts)、[tests/server/middleware/db-ready.test.ts](../../tests/server/middleware/db-ready.test.ts)、[tests/server/middleware/auth-optional-session.test.ts](../../tests/server/middleware/auth-optional-session.test.ts)、[docs/plan/todo.md](../../docs/plan/todo.md)、[docs/guide/variables.md](../../docs/guide/variables.md) 与 [docs/guide/deploy.md](../../docs/guide/deploy.md)。
- 非目标：不并行扩写为全站数据库连接池重构，不在同一轮同时改动更多公开热点读链路，也不继续拆分 `initializeDB()` 的维护职责。

### 实施结论

- 长窗口样本里最重的一组 SQL 以 TypeORM metadata introspection、`information_schema` / `pg_catalog` 探测与 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` 为主，说明压力核心更接近“初始化 / 维护链”而不是某条公开读接口的普通查询体量。
- 结合 compute operations 的时间节奏复核后，本轮首先锁定到 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts)：自部署 Cron 默认主任务频率为每 `5` 分钟一次，且过去在非 serverless 环境下会直接注册。对于“本地 dev 连远端 Neon”这类场景，这会持续周期性唤醒数据库，并把 compute 活跃窗口拉长，外观上接近“连接一直没有释放”。
- 当前已落地最小治理：内置 Cron 改为“仅生产环境自动注册；开发/测试环境需要显式设置 `ENABLE_CRON_JOB=true` 才启用”。这样不会影响生产调度闭环，但能直接切断本地联调场景下默认的 `5` 分钟数据库唤醒源。
- 随后沿请求入口组继续审计后，[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) 与 [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 已从完整 `initializeDB()` 收紧为 `initializeDatabaseConnection()`：请求级数据库预热与可选 session 解析现在只确保连接与实体元数据可用，不再把 `syncAdminRoles()` 与 `repairLegacyPostVersionRecords()` 维护链拖进公开请求首跳。
- 这次收紧与 [server/database/index.ts](../../server/database/index.ts) 现有职责注释保持一致：连接级初始化继续服务安装态探针、请求预热与鉴权自保，完整 `initializeDB()` 仍由定时任务、seed 插件或显式调用入口承担维护型动作，不会因为这轮请求级收紧而变成死路径。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run server/plugins/task-scheduler.test.ts`
	- 结果：通过；`4` 个测试全部通过，覆盖生产默认启用、非生产默认跳过、serverless 禁用与生产 eager health check 四条边界。
- 定向 Vitest：`pnpm exec vitest run tests/server/middleware/db-ready.test.ts tests/server/middleware/auth-optional-session.test.ts`
	- 结果：通过；`13` 个测试全部通过，确认请求级数据库预热与可选 session 解析已经改为连接级初始化，且不再误触完整 `initializeDB()`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已切断一个高概率周期性唤醒源，并收紧了当前已确认的请求入口误触面；但是否还存在其它首次请求或后台路径会把完整 `initializeDB()` 维护链放大到长窗口样本中，仍需下一轮 live sample 继续确认。

### 未覆盖边界

- 本轮没有改动 PostgreSQL pool 的 `idleTimeoutMillis` / `maxLifetimeSeconds` 等连接池参数，也没有引入 `DataSource.destroy()` 生命周期钩子；如果后续证据表明仍存在非 Cron 场景的活跃连接拖尾，需要再单独评估这条切片。
- 本轮没有继续改造 `initializeDatabaseConnection()` 与 `initializeDB()` 的职责边界，因此 Top SQL 中与完整初始化维护链相关的 metadata introspection 仍可能在首次真正需要数据库的路径上出现，但不会再被本地默认 Cron 或当前这两条请求级中间件重复放大。

## 2026-05-06 第三十五阶段 Postgres P0 首页 popular posts 显式 `limit` 查库收敛关闭

### 范围

- 目标：完成第三十五阶段 `Postgres 热点公开读链路与数据库唤醒继续治理 (P0)` 当前这条首页 popular posts 子切片收口，并补齐数据库级 live sample 证据后正式关闭 todo。
- 本轮覆盖：[server/api/posts/index.get.ts](../../server/api/posts/index.get.ts)、[tests/server/api/posts/index.get.test.ts](../../tests/server/api/posts/index.get.test.ts)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不并行扩写到其它公开读链路，不把应用层 runtime cache 命中统计冒充为数据库级证据，也不继续改造首页 `posts/home` 或其它请求级数据库唤醒入口。

### 实施结论

- [server/api/posts/index.get.ts](../../server/api/posts/index.get.ts) 现已只在请求缺省 `limit` 时读取 `POSTS_PER_PAGE`；首页 popular posts 这组显式 `limit=3` 的公开列表请求不再在命中 runtime cache 之前额外读取 settings。
- 本地 PostgreSQL 17 + `pg_stat_statements` 对照样本已经补齐：工作区内临时 PostgreSQL 实例运行在 `55432` 端口，Nuxt dev 运行在 `3004` 端口；在重置统计窗口后，连续两次请求 `/api/posts?scope=public&limit=3&isPinned=false&orderBy=views&order=DESC&excludeIds=post-hot-read-01,post-hot-read-02`，数据库中只留下 `3` 条 `momei_post` 查询指纹（`calls=1`，`rows=3/3/1`，`total_ms=0.14/0.13/0.07`），未出现 `momei_setting` 查询。
- 同组缺省 `limit` 对照请求 `/api/posts?scope=public&isPinned=false&orderBy=views&order=DESC&excludeIds=post-hot-read-01,post-hot-read-02` 在同样的“重置统计窗口后连续请求 2 次”条件下，仍留下 `1` 条 `momei_setting` 查询（`calls=1`，`rows=1`，`total_ms=0.09`）以及 `2` 条 `momei_post` 查询指纹（`calls=1`，`rows=3/3`，`total_ms=0.19/0.08`）。这说明显式 `limit` 请求已经从数据库层完全移除了那次前置 settings 读取。
- 结合 [tests/server/api/posts/index.get.test.ts](../../tests/server/api/posts/index.get.test.ts) 中“显式 `limit` 不再调用 `getSetting`”的回归断言，本轮已经满足 todo 对“同范围数据库级 live sample”与“可追溯下降趋势”的关闭条件；第三十五阶段这条 Postgres P0 待办可正式关闭。

### 已执行验证

- 数据库级 live sample：本地 PostgreSQL 17 `pg_stat_statements` 对照采样。
	- 结果：通过；显式 `limit` 样本仅留下 `momei_post` 指纹，缺省 `limit` 对照额外留下 `1` 条 `momei_setting` 查询。
- 定向 Vitest：`pnpm exec vitest run tests/server/api/posts/index.get.test.ts`
	- 结果：通过；`19` 个测试全部通过。
- Nuxt typecheck：`pnpm exec nuxt typecheck`
	- 结果：通过；无新增类型错误输出。
- Markdown lint：`pnpm exec lint-md docs/plan/todo.md docs/reports/regression/current.md`
	- 结果：通过；无输出。
- 受影响文件诊断：`get_errors(server/api/posts/index.get.ts, tests/server/api/posts/index.get.test.ts, docs/plan/todo.md, docs/reports/regression/current.md)`
	- 结果：通过；无新增诊断。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker / warning；代码、测试、todo 关闭记录与本地 `pg_stat_statements` 对照样本一致，足以支撑这条第三十五阶段 Postgres P0 待办正式关闭。

### 未覆盖边界

- 本轮本地样本属于短窗口控制实验，足以证明“显式 `limit` 请求已移除前置 settings 查库”，但不等价于后续阶段其它 Postgres 主线切片可直接复用本结论；若未来继续推进新的公开热读链路，仍需按新范围重新补 live sample。
- 当前关闭只覆盖首页 popular posts 经过 `/api/posts` 的前置 settings 查库问题，不等于首页 `posts/home`、更宽的 public list 查询对或其它数据库唤醒入口已经全部完成后续治理。

## 2026-05-06 第三十四阶段 coverage 80%+ 冲刺达成

### 范围

- 目标：在 2026-05-06 全量 checkpoint lines `79.57%` 的基础上，继续通过高 ROI 后台 settings / editor 切片把全仓覆盖率正式推过 `80%`。
- 起点基线：全量 `pnpm test:coverage` 为 statements `79.56%` / branches `66.78%` / functions `78.19%` / lines `79.57%`；基于最新 `coverage/coverage-final.json` 估算，还差约 `124` 条可执行语句覆盖才能越过 `80%`。
- 本轮覆盖：[components/admin/settings/external-feed-sources-editor.vue](../../components/admin/settings/external-feed-sources-editor.vue)、[components/admin/settings/theme-save-dialog.vue](../../components/admin/settings/theme-save-dialog.vue)，并以此前已完成的 [components/admin/settings/general-settings.vue](../../components/admin/settings/general-settings.vue)、[components/admin/settings/ai-quota-policies-editor.vue](../../components/admin/settings/ai-quota-policies-editor.vue)、[components/admin/settings/ai-alert-thresholds-editor.vue](../../components/admin/settings/ai-alert-thresholds-editor.vue)、[components/admin/settings/ai-cost-factors-editor.vue](../../components/admin/settings/ai-cost-factors-editor.vue) 与 [components/admin/settings/commercial-settings.vue](../../components/admin/settings/commercial-settings.vue) 作为同一轮 sprint 的已验证增量基础。
- 非目标：本轮不转向 [components/admin/settings/agreements-settings.vue](../../components/admin/settings/agreements-settings.vue)、[components/admin/settings/admin-notification-settings.vue](../../components/admin/settings/admin-notification-settings.vue) 或 [components/admin/settings/setting-audit-log-list.vue](../../components/admin/settings/setting-audit-log-list.vue) 这类更重的异步大面，只做足以过线的最后组合切片。

### 实施结论

- 最新两块切片的局部 coverage 已稳定过高线： [components/admin/settings/external-feed-sources-editor.vue](../../components/admin/settings/external-feed-sources-editor.vue) 达到 statements `94.40%` / branches `77.96%` / functions `100%` / lines `94.11%`；[components/admin/settings/theme-save-dialog.vue](../../components/admin/settings/theme-save-dialog.vue) 达到 statements `93.93%` / branches `80.43%` / functions `80%` / lines `93.84%`。
- 与本轮前序已完成切片叠加后，coverage 冲刺的 settings / editor 收口面已包含 [components/admin/settings/general-settings.vue](../../components/admin/settings/general-settings.vue) lines `91.48%`、[components/admin/settings/ai-quota-policies-editor.vue](../../components/admin/settings/ai-quota-policies-editor.vue) lines `85.61%`、[components/admin/settings/ai-alert-thresholds-editor.vue](../../components/admin/settings/ai-alert-thresholds-editor.vue) lines `94.93%`、[components/admin/settings/ai-cost-factors-editor.vue](../../components/admin/settings/ai-cost-factors-editor.vue) lines `93.75%`、[components/admin/settings/commercial-settings.vue](../../components/admin/settings/commercial-settings.vue) lines `96.22%`、[components/admin/settings/external-feed-sources-editor.vue](../../components/admin/settings/external-feed-sources-editor.vue) lines `94.11%` 与 [components/admin/settings/theme-save-dialog.vue](../../components/admin/settings/theme-save-dialog.vue) lines `93.84%`。
- 最终全量 `pnpm test:coverage` 已正式过线：`460` 个测试文件中 `459` 通过、`1` 跳过；`3511` 个测试中 `3510` 通过、`1` 跳过；All files 为 statements `80.03%` / branches `67.18%` / functions `78.99%` / lines `80.05%`。
- 这意味着第三十四阶段 `测试覆盖率冲刺 80%+ (P0)` 已从“阶段守住 78%”推进到“正式越过 80%”，条目可以关闭；后续若继续治理，重点应转向更大体量的后台设置和编辑器文件，而不是继续在已过高线的小面上补边角。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run components/admin/settings/external-feed-sources-editor.test.ts`
	- 结果：通过；`4` 个测试全部通过。
- 定向 coverage：`pnpm exec vitest run components/admin/settings/external-feed-sources-editor.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/settings/external-feed-sources-editor.vue`
	- 结果：通过；[components/admin/settings/external-feed-sources-editor.vue](../../components/admin/settings/external-feed-sources-editor.vue) 为 statements `94.40%` / branches `77.96%` / functions `100%` / lines `94.11%`。
- 定向 Vitest：`pnpm exec vitest run components/admin/settings/theme-save-dialog.test.ts`
	- 结果：通过；`4` 个测试全部通过。
- 定向 coverage：`pnpm exec vitest run components/admin/settings/theme-save-dialog.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/settings/theme-save-dialog.vue`
	- 结果：通过；[components/admin/settings/theme-save-dialog.vue](../../components/admin/settings/theme-save-dialog.vue) 为 statements `93.93%` / branches `80.43%` / functions `80%` / lines `93.84%`。
- 定向 ESLint：`pnpm exec eslint components/admin/settings/external-feed-sources-editor.test.ts components/admin/settings/theme-save-dialog.test.ts`
	- 结果：通过；无输出。
- 受影响文件诊断：`get_errors(external-feed-sources-editor.test.ts, theme-save-dialog.test.ts)`
	- 结果：通过；无新增诊断。
- 全量 checkpoint：`pnpm test:coverage`
	- 结果：通过；All files 达到 statements `80.03%` / branches `67.18%` / functions `78.99%` / lines `80.05%`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：当前全仓 lines 已越过 `80%`，但 branches 与 functions 仍明显低于 lines；coverage 主线已完成，不等于后台设置与编辑器目录的整体低覆盖热点已经全部清偿。

### 未覆盖边界

- [components/admin/settings/agreements-settings.vue](../../components/admin/settings/agreements-settings.vue)、[components/admin/settings/admin-notification-settings.vue](../../components/admin/settings/admin-notification-settings.vue) 与 [components/admin/settings/setting-audit-log-list.vue](../../components/admin/settings/setting-audit-log-list.vue) 仍是 admin/settings 下最明显的低覆盖热点，后续若继续提升 coverage，这三块应优先重新排 ROI。
- 当前全量过线主要依赖高 ROI settings / editor 切片组合；后台 posts editor、大型主题配置与若干 `0%` 管理端组件仍然存在，不属于本轮“冲过 80%”的必要收口范围。

## 2026-05-05 第三十四阶段 coverage 80%+ 冲刺续推：ai-settings 切片

### 范围

- 目标：继续推进第三十四阶段 `测试覆盖率冲刺 80%+ (P0)`，先在已有测试基座的后台 settings 组件里拿下一块高 ROI 条件渲染切片，而不是立刻重跑全量 coverage。
- 当前全仓基线：以 2026-05-05 用户提供的最新全量 `pnpm test:coverage` 输出为准，All files lines `78.19%`，距离 `80%` 还差 `1.81` 个百分点。
- 本轮覆盖：[components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 与 [components/admin/settings/ai-settings.test.ts](../../components/admin/settings/ai-settings.test.ts)。
- 非目标：本轮不重跑全量 `pnpm test:coverage`，不并行扩写第二个 settings 组件，也不把当前切片包装成“80%+ 已达成”。

### 实施结论

- [components/admin/settings/ai-settings.test.ts](../../components/admin/settings/ai-settings.test.ts) 已从单条 happy path 扩到 `3` 条风险定向用例，分别覆盖 Google/Gemini + Volcengine 组合路径、SiliconFlow ASR + 标准 TTS 路径，以及 TTS-only Volcengine 共享凭证路径。
- 本轮测试桩同步补齐 `v-model` update 事件与 `Select` option 渲染，使 provider 切换、密码输入、普通输入和开关收起都能命中真实分支，而不是只做静态存在性断言。
- 定向 coverage 结果显示 [components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 已从 lines `44.28%` / branches `79.26%` 提升到 lines `81.42%` / branches `100%`，证明这块 Phase 34 settings 表单切片具备明确 ROI。
- 当前全仓是否已越过 `80%` 仍以“下一次全量 checkpoint” 为唯一事实源；本轮先把高 ROI 组件切片抬稳，再决定下一批候选，避免每补一个文件就重跑全量 coverage。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run components/admin/settings/ai-settings.test.ts`
	- 结果：通过；`3` 个测试全部通过。
- 定向 coverage（初始基线）：`pnpm exec vitest run components/admin/settings/ai-settings.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/settings/ai-settings.vue`
	- 结果：通过；[components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 为 lines `44.28%` / branches `79.26%`。
- 定向 coverage（当前 checkpoint）：`pnpm exec vitest run components/admin/settings/ai-settings.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/settings/ai-settings.vue`
	- 结果：通过；[components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 为 statements `81.69%` / branches `100%` / functions `79.36%` / lines `81.42%`。
- 定向 ESLint：`pnpm exec eslint components/admin/settings/ai-settings.test.ts`
	- 结果：通过；无输出。
- 受影响文件诊断：`get_errors(components/admin/settings/ai-settings.test.ts)`
	- 结果：通过；无新增诊断。

### Review Gate

- 结论：Pass（本轮切片）
- 问题分级：warning
- 主要问题：当前通过结论只覆盖 [components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 这一局部切片；全仓 coverage 仍停留在 2026-05-05 的 `78.19%` 基线口径，尚未刷新下一次全量 checkpoint。

### 未覆盖边界

- 本轮没有刷新全仓 `pnpm test:coverage`，因此不能把 [components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 的局部提升直接换算成新的全仓 lines 百分比。
- [components/admin/settings/ai-settings.vue](../../components/admin/settings/ai-settings.vue) 仍有少量未命中的图像模型字段与早段输入绑定，但已越过 `80%` 守线；下一轮更适合转向其它已有测试基座但整体 coverage 更低的后台 settings / admin 组件，而不是继续在同一文件里做边际收益递减的补测。
- 下一次全量 checkpoint 的触发条件保持不变：再累计 `1 - 2` 个高 ROI 切片后，统一重跑 `pnpm test:coverage`，用全仓 lines 结果判断是否真正逼近或越过 `80%`。

## 2026-05-05 第三十四阶段 `周期性回归执行 (P1)` 关闭

### 范围

- 目标：执行真实的 `pnpm regression:phase-close` 阶段关闭回归，并把阻塞本轮放行的依赖安全、导航 E2E、性能预算与回归窗口治理全部收口。
- 本轮覆盖：[package.json](../../package.json)、[pnpm-lock.yaml](../../pnpm-lock.yaml)、[tests/e2e/navigation.e2e.test.ts](../../tests/e2e/navigation.e2e.test.ts)、[scripts/perf/check-bundle-budget.mjs](../../scripts/perf/check-bundle-budget.mjs)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md)、[docs/reports/regression/archive/index.md](../../docs/reports/regression/archive/index.md)、[docs/reports/regression/archive/2026-05-01-to-2026-05-02.md](../../docs/reports/regression/archive/2026-05-01-to-2026-05-02.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不新建另一套回归规范，不借机扩写与本轮放行无关的治理主线。

### 实施结论

- 依赖安全阻塞已解除：根仓 `axios` override 已提升到 `^1.15.2` 并刷新锁文件，`security:audit-deps` 与随后的发布前校验恢复通过。
- 导航 E2E 阻塞已解除：[tests/e2e/navigation.e2e.test.ts](../../tests/e2e/navigation.e2e.test.ts) 改为基于真实 header href + `openPath()` 的稳态导航模型，`pnpm test:e2e` 恢复为 `230 passed / 48 skipped`，`release:check:full` 恢复为 `12 / 12` 通过。
- 性能预算误判已解除：[scripts/perf/check-bundle-budget.mjs](../../scripts/perf/check-bundle-budget.mjs) 现已识别模板字符串动态 `import()`，并从 Nuxt `client.precomputed.mjs` 回填 route owner；admin-only 的 `mavon-editor` chunk 不再被计入公开 async chunk 预算，`test:perf:budget:strict` 恢复通过。
- 回归窗口阻塞已解除：2026-05-01 至 2026-05-02 的旧记录已整体滚动归档到 [docs/reports/regression/archive/2026-05-01-to-2026-05-02.md](../../docs/reports/regression/archive/2026-05-01-to-2026-05-02.md)，活动窗口压回 `214` 行、`5` 条近线记录。
- 最终 `pnpm regression:phase-close` 已完整通过；`artifacts/review-gate/2026-05-05-phase-close-regression.md` 与对应 JSON 已生成，第三十四阶段这条周期性回归 P1 可正式关闭。

### 已执行验证

- `pnpm test:perf:budget:strict`
	- 结果：通过；`maxAsyncChunkJs` 回落到 `46.46KB / 120KB`，不再命中预算上限。
- `pnpm exec lint-md docs/reports/regression/current.md docs/reports/regression/archive/index.md docs/reports/regression/archive/2026-05-01-to-2026-05-02.md`
	- 结果：通过；回归窗口与新归档分片结构合法。
- `pnpm regression:phase-close`
	- 结果：通过；`release:check:full`、`docs:check:i18n`、`test:perf:budget:strict`、`duplicate-code:check:strict` 与 `review-gate:generate:check` 全部通过，Review Gate 结论为 `Pass`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮放行建立在真实 phase-close 回归、性能预算复核、回归窗口治理与证据文件生成全部通过之上。

### 未覆盖边界

- `prIncrementJs` 仍因 `.github/perf/bundle-baseline.json` 缺少 baseline 而处于 MVP 跳过状态；当前不阻塞本轮关闭，但若后续要把性能预算从单次守线提升为增量比较，需要先补齐 baseline。
- Playwright 套件中仍有 `48` 条已设计跳过用例；本轮目标是恢复真实回归放行，不等于这些跳过场景已经被重新纳入要求执行矩阵。

## 2026-05-05 第三十四阶段 `i18n 运行时继续扩面 (P1)` 关闭

### 范围

- 目标：完成第三十四阶段 `i18n 运行时继续扩面 (P1)` 的最后一条公开页装配链路收口，并把该待办正式关闭。
- 本轮覆盖：[vitest.shared.ts](../../vitest.shared.ts)、[pages/archives/index.test.ts](../../pages/archives/index.test.ts)、[docs/reports/regression/current.md](../../docs/reports/regression/current.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不重写 [pages/archives/index.vue](../../pages/archives/index.vue) 的页面实现，不继续扩写新的公开页矩阵，也不重新处理已在前序切片中完成的 `app-footer`、`auth-card` 或 `taxonomy-post-page` 运行时命名空间问题。

### 实施结论

- 当前仓库里 [pages/archives/index.test.ts](../../pages/archives/index.test.ts) 已经具备真实翻译命中断言，会校验归档月份、文章计数文案与 raw key 泄漏；缺口只在于它尚未被纳入 `i18n:verify:runtime` 的固定运行时回归入口。
- 本轮将 [pages/archives/index.test.ts](../../pages/archives/index.test.ts) 加入 [vitest.shared.ts](../../vitest.shared.ts) 的 `i18nRuntimeTestFiles`，把 `archives` 公开页装配链路正式并入固定回归矩阵。
- 结合 2026-05-04 已完成的 `forgot-password` / `reset-password` / taxonomy RSS 与更早完成的 `app-footer`、About、Friend Links、Categories、Tags 等守线，当前待办验收条件已经满足，可正式关闭。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run --config vitest.i18n.config.ts pages/archives/index.test.ts`
	- 结果：通过；`8` 个测试全部通过，新增公开页链路已能在固定 i18n runtime 配置下稳定运行。
- 缺词 parity：`pnpm i18n:audit:missing`
	- 结果：通过；`total: 0`，所有已扫描 locale / module 仍无缺词 blocker。
- 固定运行时入口：`pnpm i18n:verify:runtime`
	- 结果：通过；`15` 个测试文件、`103` 个测试全部通过，`archives` 已被纳入固定回归入口。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮改动只扩大固定运行时测试矩阵，没有引入新的共享命名空间或页面实现风险。

### 未覆盖边界

- 本轮没有继续新增 `archives` 之外的公开页装配链路；后续若再扩面，应以新的高风险公开页或新增共享组件为单位单独切片，而不是在当前已关闭的待办上继续膨胀范围。
- `i18n:verify:runtime` 的通过结果已足够支撑本条待办关闭，但不等于未来所有新增公开页都会自动获得守线；后续新增入口仍需按相同口径显式纳入。
- 当前完整 `i18n:verify:runtime` 套件在 `friend-links` 与 `reset-password` 相关用例上仍会打印既有的 Nuxt i18n 初始化 stderr；现阶段不影响测试通过与本条待办关闭，但后续应单列治理以降低回归噪音。

## 2026-05-04 第三十四阶段 `ESLint 下一轮切片 (P1)` 关闭

### 范围

- 目标：在已确认 `composables` 子桶没有新的高 ROI `no-non-null-assertion` 生产命中后，沿 todo 的回退口径把剩余高 ROI `@typescript-eslint/no-explicit-any` 生产 composable 单文件 / 双文件切片全部收口，并关闭第三十四阶段 `ESLint 下一轮切片 (P1)`。
- 本轮覆盖：[composables/use-upload.ts](../../composables/use-upload.ts)、[composables/use-asr-task.ts](../../composables/use-asr-task.ts)、[composables/use-admin-ai.ts](../../composables/use-admin-ai.ts)、[composables/use-admin-i18n.ts](../../composables/use-admin-i18n.ts)、[composables/use-post-editor-auto-save.ts](../../composables/use-post-editor-auto-save.ts)、[composables/use-onboarding.ts](../../composables/use-onboarding.ts)、[composables/use-post-editor-page.helpers.ts](../../composables/use-post-editor-page.helpers.ts)、[composables/use-tts-volcengine-direct.ts](../../composables/use-tts-volcengine-direct.ts)、[composables/use-post-editor-ai.ts](../../composables/use-post-editor-ai.ts)、[composables/use-post-editor-io.ts](../../composables/use-post-editor-io.ts)、[eslint.config.js](../../eslint.config.js)、[docs/design/governance/eslint-type-debt-tightening.md](../../docs/design/governance/eslint-type-debt-tightening.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把规则外溢到测试文件，不并行开启 `no-unsafe-*`、`prefer-nullish-coalescing` 或更宽的 editor / composables 目录级提级。

### 实施结论

- 本轮把回退主线剩余的高 ROI 生产 composable 显式 `any` 全部收敛为本地接口、窄 payload 类型、`unknown` 错误解析 helper 或更精确的函数签名，没有新增新的共享抽象层，也没有扩写为目录级规则提级。
- 具体收口点包括：上传 / TTS / ASR 链路的错误对象读取，后台 AI / i18n / onboarding 的局部接口约束，编辑器自动保存草稿类型，`use-post-editor-ai.ts` 的标题建议 / 翻译响应类型，以及 `use-post-editor-io.ts` 的 frontmatter `unknown` 解析与分类匹配守卫。
- [eslint.config.js](../../eslint.config.js) 已把这批 production composable 全部纳入既有 `noExplicitAnyFiles` 聚合 override。复核后，`composables/*.ts` 范围内残余 `any` 已只存在于测试文件，不再存在新的生产源码阻塞点，因此第三十四阶段这条 ESLint P1 待办可正式关闭。

### 已执行验证

- 定向 ESLint：
	`pnpm exec eslint composables/use-upload.ts composables/use-asr-task.ts composables/use-admin-ai.ts composables/use-admin-i18n.ts composables/use-post-editor-auto-save.ts composables/use-onboarding.ts composables/use-post-editor-page.helpers.ts composables/use-tts-volcengine-direct.ts eslint.config.js --max-warnings 0`
	`pnpm exec eslint composables/use-post-editor-ai.ts composables/use-post-editor-io.ts eslint.config.js --max-warnings 0`
	- 结果：通过；新纳入切片的 production composable 与配置文件均无新增 warning / error。
- 同级 Vitest：
	`pnpm exec vitest run composables/use-upload.test.ts composables/use-asr-task.test.ts composables/use-admin-ai.test.ts composables/use-admin-i18n.test.ts composables/use-post-editor-auto-save.test.ts composables/use-onboarding.test.ts composables/use-post-editor-page.helpers.test.ts composables/use-post-editor-io.test.ts`
	- 结果：通过；`8` 个测试文件、`87` 个测试全部通过。
	`pnpm exec vitest run composables/use-post-editor-ai.test.ts composables/use-tts-volcengine-direct.test.ts`
	- 结果：通过；新增 focused test `2` 个文件、`4` 个测试全部通过。
- Nuxt typecheck：`pnpm exec nuxt typecheck`
	- 结果：通过；本轮局部类型收窄与 `header.titleOp ?? null` 修正后未出现新的类型错误。
- 根仓 lint：`npm run lint`
	- 结果：通过；根仓 `eslint . --fix --max-warnings 10` 与 `packages/*` lint 均通过。
- Markdown 校验：`pnpm exec lint-md docs/design/governance/eslint-type-debt-tightening.md docs/reports/regression/current.md docs/plan/todo.md`
	- 结果：通过；治理设计、回归窗口与 todo 文档均通过 markdown lint。
- 受影响文件诊断：`get_errors`
	- 结果：通过；本轮 touched composable 与 [eslint.config.js](../../eslint.config.js) 无新增诊断。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker。当前关闭依据不是“整仓所有 ESLint 技术债清零”，而是第三十四阶段 todo 中这条主线要求的 `composables` 子桶复核 + 回退单文件 `no-explicit-any` 切片已经全部完成，且验证链路完整。

### 未覆盖边界

- 当前剩余 `any` 命中主要在测试文件与刻意保留的 mock / 非法输入断言，不属于本条 production composable 治理范围。
- 更宽的 editor 规则提级、`no-unsafe-*`、`prefer-nullish-coalescing` 与其它目录级规则治理仍是后续独立候选，不应混入本次已关闭的第三十四阶段 ESLint 切片待办。

## 2026-05-04 `use-tts-task.ts` `no-explicit-any` 回退切片

### 范围

- 目标：推进第三十四阶段 `ESLint 下一轮切片 (P1)` 时，先复核 `composables` 子桶当前没有新的 `no-non-null-assertion` 生产命中可继续上收，再按 todo 里的回退口径完成 `composables/use-tts-task.ts` 单文件 `@typescript-eslint/no-explicit-any` 切片。
- 本轮覆盖：[composables/use-tts-task.ts](../../composables/use-tts-task.ts)、[composables/use-tts-task.test.ts](../../composables/use-tts-task.test.ts)、[eslint.config.js](../../eslint.config.js)、[docs/design/governance/eslint-type-debt-tightening.md](../../docs/design/governance/eslint-type-debt-tightening.md) 与 [docs/plan/todo.md](../../docs/plan/todo.md)。
- 非目标：不把规则扩到整个 `composables/**`，不并行开启新的 `no-non-null-assertion` 或 `no-unsafe-*` 切片，也不把其它 TTS / upload composable 打包成多文件联动治理。

### 实施结论

- 结合既有 [2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md) 中 `composables` 子桶收口记录与当前生产源码命中分布，`no-non-null-assertion` 没有新的单文件高 ROI 候选，因此本轮按既定回退方案改做 `no-explicit-any` 单文件切片。
- [composables/use-tts-task.ts](../../composables/use-tts-task.ts) 当前生产源码中的显式 `any` 共有 `2` 处，分别位于任务状态轮询的 `$fetch<any>` 与错误回退 `catch (e: any)`，且已有同级测试，符合“单文件、可回滚、验证便宜”的准入条件。
- 本轮将任务轮询响应收窄为本地 `TTSTaskStatusPayload` / `TTSTaskResultPayload`，并复用 [types/ai.ts](../../types/ai.ts) 中的 `AITaskStatus` 作为状态事实源；音频 URL 解析与错误消息提取改为局部 helper，不再依赖显式 `any`。
- [eslint.config.js](../../eslint.config.js) 已把 `composables/use-tts-task.ts` 并入既有的 `noExplicitAnyFiles` 聚合列表，继续维持“单文件 + 单条 override”的回滚边界。

### 已执行验证

- 定向 Vitest：`pnpm exec vitest run composables/use-tts-task.test.ts`
	- 结果：通过；`5` 个测试全部通过，TTS 任务轮询、完成态音频 URL 解析与失败态错误回退行为保持稳定。
- 定向 ESLint：`pnpm exec eslint composables/use-tts-task.ts eslint.config.js --max-warnings 0`
	- 结果：通过；受影响文件无新增 warning / error。
- 受影响文件诊断：`get_errors(use-tts-task.ts, eslint.config.js)`
	- 结果：通过；两文件均无新增诊断。
- 根仓类型检查：`nuxt typecheck targeted`
	- 结果：失败，但命中均为本轮范围外的既有测试文件；[composables/use-tts-task.ts](../../composables/use-tts-task.ts) 与 [eslint.config.js](../../eslint.config.js) 自身无新增错误。
- 文档构建：`pnpm docs:build`
	- 结果：通过；文档站可完成 build，仅保留既有的 VitePress / Rolldown warning，不影响本轮治理记录落盘。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮切片本身无 blocker，单测、定向 ESLint 与文件级诊断均通过；当前只保留根仓 `nuxt typecheck` 的既有测试文件错误作为仓内背景噪音，不影响本轮单文件治理放行。

### 未覆盖边界

- 本轮没有把 `@typescript-eslint/no-explicit-any` 外溢到其它 TTS / upload composable；[composables/use-upload.ts](../../composables/use-upload.ts)、[composables/use-tts-volcengine-direct.ts](../../composables/use-tts-volcengine-direct.ts) 与其它轮询链路仍保留为后续单文件 / 双文件候选。
- `no-non-null-assertion` 在 `composables` 子桶没有新的单文件候选不等于整条主线已经结束；后续若再推进，仍应优先保持“单一 composable / 单一链路”的切片策略。

## 2026-05-04 第三十四阶段 coverage 80%+ 冲刺收口线达成

### 范围

- 目标：在第三十四阶段 `测试覆盖率冲刺 80%+ (P0)` 中，先把阶段收口线稳定推过 `>= 78%`，不再停留于局部定向 coverage，而是以全量 `pnpm test:coverage` 的 lines 结果作为唯一放行口径。
- 起点基线：沿用本窗口首轮记录的全仓基线，lines `75.28%`；本轮推进过程中曾依次复跑到 `76.52%`、`76.91%`、`77.22%`、`77.48%`，最后继续补两块低风险高 ROI 后再做最终全量复跑。
- 本轮覆盖：公开读链路失败路径、通知/商业/安全等用户 settings 面板、后台简单 settings 表单、后台友链管理 composable 与短链服务等高 ROI 切片。
- 非目标：本轮只要求达成 `>= 78%` 阶段收口线，不把条目直接扩写成“已达成 80%+”；仓内仍保留若干 0% 或低覆盖的大体量后台编辑器文件，暂不在本轮硬啃。

### 实施结论

- 公开读链路与轻量公共组件侧，已补齐 [components/ad-placement.test.ts](../../components/ad-placement.test.ts)、[components/rss-icon.test.ts](../../components/rss-icon.test.ts) 与 [pages/benefits.behavior.test.ts](../../pages/benefits.behavior.test.ts)，把广告位装配、SVG 图标与 benefits 页提交失败路径纳入守线。
- 用户侧 settings / notifications / commercial / security 切片，已新增并稳定通过 [components/settings/settings-security.test.ts](../../components/settings/settings-security.test.ts)、[components/settings/settings-api-keys.test.ts](../../components/settings/settings-api-keys.test.ts)、[components/settings/settings-notifications.test.ts](../../components/settings/settings-notifications.test.ts)、[components/settings/settings-commercial.test.ts](../../components/settings/settings-commercial.test.ts) 与 [components/settings/notification-history-list.test.ts](../../components/settings/notification-history-list.test.ts)。
- 后台简单 settings 表单继续作为低风险高 ROI 补量面，已新增并通过 [components/admin/settings/auth-settings.test.ts](../../components/admin/settings/auth-settings.test.ts)、[components/admin/settings/security-settings.test.ts](../../components/admin/settings/security-settings.test.ts)、[components/admin/settings/limits-settings.test.ts](../../components/admin/settings/limits-settings.test.ts)、[components/admin/settings/storage-settings.test.ts](../../components/admin/settings/storage-settings.test.ts)、[components/admin/settings/email-settings.test.ts](../../components/admin/settings/email-settings.test.ts) 与 [components/admin/settings/analytics-settings.test.ts](../../components/admin/settings/analytics-settings.test.ts)。
- 较大 ROI 切片方面，已补齐 [composables/use-admin-friend-links-page.test.ts](../../composables/use-admin-friend-links-page.test.ts) 与 [server/services/link.test.ts](../../server/services/link.test.ts)，分别回收后台友链管理状态流与短链服务 DB 路径的大块缺口。
- 最终全量 coverage 已稳定过线：All files statements `78.01%` / branches `65.32%` / functions `74.17%` / lines `78.06%`。这说明第三十四阶段 coverage 冲刺的阶段收口线已经达成，后续若继续推进，目标应从“保 78”切换为“继续冲 80+”。
- 方法论沉淀已完成：本轮已将“先估算缺口、逐文件定向验证、累计后再跑全量 checkpoint、过程持续写回回归窗口”的 coverage 冲刺口径回写到 [docs/standards/testing.md](../../standards/testing.md)，后续同类治理不再只依赖口头约定。

### 已执行验证

- `pnpm exec vitest run components/admin/settings/email-settings.test.ts components/admin/settings/analytics-settings.test.ts`
	- 结果：通过；`2` 个文件、`2` 个测试全部通过。
- `pnpm exec eslint components/admin/settings/email-settings.test.ts components/admin/settings/analytics-settings.test.ts`
	- 结果：通过；无输出。
- `pnpm test:coverage`
	- 结果：通过；`451` 个测试文件通过、`1` 个跳过；`3482` 个测试通过、`1` 个跳过；All files 为 statements `78.01%` / branches `65.32%` / functions `74.17%` / lines `78.06%`。

### Review Gate

- 结论：Pass
- 问题分级：warning
- 主要问题：本轮已经达成 `>= 78%` 阶段收口线，但 Todo 条目标题仍是 `80%+` 冲刺，因此当前只能视为阶段目标达成，不等于整个 coverage 治理条目已经完成；若后续继续冲 `80%+`，应优先转向高体量低覆盖后台编辑器或 composable，而不是继续在个位数增益的小文件上摊薄时间。

### 未覆盖边界

- 当前全仓 coverage 已过 `78%`，但距离 `80%+` 仍有明显空间；[components/admin/settings/site-settings.vue](../../components/admin/settings/site-settings.vue)、[components/admin/settings/cache-settings.vue](../../components/admin/settings/cache-settings.vue)、后台 posts editor 相关大文件仍是下一批高 ROI 候选。
- 根仓 `nuxt typecheck` 仍存在本轮范围外的既有问题，因此本条回归记录只把“本轮新增测试文件局部 lint 通过 + 全量 coverage 过线”作为放行证据，不把整仓 merge-ready 与本条混为一谈。

## 2026-05-04 第三十四阶段 coverage 80%+ 冲刺首轮推进

### 范围

- 目标：启动第三十四阶段 `测试覆盖率冲刺 80%+ (P0)`，先做基线缺口量化，再只挑“已有测试基础、贴近当前待办风险、可做定向验证”的切片推进，避免一开始就铺向全仓低价值补测。
- 当前基线：以 2026-05-04 全量 `pnpm test:coverage` 输出为准，lines `75.28%`。按现有总代码行数估算，达到 `78%` 还约差 `625` 行覆盖，达到 `80%` 还约差 `1085` 行覆盖。
- 本轮覆盖：`composables/use-auth-session.test.ts`（认证链路 hydration + 生命周期守线）与 `components/admin/posts/post-tts-dialog.test.ts`（火山直连 TTS 成功分支）。
- 非目标：本轮不做全量 coverage 复跑，不强行碰 `0%` 大块目录，不把失败态尚未稳定的 TTS 任务创建错误映射断言留在仓库里。

### 实施结论

- 认证链路先落地到 [composables/use-auth-session.test.ts](../../composables/use-auth-session.test.ts)：新增 hydration 回填断言、生命周期注册/清理断言、focus 可见性过期刷新断言，以及刷新失败 warning 断言。
- 定向 coverage 结果显示 [composables/use-auth-session.ts](../../composables/use-auth-session.ts) 当前已达 lines `89%`，说明原先未覆盖的 hydration / lifecycle 分支已被实打实回收，适合作为“认证边角分支”组的首个已完成切片。
- TTS 新链路补到 [components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts)：新增火山直连生成 + confirm emit 成功路径断言，保留现有 openai 轮询路径断言。
- 定向 coverage 结果显示 [components/admin/posts/post-tts-dialog.vue](../../components/admin/posts/post-tts-dialog.vue) 当前已达 lines `84.78%`，并带动 [composables/use-post-tts-dialog.ts](../../composables/use-post-tts-dialog.ts) 达到 lines `85.21%`。这说明当前 Phase 34 TTS 分流链路的“直连成功路径”已有稳定回归守线。
- TTS 的“任务创建失败 -> 可见错误映射”断言在组件层连续 3 次局部修正后仍未稳定打穿，因此本轮按最小风险原则回退该测试，不把不稳定断言留在仓库里；后续若继续补这一支，优先改走 composable 级定向测试，而不是继续在组件文件里来回试探。

### 已执行验证

- `pnpm exec vitest run composables/use-auth-session.test.ts`
	- 结果：通过；`9` 个测试全部通过。
- `pnpm exec vitest run composables/use-auth-session.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=composables/use-auth-session.ts`
	- 结果：通过；[composables/use-auth-session.ts](../../composables/use-auth-session.ts) 为 statements `88.78%` / branches `72.22%` / functions `96.29%` / lines `89%`。
- `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts`
	- 结果：通过；`3` 个测试全部通过。
- `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts --coverage.enabled=true --coverage.provider=v8 --coverage.include=components/admin/posts/post-tts-dialog.vue --coverage.include=composables/use-post-tts-dialog.ts`
	- 结果：通过；[components/admin/posts/post-tts-dialog.vue](../../components/admin/posts/post-tts-dialog.vue) 为 lines `84.78%`，[composables/use-post-tts-dialog.ts](../../composables/use-post-tts-dialog.ts) 为 lines `85.21%`。
- 编辑器诊断复核
	- 结果：通过；受影响测试文件无新增诊断。

### Review Gate

- 结论：Pass（本轮切片）
- 问题分级：warning
- 主要问题：当前只完成了 coverage 冲刺的首轮切片，尚未复跑全仓 coverage，因此不能用本轮局部结果替代阶段基线；TTS 失败态映射断言仍是已知候选，但未保留不稳定实现。

### 未覆盖边界

- 全仓 coverage 仍停留在 2026-05-04 的 `75.28%` 基线口径，本轮只做了局部切片验证，尚未刷新阶段级总线。
- `80%+` 冲刺距离仍然较大，当前应继续优先命中三类高 ROI 区域：认证边角分支剩余切片、热点读链路失败路径、已有测试基础但 coverage 仍偏低的 Phase 33/34 共享组件。
- 下一轮优先候选：`pages/posts/[id].test.ts` 或 `tests/server/api/posts/access-error-mapping.test.ts` 所在的公开读链路失败态，以及缺少专门 composable 测试的 `use-post-tts-dialog.ts` 失败映射分支。


## 近线窗口外历史入口

- 2026-05-01 至 2026-05-02 的第三十二阶段收口与阶段切片记录已滚动归档到 [archive/2026-05-01-to-2026-05-02.md](./archive/2026-05-01-to-2026-05-02.md)。
- 2026-04-21 至 2026-05-01 的第三十/三十一阶段回归记录（治理切片 + 归档复核）已整体迁移合并到 [archive/2026-04-21-to-2026-05-01.md](./archive/2026-04-21-to-2026-05-01.md)。
