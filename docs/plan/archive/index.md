# 规划文档深度归档治理

本文档是 `roadmap.md` 与 `todo-archive.md` 的深度归档管理入口，负责定义读写压力阈值、主窗口保留范围、后续分片策略与归档触发条件。

## 1. 适用范围

- `docs/plan/roadmap.md`: 保留项目总路线、当前阶段与近线归档结论，不承担无限增长的全量历史正文。
- `docs/plan/todo-archive.md`: 保留最近若干阶段的完整归档块与近线收口依据，不长期充当所有历史阶段的唯一全文容器。
- `docs/reports/regression/current.md`: 继续沿用独立活动窗口治理，不并回规划文档。

## 2. 当前基线（2026-04-27）

- `roadmap.md`: `528` 行，已回到健康窗口。
- `todo-archive.md`: `265` 行，已回到健康窗口。
- `docs/reports/regression/current.md`: `344` 行，仍处于活动窗口允许范围内，但后续继续追加前应优先关注滚动归档阈值。

## 3. 阈值定义

### 3.1 `roadmap.md`

- 健康窗口: `<= 800` 行。
- warning 触发: `801 - 900` 行，或当前正式阶段之外的历史阶段正文已经明显影响“当前阶段 + 近线归档结论”的阅读效率。
- 强制分片: `> 900` 行，或新增阶段规划前已经无法在单页内快速定位“当前阶段目标、上一阶段归档结论、长期路线图”。

### 3.2 `todo-archive.md`

- 健康窗口: `<= 1800` 行。
- warning 触发: `1801 - 2200` 行，或单次阶段归档已经让早期阶段检索明显拖慢当前阶段收口。
- 强制分片: `> 2200` 行，或下一次阶段归档追加后，主文档已不适合作为近线归档窗口继续维护。

## 4. 主窗口保留策略

### 4.1 `roadmap.md`

- 主文档优先保留：项目概况、长期路线、当前阶段正式规划、最近若干阶段的审计归档摘要。
- 更早且已稳定的阶段，应迁移到后续深度归档分片，只在主文档保留阶段摘要与索引入口。

### 4.2 `todo-archive.md`

- 主文档优先保留最近 `4 - 6` 个已归档阶段的完整块，确保当前阶段收口、最近发版复盘与相邻阶段对比仍可直接完成。
- 更早阶段在进入分片后，应整体迁移，禁止把验收标准、审计结论与验证记录拆散到多个位置。

## 5. 后续分片策略

- `roadmap.md` 深度归档优先按阶段区间切分；本轮已落地 `docs/plan/archive/roadmap-phases-01-10.md` 与 `docs/plan/archive/roadmap-phases-11-21.md`。
- `todo-archive.md` 深度归档优先按阶段区间切分；本轮已落地 `docs/plan/archive/todo-archive-phases-01-10.md`、`docs/plan/archive/todo-archive-phases-11-21.md` 与 `docs/plan/archive/todo-archive-phases-22-24.md`。
- 若未来阶段数继续显著增长，再评估按年份或半年度拆分，而不是重新把旧正文塞回主文档。
- 主文档只保留摘要、索引与最近窗口，不再复制完整历史正文。

## 6. 本轮结论与下一步

- 本轮已完成首轮深度归档落地：主文档只保留近线窗口，早期阶段已按区间迁入分片，并补齐主入口回链。
- `roadmap.md` 当前保留第二十二至第三十一阶段；若后续再次接近 `800` 行，优先把第二十二至第二十四阶段继续迁出为下一份近线前置分片。
- `todo-archive.md` 当前保留第二十五至第三十阶段；若后续归档再次显著增长，优先继续按连续阶段区间迁出，不重新回退到单文件全量承载。

## 7. 相关入口

- 当前路线图: [../roadmap.md](../roadmap.md)
- 当前待办归档: [../todo-archive.md](../todo-archive.md)
- 路线图分片: [roadmap-phases-01-10.md](./roadmap-phases-01-10.md)、[roadmap-phases-11-21.md](./roadmap-phases-11-21.md)
- 待办归档分片: [todo-archive-phases-01-10.md](./todo-archive-phases-01-10.md)、[todo-archive-phases-11-21.md](./todo-archive-phases-11-21.md)、[todo-archive-phases-22-24.md](./todo-archive-phases-22-24.md)
- 回归记录入口: [../../reports/regression/index.md](../../reports/regression/index.md)
