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

> 第三十八阶段已正式上收为当前执行面，具体验收标准以 [项目计划](./roadmap.md) 与 [Phase 38 执行计划](../design/governance/phase-38-plan.md) 为准。

### 第三十八阶段：分发一致性修补与热点治理续推

- [x] **第三方分发标签尾注与预览一致性修补 (P1)**
	- 验收: 仅覆盖 `B 站 / Memos` 两个渠道；`B 站` 预览、`B 站` 实际同步 payload 与 `Memos` 预览三处输出在标签尾注上保持一致。
	- 验收: 预览构造与实际分发必须复用同一条标签标准化 / 尾注拼装入口，并明确“标签尾注中的标签项去除空格后再输出”的规则。
	- 验证: 分发物料 helper / template 测试 + 实际分发 / 导出层测试；必要时补一组后台分发预览组件测试。

- [ ] **测试有效性第二轮切片 (P0)**
	- 验收: 至少完成 `3` 组高风险失败 / 边界断言，优先覆盖组件层 direct TTS 失败映射、页面级 auth degradation，以及 `settings public` 或 `friend-links` 的失败口径。
	- 验收: 其中至少 `1` 组必须覆盖用户可见错误映射，而不是只断言内部异常被抛出。
	- 验证: 定向 Vitest、受影响文件类型检查，以及本轮新增入口的定向回归矩阵记录。

- [ ] **Postgres 公开热点读链路继续瘦身 (P0)**
	- 验收: 本轮只允许推进“公开热点读链路继续瘦身”，不并行开启剩余显式 `initializeDB()` 调用点审计。
	- 验收: 至少形成一组新的 `pg_stat_statements` 或等价 live sample，对照说明目标公开读路径的 calls、rows、mean time 或网络体量存在下降趋势，并回答当前超预算为何更像公开热读问题。
	- 验证: 受影响 API 定向测试、受影响文件类型检查，以及一组 live sample 或本地等价观测记录。

- [ ] **结构复用第二轮（至少 3 处热点） (P1)**
	- 验收: 至少完成 `3` 处热点收敛，其中必须包含 `components/commercial-link-manager.vue` 文件内自重复。
	- 验收: `pnpm duplicate-code:check` 基线不反弹，并留下结构性重复候选清单。
	- 验证: 受影响组件 / helper 定向测试、`pnpm duplicate-code:check` 与受影响文件类型检查。

- [ ] **ESLint / 类型债下一轮窄切片 (P1)**
	- 验收: 继续坚持“单规则、单文件或双文件”切片，优先在 AI provider 聚合层与高 ROI 测试桩历史断言之间二选一推进。
	- 验收: 定向 ESLint、定向测试与类型检查通过，残余债务与下一轮候选有明确记录。
	- 验证: 定向 ESLint、定向 Vitest 与受影响文件类型检查。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

