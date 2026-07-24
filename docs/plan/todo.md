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

## 第六十二阶段：迁移适配扩展与治理续航

> 执行时间: 2026-07-24 ~ 约 3-4 天
> 详细规划: [项目计划 - 第六十二阶段](./roadmap.md#第六十二阶段迁移适配扩展与治理续航phase-62-migration-adapter-expansion--governance-continuation)

### P2 — 多平台迁移适配器：WordPress Parser（候选 #12）

- [x] 后端：实现 `WordPressParser` 适配器（`packages/cli/src/wordpress-parser.ts`），支持 WXR 格式解析
- [x] CLI：新增 `--format wordpress` 参数，复用现有导入链路
- [x] 测试：新增适配器单元测试覆盖 title/date/tags/categories/content/slug/draft 映射
- [x] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Hexo/Hugo 无回归

### P2 — 测试覆盖率 90%+ 第四批（长期主线 #1）

- [ ] 基于 Phase 61 最新全仓覆盖率缺口报告，选择下一批高价值覆盖缺口模块
- [ ] 补高价值缺口覆盖度（目标全仓 coverage 提升 ≥1%）
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过

### P2 — AI 编辑视角/读者视角检查（候选 #9 剩余子功能）

- [ ] 后端：新增 `/api/ai/perspective-check` 端点（`TextService.perspectiveCheck()` + `AI_PROMPTS.PERSPECTIVE_CHECK` 模板，支持 `mode: 'editor' | 'reader'`）
- [ ] 前端：编辑器工具栏新增"视角检查"按钮，选中文本后调用 API，返回结构化建议列表（不自动修改）
- [ ] 计费：复用 AI 计费和额度管理，支持 `perspective-check` 操作类型
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过

### P1 — 响应式状态模型收敛：reactive→ref Step 3（候选 #14）

- [ ] 识别 Step 3 目标文件：`settings-notifications.vue`（聚合订阅状态）、`pages/admin/comments/index.vue`、`pages/admin/submissions/index.vue` 中的深层嵌套 `reactive` 对象
- [ ] 逐文件迁移：`reactive({...})` → `ref<{...}>()`，补齐 `.value` 读取路径（实际 ~15 处剩余中的一部分）
- [ ] 定向验证：每文件配定向测试验证表单校验/提交/弹窗/开关行为不回退（≥10 tests）
- [ ] 验证：`pnpm typecheck` + `pnpm lint` 通过

### P1 — 脚本治理 warning 清理（长期主线 #10）

- [ ] 清理 `audit-comment-drift` 的 TODO 计数与逐行复述误报
- [ ] 清理 `docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 两条候选入口的 warning 面
- [ ] 验证：三条脚本产出清洁输出

---

## 阶段收口检查清单

- [ ] `todo.md` 当前阶段条目全部完成
- [ ] `roadmap.md` 同步阶段状态与收口结论
- [ ] 多语路线图摘要更新（`docs/i18n/*/plan/roadmap.md`）
- [ ] `pnpm typecheck` + `pnpm lint` 通过
- [ ] `pnpm test`+ `pnpm docs:build` 通过
- [ ] Code Auditor Review Gate 通过
- [ ] 归档记录写入 `todo-archive.md`

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
