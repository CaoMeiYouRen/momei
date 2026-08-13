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

- [x] **主线 1：测试覆盖率 90%+ 第八批（P2）**
    - [x] 全仓覆盖率缺口盘点（CI 数据）：Stmts 79.55% / Branches 67.94% / Funcs 78.25% / Lines 79.56%，报告见 [`docs/design/governance/phase-66-coverage-gap-analysis.md`](../design/governance/phase-66-coverage-gap-analysis.md)
    - [x] 补测 `server/services/ai/text.ts`（1202 行，55.64%）→ **94.82%**（目标 ≥80%，新增 18 用例：rewrite/review/perspectiveCheck/translate/无 chat 分支/JSON fallback）
    - [x] 补测 `server/services/ai/tts.ts`（771 行，59.84%）→ **88.63%**（目标 ≥80%，新增 14 用例：compensate 分支/generateSpeech/getVoices/成本估算/提供商盘点/失败路径）
    - [x] 补测 `server/services/external-feed/parser.ts`（248 行，60.00%，分支 36.29%）→ **92.00%**（目标 ≥90%，新增 12 用例：实体解码/链接/封面/atom/CDATA/异常）
    - [x] 补测 `server/services/external-feed/aggregator.ts`（254 行，68.29%，分支 50.00%）→ **97.56%**（目标 ≥90%，新增 7 用例：locale 过滤/去重排序/refresh 失败/缓存刷新计数）
    - [x] 补测 `server/services/category.ts`（216 行，63.01%）→ **98.63%**（目标 ≥90%，新增 7 用例：ensureCategory 全分支/updateCategory 冲突）
    - [x] 定向测试 subset（5 文件）逐模块验证通过（134/134 全绿 + 周边 14/14 无回归）
    - [x] 全仓 `pnpm test:coverage` 验证 Statements **80.63% ≥ 80.48%**（+1.08%，Branches 69.26% / Lines 80.68% / Funcs 78.64%）
    - [x] `pnpm typecheck` + `pnpm lint` 通过（0 errors）

- [x] **主线 2：编辑器工具栏收敛 Phase B — 风格扩展（P2）**
    - [x] 后端 `TextService` 扩展续写/扩写/缩写 `style` 参数
    - [x] 前端工具栏 SplitButton 子项支持风格选择（复用 6 种风格定义）
    - [x] Phase A 工具栏分组无回归验证
    - [x] `pnpm typecheck` + `pnpm lint` + 受影响 AI 测试通过

- [x] **主线 3：设置表单 UI Phase 4（P2）**
    - [x] 从缺口清单选取 AI Fallback 3 项（`AI_FALLBACK_API_KEY`/`AI_FALLBACK_MODEL`/`AI_FALLBACK_ENDPOINT`）；范围校准：`WEBHOOK_TIMESTAMP_TOLERANCE` 当前实现不读取、`hexo_sync_*` 已实现且定位 INTERNAL_ONLY/ADMIN_EXCLUDED，均不在本批处理；AI Image Fallback 4 项留 Phase 5
    - [x] 补齐 SETTING_ENV_MAP 3 条映射 + `.env.full.example` 注释示例
    - [x] `ai-settings.vue` 实现 Password + InputText + InputText 表单控件（`v-if` 跟随 `ai_fallback_provider`）并补齐五语种翻译
    - [x] `pnpm typecheck` + `pnpm lint` + `pnpm lint:i18n` + `i18n:audit:missing = 0` 通过 + 定向测试 49/49 全绿；A 阶段 `@code-auditor` Review Gate Pass（RG-W01 同轮闭环、RG-W02 待手动浏览器验证）

- [x] **主线 4：结构复用治理（P1）**
    - [x] 基于 0.30% 基线识别 ≥1 组重复热点
    - [x] 切片收敛并验证 `pnpm duplicate-code:check` 基线 ≤0.30%
    - [x] `pnpm typecheck` + `pnpm lint` 通过

- [x] **主线 5：脚本治理 — audit:comment-drift 升格评估（P1）**
    - [x] 确认 `audit:comment-drift` 输出稳定、误报可控、warning 清洁（实测 exit 0：扫描 1294 文件，TODO=0 / restatement=6 / drift=139，五维评估满足）
    - [x] 输出 go/no-go 结论与理由（GO：维持 Phase 52 已升格状态，无需重复升格操作；评估文档 `docs/design/governance/script-promotion-eval-phase66.md`）
    - [x] 若 go：更新 `regression:weekly` 配置纳入 comment-drift 检查（配置已就绪 Phase 52 第 10 步，测试断言同步；本轮仅收口 7 处文档漂移）

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
