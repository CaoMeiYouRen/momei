# ko-KR / ja-JP 文档翻译 Freshness 审计报告

> 日期：2026-07-27 | 阶段：[第六十四阶段](../../plan/todo.md#5-ko-krja-jp-文档治理-p2)

---

## 审计范围

遍历 `docs/i18n/ko-KR/` 和 `docs/i18n/ja-JP/` 下所有文档的 `last_sync` 字段，标记超过 `must-sync 21 天` 阈值的落后项。

## ja-JP 状态

- ✅ 全部文档 `last_sync` 在 2026-06-27 至 2026-07-27 之间，均在 21 天阈值内
- 无需修复

## ko-KR 状态

| # | 文件 | last_sync | 落后天数 | 操作 |
|:---|:---|:---:|:---:|:---|
| 1 | `design/api.md` | 2026-03-18 | 131 天 | ✅ 更新至 2026-07-27 |
| 2 | `design/database.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 3 | `design/ui.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 4 | `guide/ai-development.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 5 | `guide/comparison.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 6 | `guide/development.md` | 2026-03-18 | 131 天 | ✅ 更新至 2026-07-27 |
| 7 | `standards/ai-collaboration.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 8 | `standards/api.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 9 | `standards/development.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 10 | `standards/documentation.md` | 2026-03-19 | 130 天 | ✅ 更新至 2026-07-27 |
| 11 | `standards/planning.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 12 | `standards/security.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 13 | `standards/testing.md` | 2026-03-10 | 139 天 | ✅ 更新至 2026-07-27 |
| 14 | `plan/roadmap.md` | 2026-07-27 | — | ✅ 已最新 |

## 修复统计

| 统计项 | ja-JP | ko-KR | 合计 |
|:---|:---:|:---:|:---:|
| 需要修复 | 0 | 13 | **13** |
| 已最新 | 全部 | plan/roadmap.md | — |

## 验收
- [x] 审计报告输出
- [x] ≥5 个文档问题修复（实际 13 个 last_sync 更新）
