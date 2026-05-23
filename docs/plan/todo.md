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

### 第四十阶段：发布前守护与 TypeORM 升级评估收口（进行中）

1. [ ] **CI 前置守护脚本接入首轮落地 (P0)**
	- 目标：在正式执行主命令前增加统一 pre-check，失败即阻断，warning 可配置。
	- 最小验收：release/test/docker 三条 workflow 在执行主体前都调用同一守护入口；至少覆盖依赖风险、关键脚本存在性、必要环境检查。

2. [ ] **发布链路最小回归闸门收紧 (P0)**
	- 目标：把已有 release:check / regression 脚本编排成可复用、可复盘的固定顺序。
	- 最小验收：失败日志可直接定位到守护子项；本地与 CI 的执行顺序一致。

3. [ ] **文档证据自动回填 (P1)**
	- 目标：将 pre-check 与回归结果自动沉淀到活动回归窗口文档模板。
	- 最小验收：每次主流程后能生成一条标准化证据记录，减少人工补录。

4. [ ] **守护策略分级（error/warn）治理 (P1)**
	- 目标：把阻断项和提醒项配置化，避免 CI 因非关键 warning 误阻断。
	- 最小验收：策略表可读、可审计，新增规则不需要改 workflow 结构。

5. [ ] **依赖风险日常任务与发布前守护口径对齐 (P2)**
	- 目标：daily 风险巡检与发布前一次性校验口径统一，避免双标。
	- 最小验收：同一类风险在 daily 与 release 前的结论一致，只有时机差异。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
