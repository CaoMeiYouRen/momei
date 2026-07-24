# 墨梅博客 待办事项 （Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事（ (To）o) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 （Todo）
- [x] 已完成 （Done）
- [-] 已取消 （Cancelled）

---


---

## 第六十二阶段：迁移适配扩展与治理续航（已审计归档）

> 执行时间: 2026-07-24
> 归档说明: 第六十二阶段「1 个新功能 + 4 个优化」已于 2026-07-24 完成五条主线交付与阶段收口。多平台迁移适配器 WordPressParser 已实现（`602326cb`，WXR 解析 + `--format wordpress` 参数 + Hexo/Hugo 无回归）；测试覆盖率 90%+ 第四批已完成（`98d5268c`，26 个测试覆盖 date.ts + query-params.ts 纯函数至 100%）；AI 编辑视角/读者视角检查已完成（`f48f39b3`，`/api/ai/perspective-check` 端点 + 编辑器工具栏 + 结构化建议面板 + AI 计费）；响应式状态模型 reactive→ref Step 3 已完成（`405825cb`，3 文件 6 处深层嵌套 reactive 迁移 + 11 个定向测试）；脚本治理 warning 清理已完成（`ab87cd32`，audit-comment-drift TODO 归零 + 逐行复述 15→6 + docs candidate warning 清洁）。所有主线均通过 lint/typecheck/test/docs:build 质量门。详细归档见 [todo-archive.md](./todo-archive.md#第六十二阶段迁移适配扩展与治理续航-已审计归档)。

> 详细条目见 [待办事项归档](./todo-archive.md)

---

## 阶段收口检查清单

- [x] `todo.md` 当前阶段条目全部完成
- [x] `roadmap.md` 同步阶段状态与收口结论
- [ ] 多语路线图摘要更新（`docs/i18n/*/plan/roadmap.md`）
- [x] `pnpm typecheck` + `pnpm lint` 通过
- [x] `pnpm test` + `pnpm docs:build` 通过
- [ ] Code Auditor Review Gate 通过
- [x] 归档记录写入 `todo-archive.md`

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
