# 回归记录管理与深度归档

本文档是回归记录的管理规划与统一索引入口，负责说明活动窗口、归档分层、迁移状态与历史回溯路径。

## 1. 目录约定

- `current.md`: 当前活动回归窗口，只保留最近 1 - 2 个阶段或最近 6 - 8 条完整记录。
- `archive/index.md`: 历史归档入口，优先按模块或日期分片；如果单个归档目录继续膨胀，再按年份或半年继续拆分。
- `index.md`: 管理规划、入口索引与迁移说明。

## 2. 迁移状态

- 现有 `docs/plan/regression-log.md`、`docs/plan/regression-log-index.md` 与 `docs/plan/regression-log-archive.md` 仍保留为兼容入口，方便历史链接逐步迁移。
- 后续新增回归正文应优先落在本目录下的活动窗口与归档分片中。
- 当活动窗口超过阅读阈值时，先滚动归档再追加新记录。

## 3. 归档原则

1. 同一条回归记录必须整体迁移，不能把命令、结果、Review Gate 结论与后续计划拆散到多个位置。
2. 归档路径优先按模块或日期组织，确保后续能按问题域快速检索。
3. 若回归日志再次超出可读窗口，应先缩减活动窗口，再追加新的阶段性记录。

## 4. 相关入口

- 活动窗口: [current.md](./current.md)
- 历史归档: [archive/index.md](./archive/index.md)
- 兼容入口: [docs/plan/regression-log.md](../../plan/regression-log.md)
