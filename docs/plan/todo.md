# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办

### 第三十七阶段：Windows 本地性能与治理链路深化 (Windows Local Performance & Governance Deepening)

**时间表**: 2026-05-11 ~ 约 1 - 2 周
**目标**: 在第三十六阶段完成运行时稳态补漏与结构治理收口后，继续以“0 个新功能 + 5 个优化”的受控组合推进下一阶段，优先解决 Windows 本地 `nuxt dev` / `nuxt build` 的可感知阻塞，同时补一轮高风险测试有效性、ESLint / 类型债窄切片、至少 3 处结构复用热点，以及 Postgres 长窗口复核闭环。
**准入说明**: 五条主线均来自 [backlog.md](./backlog.md) 的长期主线任务，已完成候选分析并正式上收；详细边界与验证矩阵见 [phase-37-plan.md](../design/governance/phase-37-plan.md)。

1. **主线：Windows 本地 Dev / Build 性能治理 (P0)**
- [x] 冻结 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 的 installation state 探测边界，明确哪些路径只需要安装态、哪些路径才必须等待完整 `initializeDB()`。
- [x] 为数据库初始化与首请求冷路径补齐分阶段耗时口径，并把事实源统一沉淀到 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md) 与 `artifacts/nuxt-*-performance.json`。
- [x] 针对 `Server built -> Build complete` 长尾完成一轮 Nitro / `.output/server` 写出侧剖析与首轮收敛。

2. **主线：测试有效性切片 (P0)**
- [ ] 围绕前端直连 TTS、AI task `estimated / actual` 口径一致性、认证退化与公开热点读链路，选择已有测试基座且回归风险最高的 `2 - 3` 组路径补失败断言或边界断言。
- [ ] 至少补一组统计一致性或失败路径回归，不把本轮退化为单纯补 coverage 数字。
- [ ] 将本轮新增测试入口纳入可复用的定向回归矩阵，并记录未覆盖边界。

3. **主线：ESLint / 类型债治理 (P1)**
- [ ] 继续按“单规则 + 单文件 / 双文件”窄切片推进，优先上收 [server/services/ai/asr.ts](../../server/services/ai/asr.ts) 的高 ROI `no-explicit-any` 收敛候选。
- [ ] 进入实现前先冻结命中清单、替代写法、回滚边界与最小验证矩阵。
- [ ] 定向 ESLint 与 `nuxt typecheck` 通过后，再记录残余债务与下一轮候选。

4. **主线：结构复用治理：至少 3 处热点收敛 (P1)**
- [ ] 在 `jscpd` 可见重复与文件内自重复中，至少完成 `3` 处热点收敛，优先处理 `pages/admin/subscribers/index.vue` vs `pages/admin/waitlist/index.vue`、`pages/admin/ad/campaigns.vue` vs `pages/admin/ad/placements.vue`、[server/utils/email/service.ts](../../server/utils/email/service.ts) 与 [components/commercial-link-manager.vue](../../components/commercial-link-manager.vue)。
- [ ] 每组抽象前先写清共享边界、收益与回滚方式，不把复杂业务逻辑伪装成通用框架。
- [ ] 复核 `pnpm duplicate-code:check` 基线不反弹，并补记结构性重复盘点结论。

5. **主线：Postgres 长窗口复核切片 (P1)**
- [ ] 补一组 `pg_stat_statements` 或等价 live sample 长窗口样本，先确认当前最耗 CPU 或最拉长连接寿命的请求组。
- [ ] 在“请求入口组”与“公开热点读链路组”中二选一推进最小治理动作，不并行扩写成全站数据库重构。
- [ ] 对照查询体量、结果集大小或连接活跃窗口给出可追溯结论，并把下一轮候选收敛回 [backlog.md](./backlog.md)。

进展记录（2026-05-12）：基于用户提供的 Neon compute operations 与 Top SQL 长窗口样本，当前已确认“连接长时间不释放”的首要放大器并不是单条业务读 SQL，而是非 serverless 环境下 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 默认每 `5` 分钟注册一次自部署 Cron；在本地 dev 直连远端 Neon 的场景里，它会周期性唤醒数据库并拉长 compute 活跃窗口。本轮已先落地两步最小治理：一是非生产环境默认不再注册内置 Cron，只有生产环境或显式设置 `ENABLE_CRON_JOB=true` 时才启用；二是请求入口组中的 [server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) 与 [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 已改为只调用 `initializeDatabaseConnection()`，不再把管理员角色同步与历史数据修复一并拉进公开请求首跳。下一轮重点转为补新的长窗口样本，确认 `5` 分钟节奏唤醒是否已经消失，并继续观察是否仍存在更深层的完整 `initializeDB()` 误触路径。

进展记录（2026-05-13）：Windows 本地 build 的首轮止血已形成可复用事实源：在 [nuxt.config.ts](../../nuxt.config.ts) 关闭 Windows 本地 `sourcemap.server` 后，`pnpm perf:nuxt:build -- --repeat=1` 单样本已降至约 `490844ms`，因此“`Server built -> Build complete` 长尾首轮收敛”已关闭；但为了避免把单样本误当成完全收口，`repeat=3` 中位数验证仍保留在性能文档与后续观察项中。dev 侧则继续保持进行中：当前 [scripts/perf/measure-nuxt-lifecycle.mjs](../../scripts/perf/measure-nuxt-lifecycle.mjs) 已改为在 Windows 直接调用 repo-local Nuxt CLI，排除了 `pnpm exec nuxt` 缺少 shim 的假失败；[package.json](../../package.json) 中的 `dev`、`build`、`generate`、`preview`、`postinstall` 与 `typecheck` 标准脚本入口也已同步切到 repo-local Nuxt CLI，其中 `pnpm run typecheck` 已在当前环境返回 `EXITCODE=0`。同时 [server/utils/rate-limit.ts](../../server/utils/rate-limit.ts) 已把 `limiterStorage` 收敛为懒加载，避免常驻中间件顶层直接拉入存储链；[server/database/storage.ts](../../server/database/storage.ts) 也进一步改成首次访问时才创建 Redis / LRU 实例，先把 always-loaded storage 开销从模块导入路径上摘掉。最新冷启动事实源已补齐到 [artifacts/nuxt-dev-favicon-performance.json](../../artifacts/nuxt-dev-favicon-performance.json)、[artifacts/nuxt-dev-startup-baseline.json](../../artifacts/nuxt-dev-startup-baseline.json) 与 [artifacts/dev-startup-baseline-34571.log](../../artifacts/dev-startup-baseline-34571.log)：前者显示 `Local ready` 约 `24419ms`，但 `GET /favicon.ico` 在 `60000ms` 窗口内仍无响应；后者则给出了真正的成功首响基线，`/favicon.ico` 首个 `HTTP 200` 的 wall-clock 约 `502279ms`，同轮日志记录 `Nuxt Nitro server built in 426190ms`。这说明当前 Windows dev 已可成功启动并最终响应，但冷启动到首响仍约为 `8.37` 分钟，主阻塞继续落在 Nitro dev 首次服务端构建。期间试过一轮 broad ignore / reduced-surface 配置，但没有恢复首响且拉长了 `Local ready`，因此该方向已回滚并记为证伪结论；下一轮将继续围绕 always-loaded install/auth/logger/database cluster 收紧，并优先复测 `storage` 懒初始化能否缩短现有基线，而不是继续扩大路由裁剪面。

进展记录（2026-05-14）：Windows 本地 Dev / Build 性能治理 (P0) 在当前阶段已具备关闭条件。当前已把 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 的安装态探测边界冻结为“连接级初始化 + 轻量安装状态探针”：新增 [server/services/installation-probe.ts](../../server/services/installation-probe.ts) 只负责返回 `installed` / `databaseConnected`，不再复用携带环境诊断与安装向导写路径的重型 [server/services/installation.ts](../../server/services/installation.ts)。同时 [server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts)、[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts)、[server/middleware/2-log.ts](../../server/middleware/2-log.ts) 与 [server/utils/permission.ts](../../server/utils/permission.ts) 已继续把 logger / auth / database 依赖下沉到函数内懒加载，冻结了 installation state、optional session、request log 与 permission 这几条 always-loaded 边界。最新 [artifacts/nuxt-dev-favicon-performance.json](../../artifacts/nuxt-dev-favicon-performance.json) 已补齐新的分阶段时序：`Local ready` 约 `2729ms`，`Nuxt Nitro server built` 约 `44067ms`，`/favicon.ico` 首个 `HTTP 200` 约 `58549ms`、首个响应块约 `55821ms`；相较 2026-05-13 的约 `502279ms` 首响，当前已缩短约 `446s`。配合 [artifacts/nitro-resolve-probe.json](../../artifacts/nitro-resolve-probe.json) 与 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md) 的最新结论，当前剩余长尾已经从 install/auth/logger cluster 收敛为更广的 `server/api -> server/database / server/utils/permission / types/setting / utils/shared/roles` 共享图，适合作为下一阶段候选继续推进，不再阻塞本轮 P0 主线关闭。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

