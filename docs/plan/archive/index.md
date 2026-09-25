# 规划文档深度归档治理

本文档是 `roadmap.md` 与 `todo-archive.md` 的深度归档管理入口，负责定义读写压力阈值、主窗口保留范围、后续分片策略与归档触发条件。

## 1. 适用范围

- `docs/plan/roadmap.md`: 保留项目总路线、当前阶段与近线归档结论，不承担无限增长的全量历史正文。
- `docs/plan/todo-archive.md`: 保留最近若干阶段的完整归档块与近线收口依据，不长期充当所有历史阶段的唯一全文容器。
- `docs/reports/regression/current.md`: 继续沿用独立活动窗口治理，不并回规划文档。

## 2. 当前基线（2026-09-25）

- `roadmap.md`: `132` 行（脚本 `docs:check:line-count` 口径），处于健康窗口（第一至第五十三阶段已迁入分片归档；第五十四至第六十七阶段本轮迁入 `roadmap-phases-54-67.md`，主窗口仅保留阶段摘要表与最近阶段归档结论）。
- `todo-archive.md`: `282` 行（脚本口径），处于健康窗口（本轮迁出第六十一至第六十三阶段至 `todo-archive-phases-61-63.md`，主窗口保留第六十四至第六十七阶段近线归档块）。
- `docs/reports/regression/current.md`: `589` 行，处于 warning 区间（>`500`），建议在下一轮窗口治理中把更早记录迁入 `docs/reports/regression/archive/`。

## 3. 阈值定义

### 3.1 `roadmap.md`

- 健康窗口: `<= 800` 行。
- warning 触发: `801 - 900` 行，或当前正式阶段之外的历史阶段正文已经明显影响“当前阶段 + 近线归档结论”的阅读效率。
- 强制分片: `> 900` 行，或新增阶段规划前已经无法在单页内快速定位“当前阶段目标、上一阶段归档结论、长期路线图”。

### 3.2 `todo-archive.md`

- 健康窗口: `<= 500` 行。
- warning 触发: `501 - 700` 行，或单次阶段归档已经让早期阶段检索明显拖慢当前阶段收口。
- 强制分片: `> 700` 行，或下一次阶段归档追加后，主文档已不适合作为近线归档窗口继续维护。

## 4. 主窗口保留策略

### 4.1 `roadmap.md`

- 主文档优先保留：项目概况、长期路线、当前阶段正式规划、最近若干阶段的审计归档摘要。
- 更早且已稳定的阶段，应迁移到后续深度归档分片，只在主文档保留阶段摘要与索引入口。

### 4.2 `todo-archive.md`

- 主文档优先保留最近 `4 - 6` 个已归档阶段的完整块，确保当前阶段收口、最近发版复盘与相邻阶段对比仍可直接完成。
- 更早阶段在进入分片后，应整体迁移，禁止把验收标准、审计结论与验证记录拆散到多个位置。

## 5. 后续分片策略

- `roadmap.md` 深度归档优先按阶段区间切分；当前已落地 `docs/plan/archive/roadmap-phases-01-10.md`、`roadmap-phases-11-21.md`、`roadmap-phases-22-24.md`、`roadmap-phases-25-31.md`、`roadmap-phases-32-41.md`、`roadmap-phases-42-53.md` 与 `roadmap-phases-54-67.md`。
- `todo-archive.md` 深度归档优先按阶段区间切分；已落地 `docs/plan/archive/todo-archive-phases-01-10.md`、`todo-archive-phases-11-21.md`、`todo-archive-phases-22-24.md`、`todo-archive-phases-25-31.md`、`todo-archive-phases-32-41.md`、`todo-archive-phases-42-45.md`、`todo-archive-phases-46-49.md`、`todo-archive-phases-50-51.md`、`todo-archive-phases-52-57.md`、`todo-archive-phases-58-60.md` 与 `todo-archive-phases-61-63.md`。
- 若未来阶段数继续显著增长，再评估按年份或半年度拆分，而不是重新把旧正文塞回主文档。
- 主文档只保留摘要、索引与最近窗口，不再复制完整历史正文。

## 6. 本轮结论与下一步

> **维护约定**: 本文件中的行数声明必须与 `pnpm docs:check:line-count` 输出逐字对账后再写入；任何涉及 `docs/plan/` 文件的增删改后，先复跑脚本再更新本文件，防止声明漂移。

- 本轮（2026-09-25）完成第六十七阶段归档收口：`roadmap.md` 迁出第五十四至第六十七阶段正文至 `roadmap-phases-54-67.md`（主窗口仅保留阶段摘要表 + 最近阶段归档结论）；`todo-archive.md` 迁出第六十一至第六十三阶段至 `todo-archive-phases-61-63.md`，并收录第六十七阶段归档块；`todo.md` 已清空已完成阶段正文（当前无进行中阶段）；`backlog.md` 已移除已关闭主线与已完成候选。
- `roadmap.md` 当前保留第一至第五十三阶段的索引 / 摘要与第五十四至第六十七阶段摘要表（脚本口径 `132` 行，健康）；若后续再次接近 `800` 行，优先按连续阶段区间继续前移归档。
- `todo-archive.md` 当前保留第六十四至第六十七阶段近线窗口（脚本口径 `282` 行，健康）。建议在下一阶段归档前，将第六十四至第六十五阶段从主窗口迁入分片。
- `docs/reports/regression/current.md` 已进入 warning 区间（`589` 行），下一轮窗口治理需滚动归档更早记录。

## 7. 相关入口

- 当前路线图: [../roadmap.md](../roadmap.md)
- 当前待办归档: [../todo-archive.md](../todo-archive.md)
- 路线图分片: [roadmap-phases-01-10.md](./roadmap-phases-01-10.md)、[roadmap-phases-11-21.md](./roadmap-phases-11-21.md)、[roadmap-phases-22-24.md](./roadmap-phases-22-24.md)、[roadmap-phases-25-31.md](./roadmap-phases-25-31.md)、[roadmap-phases-32-41.md](./roadmap-phases-32-41.md)、[roadmap-phases-42-53.md](./roadmap-phases-42-53.md)、[roadmap-phases-54-67.md](./roadmap-phases-54-67.md)
- 待办归档分片: [todo-archive-phases-01-10.md](./todo-archive-phases-01-10.md)、[todo-archive-phases-11-21.md](./todo-archive-phases-11-21.md)、[todo-archive-phases-22-24.md](./todo-archive-phases-22-24.md)、[todo-archive-phases-25-31.md](./todo-archive-phases-25-31.md)、[todo-archive-phases-32-41.md](./todo-archive-phases-32-41.md)、[todo-archive-phases-42-45.md](./todo-archive-phases-42-45.md)、[todo-archive-phases-46-49.md](./todo-archive-phases-46-49.md)、[todo-archive-phases-50-51.md](./todo-archive-phases-50-51.md)、[todo-archive-phases-52-57.md](./todo-archive-phases-52-57.md)、[todo-archive-phases-58-60.md](./todo-archive-phases-58-60.md)、[todo-archive-phases-61-63.md](./todo-archive-phases-61-63.md)
- 回归记录入口: [../../reports/regression/index.md](../../reports/regression/index.md)
