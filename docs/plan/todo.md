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
- [ ] 冻结 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 的 installation state 探测边界，明确哪些路径只需要安装态、哪些路径才必须等待完整 `initializeDB()`。
- [ ] 为数据库初始化与首请求冷路径补齐分阶段耗时口径，并把事实源统一沉淀到 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md) 与 `artifacts/nuxt-*-performance.json`。
- [ ] 针对 `Server built -> Build complete` 长尾完成一轮 Nitro / `.output/server` 写出侧剖析与首轮收敛。

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

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

