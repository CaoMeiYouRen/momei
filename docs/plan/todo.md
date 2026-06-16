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

> 第五十一阶段（边界收敛与治理增压）已于 2026-06-16 启动。五条主线：types/utils 边界收敛、跨包复用评估、ESLint ≥5 组、结构复用 ≥5 组、backlog 状态同步。

### A. `utils/shared` 与 `types` 职责边界收敛 (P1)

- **执行范围**: 盘点类型与逻辑混放位置，纯类型→`types/`，含逻辑代码→`utils/`。输出冲突清单 + 迁移规则，≥3 处样本迁移。
- **非目标**: 不跨目录大重构、不改变业务行为。
- **最小验收**: 冲突清单落盘；迁移规则文档化；≥3 处迁移完成且 typecheck 通过。
- [x] 输出冲突样本清单（类型与逻辑混放位置） → [治理文档](../design/governance/types-utils-boundary-governance.md)
- [x] 给出迁移规则与渐进式收敛顺序 → [治理文档](../design/governance/types-utils-boundary-governance.md)
- [x] ≥3 处样本迁移完成 + typecheck 通过（样本: copyright.ts → utils/shared/copyright.ts, utils.ts → type-guards.ts, email-template-preview.ts → types/）

### B. 跨包复用治理 — 评估态 (P2)

- **执行范围**: 盘点 `packages/mcp-server` 与 `packages/cli` 共享代码（类型/函数/常量/配置），产出 go/no-go 评估文档。
- **非目标**: 不抽取共享包、不进入代码实现。
- **最小验收**: 共享代码清单 + 评估文档（覆盖共享面规模、抽包成本、替代方案）。
- [ ] 盘点双包共享代码清单
- [ ] 产出 go/no-go 评估文档

### C. ESLint / 类型债治理 — ≥5 组窄切片 (P1)

- **执行范围**: 「单规则 + 单文件/双文件」窄切片 ×5。保持 `warning=0`。
- **非目标**: 不全仓 any 清零、不引入新规则族。
- **最小验收**: ≥5 组切片完成；`pnpm governance:audit:eslint-debt` delta 可对照。
- [ ] 窄切片 1
- [ ] 窄切片 2
- [ ] 窄切片 3
- [ ] 窄切片 4
- [ ] 窄切片 5
- [ ] governance:audit:eslint-debt delta 对照

### D. 结构复用治理 — ≥5 组热点切片 (P1)

- **执行范围**: `commercial-link-manager.vue` 自重复 + ≥4 组其他（同名 type/函数/工具函数）。每组输出原始重复点、抽象边界与回滚方式。
- **非目标**: 不跨目录大重构、不为复用而复用。
- **最小验收**: ≥5 组切片完成；`duplicate-code` 基线不反弹。
- [ ] 热点切片 1：commercial-link-manager.vue 自重复
- [ ] 热点切片 2
- [ ] 热点切片 3
- [ ] 热点切片 4
- [ ] 热点切片 5
- [ ] duplicate-code 基线不反弹

### E. Backlog 长期主线状态同步 (P1)

- **执行范围**: 对照 Phase 38-50 归档记录，更新 10 条长期主线的状态字段。
- **非目标**: 不重写条目正文、不新增条目。
- **最小验收**: 10 条主线「最近一次上收阶段」全部 ≥Phase 48。
- [ ] 10 条长期主线状态字段更新至 ≥Phase 48

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
