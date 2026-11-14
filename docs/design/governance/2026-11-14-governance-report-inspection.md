# 2026-11-14 专项治理报告巡检（>180 天）

> 适用条目：第七十五阶段条目 6「文档与治理口径收敛」③。
> 巡检口径：`docs/design/governance/*.md` 中以 git 首次提交日（`git log --diff-filter=A --format=%aI -- <path>`，不跟随重命名）计算年龄 >180 天（截至 2026-11-14，即首次提交早于 2026-05-18）；「已被取代」以「是否有当前引用 / 是否仍表达当前实现」判定。

## 1. 结论

- 巡检范围 20 份（不含 `index.md`）；其中 **2 份已归档**，18 份仍在役（继续作为当前事实源，不迁 archive）。
- 归档动作：`api-schema-validation-governance.md`（首轮审计，无当前引用，已由 API 规范与后续接口治理覆盖）、`multilingual-assetization-intake.md`（第三十二阶段已交付设计，仅历史归档引用）。
- 所有归档文件已更新 `archive/index.md` 与 `docs/design/governance/index.md` 的入口；正文内联路径引用同步到新位置。

## 2. 明细

| 文件 | 首次提交 | 年龄（天） | 处置 |
| :--- | :--- | :--- | :--- |
| `ai-cost-governance.md` | 2026-04-21 | 207 | 在役：`docs/design/modules/ai.md` |
| `asr-performance-optimization.md` | 2026-04-21 | 207 | 在役：`docs/design/modules/asr.md`、`docs/design/governance/archive/phase-8-feasibility-report.md` |
| `batch-translation-orchestration.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-22-24.md`、`docs/design/governance/cli-mcp-automation.md` |
| `cacheable-api-inventory.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/roadmap-phases-25-31.md`、`docs/plan/archive/todo-archive-phases-25-31.md` |
| `cli-mcp-automation.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-11-21.md`、`docs/design/modules/mcp-http.md` |
| `comment-drift-governance.md` | 2026-04-21 | 207 | 在役：`docs/reports/regression/archive/2026-04-21-to-2026-05-01.md` |
| `content-distribution-governance.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-11-21.md`、`docs/design/governance/content-distribution-template-tag-adaptation.md` |
| `content-distribution-template-tag-adaptation.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-11-21.md`、`docs/design/governance/wechatsync-tag-copyright-fix-plan.md` |
| `docs-translation-freshness-governance.md` | 2026-04-21 | 207 | 在役：`docs/design/governance/script-governance.md`、`docs/reports/regression/archive/2026-04-21-to-2026-05-01.md` |
| `eslint-type-debt-tightening.md` | 2026-04-21 | 207 | 在役：`docs/design/governance/archive/phase-31-candidate-draft.md`、`docs/design/governance/script-governance.md` |
| `i18n-field-governance.md` | 2026-04-21 | 207 | 在役：`docs/design/governance/archive/phase-31-candidate-draft.md`、`docs/reports/regression/archive/2026-04-21-to-2026-05-01.md` |
| `i18n-seo-unification.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-01-10.md`、`docs/reports/regression/archive/2026-04-18-to-2026-04-21.md` |
| `migration-link-governance.md` | 2026-04-21 | 207 | 在役：`docs/plan/archive/todo-archive-phases-11-21.md`、`docs/design/modules/storage.md` |
| `post-metadata-unification.md` | 2026-04-21 | 207 | 在役：`docs/design/governance/index.md`（系统治理与运行时边界小节） |
| `settings-i18n-fallback-governance.md` | 2026-04-21 | 207 | 在役：`docs/design/modules/system.md`、`docs/design/modules/i18n.md` |
| `subscription-external-feed-aggregation.md` | 2026-04-21 | 207 | 在役：`docs/design/modules/subscription.md` |
| `system-config-unification.md` | 2026-04-21 | 207 | 在役：`docs/design/modules/system.md`、`docs/design/modules/commercial.md` |
| `windows-dev-build-performance-governance.md` | 2026-05-11 | 187 | 在役：`docs/plan/archive/roadmap-phases-32-41.md`、`docs/plan/archive/todo-archive-phases-32-41.md` |
| `api-schema-validation-governance.md` | 2026-05-04 | 194 | **已归档**（2026-11-14 迁入 `archive/`；归档前无当前引用，仅历史回溯） |
| `multilingual-assetization-intake.md` | 2026-04-30 | 198 | **已归档**（2026-11-14 迁入 `archive/`；归档前无当前引用，仅历史回溯） |

## 3. 后续

- 下一次巡检在 2027-05-14 前执行；新增 >180 天文档若已无当前引用，按同一口径迁入 `archive/` 并更新索引。
- 在役文档若被新规范取代，先在原文档顶部标注「已被 xxx 取代」再迁移，避免历史链接失去指向。
