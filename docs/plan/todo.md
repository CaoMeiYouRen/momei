# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 第六十六阶段：编辑器续航与覆盖率攻坚（进行中）

> **时间表**: 2026-08-07 ~ 约 3-5 天 | **路线图**: [Phase 66](./roadmap.md#第六十六阶段编辑器续航与覆盖率攻坚phase-66-editor-continuation--coverage-push进行中)

- [ ] **主线 1：测试覆盖率 90%+ 第八批（P2）**
    - [x] 全仓覆盖率缺口盘点（CI 数据）：Stmts 79.55% / Branches 67.94% / Funcs 78.25% / Lines 79.56%，报告见 [`docs/design/governance/phase-66-coverage-gap-analysis.md`](../design/governance/phase-66-coverage-gap-analysis.md)
    - [ ] 补测 `server/services/ai/text.ts`（1202 行，55.64%）→ 目标 ≥80%
    - [ ] 补测 `server/services/ai/tts.ts`（771 行，59.84%）→ 目标 ≥80%
    - [ ] 补测 `server/services/external-feed/parser.ts`（248 行，60.00%，分支 36.29%）→ 目标 ≥90%
    - [ ] 补测 `server/services/external-feed/aggregator.ts`（254 行，68.29%，分支 50.00%）→ 目标 ≥90%
    - [ ] 补测 `server/services/category.ts`（216 行，63.01%）→ 目标 ≥90%
    - [ ] 定向测试 subset（3-5 文件）逐模块验证通过
    - [ ] 全仓 `pnpm test:coverage` 验证 Statements ≥80.48%（CI 为准，预估 +1.3~1.5%）
    - [ ] `pnpm typecheck` + `pnpm lint` 通过

- [ ] **主线 2：编辑器工具栏收敛 Phase B — 风格扩展（P2）**
    - [ ] 后端 `TextService` 扩展续写/扩写/缩写 `style` 参数
    - [ ] 前端工具栏 SplitButton 子项支持风格选择（复用 6 种风格定义）
    - [ ] Phase A 工具栏分组无回归验证
    - [ ] `pnpm typecheck` + `pnpm lint` + 受影响 AI 测试通过

- [ ] **主线 3：设置表单 UI Phase 4（P2）**
    - [ ] 从缺口清单选取 2-4 个配置项（缺口 A: `WEBHOOK_TIMESTAMP_TOLERANCE` 等 + 缺口 B: `hexo_sync_*` 等）
    - [ ] 补齐 SettingKey/SETTING_ENV_MAP 映射（如需）
    - [ ] 实现表单控件并补齐五语种翻译
    - [ ] `pnpm typecheck` + `pnpm lint` 通过，受影响表单保存/验证通过

- [ ] **主线 4：结构复用治理（P1）**
    - [ ] 基于 0.30% 基线识别 ≥1 组重复热点
    - [ ] 切片收敛并验证 `pnpm duplicate-code:check` 基线 ≤0.30%
    - [ ] `pnpm typecheck` + `pnpm lint` 通过

- [ ] **主线 5：脚本治理 — audit:comment-drift 升格评估（P1）**
    - [ ] 确认 `audit:comment-drift` 输出稳定、误报可控、warning 清洁
    - [ ] 输出 go/no-go 结论与理由
    - [ ] 若 go：更新 `regression:weekly` 配置纳入 comment-drift 检查

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
