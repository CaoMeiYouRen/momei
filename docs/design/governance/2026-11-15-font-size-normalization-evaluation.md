# 2026-11-15 非字阶字号取值归一评估（第七十七阶段条目 1）

- 数据源: `pnpm governance:inventory:font-sizes`（`artifacts/governance/font-sizes-inventory-latest.json`）
- 扫描面: app.vue / components / error.vue / layouts / modules / pages / styles，210 个样式 / 组件文件
- 口径: 只评估、不改值；`off-scale` 指取值不等于字阶任一档（`--m-font-size-*`），替换会改变渲染。
- 主文档: [UI 设计 §2.3 字号字阶](../ui.md#23-字体-typography)；分桶口径与试点范围见 [字号治理试点 §2](./2026-11-13-font-size-scale-pilot.md#2-字阶)。

## 结论摘要

- 全部 font-size 声明: **457**
- 已 token 化: 88
- 字阶口径内（可等价替换）: 186
- SCSS 变量: 34
- 非字阶（本报告对象）: **149** 处 / 39 种取值（阶段基线 150 处；条目 3 删除两个零引用面板时带走 1 处 `0.8125rem`）

评估口径（提案，尚未取得设计确认，不作准入规则）：

- **rem 取值**：与最近字阶差值 ≤ 0.5px 时列为「候选」，但仍需设计确认后才可替换；差值 > 0.5px 一律保留。
- **px 取值**：按 1rem = 16px 折算后同样判定，并在建议里标注取值原本是 px（替换同时承担单位迁移）。
- **em 取值**：相对值，实际像素取决于父级 `font-size`，**不做等价判定**，统一保留并标注「需实测父级」。

## 取值分桶与处置建议

| 取值 | 处数 | 最近字阶 | 差值 | 建议 |
|:---|:---|:---|:---|:---|
| `0.85rem` | 17 | `--m-font-size-sm` | -0.4px | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| `1.1rem` | 17 | `--m-font-size-lg` | -0.4px | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| `0.95rem` | 16 | `--m-font-size-md` | -0.8px | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| `0.8125rem` | 13 | `--m-font-size-xs` | 1px | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| `0.8rem` | 11 | `--m-font-size-xs` | 0.8px | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| `0.7rem` | 10 | `--m-font-size-xs` | -0.8px | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| `0.9rem` | 9 | `--m-font-size-sm` | 0.4px | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| `2rem` | 8 | `--m-font-size-3xl` | 2px | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| `2.5rem` | 6 | `--m-font-size-4xl` | 4px | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| `0.9em` | 4 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `3rem` | 4 | `--m-font-size-4xl` | 12px | 保留（距最近字阶 --m-font-size-4xl 差 12px，替换会改版式） |
| `1.75rem` | 3 | `--m-font-size-3xl` | -2px | 保留（距最近字阶 --m-font-size-3xl 差 -2px，替换会改版式） |
| `0.935rem` | 2 | `--m-font-size-sm` | 0.96px | 保留（距最近字阶 --m-font-size-sm 差 0.96px，替换会改版式） |
| `0.9375rem` | 2 | `--m-font-size-sm` | 1px | 保留（距最近字阶 --m-font-size-sm 差 1px，替换会改版式） |
| `1.2rem` | 2 | `--m-font-size-xl` | -0.8px | 保留（距最近字阶 --m-font-size-xl 差 -0.8px，替换会改版式） |
| `1.35rem` | 2 | `--m-font-size-xl` | 1.6px | 保留（距最近字阶 --m-font-size-xl 差 1.6px，替换会改版式） |
| `0.65rem` | 1 | `--m-font-size-xs` | -1.6px | 保留（距最近字阶 --m-font-size-xs 差 -1.6px，替换会改版式） |
| `0.825rem` | 1 | `--m-font-size-sm` | -0.8px | 保留（距最近字阶 --m-font-size-sm 差 -0.8px，替换会改版式） |
| `0.85em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `0.92rem` | 1 | `--m-font-size-sm` | 0.72px | 保留（距最近字阶 --m-font-size-sm 差 0.72px，替换会改版式） |
| `1.05rem` | 1 | `--m-font-size-md` | 0.8px | 保留（距最近字阶 --m-font-size-md 差 0.8px，替换会改版式） |
| `1.15rem` | 1 | `--m-font-size-lg` | 0.4px | 候选：--m-font-size-lg（差值 0.4px；需设计确认） |
| `1.1em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `1.25em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `1.4rem` | 1 | `--m-font-size-2xl` | -1.6px | 保留（距最近字阶 --m-font-size-2xl 差 -1.6px，替换会改版式） |
| `1.5em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `1.75em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `1.8rem` | 1 | `--m-font-size-3xl` | -1.2px | 保留（距最近字阶 --m-font-size-3xl 差 -1.2px，替换会改版式） |
| `10px !important` | 1 | `--m-font-size-xs` | -2px | 保留（距最近字阶 --m-font-size-xs 差 -2px，替换会改版式） |
| `16px` | 1 | `--m-font-size-md` | 0px | 候选：--m-font-size-md（差值 0px；本值为 px，替换同时承担单位迁移；需设计确认） |
| `2.25em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `2.5em` | 1 | - | - | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| `3.5rem` | 1 | `--m-font-size-4xl` | 20px | 保留（距最近字阶 --m-font-size-4xl 差 20px，替换会改版式） |
| `3.75rem` | 1 | `--m-font-size-4xl` | 24px | 保留（距最近字阶 --m-font-size-4xl 差 24px，替换会改版式） |
| `clamp(1.6rem, 3vw, 2.35rem)` | 1 | - | - | 保留（未识别单位，需人工判定） |
| `clamp(2rem, 3vw, 2.75rem)` | 1 | - | - | 保留（未识别单位，需人工判定） |
| `clamp(2rem, 5vw, 3.25rem)` | 1 | - | - | 保留（未识别单位，需人工判定） |
| `inherit` | 1 | - | - | 保留（未识别单位，需人工判定） |
| `var(--reader-font-size) !important` | 1 | - | - | 保留（未识别单位，需人工判定） |

## 逐处明细

| # | 文件 | 行 | 取值 | 建议 |
|:---|:---|:---|:---|:---|
| 1 | `components/admin/admin-taxonomy-page.vue` | 885 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 2 | `components/admin/ai/metric-card.vue` | 56 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 3 | `components/admin/ai/metric-card.vue` | 62 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 4 | `components/admin/ai/stats-overview.vue` | 348 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 5 | `components/admin/ai/stats-overview.vue` | 379 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 6 | `components/admin/ai/stats-overview.vue` | 408 | `1.2rem` | 保留（距最近字阶 --m-font-size-xl 差 -0.8px，替换会改版式） |
| 7 | `components/admin/calendar/calendar-view.vue` | 331 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 8 | `components/admin/calendar/calendar-view.vue` | 374 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 9 | `components/admin/calendar/calendar-view.vue` | 386 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 10 | `components/admin/calendar/calendar-view.vue` | 406 | `0.65rem` | 保留（距最近字阶 --m-font-size-xs 差 -1.6px，替换会改版式） |
| 11 | `components/admin/calendar/kanban-view.vue` | 158 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 12 | `components/admin/calendar/kanban-view.vue` | 192 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 13 | `components/admin/calendar/kanban-view.vue` | 202 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 14 | `components/admin/calendar/kanban-view.vue` | 216 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 15 | `components/admin/dashboard/creator-stats-panel.vue` | 299 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 16 | `components/admin/dashboard/metric-card.vue` | 89 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 17 | `components/admin/posts/_editor-panel-shared.scss` | 55 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 18 | `components/admin/posts/_editor-panel-shared.scss` | 98 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 19 | `components/admin/posts/post-audit-dialog.scss` | 17 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 20 | `components/admin/posts/post-audit-dialog.scss` | 22 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 21 | `components/admin/posts/post-audit-dialog.scss` | 36 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 22 | `components/admin/posts/post-audit-dialog.scss` | 52 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 23 | `components/admin/posts/post-audit-dialog.scss` | 57 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 24 | `components/admin/posts/post-audit-dialog.scss` | 67 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 25 | `components/admin/posts/post-audit-dialog.scss` | 74 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 26 | `components/admin/posts/post-editor-consolidated-review-panel.vue` | 413 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 27 | `components/admin/posts/post-editor-header.vue` | 631 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 28 | `components/admin/posts/post-editor-header.vue` | 735 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 29 | `components/admin/posts/post-editor-rewrite-compare.vue` | 134 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 30 | `components/admin/posts/post-editor-setup-reminder.vue` | 66 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 31 | `components/admin/posts/post-history-panel.vue` | 429 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 32 | `components/admin/posts/post-history-panel.vue` | 579 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 33 | `components/admin/posts/post-history-panel.vue` | 599 | `0.825rem` | 保留（距最近字阶 --m-font-size-sm 差 -0.8px，替换会改版式） |
| 34 | `components/admin/posts/post-media-preview-cell.vue` | 235 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 35 | `components/admin/posts/post-social-dialog.vue` | 187 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 36 | `components/admin/posts/post-tts-dialog.vue` | 314 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 37 | `components/admin/posts/post-tts-dialog.vue` | 326 | `0.935rem` | 保留（距最近字阶 --m-font-size-sm 差 0.96px，替换会改版式） |
| 38 | `components/admin/posts/post-tts-dialog.vue` | 443 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 39 | `components/admin/posts/post-tts-dialog.vue` | 465 | `0.935rem` | 保留（距最近字阶 --m-font-size-sm 差 0.96px，替换会改版式） |
| 40 | `components/admin/posts/post-tts-dialog.vue` | 481 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 41 | `components/admin/settings/ai-alert-thresholds-editor.vue` | 350 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 42 | `components/admin/settings/ai-cost-factors-editor.vue` | 272 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 43 | `components/admin/settings/ai-quota-policies-editor.vue` | 568 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 44 | `components/admin/settings/notification-delivery-log-list.vue` | 485 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 45 | `components/admin/settings/setting-explanation-card.vue` | 115 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 46 | `components/admin/settings/setting-form-field.vue` | 152 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 47 | `components/admin/settings/setup-follow-up-card.vue` | 166 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 48 | `components/admin/settings/theme-config-section.vue` | 369 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 49 | `components/admin/snippets/snippet-aggregate-dialog.vue` | 514 | `0.9375rem` | 保留（距最近字阶 --m-font-size-sm 差 1px，替换会改版式） |
| 50 | `components/admin/snippets/snippet-bookmarklet.vue` | 75 | `0.9375rem` | 保留（距最近字阶 --m-font-size-sm 差 1px，替换会改版式） |
| 51 | `components/app-footer.vue` | 251 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 52 | `components/app-header.vue` | 647 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 53 | `components/app-notifications.vue` | 301 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 54 | `components/app-notifications.vue` | 313 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 55 | `components/app-notifications.vue` | 344 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 56 | `components/app-search.vue` | 191 | `1.15rem` | 候选：--m-font-size-lg（差值 0.4px；需设计确认） |
| 57 | `components/article-content.vue` | 87 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 58 | `components/article-content.vue` | 98 | `2.25em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 59 | `components/article-content.vue` | 101 | `1.75em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 60 | `components/article-content.vue` | 105 | `1.5em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 61 | `components/article-content.vue` | 106 | `1.25em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 62 | `components/article-content.vue` | 153 | `0.9em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 63 | `components/article-content.vue` | 170 | `0.9em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 64 | `components/article-copyright.vue` | 90 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 65 | `components/article-copyright.vue` | 97 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 66 | `components/article-sponsor.vue` | 266 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 67 | `components/article-sponsor.vue` | 275 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 68 | `components/article-sponsor.vue` | 309 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 69 | `components/comment-item.vue` | 389 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 70 | `components/comment-item.vue` | 397 | `0.85em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 71 | `components/comment-list.vue` | 136 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 72 | `components/commercial-link-dialog.vue` | 195 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 73 | `components/commercial-link-section.vue` | 231 | `3rem` | 保留（距最近字阶 --m-font-size-4xl 差 12px，替换会改版式） |
| 74 | `components/commercial-link-section.vue` | 314 | `10px !important` | 保留（距最近字阶 --m-font-size-xs 差 -2px，替换会改版式） |
| 75 | `components/confirm-delete-dialog.vue` | 81 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 76 | `components/demo-banner.vue` | 266 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 77 | `components/home/external-feed-panel.vue` | 223 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 78 | `components/legal-agreement-page.vue` | 240 | `1.75rem` | 保留（距最近字阶 --m-font-size-3xl 差 -2px，替换会改版式） |
| 79 | `components/taxonomy-post-page.vue` | 280 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 80 | `components/travellings-link.vue` | 99 | `inherit` | 保留（未识别单位，需人工判定） |
| 81 | `components/travellings-link.vue` | 106 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 82 | `components/travellings-link.vue` | 124 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 83 | `components/travellings-link.vue` | 150 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 84 | `components/travellings-link.vue` | 175 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 85 | `error.vue` | 110 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 86 | `pages/about.vue` | 253 | `3.75rem` | 保留（距最近字阶 --m-font-size-4xl 差 24px，替换会改版式） |
| 87 | `pages/admin/external-links/index.vue` | 477 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 88 | `pages/admin/index.vue` | 361 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 89 | `pages/admin/index.vue` | 385 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 90 | `pages/admin/index.vue` | 421 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 91 | `pages/admin/index.vue` | 449 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 92 | `pages/admin/posts/index.vue` | 778 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 93 | `pages/admin/submissions/index.vue` | 413 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 94 | `pages/archives/index.vue` | 222 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 95 | `pages/benefits.vue` | 402 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 96 | `pages/benefits.vue` | 415 | `3rem` | 保留（距最近字阶 --m-font-size-4xl 差 12px，替换会改版式） |
| 97 | `pages/feedback.vue` | 143 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 98 | `pages/feedback.vue` | 152 | `clamp(2rem, 3vw, 2.75rem)` | 保留（未识别单位，需人工判定） |
| 99 | `pages/feedback.vue` | 198 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 100 | `pages/friend-links.vue` | 500 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 101 | `pages/friend-links.vue` | 508 | `clamp(2rem, 5vw, 3.25rem)` | 保留（未识别单位，需人工判定） |
| 102 | `pages/friend-links.vue` | 521 | `1.2rem` | 保留（距最近字阶 --m-font-size-xl 差 -0.8px，替换会改版式） |
| 103 | `pages/friend-links.vue` | 544 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 104 | `pages/friend-links.vue` | 555 | `1.35rem` | 保留（距最近字阶 --m-font-size-xl 差 1.6px，替换会改版式） |
| 105 | `pages/friend-links.vue` | 608 | `1.35rem` | 保留（距最近字阶 --m-font-size-xl 差 1.6px，替换会改版式） |
| 106 | `pages/friend-links.vue` | 620 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 107 | `pages/friend-links.vue` | 651 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 108 | `pages/friend-links.vue` | 756 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 109 | `pages/goto/[code].vue` | 159 | `3rem` | 保留（距最近字阶 --m-font-size-4xl 差 12px，替换会改版式） |
| 110 | `pages/goto/[code].vue` | 198 | `0.9rem` | 候选：--m-font-size-sm（差值 0.4px；需设计确认） |
| 111 | `pages/goto/[code].vue` | 204 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 112 | `pages/index.vue` | 349 | `3.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 20px，替换会改版式） |
| 113 | `pages/index.vue` | 358 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 114 | `pages/installation.vue` | 272 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 115 | `pages/installation.vue` | 351 | `0.92rem` | 保留（距最近字阶 --m-font-size-sm 差 0.72px，替换会改版式） |
| 116 | `pages/installation.vue` | 404 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 117 | `pages/installation.vue` | 412 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 118 | `pages/installation.vue` | 521 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 119 | `pages/installation.vue` | 638 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 120 | `pages/posts/post-detail.scss` | 72 | `1.75rem` | 保留（距最近字阶 --m-font-size-3xl 差 -2px，替换会改版式） |
| 121 | `pages/posts/post-detail.scss` | 220 | `3rem` | 保留（距最近字阶 --m-font-size-4xl 差 12px，替换会改版式） |
| 122 | `pages/posts/post-detail.scss` | 346 | `1.05rem` | 保留（距最近字阶 --m-font-size-md 差 0.8px，替换会改版式） |
| 123 | `pages/posts/post-detail.scss` | 490 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 124 | `pages/posts/post-detail.scss` | 524 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 125 | `pages/posts/post-detail.scss` | 584 | `0.8125rem` | 保留（距最近字阶 --m-font-size-xs 差 1px，替换会改版式） |
| 126 | `pages/settings.vue` | 120 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 127 | `pages/submit.vue` | 253 | `2.5rem` | 保留（距最近字阶 --m-font-size-4xl 差 4px，替换会改版式） |
| 128 | `pages/submit.vue` | 263 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 129 | `pages/submit.vue` | 284 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 130 | `pages/submit.vue` | 300 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 131 | `pages/submit.vue` | 317 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 132 | `styles/_layout.scss` | 75 | `0.7rem` | 保留（距最近字阶 --m-font-size-xs 差 -0.8px，替换会改版式） |
| 133 | `styles/_reader.scss` | 45 | `var(--reader-font-size) !important` | 保留（未识别单位，需人工判定） |
| 134 | `styles/_reader.scss` | 61 | `2.5em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 135 | `styles/_rendering.scss` | 22 | `1.8rem` | 保留（距最近字阶 --m-font-size-3xl 差 -1.2px，替换会改版式） |
| 136 | `styles/_rendering.scss` | 24 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 137 | `styles/_rendering.scss` | 122 | `0.9em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 138 | `styles/_rendering.scss` | 188 | `1.1em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 139 | `styles/_rendering.scss` | 242 | `0.9em` | 保留（em 相对值，依赖父级字号，需实测父级后才可判定） |
| 140 | `styles/components/_dashboard-metric-card.scss` | 29 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |
| 141 | `styles/components/_dashboard-metric-card.scss` | 33 | `2rem` | 保留（距最近字阶 --m-font-size-3xl 差 2px，替换会改版式） |
| 142 | `styles/iconfont/iconfont.css` | 13 | `16px` | 候选：--m-font-size-md（差值 0px；本值为 px，替换同时承担单位迁移；需设计确认） |
| 143 | `styles/main.scss` | 192 | `1.75rem` | 保留（距最近字阶 --m-font-size-3xl 差 -2px，替换会改版式） |
| 144 | `styles/pages/_admin-dashboard.scss` | 26 | `0.8rem` | 保留（距最近字阶 --m-font-size-xs 差 0.8px，替换会改版式） |
| 145 | `styles/pages/_admin-dashboard.scss` | 32 | `clamp(1.6rem, 3vw, 2.35rem)` | 保留（未识别单位，需人工判定） |
| 146 | `styles/pages/_admin-dashboard.scss` | 84 | `1.4rem` | 保留（距最近字阶 --m-font-size-2xl 差 -1.6px，替换会改版式） |
| 147 | `styles/pages/_admin-dashboard.scss` | 174 | `0.85rem` | 候选：--m-font-size-sm（差值 -0.4px；需设计确认） |
| 148 | `styles/pages/admin-friend-links.scss` | 39 | `1.1rem` | 候选：--m-font-size-lg（差值 -0.4px；需设计确认） |
| 149 | `styles/voice-popover.scss` | 18 | `0.95rem` | 保留（距最近字阶 --m-font-size-md 差 -0.8px，替换会改版式） |

## 后续增强方向

1. **rem 候选桶**（差值 ≤ 0.5px，如 `0.85rem` / `1.1rem` / `0.9rem`）可先由设计侧确认「新增档位或接受微调」，确认后再按目录分批替换；未确认前一律不改值。
2. **需要设计决策的取值**（`0.95rem` / `0.8125rem` / `0.8rem` / `0.7rem` / `2rem` / `2.5rem` / `3rem` 等）先明确「是否新增字阶档位」，再决定替换或保留。
3. **px / em 取值**先统一到 rem 并实测父级字号，避免一次改动同时承担单位迁移与字阶归一。
4. 同目录仍有 3 处口径内字面量未纳入本批（`post-media-preview-cell.vue` / `post-editor-drag-mask.vue` / `post-editor-settings.vue`），随下一滚动批次处理。

