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
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

> 阶段状态: 第三十一阶段已完成审计归档；第三十二阶段 5/5 主线 + 1 派生切片已于 2026-05-01 / 2026-05-02 全部闭合并归档至 [todo-archive.md](./todo-archive.md)，阶段正式收口。下一阶段继续将测试覆盖率推进至 `80%+`。`存量代码注释治理与注释漂移收敛` 继续保留为备用项，留在 [backlog.md](./backlog.md)。

> 当前进行中: 暂无。第三十二阶段已全部闭合，下一阶段候选待 [backlog.md](./backlog.md) 评分后正式上收。

### 第三十二阶段：多语言内容资产化承接入口与高风险治理推进

- [x] ~~**多语言内容资产化增强包的统一承接入口 (P1)**~~ → 已归档
- [x] **测试覆盖率与有效性治理 (P0)** → 阶段收口（下一阶段继续冲刺 80%+）
		- **阶段收口记录（2026-05-02）**: 本阶段已完成公开页 runtime（categories / tags / archives / posts）、认证配置退化（auth-client / auth lib）、认证页 raw key 暴露（forgot-password / reset-password / register / login）三大高风险链路的真实文案装配断言补强。全仓覆盖率从 76.03% / 76.08% 抬升至当前基线，pages/login.vue 达 statements 100% / branches 84.44%。80%+ 冲刺目标顺延至下一阶段，优先沿其余认证流边角分支、共享组件 raw key 暴露与热点公开读链路失败路径继续补强。
		- 验证: 多轮定向 Vitest、pnpm i18n:verify:runtime、pnpm test:coverage 与 pnpm exec nuxt typecheck 均通过。

- [x] ~~**重复代码与纯函数复用收敛 (P1)**~~ → 已归档
- [x] ~~**ESLint / 类型债治理 (P1)**~~ → 已归档
- [x] ~~**Postgres 查询、CPU 与连接生命周期平衡治理 (P0)**~~ → 已归档
- [x] ~~**AITask stale compensation 宽行扫描收敛 (P0 / Postgres 派生切片)**~~ → 已归档

> 备用项：`存量代码注释治理与注释漂移收敛` 当前不作为第三十二阶段正式待办；若后续容量允许，只能按 backlog 中候选组 A / B / C 的单组切片方式补入，不得扩写为全仓补注释工程。



## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

