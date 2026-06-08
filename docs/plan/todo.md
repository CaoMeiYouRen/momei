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

### 第四十六阶段：隐私部署收口与治理深化（进行中）

> 第四十五阶段已完成归档收口（详见 [待办事项归档](./todo-archive.md) 第四十五阶段条目）。本阶段按“1 个新功能 + 5 个优化”推进，容量控制为 6 项。

- [ ] **主线：Umami 隐私自托管分析集成 — Phase 2 部署化 (P0)**
	- 当前状态：待启动。
	- 最小验收：补齐 Umami Docker Compose 模板、部署变量说明与脚本化入口；保持与 GA4/Clarity/百度统计并行，不互相覆盖。

- [ ] **主线：ESLint / 类型债治理 — 至少 3 组窄切片 (P1)**
	- 当前状态：待启动。
	- 最小验收：至少 3 组“单规则 + 小范围”切片闭环，`pnpm governance:audit:eslint-debt` 可对照本轮清偿结果。

- [ ] **主线：结构复用治理 — 至少 3 组热点切片 (P1)**
	- 当前状态：待启动。
	- 最小验收：至少 3 组热点完成抽象与复用收敛，`pnpm duplicate-code:check` 基线不反弹。

- [ ] **主线：测试覆盖率治理 — 提升至 82% (P1)**
	- 当前状态：待启动。
	- 最小验收：全仓覆盖率达到 `82%+`，优先补齐最近新增功能与高风险链路的失败/边界断言。

- [ ] **主线：周期性回归任务 + 项目现状调研 (P0)**
	- 当前状态：待启动。
	- 最小验收：完成一次固定回归入口执行并更新 `docs/reports/regression/current.md`，同时输出下一阶段重点候选结论。

- [ ] **主线：数据库初始化脚本与文档同步 (P1)**
	- 当前状态：待启动。
	- 最小验收：完成 `database/**/init.sql` 与实体/设计文档一致性核对，更新 `database/README.md` 与部署文档的对应说明。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
