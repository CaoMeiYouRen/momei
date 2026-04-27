# 回归记录管理与深度归档

本文档是回归记录的管理规划与统一索引入口，负责说明活动窗口、历史归档、兼容入口与后续深度拆分边界。

## 1. 目录职责

- `current.md`: 当前活动回归窗口，是唯一允许继续追加近线回归正文的正式入口。
- `archive/index.md`: 历史归档入口，负责说明模块 / 日期分片策略与后续年度、半年度拆分规则。
- `index.md`: 管理规划、入口索引与兼容边界说明。

## 2. 边界定义

### 2.1 活动窗口

- 正式写入位置固定为 [current.md](./current.md)。
- 默认只保留最近 `1 - 2` 个阶段或最近 `6 - 8` 条完整记录。
- 若活动窗口超过阅读阈值，应先滚动归档，再继续追加新记录。

### 2.2 历史归档

- 正式归档入口固定为 [archive/index.md](./archive/index.md)。
- 历史记录优先按模块或日期分片；若单个归档入口继续膨胀，再按年份或半年继续拆分。
- 同一条记录必须整体迁移，不得把命令、结论与后续计划拆散到多个位置。

### 2.3 兼容入口

- `docs/plan/regression-log.md`、`docs/plan/regression-log-index.md` 与 `docs/plan/regression-log-archive.md` 仅保留为兼容快照入口。
- 原 `docs/plan/regression-log.md` 与 `docs/plan/regression-log-archive.md` 的历史正文快照已迁移到 `docs/reports/regression/archive/legacy-plan-regression-log*.md`。
- 兼容入口不得继续追加新的正式回归正文，也不应再承载新的窗口统计或管理规则。
- 兼容入口只负责旧链接回看与迁移提示；新的管理规则统一以本目录为准。

## 3. 窗口与拆分阈值

1. `current.md` 超过 `300 - 400` 行、或超过 `6 - 8` 条完整记录时，必须先滚动归档再继续写入。
2. `archive/index.md` 若开始难以承担“按模块 / 日期快速定位”的索引职责，应继续向年份或半年度分片，而不是把历史正文重新塞回活动窗口。
3. 兼容入口不参与新的窗口统计；窗口健康度只以 `docs/reports/regression/current.md` 为准。

## 4. 相关入口

- 活动窗口: [current.md](./current.md)
- 历史归档: [archive/index.md](./archive/index.md)
- 兼容入口: [docs/plan/regression-log.md](../../plan/regression-log.md)
- 旧活动日志迁移快照: [archive/legacy-plan-regression-log.md](./archive/legacy-plan-regression-log.md)
- 旧归档日志迁移快照: [archive/legacy-plan-regression-log-archive.md](./archive/legacy-plan-regression-log-archive.md)
